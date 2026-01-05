const { body, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: errors.array() });
  }
  next();
};

const validateLogin = [
  body("email")
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password is required"),
];

const validateForgotPassword = [
  body("email")
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9]{2,}$/)
    .withMessage("Invalid email format"),
];

const validateResetPassword = [
  body("token").notEmpty().withMessage("Token is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
};
