require("dotenv").config();
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Supplier = require("../src/models/Supplier");
const PurchaseOrder = require("../src/models/PurchaseOrder");
const { generateToken } = require("../src/utils/jwt");
const { hashPassword } = require("../src/utils/password");

describe("RBAC Authorization Tests", () => {
  let adminToken, procurementToken, auditorToken;
  let adminUser, procurementUser, auditorUser;
  let supplier, product;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/test_db");
    }

    // Clean up existing test data - use findOneAndDelete to handle duplicates
    const testEmails = ["admin@test.com", "procurement@test.com", "auditor@test.com", "inactive@test.com"];
    for (const email of testEmails) {
      await User.findOneAndDelete({ email });
    }
    await Product.findOneAndDelete({ sku: "TEST-001" });
    await Supplier.findOneAndDelete({ email: "supplier@test.com" });
    await PurchaseOrder.deleteMany({});

    // Create test users with hashed passwords - use findOneAndUpdate with upsert
    adminUser = await User.findOneAndUpdate(
      { email: "admin@test.com" },
      {
        name: "Admin Test",
        email: "admin@test.com",
        password: await hashPassword("password123"),
        role: "ADMIN",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    procurementUser = await User.findOneAndUpdate(
      { email: "procurement@test.com" },
      {
        name: "Procurement Test",
        email: "procurement@test.com",
        password: await hashPassword("password123"),
        role: "PROCUREMENT",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    auditorUser = await User.findOneAndUpdate(
      { email: "auditor@test.com" },
      {
        name: "Auditor Test",
        email: "auditor@test.com",
        password: await hashPassword("password123"),
        role: "AUDITOR",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    // Ensure users are saved - findOneAndUpdate already returns the document, but refresh to be sure
    adminUser = await User.findById(adminUser._id);
    procurementUser = await User.findById(procurementUser._id);
    auditorUser = await User.findById(auditorUser._id);

    // Verify users exist before generating tokens
    if (!adminUser || !procurementUser || !auditorUser) {
      throw new Error("Failed to create test users");
    }

    // Generate tokens - Mongoose ObjectId works fine with JWT
    adminToken = generateToken({ userId: adminUser._id.toString(), role: adminUser.role });
    procurementToken = generateToken({ userId: procurementUser._id.toString(), role: procurementUser.role });
    auditorToken = generateToken({ userId: auditorUser._id.toString(), role: auditorUser.role });

    // Verify tokens can be decoded
    const jwt = require("jsonwebtoken");
    const decodedAdmin = jwt.verify(adminToken, process.env.JWT_SECRET || "test-secret-key-for-jwt-tokens");
    const adminFromToken = await User.findById(decodedAdmin.userId);
    if (!adminFromToken) {
      throw new Error(`Admin user not found for token userId: ${decodedAdmin.userId}`);
    }

    // Create test data
    supplier = await Supplier.findOneAndUpdate(
      { email: "supplier@test.com" },
      {
        companyName: "Test Supplier",
        contactPerson: "John Doe",
        email: "supplier@test.com",
        status: "ACTIVE",
      },
      { upsert: true, new: true }
    );

    product = await Product.findOneAndUpdate(
      { sku: "TEST-001" },
      {
        sku: "TEST-001",
        name: "Test Product",
        description: "Test Description",
        category: "Electronics",
        quantity: 100,
        unitPrice: 50,
        supplier: supplier._id,
        createdBy: adminUser._id,
        status: "ACTIVE",
      },
      { upsert: true, new: true }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Supplier.deleteMany({});
    await PurchaseOrder.deleteMany({});
    await mongoose.connection.close();
  });

  test("1. Admin can access all routes (Products, Suppliers, Orders, Users, Reports)", async () => {
    const productsResponse = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(productsResponse.status).toBe(200);

    const suppliersResponse = await request(app)
      .get("/api/suppliers")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(suppliersResponse.status).toBe(200);

    const ordersResponse = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(ordersResponse.status).toBe(200);

    const usersResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(usersResponse.status).toBe(200);

    const reportsResponse = await request(app)
      .get("/api/reports/audit")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(reportsResponse.status).toBe(200);
  });

  test("2. Procurement can access Products, Suppliers, Orders but NOT Users or Reports", async () => {
    const productsResponse = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${procurementToken}`);
    expect(productsResponse.status).toBe(200);

    const suppliersResponse = await request(app)
      .get("/api/suppliers")
      .set("Authorization", `Bearer ${procurementToken}`);
    expect(suppliersResponse.status).toBe(200);

    const ordersResponse = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${procurementToken}`);
    expect(ordersResponse.status).toBe(200);

    const usersResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${procurementToken}`);
    expect(usersResponse.status).toBe(403);

    const reportsResponse = await request(app)
      .get("/api/reports/audit")
      .set("Authorization", `Bearer ${procurementToken}`);
    expect(reportsResponse.status).toBe(403);
  });

  test("3. Auditor can ONLY access Reports, blocked from Products, Suppliers, Orders, Users", async () => {
    const productsResponse = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${auditorToken}`);
    expect(productsResponse.status).toBe(403);
    expect(productsResponse.body.message).toContain("Auditors can only view reports");

    const suppliersResponse = await request(app)
      .get("/api/suppliers")
      .set("Authorization", `Bearer ${auditorToken}`);
    expect(suppliersResponse.status).toBe(403);
    expect(suppliersResponse.body.message).toContain("Auditors can only view reports");

    const ordersResponse = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${auditorToken}`);
    expect(ordersResponse.status).toBe(403);
    expect(ordersResponse.body.message).toContain("Auditors can only view reports");

    const usersResponse = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${auditorToken}`);
    expect(usersResponse.status).toBe(403);

    const reportsResponse = await request(app)
      .get("/api/reports/audit")
      .set("Authorization", `Bearer ${auditorToken}`);
    expect(reportsResponse.status).toBe(200);
  });

  test("4. Only ADMIN can create users", async () => {
    // Clean up any existing test user
    await User.findOneAndDelete({ email: "newuser@test.com" });
    await User.findOneAndDelete({ email: "newuser2@test.com" });
    await User.findOneAndDelete({ email: "newuser3@test.com" });

    const newUser1 = {
      name: "New User 1",
      email: "newuser@test.com",
      password: "password123",
      role: "PROCUREMENT",
    };

    const adminResponse = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(newUser1);
    expect(adminResponse.status).toBe(201);

    // Use different email for procurement test
    const newUser2 = {
      name: "New User 2",
      email: "newuser2@test.com",
      password: "password123",
      role: "PROCUREMENT",
    };

    const procurementResponse = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${procurementToken}`)
      .send(newUser2);
    expect(procurementResponse.status).toBe(403);

    // Use different email for auditor test
    const newUser3 = {
      name: "New User 3",
      email: "newuser3@test.com",
      password: "password123",
      role: "PROCUREMENT",
    };

    const auditorResponse = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${auditorToken}`)
      .send(newUser3);
    expect(auditorResponse.status).toBe(403);
  });

  test("5. Only PROCUREMENT can create orders", async () => {
    const orderData1 = {
      supplier: supplier._id,
      items: [
        {
          product: product._id,
          quantity: 10,
        },
      ],
    };

    const procurementResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${procurementToken}`)
      .send(orderData1);
    expect(procurementResponse.status).toBe(201);

    // Clean up the created order
    if (procurementResponse.body._id) {
      await PurchaseOrder.findByIdAndDelete(procurementResponse.body._id);
    }

    const orderData2 = {
      supplier: supplier._id,
      items: [
        {
          product: product._id,
          quantity: 5,
        },
      ],
    };

    const adminResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(orderData2);
    expect(adminResponse.status).toBe(403);

    const orderData3 = {
      supplier: supplier._id,
      items: [
        {
          product: product._id,
          quantity: 3,
        },
      ],
    };

    const auditorResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${auditorToken}`)
      .send(orderData3);
    expect(auditorResponse.status).toBe(403);
  });

  test("6. Only ADMIN can approve orders", async () => {
    // Create first order for admin approval
    const order1 = await PurchaseOrder.create({
      orderNumber: `PO-TEST-RBAC-${Date.now()}-1`,
      supplier: supplier._id,
      items: [
        {
          product: product._id,
          quantity: 10,
          sku: product.sku,
          name: product.name,
          unitPrice: product.unitPrice,
          totalPrice: 500,
        },
      ],
      totalAmount: 500,
      status: "SUBMITTED",
      requestedBy: procurementUser._id,
    });

    const adminResponse = await request(app)
      .put(`/api/orders/${order1._id}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminResponse.status).toBe(200);

    // Create second order for procurement test
    const order2 = await PurchaseOrder.create({
      orderNumber: `PO-TEST-RBAC-${Date.now()}-2`,
      supplier: supplier._id,
      items: [
        {
          product: product._id,
          quantity: 5,
          sku: product.sku,
          name: product.name,
          unitPrice: product.unitPrice,
          totalPrice: 250,
        },
      ],
      totalAmount: 250,
      status: "SUBMITTED",
      requestedBy: procurementUser._id,
    });

    const procurementResponse = await request(app)
      .put(`/api/orders/${order2._id}/approve`)
      .set("Authorization", `Bearer ${procurementToken}`);
    expect(procurementResponse.status).toBe(403);

    // Create third order for auditor test
    const order3 = await PurchaseOrder.create({
      orderNumber: `PO-TEST-RBAC-${Date.now()}-3`,
      supplier: supplier._id,
      items: [
        {
          product: product._id,
          quantity: 3,
          sku: product.sku,
          name: product.name,
          unitPrice: product.unitPrice,
          totalPrice: 150,
        },
      ],
      totalAmount: 150,
      status: "SUBMITTED",
      requestedBy: procurementUser._id,
    });

    const auditorResponse = await request(app)
      .put(`/api/orders/${order3._id}/approve`)
      .set("Authorization", `Bearer ${auditorToken}`);
    expect(auditorResponse.status).toBe(403);
  });

  test("7. Only ADMIN can create products", async () => {
    // Clean up any existing test products
    await Product.findOneAndDelete({ sku: "NEW-001" });
    await Product.findOneAndDelete({ sku: "NEW-002" });
    await Product.findOneAndDelete({ sku: "NEW-003" });

    const productData1 = {
      sku: "NEW-001",
      name: "New Product 1",
      description: "Description",
      category: "Electronics",
      quantity: 50,
      unitPrice: 100,
      supplier: supplier._id,
      status: "ACTIVE",
    };

    const adminResponse = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(productData1);
    expect(adminResponse.status).toBe(201);

    // Clean up created product
    if (adminResponse.body._id) {
      await Product.findByIdAndDelete(adminResponse.body._id);
    }

    const productData2 = {
      sku: "NEW-002",
      name: "New Product 2",
      description: "Description",
      category: "Electronics",
      quantity: 30,
      unitPrice: 80,
      supplier: supplier._id,
      status: "ACTIVE",
    };

    const procurementResponse = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${procurementToken}`)
      .send(productData2);
    expect(procurementResponse.status).toBe(403);

    const productData3 = {
      sku: "NEW-003",
      name: "New Product 3",
      description: "Description",
      category: "Electronics",
      quantity: 20,
      unitPrice: 60,
      supplier: supplier._id,
      status: "ACTIVE",
    };

    const auditorResponse = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${auditorToken}`)
      .send(productData3);
    expect(auditorResponse.status).toBe(403);
  });

  test("8. Only ADMIN can create suppliers", async () => {
    // Clean up any existing test suppliers
    await Supplier.findOneAndDelete({ email: "newsupplier@test.com" });
    await Supplier.findOneAndDelete({ email: "newsupplier2@test.com" });
    await Supplier.findOneAndDelete({ email: "newsupplier3@test.com" });

    const supplierData1 = {
      companyName: "New Supplier 1",
      contactPerson: "Contact 1",
      email: "newsupplier@test.com",
      status: "ACTIVE",
    };

    const adminResponse = await request(app)
      .post("/api/suppliers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(supplierData1);
    expect(adminResponse.status).toBe(201);

    // Clean up created supplier
    if (adminResponse.body._id) {
      await Supplier.findByIdAndDelete(adminResponse.body._id);
    }

    const supplierData2 = {
      companyName: "New Supplier 2",
      contactPerson: "Contact 2",
      email: "newsupplier2@test.com",
      status: "ACTIVE",
    };

    const procurementResponse = await request(app)
      .post("/api/suppliers")
      .set("Authorization", `Bearer ${procurementToken}`)
      .send(supplierData2);
    expect(procurementResponse.status).toBe(403);

    const supplierData3 = {
      companyName: "New Supplier 3",
      contactPerson: "Contact 3",
      email: "newsupplier3@test.com",
      status: "ACTIVE",
    };

    const auditorResponse = await request(app)
      .post("/api/suppliers")
      .set("Authorization", `Bearer ${auditorToken}`)
      .send(supplierData3);
    expect(auditorResponse.status).toBe(403);
  });

  test("9. Unauthorized access without token returns 401", async () => {
    const productsResponse = await request(app).get("/api/products");
    expect(productsResponse.status).toBe(401);

    const ordersResponse = await request(app).get("/api/orders");
    expect(ordersResponse.status).toBe(401);

    const usersResponse = await request(app).get("/api/users");
    expect(usersResponse.status).toBe(401);
  });

  test("10. Inactive users cannot access any routes", async () => {
    // Clean up any existing inactive test user
    await User.findOneAndDelete({ email: "inactive@test.com" });
    
    const inactiveUser = await User.findOneAndUpdate(
      { email: "inactive@test.com" },
      {
        name: "Inactive User",
        email: "inactive@test.com",
        password: await hashPassword("password123"),
        role: "PROCUREMENT",
        isActive: false,
      },
      { upsert: true, new: true }
    );

    const inactiveToken = generateToken({ userId: inactiveUser._id, role: inactiveUser.role });

    // Even with valid token, inactive users should be blocked at login
    // But if they somehow have a token, they should be blocked
    const response = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${inactiveToken}`);
    
    // Note: This depends on your auth middleware implementation
    // If middleware checks isActive, it should return 401
    expect([401, 403]).toContain(response.status);
  });
});
