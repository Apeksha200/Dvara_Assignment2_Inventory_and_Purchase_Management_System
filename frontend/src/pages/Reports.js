import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
} from "@mui/material";
import axios from "../utils/axios";
import { useAuth } from "../context/AuthContext";

const Reports = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    userId: "",
    action: "",
    entityType: "",
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchLogs = React.useCallback(async () => {
    try {
      // Build query params from filters
      const params = new URLSearchParams();
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.action) params.append("action", filters.action);
      if (filters.entityType) params.append("entityType", filters.entityType);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      
      const queryString = params.toString();
      const url = `/reports/audit${queryString ? `?${queryString}` : ""}`;
      const res = await axios.get(url);
      setLogs(res.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  }, [filters]);
  
  // Refetch when filters change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Get unique actions and entity types
  const uniqueActions = useMemo(() => {
    return [...new Set(logs.map((log) => log.action))].sort();
  }, [logs]);

  const uniqueEntityTypes = useMemo(() => {
    return [...new Set(logs.map((log) => log.entityType))].sort();
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesUser = !filters.userId || log.user?._id === filters.userId;
      const matchesAction = !filters.action || log.action === filters.action;
      const matchesEntity =
        !filters.entityType || log.entityType === filters.entityType;
      
      // Date filtering - compare dates only (ignore time)
      const logDate = new Date(log.createdAt || log.timestamp);
      logDate.setHours(0, 0, 0, 0);
      
      const matchesStartDate = !filters.startDate || (() => {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        return logDate >= startDate;
      })();
      
      const matchesEndDate = !filters.endDate || (() => {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        return logDate <= endDate;
      })();

      return (
        matchesUser &&
        matchesAction &&
        matchesEntity &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [logs, filters]);

  // Calculate stats
  const totalActions = logs.length;
  const todayActions = logs.filter((log) => {
    const today = new Date();
    const logDate = new Date(log.createdAt);
    return (
      logDate.getDate() === today.getDate() &&
      logDate.getMonth() === today.getMonth() &&
      logDate.getFullYear() === today.getFullYear()
    );
  }).length;

  const lastCriticalAction = logs
    .filter((log) =>
      ["DELETE", "RESET_PASSWORD", "APPROVE", "CREATE"].includes(log.action)
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  const getActionColor = (action) => {
    switch (action) {
      case "CREATE":
        return { bgcolor: "#4caf50", color: "#fff" }; // Green
      case "UPDATE":
        return { bgcolor: "#2196f3", color: "#fff" }; // Blue
      case "DELETE":
        return { bgcolor: "#f44336", color: "#fff" }; // Red
      case "APPROVE":
        return { bgcolor: "#3f51b5", color: "#fff" }; // Indigo
      case "RESET_PASSWORD":
        return { bgcolor: "#ff9800", color: "#fff" }; // Orange
      case "SUBMIT":
        return { bgcolor: "#ff9800", color: "#fff" }; // Orange
      case "DELIVER":
        return { bgcolor: "#4caf50", color: "#fff" }; // Green
      case "LOGIN":
        return { bgcolor: "#9c27b0", color: "#fff" }; // Purple
      default:
        return { bgcolor: "#9e9e9e", color: "#fff" }; // Grey
    }
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Audit Reports
      </Typography>

      {/* Stats Cards for Auditor */}
      {user.role === "AUDITOR" && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>
                  Total Actions Logged
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: "bold" }}>
                  {totalActions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                color: "white",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>
                  Actions Today
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: "bold" }}>
                  {todayActions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                color: "white",
              }}
            >
              <CardContent>
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
                        lastCriticalAction.createdAt
                      ).toLocaleString()
                    : "N/A"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter by User</InputLabel>
              <Select
                value={filters.userId}
                label="Filter by User"
                onChange={(e) =>
                  setFilters({ ...filters, userId: e.target.value })
                }
              >
                <MenuItem value="">All Users</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter by Action</InputLabel>
              <Select
                value={filters.action}
                label="Filter by Action"
                onChange={(e) =>
                  setFilters({ ...filters, action: e.target.value })
                }
              >
                <MenuItem value="">All Actions</MenuItem>
                {uniqueActions.map((action) => (
                  <MenuItem key={action} value={action}>
                    {action}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter by Entity</InputLabel>
              <Select
                value={filters.entityType}
                label="Filter by Entity"
                onChange={(e) =>
                  setFilters({ ...filters, entityType: e.target.value })
                }
              >
                <MenuItem value="">All Entities</MenuItem>
                {uniqueEntityTypes.map((entity) => (
                  <MenuItem key={entity} value={entity}>
                    {entity}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={filters.startDate || ""}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value || null })
              }
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={filters.endDate || ""}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value || null })
              }
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
              <Typography variant="body2" color="textSecondary">
                Showing {filteredLogs.length} of {logs.length} logs
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Entity ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No audit logs found matching the filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell>
                    {new Date(log.createdAt || log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {log.user?.name || "Unknown"} ({log.user?.role || "N/A"})
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.action}
                      sx={getActionColor(log.action)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{log.entityType || "N/A"}</TableCell>
                  <TableCell>
                    {log.entityId
                      ? log.entityId.toString().substring(0, 8) + "..."
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Reports;
