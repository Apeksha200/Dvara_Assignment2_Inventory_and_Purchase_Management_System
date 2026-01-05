const PurchaseOrder = require("../models/PurchaseOrder");
const AuditLog = require("../models/AuditLog");

// Get order reports
const getOrderReports = async (req, res) => {
  try {
    const reports = await PurchaseOrder.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get audit logs with optional filters
const getAuditLogs = async (req, res) => {
  try {
    const { userId, action, entityType, startDate, endDate } = req.query;
    
    let query = {};
    
    if (userId) query.user = userId;
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    
    // Date filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }
    
    const logs = await AuditLog.find(query)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .limit(1000);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getOrderReports, getAuditLogs };
