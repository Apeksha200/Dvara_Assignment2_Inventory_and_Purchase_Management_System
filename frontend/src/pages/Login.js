import React, { useState } from "react";
import {
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  Link,
  Grid,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        "Invalid credentials";
      setError(errorMessage);
    }
  };

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  return (
    <Grid container component="main" sx={{ height: "100vh", width: "100vw", m: 0 }}>
      {/* Left Side - Hero/Gradient (Swapped from Right) */}
      <Grid
        item
        xs={false}
        sm={6}
        md={6}
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Matches Dashboard Admin Card gradient
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: { xs: "none", sm: "flex" }, 
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          color: "white"
        }}
      >
        {/* Abstract Shapes */}
        <Box
            sx={{
                position: "absolute",
                top: "-20%",
                right: "-20%",
                width: "70%",
                height: "70%",
                background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)",
                filter: "blur(60px)",
                animation: "pulse 10s infinite ease-in-out"
            }}
        />
        <Box
            sx={{
                position: "absolute",
                bottom: "-10%",
                left: "-10%",
                width: "60%",
                height: "60%",
                background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)",
                filter: "blur(60px)",
                animation: "pulse 15s infinite ease-in-out reverse"
            }}
        />
        
        <Box sx={{ position: "relative", zIndex: 1, textAlign: "center", p: 4, maxWidth: "80%" }}>
             <Paper 
                elevation={0}
                sx={{ 
                    width: 120, 
                    height: 120, 
                    borderRadius: "50%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    bgcolor: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)",
                    mb: 4,
                    mx: "auto",
                    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
                }}
             >
                 <Box 
                    component="img"
                    src="https://cdn-icons-png.flaticon.com/512/2821/2821898.png" 
                    alt="Inventory Icon"
                    sx={{ width: 60, height: 60, filter: "brightness(0) invert(1)" }}
                    onError={(e) => {e.target.style.display = 'none'}} 
                 />
             </Paper>
             <Typography variant="h3" component="h1" sx={{ fontWeight: "800", mb: 2, textShadow: "0 2px 10px rgba(0,0,0,0.2)"}}>
                 Inventory Manager
             </Typography>
             <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300, lineHeight: 1.6 }}>
                Streamline your purchase orders, manage suppliers, and track inventory in real-time.
             </Typography>
        </Box>
      </Grid>

      {/* Right Side - Form (Swapped from Left) */}
      <Grid
        item
        xs={12}
        sm={6}
        md={6}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f8f9fa" // Light grey background
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 6 },
            width: "100%",
            maxWidth: "500px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            bgcolor: "transparent", 
            borderRadius: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Typography component="h1" variant="h4" sx={{ fontWeight: "700", mb: 1, color: "#2d3748" }}>
              Welcome Back
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
              Enter your credentials to access your account.
            </Typography>
  
            {error && (
              <Alert severity="error" sx={{ width: "100%", mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
  
            <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 } 
                }}
                variant="outlined"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
              
              <Grid container sx={{ mt: 1, mb: 2 }}>
                <Grid item xs>
                  {/* Spacer or Checkbox could go here */}
                </Grid>
                <Grid item>
                  <Link href="/forgot-password" variant="body2" sx={{ textDecoration: "none", color: "#667eea", fontWeight: 500 }}>
                    Forgot password?
                  </Link>
                </Grid>
              </Grid>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 2,
                  mb: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                  bgcolor: "#667eea", 
                  boxShadow: "0 4px 6px rgba(102, 126, 234, 0.25)",
                  "&:hover": {
                    bgcolor: "#764ba2",
                    boxShadow: "0 6px 8px rgba(118, 75, 162, 0.3)",
                  },
                }}
              >
                Sign In
              </Button>
              
              <Box mt={4} textAlign="center">
                 <Typography variant="caption" color="textSecondary">
                   © {new Date().getFullYear()} Inventory Management System. All rights reserved.
                 </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Login;
