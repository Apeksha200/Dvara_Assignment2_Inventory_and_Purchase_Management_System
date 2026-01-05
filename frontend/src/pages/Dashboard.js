import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  MenuItem,
  IconButton,
  Tabs,
  Tab,
} from "@mui/material";
import { Add, LocalShipping, Warning } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axios";

const Dashboard = () => {
  const { user } = useAuth();

  if (user.role === "ADMIN") {
    return <AdminDashboard />;
  } else if (user.role === "PROCUREMENT") {
    return <ProcurementDashboard />;
  } else if (user.role === "AUDITOR") {
    return <AuditorDashboard />;
  }

  return <div>Access Denied</div>;
};

// Admin Dashboard
const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSuppliers: 0,
    pendingOrders: 0,
    approvedOrders: 0,
  });
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productDialog, setProductDialog] = useState(false);
  const [supplierDialog, setSupplierDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    description: "",
    category: "",
    quantity: 0,
    unitPrice: 0,
    reorderThreshold: 10,
    supplier: "",
    status: "ACTIVE",
  });
  const [supplierForm, setSupplierForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, suppliersRes, ordersRes] = await Promise.all([
        axios.get("/products"),
        axios.get("/suppliers"),
        axios.get("/orders"),
      ]);

      const orders = ordersRes.data;
      setProducts(productsRes.data);
      setSuppliers(suppliersRes.data);
      setOrders(orders);
      setStats({
        totalProducts: productsRes.data.length,
        totalSuppliers: suppliersRes.data.length,
        pendingOrders: orders.filter((o) => o.status === "SUBMITTED").length,
        approvedOrders: orders.filter((o) => o.status === "APPROVED").length,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleCreateProduct = async () => {
    try {
      await axios.post("/products", productForm);
      setProductDialog(false);
      setProductForm({
        sku: "",
        name: "",
        description: "",
        category: "",
        quantity: 0,
        unitPrice: 0,
        reorderThreshold: 10,
        supplier: "",
        status: "ACTIVE",
      });
      fetchData();
    } catch (err) {
      console.error("Error creating product:", err);
    }
  };

  const handleUpdateProduct = async () => {
    try {
      await axios.put(`/products/${editingProduct._id}`, productForm);
      setProductDialog(false);
      setEditingProduct(null);
      setProductForm({
        sku: "",
        name: "",
        description: "",
        category: "",
        quantity: 0,
        unitPrice: 0,
        reorderThreshold: 10,
        supplier: "",
        status: "ACTIVE",
      });
      fetchData();
    } catch (err) {
      console.error("Error updating product:", err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to deactivate this product?")) {
      try {
        await axios.delete(`/products/${id}`);
        fetchData();
      } catch (err) {
        console.error("Error deleting product:", err);
      }
    }
  };

  const handleCreateSupplier = async () => {
    try {
      await axios.post("/suppliers", supplierForm);
      setSupplierDialog(false);
      setSupplierForm({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        status: "ACTIVE",
      });
      fetchData();
    } catch (err) {
      console.error("Error creating supplier:", err);
    }
  };

  const handleUpdateSupplier = async () => {
    try {
      await axios.put(`/suppliers/${editingSupplier._id}`, supplierForm);
      setSupplierDialog(false);
      setEditingSupplier(null);
      setSupplierForm({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        status: "ACTIVE",
      });
      fetchData();
    } catch (err) {
      console.error("Error updating supplier:", err);
    }
  };

  const handleApproveOrder = async (orderId) => {
    try {
      await axios.put(`/orders/${orderId}/approve`);
      fetchData();
    } catch (err) {
      console.error("Error approving order:", err);
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Admin Dashboard</Typography>
        <Button variant="outlined" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              transition: "transform 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ flex: 1, textAlign: "center" }}>
              <Typography variant="h6" sx={{ mb: 1, opacity: 0.8 }}>
                Total Products
              </Typography>
              <Typography
                variant="h2"
                component="div"
                sx={{ fontWeight: "bold", mb: 1 }}
              >
                {stats.totalProducts}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Inventory Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
              transition: "transform 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ flex: 1, textAlign: "center" }}>
              <Typography variant="h6" sx={{ mb: 1, opacity: 0.8 }}>
                Total Suppliers
              </Typography>
              <Typography
                variant="h2"
                component="div"
                sx={{ fontWeight: "bold", mb: 1 }}
              >
                {stats.totalSuppliers}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Active Partners
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
              transition: "transform 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ flex: 1, textAlign: "center" }}>
              <Typography variant="h6" sx={{ mb: 1, opacity: 0.8 }}>
                Pending Orders
              </Typography>
              <Typography
                variant="h2"
                component="div"
                sx={{ fontWeight: "bold", mb: 1 }}
              >
                {stats.pendingOrders}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Awaiting Approval
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
              color: "white",
              transition: "transform 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ flex: 1, textAlign: "center" }}>
              <Typography variant="h6" sx={{ mb: 1, opacity: 0.8 }}>
                Approved Orders
              </Typography>
              <Typography
                variant="h2"
                component="div"
                sx={{ fontWeight: "bold", mb: 1 }}
              >
                {stats.approvedOrders}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Ready for Delivery
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Procurement Dashboard
const ProcurementDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/orders");
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT":
        return "warning";
      case "SUBMITTED":
        return "info";
      case "APPROVED":
        return "success";
      case "DELIVERED":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "DRAFT":
        return "🟡";
      case "SUBMITTED":
        return "🔵";
      case "APPROVED":
        return "🟢";
      case "DELIVERED":
        return "⚫";
      default:
        return "";
    }
  };


  const handleStatusChange = async (orderId, newStatus) => {
    try {
      if (newStatus === "SUBMITTED") {
        await axios.put(`/orders/${orderId}/submit`);
        alert("Order submitted successfully");
      } else if (newStatus === "DELIVERED") {
        await axios.put(`/orders/${orderId}/deliver`);
        alert("Order marked as delivered. Inventory has been updated.");
        // Refresh products to show updated quantities
        fetchProducts();
      }
      fetchOrders();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An error occurred";
      alert(`Error: ${errorMessage}`);
      console.error("Error updating order status:", err);
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Procurement Dashboard</Typography>
        <Button variant="outlined" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Card
          sx={{
            p: 3,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                Products Inventory
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Manage your product catalog and create purchase orders
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
            Showing {products.length} active products
          </Typography>
        </Card>

        <TableContainer
          component={Paper}
          sx={{ mt: 2, borderRadius: 2, boxShadow: 3 }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: "primary.main" }}>
              <TableRow>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  SKU
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Name
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Category
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Stock
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Unit Price
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Supplier
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No products found. Please contact your administrator.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow
                    key={product._id}
                    sx={{ "&:hover": { backgroundColor: "action.hover" } }}
                  >
                    <TableCell
                      sx={{ fontWeight: "bold", color: "primary.main" }}
                    >
                      {product.sku}
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={product.category}
                        size="small"
                        sx={{
                          backgroundColor: "secondary.light",
                          color: "white",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          color={
                            product.quantity <= product.reorderThreshold
                              ? "error"
                              : "success.main"
                          }
                          fontWeight="bold"
                        >
                          {product.quantity}
                        </Typography>
                        {product.quantity <= product.reorderThreshold && (
                          <Warning sx={{ color: "error.main", fontSize: 16 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      ₹{product.unitPrice}
                    </TableCell>
                    <TableCell>{product.supplier?.companyName}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box>
        <Card
          sx={{
            p: 3,
            mb: 3,
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "white",
            borderRadius: 2,
            boxShadow: 3
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
            📋 My Purchase Orders
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Track and manage your purchase order workflow
          </Typography>
        </Card>

        <TableContainer
          component={Paper}
          sx={{ borderRadius: 2, boxShadow: 3 }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: "primary.main" }}>
              <TableRow>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Order ID
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Status
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Total Items
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Total Value
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No purchase orders found. Create your first order above.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow
                    key={order._id}
                    sx={{ "&:hover": { backgroundColor: "action.hover" } }}
                  >
                    <TableCell
                      sx={{ fontWeight: "bold", color: "primary.main" }}
                    >
                      #{order._id.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                        sx={{ fontWeight: "bold" }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {order.items?.length || 0}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      ₹
                      {order.items
                        ?.reduce(
                          (sum, item) => sum + item.quantity * item.unitPrice,
                          0
                        )
                        .toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell>
                      {order.status === "DRAFT" ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() =>
                            handleStatusChange(order._id, "SUBMITTED")
                          }
                          sx={{ mr: 1 }}
                        >
                          Submit
                        </Button>
                      ) : order.status === "APPROVED" ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<LocalShipping />}
                          onClick={() =>
                            handleStatusChange(order._id, "DELIVERED")
                          }
                        >
                          Mark Delivered
                        </Button>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          {order.status === "DELIVERED"
                            ? "Completed"
                            : "No actions available"}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

    </Box>
  );
};

// Auditor Dashboard
const AuditorDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const res = await axios.get("/reports/audit");
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    }
  };

  // Calculate stats
  const totalActions = auditLogs.length;
  const todayActions = auditLogs.filter((log) => {
    const today = new Date();
    const logDate = new Date(log.createdAt || log.timestamp);
    return (
      logDate.getDate() === today.getDate() &&
      logDate.getMonth() === today.getMonth() &&
      logDate.getFullYear() === today.getFullYear()
    );
  }).length;

  const lastCriticalAction = auditLogs
    .filter((log) =>
      ["DELETE", "RESET_PASSWORD", "APPROVE", "CREATE"].includes(log.action)
    )
    .sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp))[0];

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Auditor Dashboard</Typography>
        <Button variant="outlined" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              minHeight: 200,
              display: "flex",
              alignItems: "center",
            }}
          >
            <CardContent sx={{ flex: 1, textAlign: "center" }}>
              <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>
                Total Actions Logged
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: "bold" }}>
                {totalActions}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                All time audit records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
              minHeight: 200,
              display: "flex",
              alignItems: "center",
            }}
          >
            <CardContent sx={{ flex: 1, textAlign: "center" }}>
              <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>
                Actions Today
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: "bold" }}>
                {todayActions}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                Activity in last 24 hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
              minHeight: 200,
              display: "flex",
              alignItems: "center",
            }}
          >
            <CardContent sx={{ flex: 1, textAlign: "center" }}>
              <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>
                Last Critical Action
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
                {lastCriticalAction
                  ? lastCriticalAction.action
                  : "No actions"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {lastCriticalAction
                  ? new Date(
                      lastCriticalAction.createdAt || lastCriticalAction.timestamp
                    ).toLocaleString()
                  : "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="body1" color="textSecondary" sx={{ textAlign: "center", py: 4 }}>
        Navigate to <strong>Reports</strong> in the sidebar to view detailed audit logs with filters.
      </Typography>
    </Box>
  );
};

export default Dashboard;
