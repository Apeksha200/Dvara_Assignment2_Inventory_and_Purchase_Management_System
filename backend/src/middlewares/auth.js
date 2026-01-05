const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set in environment variables");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Mongoose findById handles both ObjectId and string IDs
    // Ensure userId is a string for consistent lookup
    const userId = decoded.userId ? decoded.userId.toString() : decoded.userId;
    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found for userId:", userId, "decoded.userId:", decoded.userId);
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res
        .status(401)
        .json({ message: "Not authorized, user account is inactive" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Not authorized for this action" });
    }
    next();
  };
};

module.exports = { protect, authorize };
