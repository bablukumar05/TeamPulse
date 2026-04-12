const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const chatRoutes = require('./routes/chatRoutes');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('authenticate', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} authenticated with socket ${socket.id}`);
  });

  socket.on('adminConnect', () => {
    socket.join('admins');
    console.log(`Admin joined admins room with socket ${socket.id}`);
  });

  socket.on('sendGlobalMessage', async (data) => {
    try {
      const newMessage = await Message.create({
        senderId: data.senderId,
        senderName: data.senderName,
        senderRole: data.senderRole,
        text: data.text
      });
      io.emit('receiveGlobalMessage', newMessage);
    } catch (err) {
      console.error('Message error', err);
    }
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
    console.log('A user disconnected:', socket.id);
  });
});

app.set('io', io);
app.set('userSockets', userSockets);

app.use(cors());
app.use(express.json());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const projectRoutes = require('./routes/projectRoutes');
const timeLogRoutes = require('./routes/timeLogRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/timelogs', timeLogRoutes);

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));
