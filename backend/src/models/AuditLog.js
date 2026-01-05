const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    action: {
      type: String,
      required: true,
      index: true,
    },

    entityType: {
      type: String,
      required: true,
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    ipAddress: {
      type: String,
    },

    changes: {
      type: Object, // before/after diff
    },
    details: {
      type: String, // Additional details about the action
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
