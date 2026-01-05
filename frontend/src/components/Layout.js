import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
} from "@mui/material";
import {
  Dashboard,
  Inventory,
  Business,
  ShoppingCart,
  Assessment,
  People,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 240;

const Layout = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
  ];

  // AUDITOR can ONLY see Reports
  if (user.role === "AUDITOR") {
    menuItems.push({ text: "Reports", icon: <Assessment />, path: "/reports" });
  } else {
    // ADMIN and PROCUREMENT can see Products, Suppliers, Orders
    if (user.role === "ADMIN" || user.role === "PROCUREMENT") {
      menuItems.push(
        { text: "Products", icon: <Inventory />, path: "/products" },
        { text: "Suppliers", icon: <Business />, path: "/suppliers" },
        { text: "Orders", icon: <ShoppingCart />, path: "/orders" }
      );
    }

    if (user.role === "ADMIN") {
      menuItems.push({ text: "Users", icon: <People />, path: "/users" });
      menuItems.push({ text: "Reports", icon: <Assessment />, path: "/reports" });
    }
  }

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Inventory Management
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
