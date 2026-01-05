const express = require("express");
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/products.controller");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(protect); // All routes require auth

// AUDITOR cannot access products
router.use((req, res, next) => {
  if (req.user.role === "AUDITOR") {
    return res.status(403).json({ message: "Access denied. Auditors can only view reports." });
  }
  next();
});

router.route("/").get(getProducts).post(authorize("ADMIN"), createProduct);

router
  .route("/:id")
  .get(getProduct)
  .put(authorize("ADMIN"), updateProduct)
  .delete(authorize("ADMIN"), deleteProduct);

module.exports = router;
