const express = require("express");
const {
  getOrderReports,
  getAuditLogs,
} = require("../controllers/reports.controller");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(protect); // All routes require auth

router.get("/orders", authorize("ADMIN", "AUDITOR"), getOrderReports);
router.get("/audit", authorize("ADMIN", "AUDITOR"), getAuditLogs);

module.exports = router;
