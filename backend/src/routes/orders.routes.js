const express = require("express");
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  submitOrder,
  approveOrder,
  deliverOrder,
  changeStatus,
  deleteOrder,
} = require("../controllers/orders.controller");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(protect); // All routes require auth

// AUDITOR cannot access orders
router.use((req, res, next) => {
  if (req.user.role === "AUDITOR") {
    return res.status(403).json({ message: "Access denied. Auditors can only view reports." });
  }
  next();
});

router.route("/").get(getOrders).post(authorize("PROCUREMENT"), createOrder);

router
  .route("/:id")
  .get(getOrder)
  .put(authorize("PROCUREMENT"), updateOrder)
  .delete(authorize("PROCUREMENT"), deleteOrder);

router.put("/:id/submit", authorize("PROCUREMENT"), submitOrder);
router.put("/:id/approve", authorize("ADMIN"), approveOrder);
router.put("/:id/deliver", authorize("PROCUREMENT"), deliverOrder);
// router.put("/:id/status", changeStatus);

module.exports = router;
