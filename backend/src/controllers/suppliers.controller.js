const Supplier = require("../models/Supplier");
const AuditLog = require("../models/AuditLog");

// Get all suppliers
const getSuppliers = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "PROCUREMENT") {
      filter.status = "ACTIVE";
    }
    // ADMIN and AUDITOR see all
    const suppliers = await Supplier.find(filter);
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single supplier
const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create supplier
const createSupplier = async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: "CREATE",
      entityType: "Supplier",
      entityId: supplier._id,
      changes: req.body,
    });

    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update supplier
const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: "UPDATE",
      entityType: "Supplier",
      entityId: supplier._id,
      changes: req.body,
    });

    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
};
