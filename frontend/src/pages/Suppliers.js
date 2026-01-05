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
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Add, Edit } from "@mui/icons-material";
import axios from "../utils/axios";
import { useAuth } from "../context/AuthContext";

const Suppliers = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: { line1: "", city: "", state: "", country: "", postalCode: "" },
    paymentTerms: "NET_30",
    status: "ACTIVE",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const res = await axios.get("/suppliers");
    setSuppliers(res.data);
  };

  const handleSubmit = async () => {
    if (editing) {
      await axios.put(`/suppliers/${editing._id}`, form);
    } else {
      await axios.post("/suppliers", form);
    }
    setOpen(false);
    setEditing(null);
    setForm({
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: { line1: "", city: "", state: "", country: "", postalCode: "" },
      paymentTerms: "NET_30",
      status: "ACTIVE",
    });
    fetchSuppliers();
  };

  const handleEdit = (supplier) => {
    setEditing(supplier);
    setForm({
      companyName: supplier.companyName,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      paymentTerms: supplier.paymentTerms,
      status: supplier.status,
    });
    setOpen(true);
  };

  const getStatusColor = (status) => {
    return status === "ACTIVE" ? "success" : "error";
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Suppliers</Typography>
        {user.role === "ADMIN" && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
          >
            Add Supplier
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Company Name</TableCell>
              <TableCell>Contact Person</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Payment Terms</TableCell>
              <TableCell>Status</TableCell>
              {user.role === "ADMIN" && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier._id}>
                <TableCell>{supplier.companyName}</TableCell>
                <TableCell>{supplier.contactPerson}</TableCell>
                <TableCell>{supplier.email}</TableCell>
                <TableCell>{supplier.phone}</TableCell>
                <TableCell>{supplier.paymentTerms}</TableCell>
                <TableCell>
                  {user.role === "ADMIN" ? (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={supplier.status === "ACTIVE"}
                          onChange={async () => {
                            try {
                              const newStatus = supplier.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                              await axios.put(`/suppliers/${supplier._id}`, {
                                ...supplier,
                                status: newStatus,
                              });
                              fetchSuppliers();
                              alert(`Supplier ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`);
                            } catch (err) {
                              const errorMessage = err.response?.data?.message || "Failed to update supplier status";
                              alert(`Error: ${errorMessage}`);
                              console.error("Error:", err);
                            }
                          }}
                          color="primary"
                        />
                      }
                      label={
                        <Chip
                          label={supplier.status}
                          color={getStatusColor(supplier.status)}
                          size="small"
                        />
                      }
                    />
                  ) : (
                    <Chip
                      label={supplier.status}
                      color={getStatusColor(supplier.status)}
                    />
                  )}
                </TableCell>
                {user.role === "ADMIN" && (
                  <TableCell>
                    <Button
                      startIcon={<Edit />}
                      onClick={() => handleEdit(supplier)}
                    >
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
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Company Name"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Contact Person"
            value={form.contactPerson}
            onChange={(e) =>
              setForm({ ...form, contactPerson: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            margin="normal"
            required
            type="email"
          />
          <TextField
            fullWidth
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            select
            fullWidth
            label="Payment Terms"
            value={form.paymentTerms}
            onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
            margin="normal"
          >
            <MenuItem value="ADVANCE">Advance</MenuItem>
            <MenuItem value="NET_15">Net 15</MenuItem>
            <MenuItem value="NET_30">Net 30</MenuItem>
            <MenuItem value="NET_60">Net 60</MenuItem>
          </TextField>
          <TextField
            select
            fullWidth
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            margin="normal"
          >
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
          </TextField>
          <Typography variant="h6" mt={2}>
            Address
          </Typography>
          <TextField
            fullWidth
            label="Line 1"
            value={form.address.line1}
            onChange={(e) =>
              setForm({
                ...form,
                address: { ...form.address, line1: e.target.value },
              })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="City"
            value={form.address.city}
            onChange={(e) =>
              setForm({
                ...form,
                address: { ...form.address, city: e.target.value },
              })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="State"
            value={form.address.state}
            onChange={(e) =>
              setForm({
                ...form,
                address: { ...form.address, state: e.target.value },
              })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Country"
            value={form.address.country}
            onChange={(e) =>
              setForm({
                ...form,
                address: { ...form.address, country: e.target.value },
              })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Postal Code"
            value={form.address.postalCode}
            onChange={(e) =>
              setForm({
                ...form,
                address: { ...form.address, postalCode: e.target.value },
              })
            }
            margin="normal"
          />
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

export default Suppliers;
