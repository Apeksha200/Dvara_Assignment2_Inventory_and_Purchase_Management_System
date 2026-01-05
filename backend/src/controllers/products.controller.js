const Product = require("../models/Product");
const AuditLog = require("../models/AuditLog");

// Get all products
const getProducts = async (req, res) => {
  try {
    let filter = {};
    // All roles (ADMIN, PROCUREMENT, AUDITOR) can see all products
    // No status filter applied

    const products = await Product.find(filter)
      .populate("supplier", "companyName")
      .populate("createdBy", "name");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single product
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("supplier", "companyName")
      .populate("createdBy", "name");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create product
const createProduct = async (req, res) => {
  try {
    const product = new Product({
      ...req.body,
      createdBy: req.user._id,
    });
    await product.save();

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: "CREATE",
      entityType: "Product",
      entityId: product._id,
      changes: req.body,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: "UPDATE",
      entityType: "Product",
      entityId: product._id,
      changes: req.body,
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete product (soft delete)
const deleteProduct = async (req, res) => {
  try {
    // Check if product exists in any orders
    const PurchaseOrder = require("../models/PurchaseOrder");
    const orderWithProduct = await PurchaseOrder.findOne({
      "items.product": req.params.id,
    });

    if (orderWithProduct) {
      return res.status(400).json({
        message: "Cannot delete product that exists in purchase orders. Set status to INACTIVE instead.",
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: "INACTIVE" },
      { new: true }
    );

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: "DELETE",
      entityType: "Product",
      entityId: product._id,
      changes: { status: "INACTIVE" },
    });

    res.json({ message: "Product deactivated", product });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
