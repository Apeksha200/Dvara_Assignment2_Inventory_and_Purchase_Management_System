const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      index: true,
    },

    description: String,

    category: {
      type: String,
      index: true,
    },

    quantity: {
      type: Number,
      min: 0,
      default: 0,
    },

    unitPrice: {
      type: Number,
      min: 0,
      required: true,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reorderThreshold: {
      type: Number,
      min: 0,
      default: 10,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
