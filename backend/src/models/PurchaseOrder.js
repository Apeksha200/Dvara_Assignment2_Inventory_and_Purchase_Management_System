const mongoose = require("mongoose");
const { ORDER_STATUS } = require("../utils/constants");
const orderItemSchema = require("./OrderItem");

const purchaseOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      index: true,
    },

    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, "At least one item required"],
    },

    totalAmount: {
      type: Number,
      min: 0,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.DRAFT,
      index: true,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    submittedAt: Date,
    approvedAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
