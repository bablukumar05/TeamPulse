const crypto = require('crypto');
const Workspace = require('../models/Workspace');
const Task = require('../models/Task');
const LeaveRequest = require('../models/LeaveRequest');
const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const User = require('../models/User');

const findTaskFromReference = async (ref) => {
  if (!ref) return null;
  if (/^[a-fA-F0-9]{24}$/.test(ref)) {
    return await Task.findById(ref);
  }
  return await Task.findOne({
    $or: [
      { title: new RegExp(`^${ref}$`, 'i') },
      { _id: ref }
    ]
  });
};

const formatICSDate = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

const escapeICS = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

exports.handleGitHubWebhook = async (req, res) => {
  try {
    const event = req.headers['x-github-event'] || 'push';
    const payload = req.body;

    if (event === 'ping') {
      return res.status(200).json({
        status: 'ok',
        message: 'TeamPulse GitHub Webhook active and verified',
        zen: payload.zen || 'Responsiveness achieved'
      });
    }

    const processedTasks = [];

    if (event === 'push' && Array.isArray(payload.commits)) {
      for (const commit of payload.commits) {
        const message = commit.message || '';
        const taskMatches = [...message.matchAll(/#TASK-([a-fA-F0-9]{24})/gi), ...message.matchAll(/#([a-fA-F0-9]{24})/gi)];
        const isClosing = /(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)/i.test(message);

        for (const match of taskMatches) {
          const taskId = match[1];
          const task = await findTaskFromReference(taskId);
          if (!task) continue;

          const newStatus = isClosing ? 'In Review' : (task.status === 'To Do' || task.status === 'Backlog' ? 'In Progress' : task.status);
          task.status = newStatus;
          task.activityLog.push({
            action: `GitHub Commit: "${message.trim()}" (${commit.id ? commit.id.substring(0, 7) : 'commit'})`,
            performedByName: commit.author?.name || 'GitHub Integration',
            timestamp: new Date()
          });

          await task.save();
          processedTasks.push({ taskId: task._id, title: task.title, status: task.status });
        }
      }
    } else if (event === 'pull_request') {
      const pr = payload.pull_request;
      const action = payload.action;

      if (pr) {
        const text = `${pr.title || ''} ${pr.body || ''}`;
        const taskMatches = [...text.matchAll(/#TASK-([a-fA-F0-9]{24})/gi), ...text.matchAll(/#([a-fA-F0-9]{24})/gi)];

        for (const match of taskMatches) {
          const taskId = match[1];
          const task = await findTaskFromReference(taskId);
          if (!task) continue;

          if (action === 'closed' && pr.merged) {
            task.status = 'In Review';
            task.activityLog.push({
              action: `GitHub PR Merged: #${pr.number} "${pr.title}" -> Task moved to In Review`,
              performedByName: pr.merged_by?.login || 'GitHub PR Integration',
              timestamp: new Date()
            });
          } else {
            task.activityLog.push({
              action: `GitHub PR ${action}: #${pr.number} "${pr.title}"`,
              performedByName: pr.user?.login || 'GitHub PR Integration',
              timestamp: new Date()
            });
          }

          await task.save();
          processedTasks.push({ taskId: task._id, title: task.title, status: task.status });
        }
      }
    }

    return res.status(200).json({
      success: true,
      event,
      processedCount: processedTasks.length,
      tasks: processedTasks
    });
  } catch (error) {
    console.error('GitHub Webhook error:', error);
    return res.status(500).json({ message: 'Error processing GitHub Webhook', error: error.message });
  }
};

exports.handleGitLabWebhook = async (req, res) => {
  try {
    const event = req.headers['x-gitlab-event'] || 'Push Hook';
    const payload = req.body;
    const processedTasks = [];

    const commits = payload.commits || [];
    for (const commit of commits) {
      const message = commit.message || '';
      const taskMatches = [...message.matchAll(/#TASK-([a-fA-F0-9]{24})/gi), ...message.matchAll(/#([a-fA-F0-9]{24})/gi)];
      const isClosing = /(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)/i.test(message);

      for (const match of taskMatches) {
        const taskId = match[1];
        const task = await findTaskFromReference(taskId);
        if (!task) continue;

        task.status = isClosing ? 'In Review' : (task.status === 'To Do' ? 'In Progress' : task.status);
        task.activityLog.push({
          action: `GitLab Commit: "${message.trim()}" (${commit.id ? commit.id.substring(0, 7) : 'commit'})`,
          performedByName: commit.author?.name || 'GitLab Integration',
          timestamp: new Date()
        });
        await task.save();
        processedTasks.push({ taskId: task._id, title: task.title, status: task.status });
      }
    }

    return res.status(200).json({
      success: true,
      event,
      processedCount: processedTasks.length,
      tasks: processedTasks
    });
  } catch (error) {
    console.error('GitLab Webhook error:', error);
    return res.status(500).json({ message: 'Error processing GitLab Webhook', error: error.message });
  }
};

exports.handleSlackInteractions = async (req, res) => {
  try {
    let payload = req.body;
    if (typeof payload.payload === 'string') {
      try {
        payload = JSON.parse(payload.payload);
      } catch (e) {
        // use raw body
      }
    }

    const action = payload.actions?.[0];
    if (action) {
      const actionId = action.action_id;
      const leaveId = action.value;

      if (actionId === 'approve_leave' || actionId === 'deny_leave') {
        const newStatus = actionId === 'approve_leave' ? 'Approved' : 'Denied';
        const leave = await LeaveRequest.findByIdAndUpdate(leaveId, { status: newStatus }, { new: true }).populate('employeeId', 'name email');

        if (leave) {
          return res.status(200).json({
            replace_original: true,
            text: `✅ Leave Request for *${leave.employeeId?.name || 'Employee'}* has been marked as *${newStatus}* via Slack 1-Click Action.`
          });
        }
      }
    }

    return res.status(200).json({ text: 'Slack interaction processed successfully.' });
  } catch (error) {
    console.error('Slack interaction error:', error);
    return res.status(500).json({ message: 'Error processing Slack interaction', error: error.message });
  }
};

exports.getCalendarFeed = async (req, res) => {
  try {
    const { token } = req.params;
    const cleanToken = token.replace(/\.ics$/i, '');

    const workspace = await Workspace.findOne({
      'integrations.calendar.feedToken': cleanToken
    }) || await Workspace.findOne();

    if (!workspace) {
      return res.status(404).send('Calendar feed not found.');
    }

    const [leaves, milestones, tasks] = await Promise.all([
      LeaveRequest.find({ status: 'Approved' }).populate('employeeId', 'name email'),
      Milestone.find({ status: 'Open' }).populate('project', 'name'),
      Task.find({ dueDate: { $exists: true, $ne: null } }).populate('assignedTo', 'name')
    ]);

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TeamPulse//Enterprise Schedule Feed//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeICS(workspace.name || 'TeamPulse')} Enterprise Schedule`,
      'X-WR-TIMEZONE:UTC'
    ];

    leaves.forEach((l) => {
      const start = formatICSDate(l.startDate);
      const end = formatICSDate(l.endDate || l.startDate);
      if (!start || !end) return;

      lines.push(
        'BEGIN:VEVENT',
        `UID:leave-${l._id}@teampulse`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `DTSTART;VALUE=DATE:${start.substring(0, 8)}`,
        `DTEND;VALUE=DATE:${end.substring(0, 8)}`,
        `SUMMARY:[Leave] ${escapeICS(l.employeeId?.name || 'Staff')} - ${escapeICS(l.reason)}`,
        `DESCRIPTION:Approved leave for ${escapeICS(l.employeeId?.name)} (${escapeICS(l.employeeId?.email)})`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    milestones.forEach((m) => {
      const dt = formatICSDate(m.dueDate || m.createdAt);
      if (!dt) return;

      lines.push(
        'BEGIN:VEVENT',
        `UID:milestone-${m._id}@teampulse`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `DTSTART:${dt}`,
        `SUMMARY:[Milestone] ${escapeICS(m.project?.name || 'Project')} - ${escapeICS(m.name)}`,
        `DESCRIPTION:${escapeICS(m.description || 'Milestone Target Date')}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    tasks.forEach((t) => {
      const dt = formatICSDate(t.dueDate);
      if (!dt) return;

      lines.push(
        'BEGIN:VEVENT',
        `UID:task-${t._id}@teampulse`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `DTSTART:${dt}`,
        `SUMMARY:[Task Deadline] ${escapeICS(t.title)} (${escapeICS(t.assignedTo?.name || 'Assignee')})`,
        `DESCRIPTION:Priority: ${t.priority} | Status: ${t.status}\\n${escapeICS(t.description)}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    lines.push('END:VCALENDAR');
    const icsData = lines.join('\r\n');

    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="teampulse-schedule.ics"'
    });

    return res.send(icsData);
  } catch (error) {
    console.error('Calendar feed error:', error);
    return res.status(500).send('Error generating calendar feed');
  }
};

exports.getIntegrationSettings = async (req, res) => {
  try {
    let workspace = await Workspace.findOne();
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (!workspace.integrations) {
      workspace.integrations = {
        github: { enabled: false, webhookSecret: '', autoTransitionOnCommit: true, autoCloseOnPRMerge: true, defaultBranch: 'main' },
        gitlab: { enabled: false, webhookSecret: '', autoTransition: true },
        slack: { enabled: false, webhookUrl: '', channel: '#general', notifyOnTaskAssign: true, notifyOnReviewSubmit: true, dailySprintDigest: true },
        calendar: { enabled: true, feedToken: crypto.randomBytes(16).toString('hex'), includeLeaves: true, includeMilestones: true, includeDeadlines: true }
      };
      await workspace.save();
    }

    return res.status(200).json({
      success: true,
      integrations: workspace.integrations
    });
  } catch (error) {
    console.error('getIntegrationSettings error:', error);
    return res.status(500).json({ message: 'Error retrieving integration settings', error: error.message });
  }
};

exports.updateIntegrationSettings = async (req, res) => {
  try {
    let workspace = await Workspace.findOne();
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const { github, gitlab, slack, calendar } = req.body;
    if (github) workspace.integrations.github = { ...workspace.integrations.github, ...github };
    if (gitlab) workspace.integrations.gitlab = { ...workspace.integrations.gitlab, ...gitlab };
    if (slack) workspace.integrations.slack = { ...workspace.integrations.slack, ...slack };
    if (calendar) workspace.integrations.calendar = { ...workspace.integrations.calendar, ...calendar };

    await workspace.save();

    return res.status(200).json({
      success: true,
      message: 'Integration configurations saved successfully',
      integrations: workspace.integrations
    });
  } catch (error) {
    console.error('updateIntegrationSettings error:', error);
    return res.status(500).json({ message: 'Error updating integration settings', error: error.message });
  }
};

exports.testSlackWebhook = async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    if (!webhookUrl) {
      return res.status(400).json({ message: 'Webhook URL is required' });
    }

    const payload = {
      text: '⚡ *TeamPulse Enterprise Bot Connected!* Test webhook notification delivered successfully.',
      attachments: [{
        color: '#6366f1',
        title: 'Integration Health: Operational',
        text: 'Automated sprint updates and leave approval actions are now synchronized.',
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    const parsedUrl = new URL(webhookUrl);
    const client = parsedUrl.protocol === 'https:' ? require('https') : require('http');

    const data = JSON.stringify(payload);
    const request = client.request(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (response) => {
      let body = '';
      response.on('data', chunk => body += chunk);
      response.on('end', () => {
        return res.status(200).json({
          success: true,
          statusCode: response.statusCode,
          response: body
        });
      });
    });

    request.on('error', (err) => {
      return res.status(500).json({ message: 'Slack delivery failed', error: err.message });
    });

    request.write(data);
    request.end();
  } catch (error) {
    return res.status(500).json({ message: 'Error initiating Slack test', error: error.message });
  }
};
