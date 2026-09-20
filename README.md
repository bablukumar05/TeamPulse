# 🚀 TeamPulse — Enterprise Engineering Workspace & Sprint Management System

[![React 18](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-v22-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-black.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-emerald.svg)](https://www.mongodb.com/atlas)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-orange.svg)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-sky.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Designed & Engineered by [Bablu Kumar](https://github.com/bablukumar05)**  
> *B.Tech Computer Science & Engineering · Full Stack Engineer*  
> GitHub: [@bablukumar05](https://github.com/bablukumar05) · Contact: [kumarbablu74824@gmail.com](mailto:kumarbablu74824@gmail.com)

---

## 📌 Executive Summary

TeamPulse is an internal engineering management workspace built to eliminate bloated enterprise tool friction. Built with the full-stack JavaScript ecosystem (**MongoDB, Express 5, React 18 LTS, Node.js 22, Socket.io**), it unifies sub-30ms real-time sprint execution, RFC 6238 Two-Factor Authentication, Squad Quality Review Gates, and automated velocity analytics in one calm, high-performance interface.

---

## ⚡ 1-Click Test Credentials

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **👑 Workspace Administrator** | `admin@me.com` | `123` | Full administrative oversight, audit logs, team management, security policy |
| **👤 Software Engineer** | `employee1@example.com` | `123` | Personal Kanban queue, attendance timer, leave requests, team chat |

---

## 🌟 Core Technical Modules

- 🔐 **RFC 6238 TOTP Two-Factor Authentication (2FA)**: Open cryptographic multi-factor security compatible with Google Authenticator, Microsoft Authenticator, and 1Password, plus 5 offline emergency recovery codes and bcrypt password hashing.
- ⚡ **Sub-30ms Real-Time Event Sync**: Bidirectional WebSocket pipeline via **Socket.io** broadcasting live task state shifts, squad notifications, and room-based team chat channels without HTTP polling overhead.
- 📋 **Agile Sprint & Kanban Management**: HTML5 drag-and-drop task execution board, sprint velocity tracking, review submission gates, priority weighting, and milestone timelines.
- 🛡️ **Role-Based Access Control (RBAC)**: Strict middleware guards (`protect`, `authorizeRoles`) isolating administrative governance from employee task execution.
- ⏱️ **Time & Attendance Timelines**: Daily check-in/check-out timers, break logging, overtime tracking, and structured employee work calendars.
- 📊 **Document & Velocity Exports**: Dynamic productivity charts built with Recharts, with automated client-side 1-click PDF (`jspdf`) and Excel (`xlsx`) report downloads.
- 🏢 **HR & Squad Governance**: Department structuring across 8 specialized software units, leave approval workflows, and immutable security audit trails.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies | Architectural Purpose |
|---|---|---|
| **Frontend** | React 18.3.1 (LTS), Vite 7, Tailwind CSS 3 | SPA client rendering, custom hooks, fast HMR bundling |
| **State & Drag-Drop** | React Context API, `@hello-pangea/dnd` | Global auth caching, frictionless Kanban drag-and-drop |
| **Backend & Routing** | Node.js 22, Express.js 5 | RESTful API gateway, JWT stateless authentication, centralized error handling |
| **Real-Time Sync** | Socket.io Engine 4.x | WebSocket channels, multi-room broadcasting, live task notifications |
| **Database & Cache** | MongoDB Atlas Cloud, Mongoose 9 | Connection-pooled document store with compound indexes on query fields |
| **Security & Hardening** | Speakeasy, Helmet, Rate Limiter, Mongo-Sanitize | RFC 6238 TOTP, brute-force mitigation, NoSQL injection prevention |

---

## 🚀 Local Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account or local MongoDB instance

### 1. Clone the Repository
```bash
git clone https://github.com/bablukumar05/TeamPulse.git
cd TeamPulse
```

### 2. Install Dependencies
```bash
# Install root orchestration tools
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies (React 18)
cd frontend && npm install && cd ..
```

### 3. Configure Environment Variables
Create `.env` inside `backend/` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
```

### 4. Seed Database (Optional)
Populate initial teams, admin account (`admin@me.com`), and demo tasks:
```bash
cd backend
npm run seed
cd ..
```

### 5. Launch Application
```bash
# Concurrently launch both Backend and Frontend dev servers:
npm run dev
```

* **Frontend Client:** `http://localhost:5173`
* **Backend API:** `http://localhost:5000`

---

## 📁 Repository Structure

```
TeamPulse/
├── backend/
│   ├── controllers/      # Express controllers (auth, tasks, admin, hr, chat, etc.)
│   ├── middleware/       # Auth guards, role authorization, rate limiting, validation
│   ├── models/           # Mongoose schemas (User, Task, Workspace, Attendance, etc.)
│   ├── routes/           # REST endpoint routers
│   ├── utils/            # Email templates, cache helpers, API helpers
│   └── server.js         # HTTP & Socket.io server entry point
├── frontend/
│   ├── src/
│   │   ├── Components/   # UI modules (Dashboard, Kanban, Chat, Auth, Settings, Modals)
│   │   ├── Context/      # AuthContext and state providers
│   │   ├── Pages/        # LandingPage, CulturePage, ReportsPage
│   │   ├── utils/        # API client configuration
│   │   ├── App.jsx       # Route manager and lazy loaders
│   │   └── main.jsx      # React 18 DOM mount point
│   ├── package.json      # Frontend dependencies (React 18.3.1)
│   └── vite.config.js    # Vite configuration & proxy settings
├── package.json          # Root orchestration scripts
└── README.md             # Project documentation
```

---

## 📜 License
Distributed under the **MIT License**. Free for educational and commercial review.

---

**Designed & Built with ❤️ by Bablu Kumar**
