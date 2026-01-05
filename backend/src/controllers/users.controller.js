const User = require("../models/User");
const { hashPassword } = require("../utils/password");
const { generateToken } = require("../utils/jwt");
const AuditLog = require("../models/AuditLog");

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single user
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create user (Invite Flow)
const createUser = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;

    // Validate required fields (Password NOT required anymore)
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate random temporary password (will be overwritten by user)
    const crypto = require("crypto");
    const tempPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await hashPassword(tempPassword);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      isActive: isActive !== undefined ? isActive : true,
    });

    // Generate reset token immediately for the invite link
    const resetToken = user.createPasswordResetToken();
    
    // Save user with reset token
    await user.save();

    // Create invite URL
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
    const inviteURL = `${frontendURL}/reset-password/${resetToken}`;

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: "CREATE",
      entityType: "User",
      entityId: user._id,
      details: `Created user ${user.name} with role ${user.role} (Invite sent)`,
    });

    // Send email or log URL
    const nodemailer = require("nodemailer");
    let emailSent = false;
    let loggedUrl = null;

    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT || 587,
          secure: process.env.EMAIL_PORT == 465,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Welcome to Inventory System - Set Your Password",
          html: `
            <h2>Welcome, ${user.name}!</h2>
            <p>Your account has been created. Please click the link below to set your password and access the system:</p>
            <p><a href="${inviteURL}">${inviteURL}</a></p>
            <p>This link will expire in 10 minutes.</p>
            <p>If you have any issues, please contact the administrator.</p>
          `,
          text: `Welcome! Set your password here: ${inviteURL}`,
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
        console.log("Invite email sent to:", user.email);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        loggedUrl = inviteURL;
      }
    } else {
      console.log("Email service not configured. Invite URL:", inviteURL);
      loggedUrl = inviteURL;
    }

    res.status(201).json({
      message: emailSent 
        ? "User created and invitation sent successfully" 
        : "User created. Check server logs for invitation link (Email not configured).",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      // Only return URL in non-production for easier testing
      inviteURL: process.env.NODE_ENV !== "production" ? loggedUrl : undefined
    });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent updating own role/status
    if (req.params.id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot update your own account" });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive === "boolean") user.isActive = isActive;

    await user.save();

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: "UPDATE",
      entityType: "User",
      entityId: user._id,
      details: `Updated user ${user.name}`,
    });

    res.json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Send password reset email to user
const resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetURL = `${frontendURL}/reset-password/${resetToken}`;

    // Try to send email if configured
    const nodemailer = require("nodemailer");
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT || 587,
          secure: process.env.EMAIL_PORT == 465,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Password Reset Request",
          html: `
            <h2>Password Reset Request</h2>
            <p>An administrator has requested a password reset for your account. Click the link below to reset your password:</p>
            <p><a href="${resetURL}">${resetURL}</a></p>
            <p>This link will expire in 10 minutes.</p>
            <p>If you didn't request this, please contact your administrator.</p>
          `,
          text: `Reset your password: ${resetURL}\n\nThis link will expire in 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        console.log("Password reset email sent to:", user.email);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        console.log("RESET URL (for development):", resetURL);
        return res.status(200).json({ 
          message: "Reset token generated. Check server logs for reset URL (email service not configured).",
          resetURL: process.env.NODE_ENV === "development" ? resetURL : undefined
        });
      }
    } else {
      console.log("Email service not configured. Reset URL:", resetURL);
      return res.status(200).json({ 
        message: "Reset token generated. Check server console for reset URL.",
        resetURL: process.env.NODE_ENV === "development" ? resetURL : undefined
      });
    }

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: "RESET_PASSWORD",
      entityType: "User",
      entityId: user._id,
      details: `Password reset email sent to user ${user.name}`,
    });

    res.json({ message: "Password reset email sent successfully" });
  } catch (error) {
    console.error("Error sending reset password email:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  resetUserPassword,
};
