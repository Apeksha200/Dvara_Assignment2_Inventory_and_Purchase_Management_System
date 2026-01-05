const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    contactPerson: {
      type: String,
    },

    email: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },

    phone: {
      type: String,
    },

    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },

    paymentTerms: {
      type: String,
      enum: ["ADVANCE", "NET_15", "NET_30", "NET_45", "NET_60"],
      default: "NET_30",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "BLACKLISTED"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", supplierSchema);
