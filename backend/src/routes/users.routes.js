const express = require("express");
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  resetUserPassword,
} = require("../controllers/users.controller");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(protect); // All routes require auth
router.use(authorize("ADMIN")); // Only ADMIN can access user management

router.route("/").get(getUsers).post(createUser);

router.route("/:id").get(getUser).put(updateUser);

router.put("/:id/reset-password", resetUserPassword);

module.exports = router;
