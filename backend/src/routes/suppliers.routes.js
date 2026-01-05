const express = require("express");
const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
} = require("../controllers/suppliers.controller");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(protect); // All routes require auth

// AUDITOR cannot access suppliers
router.use((req, res, next) => {
  if (req.user.role === "AUDITOR") {
    return res.status(403).json({ message: "Access denied. Auditors can only view reports." });
  }
  next();
});

router.route("/").get(getSuppliers).post(authorize("ADMIN"), createSupplier);

router.route("/:id").get(getSupplier).put(authorize("ADMIN"), updateSupplier);

module.exports = router;
