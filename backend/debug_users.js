require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

const checkUsers = async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);

    const users = await User.find({});
    console.log("Total Users found:", users.length);
    users.forEach(u => {
      console.log(`- ${u.email} (Role: ${u.role}, Active: ${u.isActive})`);
    });

    if (users.length === 0) {
        console.log("WARNING: Database appears to be empty (no users).");
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
  }
};

checkUsers();
