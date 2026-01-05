// Jest setup file - ensures environment variables are loaded
require("dotenv").config();

// Ensure JWT_SECRET is set for tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-secret-key-for-jwt-tokens";
}

if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = "7d";
}

console.log("Test environment configured");
