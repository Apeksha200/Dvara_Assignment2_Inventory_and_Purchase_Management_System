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
  Switch,
  FormControlLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import LockResetIcon from "@mui/icons-material/LockReset";
import axios from "../utils/axios";
import { useAuth } from "../context/AuthContext";

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "PROCUREMENT",
    isActive: true,
  });

  useEffect(() => {
    if (user.role === "ADMIN") {
      fetchUsers();
    }
  }, [user.role]);

  const fetchUsers = async () => {
    const res = await axios.get("/users");
    setUsers(res.data);
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        await axios.put(`/users/${editing._id}`, form);
        alert("User updated successfully");
      } else {
        const response = await axios.post("/users", form);
        const message = response.data.inviteURL
          ? `User created and invitation sent. Invite URL: ${response.data.inviteURL}`
          : response.data.message;
        alert(message);
      }
      setOpen(false);
      setEditing(null);
      setForm({
        name: "",
        email: "",
        role: "PROCUREMENT",
        isActive: true,
      });
      fetchUsers();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An error occurred";
      alert(`Error: ${errorMessage}`);
      console.error("Error:", err);
    }
  };

  const handleEdit = (user) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setOpen(true);
  };

  const handleResetPassword = async () => {
    try {
      const response = await axios.put(`/users/${resetUser._id}/reset-password`);
      setResetOpen(false);
      setResetUser(null);
      const message = response.data.resetURL 
        ? `Password reset email sent. Reset URL: ${response.data.resetURL}`
        : response.data.message || "Password reset email sent to user";
      alert(message);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to send reset email";
      alert(`Error: ${errorMessage}`);
      console.error("Error:", err);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await axios.put(`/users/${user._id}`, {
        ...user,
        isActive: !user.isActive,
      });
      fetchUsers();
      alert(`User ${!user.isActive ? "activated" : "deactivated"} successfully`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to update user status";
      alert(`Error: ${errorMessage}`);
      console.error("Error:", err);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "error";
      case "PROCUREMENT":
        return "primary";
      case "AUDITOR":
        return "secondary";
      default:
        return "default";
    }
  };

  if (user.role !== "ADMIN") {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="50vh"
      >
        <Typography variant="h6">Access Denied: Admin Only</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Add User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip label={user.role} color={getRoleColor(user.role)} />
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={user.isActive}
                        onChange={() => handleToggleActive(user)}
                        color="primary"
                      />
                    }
                    label={
                      <Chip
                        label={user.isActive ? "Active" : "Inactive"}
                        color={user.isActive ? "success" : "error"}
                        size="small"
                      />
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(user)}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <IconButton
                    onClick={() => {
                      setResetUser(user);
                      setResetOpen(true);
                    }}
                    size="small"
                    color="primary"
                    title="Send password reset email"
                  >
                    <LockResetIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
        <DialogContent>
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
            label="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            margin="normal"
            required
            type="email"
          />
          {/* Note: Password field removed. System generates invite link. */}
          <TextField
            select
            fullWidth
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            margin="normal"
          >
            <MenuItem value="ADMIN">Admin</MenuItem>
            <MenuItem value="PROCUREMENT">Procurement</MenuItem>
            <MenuItem value="AUDITOR">Auditor</MenuItem>
          </TextField>
          <TextField
            select
            fullWidth
            label="Status"
            value={form.isActive}
            onChange={(e) =>
              setForm({ ...form, isActive: e.target.value === "true" })
            }
            margin="normal"
          >
            <MenuItem value={true}>Active</MenuItem>
            <MenuItem value={false}>Inactive</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={resetOpen} onClose={() => setResetOpen(false)}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography>
            Send password reset email to {resetUser?.name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)}>Cancel</Button>
          <Button onClick={handleResetPassword} variant="contained">
            Send Reset Email
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
