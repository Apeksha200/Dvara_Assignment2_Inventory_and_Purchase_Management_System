require("dotenv").config();
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Supplier = require("../src/models/Supplier");
const PurchaseOrder = require("../src/models/PurchaseOrder");
const { ORDER_STATUS } = require("../src/utils/constants");
const { generateToken } = require("../src/utils/jwt");
const { hashPassword } = require("../src/utils/password");

describe("Order Workflow Tests", () => {
  let adminToken, procurementToken;
  let adminUser, procurementUser;
  let supplier, product, order;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/test_db");
    }

    // Clean up existing test data - use findOneAndDelete
    await User.findOneAndDelete({ email: "admin@test.com" });
    await User.findOneAndDelete({ email: "procurement@test.com" });
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

    // Ensure users are saved - findOneAndUpdate already returns the document, but refresh to be sure
    adminUser = await User.findById(adminUser._id);
    procurementUser = await User.findById(procurementUser._id);

    // Verify users exist before generating tokens
    if (!adminUser || !procurementUser) {
      throw new Error("Failed to create test users");
    }

    // Generate tokens - Mongoose ObjectId works fine with JWT
    adminToken = generateToken({ userId: adminUser._id.toString(), role: adminUser.role });
    procurementToken = generateToken({ userId: procurementUser._id.toString(), role: procurementUser.role });

    // Verify tokens can be decoded and users found
    const jwt = require("jsonwebtoken");
    const decodedAdmin = jwt.verify(adminToken, process.env.JWT_SECRET || "test-secret-key-for-jwt-tokens");
    const adminFromToken = await User.findById(decodedAdmin.userId);
    if (!adminFromToken) {
      throw new Error(`Admin user not found for token userId: ${decodedAdmin.userId}, adminUser._id: ${adminUser._id}`);
    }

    // Create test supplier
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

    // Create test product
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

  beforeEach(async () => {
    await PurchaseOrder.deleteMany({});
  });

  test("1. Procurement can create a DRAFT order", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${procurementToken}`)
      .send({
        supplier: supplier._id,
        items: [
          {
            product: product._id,
            quantity: 10,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(ORDER_STATUS.DRAFT);
    order = response.body;
  });

  test("2. Procurement can submit DRAFT order to SUBMITTED", async () => {
    const draftOrder = await PurchaseOrder.create({
      orderNumber: `PO-TEST-001-${Date.now()}`,
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
      status: ORDER_STATUS.DRAFT,
      requestedBy: procurementUser._id,
    });

    const response = await request(app)
      .put(`/api/orders/${draftOrder._id}/submit`)
      .set("Authorization", `Bearer ${procurementToken}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(ORDER_STATUS.SUBMITTED);
    expect(response.body.submittedAt).toBeDefined();
  });

  test("3. Admin can approve SUBMITTED order to APPROVED", async () => {
    // Verify admin user exists and is active
    const adminUserCheck = await User.findById(adminUser._id);
    expect(adminUserCheck).toBeTruthy();
    expect(adminUserCheck.isActive).toBe(true);
    expect(adminUserCheck.role).toBe("ADMIN");

    const submittedOrder = await PurchaseOrder.create({
      orderNumber: `PO-TEST-002-${Date.now()}`,
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
      status: ORDER_STATUS.SUBMITTED,
      requestedBy: procurementUser._id,
      submittedAt: new Date(),
    });

    const response = await request(app)
      .put(`/api/orders/${submittedOrder._id}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(ORDER_STATUS.APPROVED);
    expect(response.body.approvedBy).toBeDefined();
    expect(response.body.approvedAt).toBeDefined();
  });

  test("4. Procurement can deliver APPROVED order to DELIVERED", async () => {
    const approvedOrder = await PurchaseOrder.create({
      orderNumber: `PO-TEST-003-${Date.now()}`,
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
      status: ORDER_STATUS.APPROVED,
      requestedBy: procurementUser._id,
      approvedBy: adminUser._id,
      approvedAt: new Date(),
    });

    const initialQuantity = product.quantity;

    const response = await request(app)
      .put(`/api/orders/${approvedOrder._id}/deliver`)
      .set("Authorization", `Bearer ${procurementToken}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(ORDER_STATUS.DELIVERED);
    expect(response.body.deliveredAt).toBeDefined();

    // Verify inventory was updated
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.quantity).toBe(initialQuantity + 10);
  });

  test("5. Cannot submit order that is not DRAFT", async () => {
    const submittedOrder = await PurchaseOrder.create({
      orderNumber: `PO-TEST-004-${Date.now()}`,
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
      status: ORDER_STATUS.SUBMITTED,
      requestedBy: procurementUser._id,
    });

    const response = await request(app)
      .put(`/api/orders/${submittedOrder._id}/submit`)
      .set("Authorization", `Bearer ${procurementToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("already submitted");
  });

  test("6. Cannot approve order that is not SUBMITTED", async () => {
    // Verify admin user exists
    const adminUserCheck = await User.findById(adminUser._id);
    expect(adminUserCheck).toBeTruthy();

    const draftOrder = await PurchaseOrder.create({
      orderNumber: `PO-TEST-005-${Date.now()}`,
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
      status: ORDER_STATUS.DRAFT,
      requestedBy: procurementUser._id,
    });

    const response = await request(app)
      .put(`/api/orders/${draftOrder._id}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("not submitted");
  });

  test("7. Cannot deliver order that is not APPROVED", async () => {
    const submittedOrder = await PurchaseOrder.create({
      orderNumber: `PO-TEST-006-${Date.now()}`,
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
      status: ORDER_STATUS.SUBMITTED,
      requestedBy: procurementUser._id,
    });

    const response = await request(app)
      .put(`/api/orders/${submittedOrder._id}/deliver`)
      .set("Authorization", `Bearer ${procurementToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("not approved");
  });

  test("8. Cannot create order with inactive supplier", async () => {
    // Clean up any existing inactive supplier
    await Supplier.findOneAndDelete({ email: "inactive@test.com" });
    
    const inactiveSupplier = await Supplier.findOneAndUpdate(
      { email: "inactive@test.com" },
      {
        companyName: "Inactive Supplier",
        contactPerson: "Jane Doe",
        email: "inactive@test.com",
        status: "INACTIVE",
      },
      { upsert: true, new: true }
    );

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${procurementToken}`)
      .send({
        supplier: inactiveSupplier._id,
        items: [
          {
            product: product._id,
            quantity: 10,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("inactive supplier");
  });

  test("9. Order workflow follows correct sequence: DRAFT → SUBMITTED → APPROVED → DELIVERED", async () => {
    // Verify users exist
    const adminUserCheck = await User.findById(adminUser._id);
    const procurementUserCheck = await User.findById(procurementUser._id);
    expect(adminUserCheck).toBeTruthy();
    expect(procurementUserCheck).toBeTruthy();

    // Create DRAFT order
    const draftOrder = await PurchaseOrder.create({
      orderNumber: `PO-TEST-007-${Date.now()}`,
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
      status: ORDER_STATUS.DRAFT,
      requestedBy: procurementUser._id,
    });

    expect(draftOrder.status).toBe(ORDER_STATUS.DRAFT);

    // Submit
    const submittedResponse = await request(app)
      .put(`/api/orders/${draftOrder._id}/submit`)
      .set("Authorization", `Bearer ${procurementToken}`);
    expect(submittedResponse.status).toBe(200);
    expect(submittedResponse.body.status).toBe(ORDER_STATUS.SUBMITTED);

    // Approve
    const approvedResponse = await request(app)
      .put(`/api/orders/${draftOrder._id}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(approvedResponse.status).toBe(200);
    expect(approvedResponse.body.status).toBe(ORDER_STATUS.APPROVED);

    // Deliver
    const deliveredResponse = await request(app)
      .put(`/api/orders/${draftOrder._id}/deliver`)
      .set("Authorization", `Bearer ${procurementToken}`);
    expect(deliveredResponse.status).toBe(200);
    expect(deliveredResponse.body.status).toBe(ORDER_STATUS.DELIVERED);
  });

  test("10. Admin cannot submit or deliver orders (only approve)", async () => {
    // Verify admin user exists
    const adminUserCheck = await User.findById(adminUser._id);
    expect(adminUserCheck).toBeTruthy();

    const draftOrder1 = await PurchaseOrder.create({
      orderNumber: `PO-TEST-008-${Date.now()}-1`,
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
      status: ORDER_STATUS.DRAFT,
      requestedBy: procurementUser._id,
    });

    // Admin cannot submit
    const submitResponse = await request(app)
      .put(`/api/orders/${draftOrder1._id}/submit`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(submitResponse.status).toBe(403);

    // Create approved order for deliver test
    const approvedOrder = await PurchaseOrder.create({
      orderNumber: `PO-TEST-008-${Date.now()}-2`,
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
      status: ORDER_STATUS.APPROVED,
      requestedBy: procurementUser._id,
      approvedBy: adminUser._id,
      approvedAt: new Date(),
    });

    // Admin cannot deliver
    const deliverResponse = await request(app)
      .put(`/api/orders/${approvedOrder._id}/deliver`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deliverResponse.status).toBe(403);
  });
});
