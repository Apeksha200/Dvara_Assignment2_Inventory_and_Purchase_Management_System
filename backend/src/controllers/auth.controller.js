const User = require("../models/User");
const { comparePassword, hashPassword } = require("../utils/password");
const { generateToken } = require("../utils/jwt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", {
      email,
      password: password ? "***" : "empty",
    });

    // Find user
    const user = await User.findOne({ email }).select("+password");
    console.log(
      "User found:",
      user
        ? {
            id: user._id,
            email: user.email,
            role: user.role,
            hasPassword: !!user.password,
          }
        : "null"
    );
    if (!user || !user.isActive) {
      console.log("User not found or inactive");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await comparePassword(password, user.password);
    console.log("Password match:", isMatch);
    if (!isMatch) {
      console.log("Password does not match");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = generateToken({
      userId: user._id,
      role: user.role,
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Respond
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL - Default to port 3000 or use FRONTEND_URL env var
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetURL = `${frontendURL}/reset-password/${resetToken}`;

    // Try to send email if configured, otherwise log it for development
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
            <p>You requested to reset your password. Click the link below to reset it:</p>
            <p><a href="${resetURL}">${resetURL}</a></p>
            <p>This link will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          `,
          text: `Reset your password: ${resetURL}\n\nThis link will expire in 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        console.log("Password reset email sent to:", user.email);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Log the reset URL for development purposes
        console.log("RESET URL (for development):", resetURL);
        // Still return success but with a note
        return res.status(200).json({ 
          message: "Reset token generated. Check server logs for reset URL (email service not configured).",
          resetURL: process.env.NODE_ENV === "development" ? resetURL : undefined
        });
      }
    } else {
      // Email not configured - log for development
      console.log("Email service not configured. Reset URL:", resetURL);
      return res.status(200).json({ 
        message: "Reset token generated. Check server console for reset URL.",
        resetURL: process.env.NODE_ENV === "development" ? resetURL : undefined
      });
    }

    res.status(200).json({ message: "Reset link sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    console.log("Reset password request received");
    console.log("Token length:", token?.length);
    console.log("Token preview:", token?.substring(0, 20) + "...");

    // Validate password
    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    if (!token) {
      return res.status(400).json({ message: "Reset token is required" });
    }

    // Hash the token (same way it was hashed when created)
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    console.log("Hashed token:", hashedToken.substring(0, 20) + "...");

    // Find user with matching token and non-expired token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      // Check if token exists but expired
      const expiredUser = await User.findOne({
        resetPasswordToken: hashedToken,
      }).select("+resetPasswordToken +resetPasswordExpires");
      
      if (expiredUser) {
        console.log("Token found but expired. Expires:", expiredUser.resetPasswordExpires);
        return res.status(400).json({ 
          message: "Reset token has expired. Please request a new password reset link." 
        });
      }
      
      console.log("No user found with this token");
      return res.status(400).json({ 
        message: "Invalid reset token. Please use the link from your email or request a new password reset." 
      });
    }

    console.log("User found, resetting password for:", user.email);

    // Update password
    user.password = await hashPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log("Password reset successful for:", user.email);

    res.status(200).json({ message: "Password reset successful. You can now login with your new password." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { login, forgotPassword, resetPassword, getMe };
