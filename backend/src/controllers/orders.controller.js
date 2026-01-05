const PurchaseOrder = require("../models/PurchaseOrder");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const AuditLog = require("../models/AuditLog");
const { ORDER_STATUS } = require("../utils/constants");

// Get all orders
const getOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.find()
      .populate("supplier", "companyName")
      .populate("requestedBy", "name")
      .populate("approvedBy", "name")
      .populate("items.product", "name sku");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate("supplier", "companyName")
      .populate("requestedBy", "name")
      .populate("approvedBy", "name")
      .populate("items.product", "name sku");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create order
const createOrder = async (req, res) => {
  try {
    const { supplier, items } = req.body;

    // Calculate total and get supplier from first product if not provided
    let totalAmount = 0;
    let orderSupplier = supplier;
    
    for (const item of items) {
      const product = await Product.findById(item.product).populate("supplier");
      if (!product) {
        return res.status(400).json({ message: `Product ${item.product} not found` });
      }
      
      // If supplier not provided, use the first product's supplier
      if (!orderSupplier && product.supplier) {
        orderSupplier = product.supplier._id;
      }
      
      // Validate that product's supplier is active
      if (product.supplier && product.supplier.status !== "ACTIVE") {
        return res.status(400).json({ 
          message: `Cannot create order with inactive supplier: ${product.supplier.companyName}` 
        });
      }
      
      item.sku = product.sku;
      item.name = product.name;
      item.unitPrice = product.unitPrice;
      item.totalPrice = item.quantity * item.unitPrice;
      totalAmount += item.totalPrice;
    }

    // Validate that the selected supplier is active
    if (orderSupplier) {
      const supplierDoc = await Supplier.findById(orderSupplier);
      if (!supplierDoc) {
        return res.status(400).json({ message: "Supplier not found" });
      }
      if (supplierDoc.status !== "ACTIVE") {
        return res.status(400).json({ 
          message: `Cannot create order with inactive supplier: ${supplierDoc.companyName}` 
        });
      }
    }

    const orderNumber = `PO-${Date.now()}`;

    const order = new PurchaseOrder({
      orderNumber,
      supplier: orderSupplier || null, // Use supplier from product if not provided
      items,
      totalAmount,
      requestedBy: req.user._id,
    });

    await order.save();

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: "CREATE",
      entityType: "PurchaseOrder",
      entityId: order._id,
      changes: req.body,
    });

    // Populate supplier before returning
    const populatedOrder = await PurchaseOrder.findById(order._id)
      .populate("supplier", "companyName")
      .populate("requestedBy", "name");

    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update order
const updateOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only allow update if draft
    if (order.status !== ORDER_STATUS.DRAFT) {
      return res.status(400).json({ message: "Can only update draft orders" });
    }

    const { supplier, items } = req.body;
    let totalAmount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      item.sku = product.sku;
      item.name = product.name;
      item.unitPrice = product.unitPrice;
      item.totalPrice = item.quantity * item.unitPrice;
      totalAmount += item.totalPrice;
    }

    order.supplier = supplier;
    order.items = items;
    order.totalAmount = totalAmount;
    await order.save();

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: "UPDATE",
      entityType: "PurchaseOrder",
      entityId: order._id,
      changes: req.body,
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Submit order
const submitOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== ORDER_STATUS.DRAFT) {
      return res.status(400).json({ message: "Order already submitted" });
    }

    order.status = ORDER_STATUS.SUBMITTED;
    order.submittedAt = new Date();
    await order.save();

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: "SUBMIT",
      entityType: "PurchaseOrder",
      entityId: order._id,
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Approve order
const approveOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== ORDER_STATUS.SUBMITTED) {
      return res.status(400).json({ message: "Order not submitted" });
    }

    order.status = ORDER_STATUS.APPROVED;
    order.approvedBy = req.user._id;
    order.approvedAt = new Date();
    await order.save();

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: "APPROVE",
      entityType: "PurchaseOrder",
      entityId: order._id,
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Deliver order
const deliverOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== ORDER_STATUS.APPROVED) {
      return res.status(400).json({ message: "Order not approved" });
    }

    order.status = ORDER_STATUS.DELIVERED;
    order.deliveredAt = new Date();

    // Update product quantities
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        console.error(`Product not found: ${item.product}`);
        continue;
      }
      const oldQuantity = product.quantity;
      const updatedProduct = await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity } },
        { new: true }
      );

      // Audit log for inventory update
      await AuditLog.create({
        user: req.user._id,
        action: "INVENTORY_UPDATE",
        entityType: "Product",
        entityId: item.product,
        details: `Quantity increased from ${oldQuantity} to ${
          updatedProduct.quantity
        } (Order delivery: ${order.orderNumber})`,
      });
    }

    await order.save();

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: "DELIVER",
      entityType: "PurchaseOrder",
      entityId: order._id,
    });

    res.json(order);
  } catch (error) {
    console.error("Error delivering order:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== ORDER_STATUS.DRAFT) {
      return res.status(400).json({ message: "Can only delete draft orders" });
    }

    await PurchaseOrder.findByIdAndDelete(req.params.id);

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: "DELETE",
      entityType: "PurchaseOrder",
      entityId: req.params.id,
    });

    res.json({ message: "Order deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  submitOrder,
  approveOrder,
  deliverOrder,
  deleteOrder,
};
