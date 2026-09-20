# LabTrack - Institutional Lab Equipment & Asset Tracking System

A full-stack, enterprise-grade institutional laboratory asset management and equipment issue-return tracking system built with **Node.js**, **Express.js**, **MongoDB**, **Mongoose**, **EJS**, and modern **Vanilla CSS3 / JavaScript**.

Designed for university departments, engineering colleges, and research institutions to manage high-value laboratory equipment, track inventory balances in real time, enforce atomic checkout quotas, monitor overdue returns, log repair maintenance, and generate verified analytics.

---

## 🚀 Key Features

### 1. Role-Based Access Control (RBAC) & Security
- **Strict 3-Tier Hierarchy**: System Administrator, Lab In-Charge, and Requesters (Students & Faculty/Staff).
- **Session-Based Authentication**: Secure server-side sessions with `express-session`, `connect-mongo` persistence, and `bcryptjs` password hashing.
- **Protection**: URL tampering guardrails, `helmet` security headers, input sanitization, and Mongoose CastError/duplicate-key interceptors.

### 2. Equipment Catalog & Asset Lifecycle Management
- **Catalog**: Search by keyword, filter by category, laboratory location, condition, and real-time stock availability.
- **Real-Time Balance Invariant**: Guaranteed conservation formula:
  $$\text{Total Units} = \text{Available} + \text{Issued} + \text{Damaged} + \text{Under Maintenance} + \text{Lost}$$
- **Atomic Concurrency Guard**: Server-side MongoDB conditional `$inc` queries prevent over-issuing race conditions.
- **Protected Deletion**: Prevents decommissioning or deleting assets with active borrowings or pending requests.

### 3. Equipment Issue & Return Workflows
- **State Machine**:
  $$\text{PENDING} \longrightarrow \text{APPROVED} \longrightarrow \text{ISSUED} \longrightarrow \text{RETURNED}$$
  (With intermediate `REJECTED` and `CANCELLED` branches).
- **Condition Grading upon Return**:
  - **OK**: Automatically returned to available laboratory stock.
  - **Damaged**: Isolated in damaged quarantine tally; triggers optional 1-click maintenance scheduling.
  - **Lost**: Recorded against lost tally, adjusting active inventory.

### 4. Dynamic Overdue Identification
- Automatically flags items where $\text{Current Date} > \text{Expected Return Date}$ and status is `issued`.
- High-visibility overdue banners, warning badges, and days-overdue counters on dashboards and tables.

### 5. Maintenance & Service Logging (Stretch Goal)
- Preventive maintenance and repair tracking with technician names, costs, scheduled dates, and service scopes.
- Seamless status transition (`scheduled` $\rightarrow$ `in_progress` $\rightarrow$ `completed`) with inventory restoration.

### 6. Aggregated Analytics & CSV Data Export
- Real MongoDB aggregation pipelines calculating equipment utilization, category share, and lab distribution.
- Interactive Chart.js visualizations.
- Instant server-side CSV dataset export for assets and transaction audit logs.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime** | Node.js (v20+) |
| **Web Framework** | Express.js 4.x |
| **Database & ODM** | MongoDB with Mongoose 8.x |
| **View Engine** | EJS + Express-EJS-Layouts |
| **Session Management** | Express-Session + Connect-Mongo |
| **Styling** | Vanilla CSS3 (Custom Design System, Deep Navy / Slate theme) |
| **Client Scripts** | Vanilla JavaScript (ES6+), Chart.js |
| **Security** | Helmet, Bcryptjs, Method-Override, Connect-Flash |

---

## 📋 Default Development Credentials

Run `npm run seed` to populate the database with realistic institutional data:

| Role | Email | Password | Assigned Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@labtrack.edu` | `Admin@12345` | Global Full Access |
| **Lab In-Charge (CS & IoT)** | `incharge.cs@labtrack.edu` | `Lab@12345` | IoT & HPC Labs |
| **Lab In-Charge (ECE & Robo)** | `incharge.ece@labtrack.edu` | `Lab@12345` | Robotics, Power & Physics Labs |
| **Student Requester** | `student.rahul@labtrack.edu` | `User@12345` | B.Tech CSE (Roll: 2023CSB042) |
| **Student Requester** | `student.ananya@labtrack.edu` | `User@12345` | B.Tech ECE (Roll: 2023ECB089) |
| **Staff / Researcher** | `staff.priya@labtrack.edu` | `User@12345` | Robotics & AI Center |

---

## ⚡ Quick Start & Installation

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/lab_asset_management
SESSION_SECRET=labtrack_super_secure_session_secret_2026_x9k2p
```

### 3. Seed the Database
Populate 16+ realistic institutional assets, 5 laboratories, 6 categories, and sample requests across all states:
```bash
npm run seed
```

### 4. Run Automated Tests
```bash
npm test
```

### 5. Launch the Server
```bash
# Production mode
npm start

# Development mode with Nodemon
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🏛️ Permissions Matrix

| Feature / Action | Requester | Lab In-Charge | Admin |
| :--- | :---: | :---: | :---: |
| Browse Equipment Catalog & Real-Time Stock | ✅ | ✅ | ✅ |
| Submit Issue Request | ✅ | ❌ | ❌ |
| View Own Requests & Borrowing History | ✅ | ✅ | ✅ |
| Cancel Own Pending Request | ✅ | ✅ | ✅ |
| Approve / Reject Requests | ❌ | ✅ | ✅ |
| Issue Equipment Handover | ❌ | ✅ | ✅ |
| Record Equipment Return & Condition | ❌ | ✅ | ✅ |
| Create / Edit Equipment Assets | ❌ | ✅ | ✅ |
| Delete Assets (with reference protection) | ❌ | ❌ | ✅ |
| Manage Categories & Laboratories | ❌ | ❌ | ✅ |
| User Directory & Role Management | ❌ | ❌ | ✅ |
| Log & Complete Equipment Maintenance | ❌ | ✅ | ✅ |
| View Analytics & Export CSV Reports | ❌ | ✅ | ✅ |

---

## 📂 Project Structure

```
├── app.js                   # Express application setup & middleware stack
├── server.js                # HTTP server bootstrap & MongoDB connection
├── package.json             # NPM dependencies and scripts
├── .env                     # Environment configuration
├── config/
│   └── db.js                # MongoDB connection handler with Mongoose
├── models/
│   ├── User.js              # User schema with bcrypt encryption
│   ├── Category.js          # Asset category schema
│   ├── Lab.js               # Laboratory and location schema
│   ├── Asset.js             # Equipment asset schema with balance invariant
│   ├── IssueRequest.js      # Request lifecycle schema with overdue virtuals
│   └── MaintenanceLog.js    # Service and calibration record schema
├── middleware/
│   ├── auth.js              # Authentication and session locals middleware
│   ├── role.js              # Role-based access control guards
│   ├── validation.js        # Input sanitization and ObjectId validation
│   └── errorHandler.js      # 404, 403, 500 and Mongoose error handlers
├── services/
│   ├── inventoryService.js  # Atomic issue and conditional return business logic
│   ├── requestService.js    # Request lifecycle state transitions
│   ├── statsService.js      # Real MongoDB dashboard aggregation pipelines
│   └── reportService.js     # Analytics summaries and CSV generation
├── controllers/
│   ├── authController.js    # Login, register, logout, profile
│   ├── assetController.js   # Catalog, detail, create, edit, soft delete
│   ├── requestController.js # Request submissions, reviews, approvals
│   ├── returnController.js  # Handover fulfillment and return grading
│   ├── maintenanceController.js # Maintenance scheduling and resolution
│   ├── adminController.js   # Users, categories, and laboratories CRUD
│   └── reportController.js  # System reports and CSV exports
├── routes/
│   ├── index.js             # Landing and dynamic role-based dashboards
│   ├── authRoutes.js        # Authentication endpoints
│   ├── assetRoutes.js       # Equipment endpoints
│   ├── requestRoutes.js     # Request workflow endpoints
│   ├── returnRoutes.js      # Issue and return endpoints
│   ├── maintenanceRoutes.js # Maintenance endpoints
│   ├── adminRoutes.js       # Admin management endpoints
│   └── reportRoutes.js      # Report analytics and export endpoints
├── views/
│   ├── layouts/             # Base shells (main.ejs, auth.ejs)
│   ├── partials/            # Sidebar, Header, Toasts, Pagination
│   ├── auth/                # Login, Register, Profile views
│   ├── dashboard/           # Admin, Lab In-charge, Requester dashboards
│   ├── assets/              # Catalog, Show, Create, Edit views
│   ├── requests/            # Queue, New, Show detail views
│   ├── returns/             # Return grading view
│   ├── maintenance/         # Log list and schedule views
│   ├── admin/               # Users, Categories, Labs admin views
│   ├── reports/             # System analytics view
│   └── errors/              # 403, 404, 500 styled error pages
├── public/
│   ├── css/                 # main.css, dashboard.css, auth.css
│   └── js/                  # main.js, charts.js
├── scripts/
│   └── seed.js              # Database seeder with realistic institutional data
└── test/
    └── app.test.js          # Automated business logic test suite
```

---

## 🔒 Security Practices
- **Password Security**: Bcrypt with salt rounds = 10; passwords stripped from `toJSON()` serialization.
- **Session Security**: Cookies configured with `httpOnly: true`, `sameSite: 'lax'`, and persistent Mongo session store.
- **Input Validation**: Server-side verification for quantities, return dates, non-empty purpose, and Mongo ObjectIds.
- **Error Handling**: Graceful error handling prevents database stack leakages in production.
# test-02
