import React, { useState } from "react";
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
import { Email, ArrowBack } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await forgotPassword(email);
      // If in development and resetURL is provided, show it
      if (response?.data?.resetURL) {
        console.log("Reset URL:", response.data.resetURL);
        setMessage(`Reset token generated. Check browser console for reset URL.`);
      } else {
        setMessage(response?.data?.message || "Reset link sent to your email");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.[0]?.msg || 
                          err.message || 
                          "Failed to send reset email";
      setError(errorMessage);
      console.error("Forgot password error:", err);
    }
  };

  return (
    <Grid container component="main" sx={{ height: "100vh" }}>
      {/* Left Side - Hero/Gradient (Swapped) */}
      <Grid
        item
        xs={false}
        sm={4}
        md={7}
        sx={{
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", // Matches another dashboard card gradient
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
                    src="https://cdn-icons-png.flaticon.com/512/6195/6195699.png" // Secure / Shield icon
                    alt="Secure Icon"
                    sx={{ width: 60, height: 60, filter: "brightness(0) invert(1)" }}
                    onError={(e) => {e.target.style.display = 'none'}}
                 />
             </Paper>
             <Typography variant="h3" component="h1" sx={{ fontWeight: "800", mb: 2, textShadow: "0 2px 10px rgba(0,0,0,0.2)"}}>
                 Account Recovery
             </Typography>
             <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300, lineHeight: 1.6 }}>
                Don't worry, we'll help you get back into your account securely.
             </Typography>
        </Box>
      </Grid>
      
      {/* Right Side - Form */}
      <Grid
        item
        xs={12}
        sm={8}
        md={5}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f8f9fa"
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
            bgcolor: "transpatent",
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
             Reset Password
           </Typography>
           <Typography variant="body1" color="textSecondary" sx={{ mb: 4, textAlign: "center" }}>
            Enter your email address and we'll send you a link to reset your password.
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

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                sx: { borderRadius: 2 }
              }}
              variant="outlined"
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
                bgcolor: "#f093fb",
                backgroundImage: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                boxShadow: "0 4px 6px rgba(240, 147, 251, 0.25)",
                "&:hover": {
                  backgroundImage: "linear-gradient(135deg, #e083eb 0%, #e5475c 100%)",
                  boxShadow: "0 6px 8px rgba(240, 147, 251, 0.3)",
                },
              }}
            >
              Send Reset Link
            </Button>
            
            <Button
              onClick={() => navigate("/login")}
              startIcon={<ArrowBack />}
              fullWidth
              sx={{
                textTransform: "none",
                color: "#6c757d",
                mt: 2,
                "&:hover": {
                  backgroundColor: "transparent",
                  color: "#495057",
                },
              }}
            >
              Back to Login
            </Button>
          </Box>
        </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ForgotPassword;
