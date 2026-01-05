const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/users.routes");
const productRoutes = require("./routes/products.routes");
const supplierRoutes = require("./routes/suppliers.routes");
const orderRoutes = require("./routes/orders.routes");
const reportRoutes = require("./routes/reports.routes");

const app = express();

app.use(helmet()); // Security headers
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3004",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" })); // Limit payload size

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reports", reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

module.exports = app;
