import React, { useEffect, useState, useMemo } from "react";
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
  MenuItem,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Card,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Add, Search, Warning } from "@mui/icons-material";
import axios from "../utils/axios";
import { useAuth } from "../context/AuthContext";

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [form, setForm] = useState({
    sku: "",
    name: "",
    description: "",
    category: "",
    quantity: 0,
    unitPrice: 0,
    supplier: "",
    reorderThreshold: 10,
    status: "ACTIVE",
  });

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchProducts = async () => {
    const res = await axios.get("/products");
    setProducts(res.data);
  };

  const fetchSuppliers = async () => {
    const res = await axios.get("/suppliers");
    setSuppliers(res.data);
  };

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ];
    return uniqueCategories.sort();
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch =
        !searchTerm ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category &&
          product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.supplier?.companyName &&
          product.supplier.companyName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));
      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;
      const matchesSupplier =
        !selectedSupplier || product.supplier?._id === selectedSupplier;
      return matchesSearch && matchesCategory && matchesSupplier;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "lowStock":
          // Sort by low stock first (quantity <= reorderThreshold)
          const aLow = a.quantity <= a.reorderThreshold;
          const bLow = b.quantity <= b.reorderThreshold;
          if (aLow && !bLow) return -1;
          if (!aLow && bLow) return 1;
          return a.name.localeCompare(b.name);
        case "name":
          return a.name.localeCompare(b.name);
        case "category":
          return (a.category || "").localeCompare(b.category || "");
        case "quantity":
          return b.quantity - a.quantity;
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedSupplier, sortBy]);

  const handleSubmit = async () => {
    if (editing) {
      // Update existing product
      await axios.put(`/products/${editing._id}`, form);
    } else {
      // Create new product
      await axios.post("/products", form);
    }
    setOpen(false);
    setEditing(null);
    setForm({
      sku: "",
      name: "",
      description: "",
      category: "",
      quantity: 0,
      unitPrice: 0,
      supplier: "",
      reorderThreshold: 10,
      status: "ACTIVE",
    });
    fetchProducts();
  };

  const handleEdit = (product) => {
    setEditing(product);
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description || "",
      category: product.category || "",
      quantity: product.quantity,
      unitPrice: product.unitPrice,
      supplier: product.supplier?._id || "",
      reorderThreshold: product.reorderThreshold,
      status: product.status,
    });
    setOpen(true);
  };

  const handleDelete = async (product, newStatus) => {
    const status = newStatus || (product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
    const action = status === "INACTIVE" ? "deactivate" : "activate";

    if (!newStatus && !window.confirm(`Are you sure you want to ${action} this product?`)) {
      return;
    }
    
    try {
      await axios.put(`/products/${product._id}`, { ...product, status });
      fetchProducts();
      alert(`Product ${status === "ACTIVE" ? "activated" : "deactivated"} successfully`);
    } catch (error) {
      console.error("Error updating product status:", error);
      const errorMessage = error.response?.data?.message || "Failed to update product status";
      alert(`Error: ${errorMessage}`);
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
        <Typography variant="h4">Products</Typography>
        {user.role === "ADMIN" && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
          >
            Add Product
          </Button>
        )}
      </Box>

      {/* Search and Filter Controls */}
      <Card
        sx={{
          mb: 3,
          p: 3,
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        <Typography
          variant="h6"
          sx={{ mb: 2, color: "primary.main", fontWeight: "bold" }}
        >
          🔍 Search & Filter Products
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={9}>
            <TextField
              fullWidth
              placeholder="Search by SKU, Name, Category, or Supplier"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "primary.main" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                  borderRadius: 2,
                  height: "56px",
                  "&:hover": {
                    boxShadow: 2,
                  },
                  "&.Mui-focused": {
                    boxShadow: 3,
                  },
                },
                "& .MuiInputBase-input": {
                  fontSize: "1rem",
                  padding: "16.5px 14px",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={1}>
            <FormControl fullWidth>
              <InputLabel shrink>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
                sx={{
                  backgroundColor: "white",
                  borderRadius: 2,
                  "&:hover": {
                    boxShadow: 2,
                  },
                  "&.Mui-focused": {
                    boxShadow: 3,
                  },
                }}
              >
                <MenuItem value="">All</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={1}>
            <FormControl fullWidth>
              <InputLabel shrink>Supplier</InputLabel>
              <Select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                label="Supplier"
                sx={{
                  backgroundColor: "white",
                  borderRadius: 2,
                  "&:hover": {
                    boxShadow: 2,
                  },
                  "&.Mui-focused": {
                    boxShadow: 3,
                  },
                }}
              >
                <MenuItem value="">All</MenuItem>
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier._id} value={supplier._id}>
                    {supplier.companyName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={1}>
            <FormControl fullWidth>
              <InputLabel shrink>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
                sx={{
                  backgroundColor: "white",
                  borderRadius: 2,
                  "&:hover": {
                    boxShadow: 2,
                  },
                  "&.Mui-focused": {
                    boxShadow: 3,
                  },
                }}
              >
                <MenuItem value="name">📝 Name</MenuItem>
                <MenuItem value="category">🏷️ Category</MenuItem>
                <MenuItem value="quantity">📦 Stock</MenuItem>
                <MenuItem value="lowStock">⚠️ Low Stock</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>SKU</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Reorder Threshold</TableCell>
              <TableCell>Unit Price</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Status</TableCell>
              {user.role === "ADMIN" && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product._id}>
                <TableCell>{product.sku}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {product.name}
                    {product.quantity <= product.reorderThreshold && (
                      <Warning
                        color="warning"
                        fontSize="small"
                        titleAccess="Low Stock"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>
                  <Typography
                    color={
                      product.quantity <= product.reorderThreshold
                        ? "error"
                        : "inherit"
                    }
                    fontWeight={
                      product.quantity <= product.reorderThreshold
                        ? "bold"
                        : "normal"
                    }
                  >
                    {product.quantity}
                  </Typography>
                </TableCell>
                <TableCell>{product.reorderThreshold}</TableCell>
                <TableCell>${product.unitPrice}</TableCell>
                <TableCell>{product.supplier?.companyName}</TableCell>
                <TableCell>
                  {user.role === "ADMIN" ? (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={product.status === "ACTIVE"}
                          onChange={() => {
                            const newStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                            handleDelete(product, newStatus);
                          }}
                          color="primary"
                        />
                      }
                      label={
                        <Chip
                          label={product.status}
                          color={product.status === "ACTIVE" ? "success" : "error"}
                          size="small"
                        />
                      }
                    />
                  ) : (
                    <Chip
                      label={product.status}
                      color={product.status === "ACTIVE" ? "success" : "error"}
                      size="small"
                    />
                  )}
                </TableCell>
                {user.role === "ADMIN" && (
                  <TableCell>
                    <Button size="small" onClick={() => handleEdit(product)}>
                      Edit
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
          setForm({
            sku: "",
            name: "",
            description: "",
            category: "",
            quantity: 0,
            unitPrice: 0,
            supplier: "",
            reorderThreshold: 10,
            status: "ACTIVE",
          });
        }}
      >
        <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Quantity"
            type="number"
            value={form.quantity}
            onChange={(e) =>
              setForm({ ...form, quantity: parseInt(e.target.value) })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Unit Price"
            type="number"
            value={form.unitPrice}
            onChange={(e) =>
              setForm({ ...form, unitPrice: parseFloat(e.target.value) })
            }
            margin="normal"
            required
          />
          <TextField
            select
            fullWidth
            label="Supplier"
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            margin="normal"
            required
          >
            {suppliers.map((supplier) => (
              <MenuItem key={supplier._id} value={supplier._id}>
                {supplier.companyName}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;
