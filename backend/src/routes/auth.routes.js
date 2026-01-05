const express = require("express");
const {
  login,
  forgotPassword,
  resetPassword,
  getMe,
} = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth");
const {
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  handleValidationErrors,
} = require("../middlewares/validation");

const router = express.Router();

router.post("/login", validateLogin, handleValidationErrors, login);
router.post(
  "/forgot-password",
  validateForgotPassword,
  handleValidationErrors,
  forgotPassword
);
router.post(
  "/reset-password",
  validateResetPassword,
  handleValidationErrors,
  resetPassword
);
router.get("/me", protect, getMe);

module.exports = router;
