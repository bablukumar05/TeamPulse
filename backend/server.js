const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssLib = require('xss-clean/lib/xss');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const compression = require('compression');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const logger = require('./utils/logger');

process.on('uncaughtException', (err) => {
  logger.error('FATAL UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('FATAL UNHANDLED REJECTION:', reason);
});

const authRoutes        = require('./routes/authRoutes');
const adminRoutes       = require('./routes/adminRoutes');
const employeeRoutes    = require('./routes/employeeRoutes');
const chatRoutes        = require('./routes/chatRoutes');
const projectRoutes     = require('./routes/projectRoutes');
const timeLogRoutes     = require('./routes/timeLogRoutes');
const cultureRoutes     = require('./routes/cultureRoutes');
const workspaceRoutes   = require('./routes/workspaceRoutes');
const notificationRoutes= require('./routes/notificationRoutes');
const attendanceRoutes  = require('./routes/attendanceRoutes');
const sprintRoutes      = require('./routes/sprintRoutes');
const milestoneRoutes   = require('./routes/milestoneRoutes');
const hrRoutes          = require('./routes/hrRoutes');
const aiRoutes          = require('./routes/aiRoutes');
const reportRoutes      = require('./routes/reportRoutes');
const Message = require('./models/Message');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(compression());

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(morgan('combined', { stream: logger.stream }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  try {
    ['body', 'params', 'headers'].forEach((key) => {
      if (req[key]) {
        req[key] = mongoSanitize.sanitize(req[key], { replaceWith: '_', allowDots: true });
      }
    });
  } catch (err) {
    logger.error('Error during request sanitization:', err);
  }
  next();
});

app.use((req, res, next) => {
  try {
    if (req.body) req.body = xssLib.clean(req.body);
    if (req.params) req.params = xssLib.clean(req.params);
  } catch (err) {
    logger.error('Error during XSS sanitization:', err);
  }
  next();
});

const isDev = process.env.NODE_ENV !== 'production';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth requests from this IP, please try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const userSockets = new Map();

function attachIoHandlers(io) {
  io.on('connection', (socket) => {
    logger.info(`A user connected: ${socket.id}`);

    socket.on('authenticate', (userId) => {
      userSockets.set(userId, socket.id);
      logger.info(`User ${userId} authenticated with socket ${socket.id}`);
    });

    socket.on('adminConnect', () => {
      socket.join('admins');
      logger.info(`Admin joined admins room with socket ${socket.id}`);
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
        logger.error('Message error', err);
      }
    });

    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      logger.info(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('leaveRoom', (roomId) => {
      socket.leave(roomId);
      logger.info(`Socket ${socket.id} left room ${roomId}`);
    });

    socket.on('sendRoomMessage', (data) => {
      io.to(data.roomId).emit('newRoomMessage', data.message);
    });

    socket.on('typing', ({ roomId, userId, userName }) => {
      socket.to(roomId).emit('userTyping', { roomId, userId, userName });
    });

    socket.on('stopTyping', ({ roomId, userId }) => {
      socket.to(roomId).emit('userStopTyping', { roomId, userId });
    });

    socket.on('messageReaction', (data) => {
      io.to(data.roomId).emit('messageReactionUpdated', data.message);
    });

    socket.on('disconnect', () => {
      for (let [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
      logger.info(`A user disconnected: ${socket.id}`);
    });
  });
}

function createServerWithIo(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: true,
        credentials: true,
      }
    });

    attachIoHandlers(io);

    app.set('io', io);
    app.set('userSockets', userSockets);

    server.once('error', (err) => {
      reject(err);
    });

    server.listen(port, () => {
      resolve({ server, io, port });
    });
  });
}

app.use((req, res, next) => {
  if (req.url.startsWith('/TeamPulse/api')) {
    req.url = req.url.replace('/TeamPulse/api', '/api');
  }
  next();
});

app.use('/api/', apiLimiter);
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/employee',      employeeRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/projects',      projectRoutes);
app.use('/api/timelogs',      timeLogRoutes);
app.use('/api/culture',       cultureRoutes);
app.use('/api/workspace',     workspaceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/sprints',       sprintRoutes);
app.use('/api/milestones',    milestoneRoutes);
app.use('/api/hr',            hrRoutes);
app.use('/api/ai',            aiRoutes);
app.use('/api/reports',       reportRoutes);

app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/TeamPulse/api/')) {
    return res.status(404).json({ message: `API endpoint ${req.originalUrl} not found` });
  }
  next();
});

const fs = require('fs');
const frontendDist = path.resolve(__dirname, '../frontend/dist');

app.use(express.static(frontendDist));
app.use('/TeamPulse', express.static(frontendDist));

app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/socket.io')) {
    return next();
  }
  const indexPath = path.join(frontendDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send('TeamPulse Backend API is running live.');
});

const PORT = process.env.PORT || 5000;
const DEFAULT_MONGO_URI = 'mongodb+srv://kumarbablu74824_db_user:wMooohJWCuUW8Qko@cluster0.gffjvwp.mongodb.net/TeamPulse?retryWrites=true&w=majority&appName=Cluster0';
const MONGO_URI = process.env.MONGO_URI || DEFAULT_MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    logger.info('Connected to MongoDB');

    let port = Number(PORT) || 0;
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await createServerWithIo(port);
        logger.info(`Server running on port ${result.port}`);
        return;
      } catch (err) {
        if (err && err.code === 'EADDRINUSE') {
          logger.warn(`Port ${port} is in use. Trying port ${port + 1}...`);
          port = port + 1;
          continue;
        }
        logger.error('Failed to start server:', err);
        process.exit(1);
      }
    }

    logger.error(`Unable to bind to a port after ${maxAttempts} attempts. Exiting.`);
    process.exit(1);
  })
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });
