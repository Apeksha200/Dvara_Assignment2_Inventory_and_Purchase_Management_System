import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, Typography, Button } from "@mui/material";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Users from "./pages/Users";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";

const theme = createTheme();

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

// Role-based route protection
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          p: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="textSecondary">
          You don't have permission to access this page.
        </Typography>
      </Box>
    );
  }
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/products"
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={["ADMIN", "PROCUREMENT"]}>
                    <Layout>
                      <Products />
                    </Layout>
                  </RoleRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/suppliers"
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={["ADMIN", "PROCUREMENT"]}>
                    <Layout>
                      <Suppliers />
                    </Layout>
                  </RoleRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={["ADMIN"]}>
                    <Layout>
                      <Users />
                    </Layout>
                  </RoleRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={["ADMIN", "PROCUREMENT"]}>
                    <Layout>
                      <Orders />
                    </Layout>
                  </RoleRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <RoleRoute allowedRoles={["ADMIN", "AUDITOR"]}>
                    <Layout>
                      <Reports />
                    </Layout>
                  </RoleRoute>
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            {/* Catch-all route for invalid paths */}
            <Route
              path="*"
              element={
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    p: 3,
                  }}
                >
                  <Typography variant="h4" gutterBottom>
                    Page Not Found
                  </Typography>
                  <Typography
                    variant="body1"
                    color="textSecondary"
                    sx={{ mb: 3 }}
                  >
                    The page you're looking for doesn't exist.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => (window.location.href = "/login")}
                  >
                    Go to Login
                  </Button>
                </Box>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
