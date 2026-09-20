const os = require('os');
const mongoose = require('mongoose');
const cache = require('../utils/cache');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Workspace = require('../models/Workspace');

const formatUptime = (seconds) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
};

exports.getSystemMetrics = async (req, res) => {
  try {
    const memory = process.memoryUsage();
    const memMb = {
      rss: +(memory.rss / 1024 / 1024).toFixed(2),
      heapTotal: +(memory.heapTotal / 1024 / 1024).toFixed(2),
      heapUsed: +(memory.heapUsed / 1024 / 1024).toFixed(2),
      external: +(memory.external / 1024 / 1024).toFixed(2)
    };

    const osMemory = {
      total: +(os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
      free: +(os.freemem() / 1024 / 1024 / 1024).toFixed(2),
      usedPercentage: +(((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(1)
    };

    let mongoLatency = null;
    let mongoStatus = 'disconnected';
    if (mongoose.connection.readyState === 1) {
      mongoStatus = 'connected';
      try {
        const start = Date.now();
        await mongoose.connection.db.admin().ping();
        mongoLatency = Date.now() - start;
      } catch (err) {
        mongoLatency = -1;
      }
    } else if (mongoose.connection.readyState === 2) {
      mongoStatus = 'connecting';
    }

    const socketCount = req.app.get('userSockets')?.size || 0;

    const [userCount, taskCount, projectCount] = await Promise.all([
      User.countDocuments().catch(() => 0),
      Task.countDocuments().catch(() => 0),
      Project.countDocuments().catch(() => 0)
    ]);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      service: 'TeamPulse Enterprise Backend',
      environment: process.env.NODE_ENV || 'production',
      version: '2.4.0',
      uptime: {
        seconds: Math.floor(process.uptime()),
        formatted: formatUptime(process.uptime())
      },
      process: {
        nodeVersion: process.version,
        pid: process.pid,
        platform: process.platform,
        arch: process.arch,
        memoryMB: memMb
      },
      system: {
        hostname: os.hostname(),
        cpus: os.cpus().length,
        loadAvg: os.loadavg(),
        ramGB: osMemory
      },
      database: {
        status: mongoStatus,
        pingLatencyMs: mongoLatency,
        poolSize: 10,
        activeModels: {
          users: userCount,
          tasks: taskCount,
          projects: projectCount
        }
      },
      cache: cache.getStats(),
      sockets: {
        activeUsersOnline: socketCount
      }
    });
  } catch (error) {
    console.error('getSystemMetrics error:', error);
    return res.status(500).json({ message: 'Error collecting system metrics', error: error.message });
  }
};

exports.clearCache = async (req, res) => {
  try {
    const cleared = cache.flush();
    return res.status(200).json({
      success: true,
      message: `System cache flushed successfully (${cleared} keys cleared)`,
      clearedKeys: cleared
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error flushing system cache', error: error.message });
  }
};
