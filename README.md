# 🚀 TeamPulse — Enterprise Workforce & Project Management Platform

TeamPulse is an enterprise-grade workforce management and agile project orchestration system built with the MERN stack (**MongoDB, Express 5, React 19, Node.js 22**). It centralizes real-time team communication, Kanban task tracking, HR operations, and interactive analytics into a single responsive workspace.

---

## 🌟 Key Modules & Capabilities

- 💬 **Real-Time Collaboration**: Multi-room chat channels, private direct messaging, real-time typing indicators, and message reaction updates powered by **Socket.IO**.
- 📋 **Agile Sprint & Task Management**: Interactive drag-and-drop Kanban task boards, sprint velocity benchmarking, priority levels, and milestone timelines.
- 👥 **HR & Organizational Hierarchy**: Employee directory across 8 specialized IT departments, leave request workflows, performance reviews, and document management.
- ⏱️ **Time & Attendance Tracking**: Daily check-in/check-out timers, break logging, overtime tracking, and automated attendance calendars.
- 📊 **Analytics & Document Exporting**: Interactive productivity charts built with Recharts, with 1-click automated PDF and Excel report downloads.
- 🤖 **AI Assistant Drawer**: Embedded AI helper providing employees with instant assistance on task prioritization and workspace navigation.

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS 3, Axios, Socket.IO Client, Recharts, `@hello-pangea/dnd`, `react-hot-toast` |
| **Backend** | Node.js 22, Express 5, Socket.IO 4, Mongoose 9, Helmet, Compression, Express Rate Limit, Morgan |
| **Database** | MongoDB Atlas Cloud |
| **Hosting** | Vercel (Frontend) & Render (Backend) |

---

## 🚀 Quick Start (Local Setup)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/bablukumar05/TeamPulse.git
cd TeamPulse

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Environment Variables
Create `.env` in `backend/` and `frontend/`:

**`backend/.env`**:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

**`frontend/.env`**:
```env
VITE_API_URL=http://localhost:5000
```

### 3. Run Development Servers
```bash
# Terminal 1 (Backend)
npm start

# Terminal 2 (Frontend)
cd frontend && npm run dev
```

---
