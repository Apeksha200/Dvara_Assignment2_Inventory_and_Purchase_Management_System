# 📦Inventory & Purchase Management System

A comprehensive MERN stack inventory and purchase order management system with role-based access control (RBAC), order workflow management, and audit logging.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB Atlas Account** (free tier available) - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Git** (optional, for cloning)

## 🛠️ Installation & Setup

### Step 1: Clone or Download the Repository

```bash
git clone <repository-url>
cd inventory_purchase_management_system
```

### Step 2: Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend` directory:
   ```bash
   touch .env
   ```

4. Add the following environment variables to `.env`:
   ```env
   # MongoDB Connection
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/inventory_db?retryWrites=true&w=majority
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   
   # Frontend URL (for password reset links)
   FRONTEND_URL=http://localhost:3000
   
   # Email Configuration (Optional - for password reset emails)
   # If not configured, reset URLs will be logged to console
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-specific-password
   ```

   **Important Notes:**
   - Replace `<username>` and `<password>` with your MongoDB Atlas credentials
   - Replace `cluster0.xxxxx.mongodb.net` with your actual MongoDB Atlas cluster URL
   - For Gmail, you'll need to generate an [App Password](https://support.google.com/accounts/answer/185833)
   - Change `JWT_SECRET` to a strong random string in production

### Step 3: Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Step 4: Database Seeding (One-time only)

**⚠️ IMPORTANT**: Run this command ONLY once during initial setup. It will populate the database with sample data.

```bash
cd backend
npm run seed
```

The seed script will create:
- 3 default users (Admin, Procurement, Auditor)
- 8 sample suppliers
- 17 sample products

**Note**: The seed script checks if data already exists and will skip seeding to preserve your data.

### Step 5: Start the Application

1. **Start Backend Server** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start Frontend Server** (Terminal 2):
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on `http://localhost:3000`

3. **Access the Application**:
   - Open your browser and navigate to `http://localhost:3000`
   - You should see the login page

## 🔐 Default Login Credentials

After seeding the database, use these credentials to login:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@gmail.com | AdminSecure2026! |
| **Procurement** | procurement@gmail.com | ProcureSecure2026! |
| **Auditor** | auditor@gmail.com | AuditSecure2026! |

## 👥 Role Permissions

### Admin
- ✅ Full access to all features
- ✅ Create/Edit/Delete products and suppliers
- ✅ Manage users (create, update, activate/deactivate, send password reset)
- ✅ Approve purchase orders
- ✅ View audit reports

### Procurement
- ✅ View products, suppliers, and orders
- ✅ Create purchase orders
- ✅ Submit draft orders
- ✅ Deliver approved orders
- ❌ Cannot approve orders
- ❌ Cannot access user management
- ❌ Cannot access reports

### Auditor
- ✅ View audit reports only
- ❌ Cannot access products, suppliers, orders, or users
- ❌ Read-only access to system

## 📊 Order Workflow

The system enforces a strict order workflow:

1. **DRAFT** (Grey) - Created by Procurement
   - Can be edited or deleted
   - Can be submitted by Procurement

2. **SUBMITTED** (Orange) - Submitted for approval
   - Cannot be edited
   - Can be approved by Admin

3. **APPROVED** (Blue) - Approved by Admin
   - Cannot be edited
   - Can be delivered by Procurement

4. **DELIVERED** (Green) - Delivered and inventory updated
   - Final state
   - Inventory quantities are automatically updated

**Valid Transitions:**
- DRAFT → SUBMITTED (Procurement only)
- SUBMITTED → APPROVED (Admin only)
- APPROVED → DELIVERED (Procurement only)

---

## 🗄️ Database Schema & Constraints

Here is the detailed schema design with constraints applied to the database models:

### Users Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `name` | String | Required | Full name of the user |
| `email` | String | Unique, Required, Email Format | User's email address (used for login) |
| `password` | String | Required, Min length 8 | Hashed password (bcrypt) |
| `role` | String | Required, Enum: ['ADMIN', 'PROCUREMENT', 'AUDITOR'] | User's role determining access level |
| `isActive` | Boolean | Default: true | Soft delete/deactivation flag |
| `createdAt` | Date | Default: Current Date | Account creation timestamp |

### Suppliers Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `companyName` | String | Required, Unique, Trimmed | Name of the supplier company |
| `contactPerson`| String | Optional | Primary contact name |
| `email` | String | Email Format | Contact email |
| `status` | String | Enum: ['ACTIVE', 'INACTIVE', 'BLACKLISTED'], Default: 'ACTIVE' | Supplier operational status |
| `paymentTerms` | String | Enum: ['ADVANCE', 'NET_30', etc.] | Agreed payment terms |

### Products Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `sku` | String | Required, Unique, Uppercase | Stock Keeping Unit identifier |
| `name` | String | Required | Product name |
| `quantity` | Number | Min: 0, Default: 0 | Current stock level |
| `unitPrice` | Number | Min: 0, Required | Price per unit |
| `supplier` | ObjectId | Required, Ref: 'Supplier' | Link to Supplier |
| `status` | String | Enum: ['ACTIVE', 'INACTIVE'] | Product availability |
| `reorderThreshold`| Number | Default: 10 | Stock level to trigger reorder alert |

### Purchase Orders Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `orderNumber` | String | Required, Unique | Auto-generated order ID |
| `supplier` | ObjectId | Ref: 'Supplier' | Supplier for the order |
| `items` | Array | Min length: 1 | List of products to order |
| `totalAmount` | Number | Min: 0, Required | Total cost of the order |
| `status` | String | Enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'DELIVERED', 'CANCELLED'] | Current order state |
| `requestedBy` | ObjectId | Required, Ref: 'User' | User who created the order |

### Order Items (Embedded in Purchase Order)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `product` | ObjectId | Required, Ref: 'Product' | Product being ordered |
| `quantity` | Number | Min: 1 | Quantity ordered |
| `unitPrice` | Number | Min: 0 | specific price at time of order |


## 🧑‍💼 Procurement Dashboard – Screenshots & Explanation

### 1. Procurement User Login
**Description**: The Procurement Officer securely logs into the system using email and password. Authentication is handled using JWT-based login, and access is granted based on the user’s assigned role. Only users created by the Admin can log in.

*   **Credentials Used**:
    *   Email: `procurement@gmail.com`
    *   Password: `ProcureSecure2026!`

<img width="1918" height="867" alt="image" src="https://github.com/user-attachments/assets/f4b4bc38-5cbb-41d5-bd0d-f0cfa0d5d634" />

### 2. Products Management – Search, Filter & Sort
**Description**: After login, the procurement user can view the Products section from the sidebar.

**Key Functionalities**:
*   **Search products by**: SKU, Product Name, Category, Supplier.
*   **Filter products**: Based on category and supplier.
*   **Sort products by**: Name, Category, Stock quantity, Low stock items.
*   **⚠️ Low Stock Alert**: Low stock products are highlighted in red color to indicate reorder priority. This helps procurement users quickly identify items that need replenishment.
  
<img width="1897" height="872" alt="image" src="https://github.com/user-attachments/assets/b50ea506-995e-4997-879b-e8ee07cf5957" />


### 3. Suppliers List (Active Suppliers Only)
**Description**: The Suppliers page displays all registered suppliers along with company name, contact person, email, phone number, payment terms, and status.

*   **Restricted Access**: ✅ Only **ACTIVE** suppliers are shown and selectable for purchase orders. Inactive suppliers are automatically restricted to ensure orders are placed only with valid and approved suppliers.
  
<img width="1889" height="858" alt="image" src="https://github.com/user-attachments/assets/a4de0545-79f9-4d7c-8956-7cb51b73662f" />

### 4. Create Purchase Order (Draft Stage)
**Description**: The procurement user can create a new Purchase Order by selecting an active supplier, choosing one or more products, and entering required quantities. Unit prices are auto-filled for accuracy.

*   **Status**: Once created, the order is saved in **DRAFT** status.

<img width="1917" height="862" alt="image" src="https://github.com/user-attachments/assets/08c5e365-107f-4b12-b37d-4f809270b8b0" />

### 5. Purchase Order Created – Draft Status
**Description**: This screen shows the newly created purchase order in DRAFT state. It displays the Order number (auto-generated), Supplier name, Total order amount, Created by (Procurement User), and Order items with quantity and price.

*   **Actions**: The procurement user can review the order, modify it if required, or submit it for approval.

  <img width="1919" height="867" alt="image" src="https://github.com/user-attachments/assets/76beae9d-cb3f-4950-be62-f5fb087da5ef" />

### 6. Purchase Order Submitted for Approval
**Description**: After review, the procurement user submits the purchase order.

*   **Transition**: Order status transitions from **DRAFT** → **SUBMITTED**.
*   **Constraints**: Once submitted, the procurement user cannot edit the order. The order is sent to the Admin for approval. No further actions are available to the procurement user until approval.
*   
<img width="1917" height="854" alt="image" src="https://github.com/user-attachments/assets/217390f8-ca20-43b9-abf1-ef175bb95c0f" />

### 7. Approval & Delivery (Inventory Update)
**Description**: The final stage of the workflow involves Admin approval and final delivery.

1.  **Admin Approval**: The Admin reviews the submitted order. If approved, the status changes to **APPROVED**.
2.  **Delivery & Inventory Update**:
    *   Once the order is **APPROVED**, it becomes available for delivery confirmation.
    *   The Procurement user marks the order as **DELIVERED**.
    *   **Inventory Update**: Upon marking as delivered, the system **automatically increases** the inventory quantity of the items in the order.
    *   This completes the procurement cycle.

 <img width="1897" height="857" alt="image" src="https://github.com/user-attachments/assets/0dc33749-10b1-4743-bad3-2e92829bdb77" />
 <img width="1917" height="868" alt="image" src="https://github.com/user-attachments/assets/c96de3cc-304b-4fa3-8e6a-1b52b4ed61e0" />


## 🛠️ Admin Dashboard - Screenshots & Explanation

### 1. Admin Login
**Description**: The Admin logs into the system using secure email and password authentication. JWT-based authentication ensures session security and role-based access.

*   **Access Control**: Only users with the **Admin** role can access administrative dashboards and controls.
*   **Credentials Used**:
    *   Email: `admin@gmail.com`
    *   Password: `AdminSecure2026!`

<img width="1913" height="860" alt="image" src="https://github.com/user-attachments/assets/ae692789-7fd2-4be0-97bd-21d969513770" />

### 2. Admin Dashboard – System Overview
**Description**: The dashboard provides a real-time summary of system health and procurement activity.

*   **Key Metrics**:
    *   **Total Products**: Number of active inventory items.
    *   **Total Suppliers**: Count of active supplier partners.
    *   **Pending Orders**: Purchase orders awaiting administrative approval.
    *   **Approved Orders**: Orders that have been approved and are ready for delivery.
      
<img width="1910" height="865" alt="image" src="https://github.com/user-attachments/assets/6211f9a6-b4e7-4705-98b0-2fefe5729ce7" />


### 3. Product Management
**Description**: Full control over the product catalog.

*   **Capabilities**:
    *   **Add/Update**: Create new products or modify details like price, SKU, and reorder thresholds.
    *   **Soft Delete**: Products are activated/deactivated rather than deleted to preserve order history and prevent data loss.
    *   **Constraint**: Inactive products cannot be selected for new purchase orders.

### 4. Supplier Management
**Description**: Management of external supplier partners.

*   **Business Rules**:
    *   **Active Status**: Only **ACTIVE** suppliers are available for Purchase Orders.
    *   **Compliance**: Inactive suppliers are restricted but retained for historical record keeping.
 
### 5. Purchase Order Approval Workflow
**Description**: A critical control point where Admins review draft orders submitted by Procurement.

*   **Process**:
    1.  Admin identifies orders in **SUBMITTED** status.
    2.  Reviews details (Items, Prices, Total Value).
    3.  **Approve**: Status changes to **APPROVED**.
    4.  **Result**: The order returns to the Procurement officer for final delivery and stock update.


<img width="1919" height="870" alt="image" src="https://github.com/user-attachments/assets/ddbf19e1-f4ff-4b68-b4f7-bdd4986ad276" />
<img width="1919" height="857" alt="image" src="https://github.com/user-attachments/assets/29bcd41b-3179-4981-89de-db034f97648c" />

### 6. User Management
**Description**: Centralized user administration without public registration.

*   **Capabilities**:
    *   **Create Users**: Add internal staff (Procurement, Auditors).
    *   **Role Assignment**: Strictly assign RBAC roles to limit access.
    *   **Status Control**: Activate or suspend user access instantly.
*   **Design Decision**: There is **no public register page**. User accounts are strictly created by Admins to ensure enterprise security.

  <img width="1918" height="867" alt="image" src="https://github.com/user-attachments/assets/f33bbbc2-6d48-4edb-8c34-02a94df1dd3f" />

### 7. Secure Password Setup (Email Invite)
**Description**: Enhanced security flow for new user onboarding.

*   **Flow**:
    1.  Admin creates a user inputting only Name, Email, and Role.
    2.  **System Action**: Admin **does NOT** set a password. The system auto-generates a secure invite link.
    3.  **User Action**: The user receives an email, clicks the link, and defines their own password.
    4.  **Benefit**: Prevents password exposure and follows security best practices.
       
<img width="1520" height="404" alt="image" src="https://github.com/user-attachments/assets/4ebca9bb-31a9-4099-911b-c083b82bdf99" />

### 8. Reports & Audit Logs
**Description**: Complete visibility into system actions for compliance.

*   **Audit Logs**: Tracks critical actions including:
    *   User creation/modification.
    *   Order status changes (Submit, Approve, Deliver).
    *   Inventory updates.
*   **Filters**: Filter logs by Date, Action Type, User, or Entity to quickly find relevant records.
*   
<img width="1912" height="811" alt="image" src="https://github.com/user-attachments/assets/3624a003-f123-431a-8395-7bd648c2d22f" />

## 🛡️ Auditor Dashboard - Screenshots & Explanation

### 1. Auditor User Login
**Description**: The Auditor uses secure credentials to access read-only audit data.

*   **Credentials Used**:
    *   Email: `auditor@gmail.com`
    *   Password: `AuditSecure2026!`
*   **Security Context**:
    *   JWT-based authentication.
    *   **Read-Only Access**: The auditor role has **no write permissions** to any operational data (orders, inventory, users).

<img width="1914" height="867" alt="image" src="https://github.com/user-attachments/assets/750a4bd0-80b4-406f-ab3c-c5a1d0edc25b" />

### 2. Auditor Dashboard Overview
**Description**: High-level snapshot of system activity to detect anomalies and ensure transparency.

*   **Dashboard Metrics**:
    *   **🧾 Total Actions Logged**: Cumulative count of all system events (audit trail size).
    *   **⏱️ Actions Today**: Volume of activity in the last 24 hours. High spikes can indicate unusual activity.
    *   **🚨 Last Critical Action**: Displays the most recent high-impact event (e.g., `APPROVE`, `DELIVER`, `DELETE`) with its timestamp.
      
<img width="1913" height="861" alt="image" src="https://github.com/user-attachments/assets/ad0e96d8-7961-47ca-99c3-2c71d33d2242" />

### 3. Audit Reports Module
**Description**: The central tool for detailed forensic analysis of system logs.

*   **Capabilities**:
    *   View a chronological table of *user* and *system* actions.
*   **Advanced Filters**:
    *   **User**: Isolate actions performed by specific staff members (e.g., "Show all actions by Admin").
    *   **Action Type**: Filter by event category such as `CREATE`, `SUBMIT`, `APPROVE`, `DELIVER`, `INVENTORY_UPDATE`.
    *   **Entity**: Focus on specific resource types (`PurchaseOrder`, `Product`, `User`).
    *   **Date Range**: Define Start and End dates to perform time-bound compliance checks.
    *   
<img width="1895" height="857" alt="image" src="https://github.com/user-attachments/assets/30cb2b78-561a-40ad-99bd-ccdfe936100c" />














