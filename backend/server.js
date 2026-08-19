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

process.on('uncaughtException', (err) => {
  console.error('FATAL UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL UNHANDLED REJECTION:', reason);
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

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(morgan('dev'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get(['/healthz', '/api/health', '/api/ping'], (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res, next) => {
  try {
    ['body', 'params', 'headers'].forEach((key) => {
      if (req[key]) {
        req[key] = mongoSanitize.sanitize(req[key], { replaceWith: '_', allowDots: true });
      }
    });
  } catch (err) {
    console.error('Error during request sanitization:', err);
  }
  next();
});

app.use((req, res, next) => {
  try {
    if (req.body) req.body = xssLib.clean(req.body);
    if (req.params) req.params = xssLib.clean(req.params);
  } catch (err) {
    console.error('Error during XSS sanitization:', err);
  }
  next();
});

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

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '1d' }));

const userSockets = new Map();

function attachIoHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

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

    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('leaveRoom', (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
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
      console.log(`A user disconnected: ${socket.id}`);
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

const mongooseOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

mongoose.connect(MONGO_URI, mongooseOptions)
  .then(async () => {
    console.log('Connected to MongoDB Atlas with connection pooling enabled');

    let port = Number(PORT) || 0;
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await createServerWithIo(port);
        console.log(`Server running on port ${result.port}`);

        const keepAliveUrl = process.env.FRONTEND_URL || 'https://teampulse-gx6p.onrender.com';
        if (keepAliveUrl && keepAliveUrl.includes('onrender.com')) {
          setInterval(() => {
            const https = require('https');
            https.get(`${keepAliveUrl}/api/health`, (res) => {
              console.log(`Self keep-alive ping status: ${res.statusCode}`);
            }).on('error', (e) => {
              console.warn('Keep-alive ping error:', e.message);
            });
          }, 10 * 60 * 1000);
        }

        return;
      } catch (err) {
        if (err && err.code === 'EADDRINUSE') {
          console.warn(`Port ${port} is in use. Trying port ${port + 1}...`);
          port = port + 1;
          continue;
        }
        console.error('Failed to start server:', err);
        process.exit(1);
      }
    }

    console.error(`Unable to bind to a port after ${maxAttempts} attempts. Exiting.`);
    process.exit(1);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
