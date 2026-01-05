const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    sku: String,
    name: String,

    quantity: {
      type: Number,
      min: 1,
      required: true,
    },

    unitPrice: {
      type: Number,
      min: 0,
      required: true,
    },

    totalPrice: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

module.exports = orderItemSchema;
