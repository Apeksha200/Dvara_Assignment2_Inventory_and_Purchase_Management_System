require("dotenv").config();
const mongoose = require("mongoose");

const User = require("./src/models/User");
const Supplier = require("./src/models/Supplier");
const Product = require("./src/models/Product");
const PurchaseOrder = require("./src/models/PurchaseOrder");
const AuditLog = require("./src/models/AuditLog");

const { hashPassword } = require("./src/utils/password");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    const existingUsers = await User.countDocuments();
    const existingSuppliers = await Supplier.countDocuments();
    const existingProducts = await Product.countDocuments();

    const force = process.argv.includes("--force");
    if ((existingUsers || existingSuppliers || existingProducts) && !force) {
      console.log("Database already seeded. Skipping seeding. Use --force to overwrite.");
      return;
    }

    console.log("Starting database seeding...");

    await Promise.all([
      User.deleteMany(),
      Supplier.deleteMany(),
      Product.deleteMany(),
      PurchaseOrder.deleteMany(),
      AuditLog.deleteMany(),
    ]);

    /* ---------------- USERS ---------------- */
    const users = await User.insertMany([
      {
        name: "Admin User",
        email: "admin@gmail.com",
        password: await hashPassword("AdminSecure2026!"),
        role: "ADMIN",
      },
      {
        name: "Procurement User",
        email: "procurement@gmail.com",
        password: await hashPassword("ProcureSecure2026!"),
        role: "PROCUREMENT",
      },
      {
        name: "Auditor User",
        email: "auditor@gmail.com",
        password: await hashPassword("AuditSecure2026!"),
        role: "AUDITOR",
      },
    ]);

    const admin = users[0];

    /* ---------------- SUPPLIERS ---------------- */
    const suppliers = await Supplier.insertMany([
      {
        companyName: "Tech Supplies Inc",
        contactPerson: "Rajesh Kumar",
        email: "rajesh@techsupplies.in",
        phone: "+91-9876543210",
        address: {
          line1: "123 Tech Park, Sector 5",
          city: "Bangalore",
          state: "Karnataka",
          country: "India",
          postalCode: "560001"
        },
        status: "ACTIVE",
        paymentTerms: "NET_30",
      },
      {
        companyName: "Office Essentials Ltd",
        contactPerson: "Priya Sharma",
        email: "sales@officeessentials.in",
        phone: "+91-9876543211",
        address: {
          line1: "45 Corporate Avenue",
          city: "Mumbai",
          state: "Maharashtra",
          country: "India",
          postalCode: "400001"
        },
        status: "ACTIVE",
        paymentTerms: "NET_15",
      },
      {
        companyName: "Global IT Solutions",
        contactPerson: "Amit Patel",
        email: "support@globalit.in",
        phone: "+91-9876543212",
        address: {
          line1: "789 Cyber Hub",
          city: "Gurgaon",
          state: "Haryana",
          country: "India",
          postalCode: "122002"
        },
        status: "ACTIVE",
        paymentTerms: "NET_30",
      },
      {
        companyName: "Modern Furniture Co",
        contactPerson: "Suresh Reddy",
        email: "info@modernfurniture.in",
        phone: "+91-9876543213",
        address: {
          line1: "12 Industrial Area",
          city: "Hyderabad",
          state: "Telangana",
          country: "India",
          postalCode: "500034"
        },
        status: "ACTIVE",
        paymentTerms: "NET_60",
      },
      {
        companyName: "Eco Cleaning Supplies",
        contactPerson: "Anita Desai",
        email: "sales@ecoclean.in",
        phone: "+91-9876543214",
        address: {
          line1: "56 Green Road",
          city: "Pune",
          state: "Maharashtra",
          country: "India",
          postalCode: "411001"
        },
        status: "ACTIVE",
        paymentTerms: "NET_15",
      },
      {
        companyName: "Premium Stationery",
        contactPerson: "Vikram Singh",
        email: "orders@premiumstationery.in",
        phone: "+91-9876543215",
        address: {
          line1: "89 Book Street",
          city: "New Delhi",
          state: "Delhi",
          country: "India",
          postalCode: "110001"
        },
        status: "ACTIVE",
        paymentTerms: "NET_30",
      },
      {
        companyName: "Secure Networks Inc",
        contactPerson: "Karthik Nair",
        email: "admin@securenetworks.in",
        phone: "+91-9876543216",
        address: {
          line1: "234 IT Park",
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          postalCode: "600001"
        },
        status: "ACTIVE",
        paymentTerms: "NET_30",
      },
      {
        companyName: "Industrial Tools Corp",
        contactPerson: "Manoj Tiwari",
        email: "sales@industrialtools.in",
        phone: "+91-9876543217",
        address: {
          line1: "67 Manufacturing Hub",
          city: "Ahmedabad",
          state: "Gujarat",
          country: "India",
          postalCode: "380001"
        },
        status: "ACTIVE",
        paymentTerms: "NET_45",
      },
      {
        companyName: "Medical Supplies Hub",
        contactPerson: "Dr. Anjali Gupta",
        email: "contact@medsupplies.in",
        phone: "+91-9876543218",
        address: {
          line1: "90 Health City",
          city: "Bangalore",
          state: "Karnataka",
          country: "India",
          postalCode: "560066"
        },
        status: "ACTIVE",
        paymentTerms: "NET_30",
      },
      {
        companyName: "Inactive Supplier",
        contactPerson: "Lazy Supplier",
        email: "inactive@supplies.in",
        phone: "+91-9876543200",
        address: {
          line1: "00 Nowhere Road",
          city: "Unknown",
          state: "Unknown",
          country: "India",
          postalCode: "000000"
        },
        status: "INACTIVE",
        paymentTerms: "ADVANCE",
      },
    ]);

    const s = suppliers;

    /* ---------------- PRODUCTS ---------------- */
    const products = [
      // Tech Supplies (Id: 0)
      { sku: "TECH-001", name: "Dell Latitude Laptop", category: "Electronics", quantity: 40, unitPrice: 85000, supplier: s[0]._id },
      { sku: "TECH-002", name: "Logitech Wireless Mouse", category: "Accessories", quantity: 150, unitPrice: 1200, supplier: s[0]._id },
      { sku: "TECH-003", name: "Mechanical Keyboard", category: "Accessories", quantity: 100, unitPrice: 4500, supplier: s[0]._id },

      // Office Essentials (Id: 1)
      { sku: "OFF-001", name: "A4 Printer Paper (Rim)", category: "Stationery", quantity: 300, unitPrice: 450, supplier: s[1]._id },
      { sku: "OFF-002", name: "LED Desk Lamp", category: "Lighting", quantity: 40, unitPrice: 2500, supplier: s[1]._id },
      { sku: "OFF-003", name: "Ergonomic Footrest", category: "Furniture", quantity: 20, unitPrice: 1800, supplier: s[1]._id },

      // Global IT (Id: 2)
      { sku: "IT-001", name: "Cisco Network Switch", category: "Networking", quantity: 12, unitPrice: 25000, supplier: s[2]._id },
      { sku: "IT-002", name: "42U Server Rack", category: "Hardware", quantity: 6, unitPrice: 85000, supplier: s[2]._id },
      { sku: "IT-003", name: "CAT6 Ethernet Cable (Bundle)", category: "Networking", quantity: 50, unitPrice: 5000, supplier: s[2]._id },

      // Modern Furniture (Id: 3)
      { sku: "FURN-001", name: "Electric Standing Desk", category: "Furniture", quantity: 15, unitPrice: 35000, supplier: s[3]._id },
      { sku: "FURN-002", name: "Mesh Ergonomic Chair", category: "Furniture", quantity: 25, unitPrice: 12000, supplier: s[3]._id },
      { sku: "FURN-003", name: "Filing Cabinet", category: "Furniture", quantity: 10, unitPrice: 8000, supplier: s[3]._id },

      // Eco Cleaning (Id: 4)
      { sku: "CLEAN-001", name: "Floor Cleaner (5L)", category: "Cleaning", quantity: 80, unitPrice: 1500, supplier: s[4]._id },
      { sku: "CLEAN-002", name: "Paper Towels (Pack of 12)", category: "Cleaning", quantity: 120, unitPrice: 800, supplier: s[4]._id },
      { sku: "CLEAN-003", name: "Hand Sanitizer (500ml)", category: "Cleaning", quantity: 200, unitPrice: 250, supplier: s[4]._id },

      // Premium Stationery (Id: 5)
      { sku: "STAT-001", name: "Premium Notebook", category: "Stationery", quantity: 200, unitPrice: 350, supplier: s[5]._id },
      { sku: "STAT-002", name: "Whiteboard Markers (Set)", category: "Stationery", quantity: 180, unitPrice: 450, supplier: s[5]._id },
      { sku: "STAT-003", name: "Stapler Heavy Duty", category: "Stationery", quantity: 50, unitPrice: 650, supplier: s[5]._id },

      // Secure Networks (Id: 6)
      { sku: "SEC-001", name: "Firewall Appliance", category: "Security", quantity: 4, unitPrice: 120000, supplier: s[6]._id },
      { sku: "SEC-002", name: "VPN Gateway", category: "Security", quantity: 6, unitPrice: 75000, supplier: s[6]._id },
      { sku: "SEC-003", name: "Biometric Scanner", category: "Security", quantity: 10, unitPrice: 15000, supplier: s[6]._id },

      // Industrial Tools (Id: 7)
      { sku: "IND-001", name: "Cordless Power Drill", category: "Tools", quantity: 20, unitPrice: 8500, supplier: s[7]._id },
      { sku: "IND-002", name: "Angle Grinder", category: "Tools", quantity: 15, unitPrice: 6500, supplier: s[7]._id },
      { sku: "IND-003", name: "Tool Box Set", category: "Tools", quantity: 10, unitPrice: 12500, supplier: s[7]._id },

      // Medical Supplies (Id: 8)
      { sku: "MED-001", name: "Surgical Gloves (Box)", category: "Medical", quantity: 500, unitPrice: 450, supplier: s[8]._id },
      { sku: "MED-002", name: "N95 Face Masks (Pack)", category: "Medical", quantity: 1000, unitPrice: 800, supplier: s[8]._id },
      { sku: "MED-003", name: "First Aid Kit", category: "Medical", quantity: 50, unitPrice: 2500, supplier: s[8]._id },
    ].map((p) => ({ ...p, createdBy: admin._id, status: "ACTIVE" }));

    await Product.insertMany(products);

    console.log("✅ Seeding completed successfully");
    console.log("Admin: admin@gmail.com / AdminSecure2026!");
    console.log("Procurement: procurement@gmail.com / ProcureSecure2026!");
    console.log("Auditor: auditor@gmail.com / AuditSecure2026!");
  } catch (err) {
    console.error("Seeding failed:", err);
  }
};

if (require.main === module) {
  const runSeed = async () => {
    await connectDB();
    await seedData();
    mongoose.connection.close();
    process.exit();
  };
  runSeed();
}

module.exports = { seedData };
