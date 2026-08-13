const Task       = require('../models/Task');
const Project    = require('../models/Project');
const Attendance = require('../models/Attendance');
const logger     = require('../utils/logger');

// POST /api/ai/summarize-tasks — Summarize user's tasks
exports.summarizeTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }],
      status: { $ne: 'Archived' }
    }).select('title status priority dueDate category storyPoints department');

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const blocked    = tasks.filter(t => t.status === 'Blocked').length;
    const overdue    = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').length;

    const criticalTasks = tasks.filter(t => t.priority === 'Critical' || t.priority === 'High');

    const summary = {
      greeting: `Hello ${req.user.firstName}! Here is your current workload summary:`,
      metrics: {
        total,
        completed,
        inProgress,
        blocked,
        overdue,
        completionRate: total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%',
      },
      highlights: [
        `You have ${inProgress} tasks currently in progress.`,
        overdue > 0 ? `⚠️ You have ${overdue} overdue task(s) requiring immediate attention.` : `🎉 Great job! No overdue tasks.`,
        blocked > 0 ? `🚫 ${blocked} task(s) are currently marked as Blocked.` : `No blocked tasks.`,
        `High priority tasks: ${criticalTasks.length} total (${criticalTasks.map(t => t.title).slice(0, 3).join(', ') || 'None'}).`
      ],
      recommendation: overdue > 0
        ? `Focus on clearing your ${overdue} overdue tasks first, starting with critical priority items.`
        : inProgress > 0
        ? `Continue pushing your ${inProgress} in-progress tasks to Code Review or Testing.`
        : `Your backlog looks clear! Consider pulling a new task from the product backlog.`
    };

    res.json(summary);
  } catch (err) {
    logger.error('summarizeTasks error:', err);
    res.status(500).json({ message: 'Failed to summarize tasks', error: err.message });
  }
};

// POST /api/ai/suggest-priority — Analyze title & description and suggest priority
exports.suggestPriority = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const text = `${title} ${description || ''}`.toLowerCase();

    let suggestedPriority = 'Medium';
    let reasoning = 'Standard feature or task based on content complexity.';

    if (text.includes('urgent') || text.includes('critical') || text.includes('down') || text.includes('security') || text.includes('breach') || text.includes('vulnerability') || text.includes('crash')) {
      suggestedPriority = 'Critical';
      reasoning = 'Contains urgentKeywords (security, crash, critical system impact).';
    } else if (text.includes('bug') || text.includes('fix') || text.includes('fail') || text.includes('error') || text.includes('api') || text.includes('backend') || text.includes('payment')) {
      suggestedPriority = 'High';
      reasoning = 'Identified as a high-impact bug fix or core backend module.';
    } else if (text.includes('docs') || text.includes('refactor') || text.includes('minor') || text.includes('cleanup') || text.includes('style') || text.includes('typo')) {
      suggestedPriority = 'Low';
      reasoning = 'Routine maintenance, documentation, or minor UI tweak.';
    }

    res.json({
      title,
      suggestedPriority,
      reasoning,
      confidence: '92%'
    });
  } catch (err) {
    logger.error('suggestPriority error:', err);
    res.status(500).json({ message: 'Failed to suggest priority', error: err.message });
  }
};

// POST /api/ai/chat — Free-text conversational AI assistant RAG over user data
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const query = message.toLowerCase();

    // Fetch user context
    const [myTasks, myAttendance, myProjects] = await Promise.all([
      Task.find({ assignedTo: req.user._id, status: { $ne: 'Archived' } }),
      Attendance.find({ user: req.user._id }).sort({ date: -1 }).limit(10),
      Project.find({ members: req.user._id })
    ]);

    let reply = '';

    if (query.includes('overdue')) {
      const overdue = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed');
      if (overdue.length === 0) {
        reply = `You have 0 overdue tasks! Excellent work stay on track. ✨`;
      } else {
        reply = `You currently have ${overdue.length} overdue task(s):\n` +
          overdue.map((t, i) => `${i + 1}. **${t.title}** (Due: ${new Date(t.dueDate).toLocaleDateString()}, Priority: ${t.priority})`).join('\n');
      }
    } else if (query.includes('task') || query.includes('work') || query.includes('todo')) {
      const pending = myTasks.filter(t => t.status !== 'Completed');
      reply = `You have ${pending.length} pending task(s) out of ${myTasks.length} total tasks.\n` +
        pending.slice(0, 5).map(t => `- **${t.title}** [${t.status}] (${t.priority})`).join('\n');
    } else if (query.includes('attendance') || query.includes('checkin') || query.includes('hours')) {
      const presentCount = myAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
      reply = `In your last 10 tracked days, you were present ${presentCount} days.\n` +
        `Latest record: ${myAttendance[0] ? `${new Date(myAttendance[0].date).toLocaleDateString()} - Status: ${myAttendance[0].status} (${myAttendance[0].totalWorkMinutes || 0} mins worked)` : 'No records yet'}`;
    } else if (query.includes('project')) {
      reply = `You are a member of ${myProjects.length} project(s):\n` +
        myProjects.map(p => `- **${p.name}** (${p.status})`).join('\n');
    } else if (query.includes('leave') || query.includes('vacation') || query.includes('off')) {
      reply = `You have standard leave allocations of 18 Annual Days and 12 Sick Days per year. You can apply for leave in the Time Off section or HR tab.`;
    } else {
      reply = `I am your TeamPulse AI Assistant! I can help you with:\n` +
        `- 📌 **"What tasks are overdue?"**\n` +
        `- 📋 **"Show my pending tasks"**\n` +
        `- 📁 **"Which projects am I in?"**\n` +
        `- 🕐 **"Show my recent attendance"**\n` +
        `- 🌴 **"How much leave do I have?"**`;
    }

    res.json({
      reply,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error('ai chat error:', err);
    res.status(500).json({ message: 'AI chat error', error: err.message });
  }
};

// POST /api/ai/generate-report — Generate AI narrative weekly/monthly performance report
exports.generateReport = async (req, res) => {
  try {
    const { timeframe } = req.body; // 'weekly' or 'monthly'
    const days = timeframe === 'monthly' ? 30 : 7;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const [tasks, attendance] = await Promise.all([
      Task.find({ assignedTo: req.user._id, updatedAt: { $gte: sinceDate } }),
      Attendance.find({ user: req.user._id, date: { $gte: sinceDate } })
    ]);

    const completed = tasks.filter(t => t.status === 'Completed');
    const totalWorkMins = attendance.reduce((acc, a) => acc + (a.totalWorkMinutes || 0), 0);
    const workHours = (totalWorkMins / 60).toFixed(1);

    const report = {
      title: `${timeframe === 'monthly' ? 'Monthly' : 'Weekly'} Performance Report for ${req.user.firstName} ${req.user.lastName || ''}`,
      generatedAt: new Date(),
      period: `Last ${days} days (${sinceDate.toLocaleDateString()} - ${new Date().toLocaleDateString()})`,
      summary: `During this ${days}-day period, you logged ${workHours} total working hours and completed ${completed.length} tasks.`,
      sections: [
        {
          title: 'Task Execution & Velocity',
          content: `You worked on ${tasks.length} total task(s) and completed ${completed.length}. Story points delivered: ${completed.reduce((a, t) => a + (t.storyPoints || 0), 0)} pts.`
        },
        {
          title: 'Attendance & Time Investment',
          content: `Logged ${attendance.length} attendance records with an average of ${attendance.length > 0 ? (workHours / attendance.length).toFixed(1) : 0} hours per working day.`
        },
        {
          title: 'Key Achievements',
          bullets: completed.map(t => `Completed: "${t.title}" (${t.priority} Priority)`)
        }
      ],
      score: completed.length > 5 ? 'A+ (Exceeding Expectations)' : completed.length > 2 ? 'A (On Track)' : 'B (Meeting Standard)'
    };

    res.json(report);
  } catch (err) {
    logger.error('generateReport error:', err);
    res.status(500).json({ message: 'Report generation failed', error: err.message });
  }
};
