import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Chip,
  MenuItem,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import axios from "../utils/axios";
import { useAuth } from "../context/AuthContext";

const steps = ["DRAFT", "SUBMITTED", "APPROVED", "DELIVERED"];

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [form, setForm] = useState({
    supplier: "",
    items: [{ product: "", quantity: 1, unitPrice: 0 }],
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [editOrderId, setEditOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchOrders = async () => {
    const res = await axios.get("/orders");
    setOrders(res.data);
  };

  const fetchProducts = async () => {
    const res = await axios.get("/products");
    setProducts(res.data);
  };

  const fetchSuppliers = async () => {
    const res = await axios.get("/suppliers");
    setSuppliers(res.data);
  };

  const handleSubmit = async () => {
    try {
      // Validate that supplier is active
      const selectedSupplier = suppliers.find(s => s._id === form.supplier);
      if (selectedSupplier && selectedSupplier.status !== "ACTIVE") {
        alert("Cannot create order with inactive supplier. Please select an active supplier.");
        return;
      }
      
      if (isEditMode) {
        await axios.put(`/orders/${editOrderId}`, form);
        alert("Order updated successfully");
      } else {
        await axios.post("/orders", form);
        alert("Order created successfully");
      }
      
      handleCloseDialog();
      fetchOrders();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to save order";
      alert(`Error: ${errorMessage}`);
      console.error("Error:", err);
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setIsEditMode(false);
    setEditOrderId(null);
    setForm({
      supplier: "",
      items: [{ product: "", quantity: 1, unitPrice: 0 }],
    });
  };

  const handleEdit = (order) => {
    setForm({
      supplier: order.supplier._id,
      items: order.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    });
    setEditOrderId(order._id);
    setIsEditMode(true);
    setOpen(true);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      let endpoint = "";
      if (newStatus === "SUBMITTED") {
        endpoint = "submit";
      } else if (newStatus === "APPROVED") {
        endpoint = "approve";
      } else if (newStatus === "DELIVERED") {
        endpoint = "deliver";
      }
      await axios.put(`/orders/${orderId}/${endpoint}`);
      fetchOrders();
      alert(`Order status updated to ${newStatus}`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to update order status";
      alert(`Error: ${errorMessage}`);
      console.error("Error:", err);
    }
  };

  const handleExpand = (orderId) => {
    setExpanded((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case "DRAFT":
        return { bgcolor: "#9e9e9e", color: "#fff" }; // grey
      case "SUBMITTED":
        return { bgcolor: "#ff9800", color: "#fff" }; // orange
      case "APPROVED":
        return { bgcolor: "#2196f3", color: "#fff" }; // blue
      case "DELIVERED":
        return { bgcolor: "#4caf50", color: "#fff" }; // green
      default:
        return { bgcolor: "#9e9e9e", color: "#fff" };
    }
  };

  const canChangeStatus = (order, newStatus) => {
    // Enforce valid workflow transitions only
    // DRAFT → SUBMITTED → APPROVED → DELIVERED
    
    if (user.role === "ADMIN") {
      // Admin can only approve SUBMITTED orders
      if (order.status === "SUBMITTED" && newStatus === "APPROVED") {
        return true;
      }
    }
    
    if (user.role === "PROCUREMENT") {
      // Procurement can submit DRAFT orders
      if (order.status === "DRAFT" && newStatus === "SUBMITTED") {
        return true;
      }
      // Procurement can deliver APPROVED orders
      if (order.status === "APPROVED" && newStatus === "DELIVERED") {
        return true;
      }
    }
    
    return false;
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { product: "", quantity: 1, unitPrice: 0 }],
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index][field] = value;
    if (field === "product") {
      const selectedProduct = products.find((p) => p._id === value);
      if (selectedProduct) {
        newItems[index].unitPrice = selectedProduct.unitPrice;
      }
    }
    setForm({ ...form, items: newItems });
  };

  const removeItem = (index) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const getActiveStep = (status) => {
    return steps.indexOf(status);
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Purchase Orders</Typography>
        {user.role === "PROCUREMENT" && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setForm({
                supplier: "",
                items: [{ product: "", quantity: 1, unitPrice: 0 }],
              });
              setIsEditMode(false);
              setOpen(true);
            }}
          >
            Create Order
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order #</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <React.Fragment key={order._id}>
                <TableRow>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleExpand(order._id)}
                    >
                      {expanded[order._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>
                    {order.supplier
                      ? order.supplier.companyName
                      : "Unknown Supplier"}
                  </TableCell>
                  <TableCell>₹{order.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      sx={getStatusChipColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {order.requestedBy ? order.requestedBy.name : "Unknown"}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      {user.role === "PROCUREMENT" && order.status === "DRAFT" && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => handleEdit(order)}
                        >
                          Edit
                        </Button>
                      )}
                      
                      {canChangeStatus(
                        order,
                        order.status === "DRAFT"
                          ? "SUBMITTED"
                          : order.status === "SUBMITTED"
                          ? "APPROVED"
                          : "DELIVERED"
                      ) && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            handleStatusChange(
                              order._id,
                              order.status === "DRAFT"
                                ? "SUBMITTED"
                                : order.status === "SUBMITTED"
                                ? "APPROVED"
                                : "DELIVERED"
                            )
                          }
                        >
                          {order.status === "DRAFT"
                            ? "Submit"
                            : order.status === "SUBMITTED"
                            ? "Approve"
                            : "Deliver"}
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    colSpan={6}
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                  >
                    <Collapse
                      in={expanded[order._id]}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box margin={2}>
                        <Typography variant="h6" gutterBottom>Order Status Tracking</Typography>
                        <Stepper activeStep={getActiveStep(order.status)} alternativeLabel sx={{ mb: 4 }}>
                          {steps.map((label) => (
                            <Step key={label}>
                              <StepLabel>{label}</StepLabel>
                            </Step>
                          ))}
                        </Stepper>

                        <Typography variant="h6">Order Items</Typography>
                        <List dense>
                          {order.items.map((item, index) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={`${item.product.name} - Qty: ${item.quantity} @ ₹${item.unitPrice.toLocaleString()}`}
                                secondary={`Total: ₹${(
                                  item.quantity * item.unitPrice
                                ).toFixed(2)}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={open}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{isEditMode ? "Edit Purchase Order" : "Create Purchase Order"}</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Supplier"
            value={form.supplier}
            onChange={(e) => setForm({ 
              ...form, 
              supplier: e.target.value,
              // Reset items when supplier changes to avoid invalid products
              items: [{ product: "", quantity: 1, unitPrice: 0 }] 
            })}
            margin="normal"
            required
            helperText="Only active suppliers can be selected"
            disabled={isEditMode} // Cannot change supplier during edit to simply logic
          >
            {suppliers
              .filter((supplier) => supplier.status === "ACTIVE")
              .map((supplier) => (
                <MenuItem key={supplier._id} value={supplier._id}>
                  {supplier.companyName}
                </MenuItem>
              ))}
          </TextField>

          <Typography variant="h6" mt={2}>
            Order Items
          </Typography>
          {form.items.map((item, index) => (
            <Box key={index} display="flex" gap={2} alignItems="center" mb={2}>
              <TextField
                select
                label="Product"
                value={item.product}
                onChange={(e) => updateItem(index, "product", e.target.value)}
                style={{ flex: 2 }}
                disabled={!form.supplier}
              >
                {products
                  .filter(
                    (p) => 
                      // FIX: Ensure safe comparison even if p.supplier is populated object
                      (!form.supplier || (p.supplier?._id || p.supplier).toString() === form.supplier) &&
                      (p.supplier?.status === "ACTIVE" || p.supplier?.status === undefined)
                  )
                  .map((product) => (
                    <MenuItem key={product._id} value={product._id}>
                      {product.name}
                    </MenuItem>
                  ))}
              </TextField>
              <TextField
                label="Quantity"
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, "quantity", parseInt(e.target.value))
                }
                style={{ flex: 1 }}
              />
              <TextField
                label="Unit Price"
                type="number"
                value={item.unitPrice}
                onChange={(e) =>
                  updateItem(index, "unitPrice", parseFloat(e.target.value))
                }
                style={{ flex: 1 }}
                disabled // Unit price is auto-populated
              />
              <Button
                onClick={() => removeItem(index)}
                disabled={form.items.length === 1}
              >
                Remove
              </Button>
            </Box>
          ))}
          <Button onClick={addItem} disabled={!form.supplier}>Add Item</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {isEditMode ? "Update Order" : "Create Order"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
