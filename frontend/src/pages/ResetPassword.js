import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  Alert,
  Grid,
  InputAdornment,
  IconButton
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAuth } from "../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";

const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const { token } = useParams();

  // Debug: Log token on mount
  useEffect(() => {
    console.log("Reset password token from URL:", token);
    if (!token) {
      setError("No reset token found in URL. Please use the link from your email.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    
    // Validate password
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid reset token. Please use the link from your email.");
      return;
    }

    // Decode token in case it's URL encoded
    const decodedToken = decodeURIComponent(token);
    console.log("Submitting password reset with token:", decodedToken?.substring(0, 20) + "...");

    try {
      const response = await resetPassword(decodedToken, password);
      console.log("Password reset response:", response);
      setMessage("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Reset password error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        code: err.code,
      });
      
      let errorMessage = err.response?.data?.message || 
                        err.response?.data?.errors?.[0]?.msg ||
                        err.message || 
                        "Failed to reset password. The link may have expired.";
      
      // Check if backend is not running
      if (err.code === "ECONNREFUSED" || err.message.includes("ERR_CONNECTION_REFUSED") || err.message.includes("Backend server is not running")) {
        errorMessage = "Backend server is not running. Please start the backend server on port 5000 and try again.";
      }
      
      setError(errorMessage);
    }
  };

  return (
    <Grid container component="main" sx={{ height: "100vh", width: "100vw", m: 0 }}>
      {/* Left Side - Hero (Swapped) */}
      <Grid
        item
        xs={false}
        sm={7}
        md={7}
        lg={7}
        sx={{
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // Matches Pending Orders card
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
                    src="https://cdn-icons-png.flaticon.com/512/3039/3039427.png" // Reset Key/Lock icon
                    alt="Reset Icon"
                    sx={{ width: 60, height: 60, filter: "brightness(0) invert(1)" }}
                    onError={(e) => {e.target.style.display = 'none'}}
                 />
             </Paper>
             <Typography variant="h3" component="h1" sx={{ fontWeight: "800", mb: 2, textShadow: "0 2px 10px rgba(0,0,0,0.2)"}}>
                 New Beginning
             </Typography>
             <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300, lineHeight: 1.6 }}>
                Secure your account with a new, strong password.
             </Typography>
        </Box>
      </Grid>
      
      {/* Right Side - Form */}
      <Grid
        item
        xs={12}
        sm={5}
        md={5}
        lg={5}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#ffffff"
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
            Set New Password
          </Typography>
           <Typography variant="body1" color="textSecondary" sx={{ mb: 4, textAlign: "center" }}>
            Please enter your new password below.
          </Typography>

          {message && (
            <Alert severity="success" sx={{ width: "100%", mb: 3, borderRadius: 2 }}>
              {message}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ width: "100%", mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {token ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="New Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="At least 8 characters"
                inputProps={{ minLength: 8 }}
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
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2 }
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                  sx: { borderRadius: 2 }
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                  bgcolor: "#4facfe",
                  backgroundImage: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                   boxShadow: "0 4px 6px rgba(79, 172, 254, 0.25)",
                  "&:hover": {
                    backgroundImage: "linear-gradient(135deg, #3aa0ed 0%, #00d2fe 100%)",
                    boxShadow: "0 6px 8px rgba(79, 172, 254, 0.3)",
                  },
                }}
              >
                Reset Password
              </Button>
            </Box>
          ) : (
            <Alert severity="error" sx={{ mb: 2, width: "100%" }}>
              Invalid reset link.
            </Alert>
          )}
          
             <Button
                onClick={() => navigate("/forgot-password")}
                fullWidth
                sx={{
                    textTransform: "none",
                    color: "#6c757d",
                    mt: 1,
                    "&:hover": {
                    backgroundColor: "transparent",
                    color: "#495057",
                    textDecoration: "underline",
                    },
                }}
                >
                Request New Link
            </Button>
        </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ResetPassword;
