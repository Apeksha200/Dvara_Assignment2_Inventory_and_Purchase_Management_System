require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./src/models/Product");

async function checkProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const products = await Product.find({}).select(
      "sku name status category supplier"
    );
    console.log("Total products:", products.length);
    console.log("Sample products:");
    products.slice(0, 5).forEach((p, i) => {
      console.log(
        `${i + 1}. ${p.sku}: ${p.name} - Status: ${p.status} - Category: ${
          p.category
        }`
      );
    });

    const activeProducts = products.filter((p) => p.status === "ACTIVE");
    console.log("Active products:", activeProducts.length);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    mongoose.connection.close();
  }
}

checkProducts();
