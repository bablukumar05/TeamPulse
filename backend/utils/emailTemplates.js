const BRAND_COLOR = '#6366f1';
const BG_DARK = '#0f172a';
const CARD_BG = '#1e293b';
const TEXT_MUTED = '#94a3b8';
const TEXT_LIGHT = '#f8fafc';

const emailWrapper = (title, contentHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
    .container { max-width: 600px; margin: 40px auto; background-color: ${BG_DARK}; border: 1px solid #334155; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { padding: 32px; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border-bottom: 1px solid #4338ca; text-align: center; }
    .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
    .body { padding: 36px 32px; font-size: 15px; line-height: 1.6; }
    .button { display: inline-block; padding: 14px 28px; background: #6366f1; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; margin-top: 24px; box-shadow: 0 4px 14px rgba(99,102,241,0.4); }
    .card { background-color: ${CARD_BG}; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .footer { padding: 24px 32px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: ${TEXT_MUTED}; }
  </style>
</head>
<body>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <div class="container">
          <div class="header">
            <a href="#" class="logo">⚡ TeamPulse Enterprise</a>
          </div>
          <div class="body">
            ${contentHtml}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} TeamPulse Inc. All rights reserved.</p>
            <p>You received this transactional notice because your account is active in your organization's workspace.</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`;

exports.generateWelcomeEmail = ({ userName, workspaceName, loginUrl }) => {
  const content = `
    <h2 style="margin-top: 0; font-size: 22px; color: ${TEXT_LIGHT};">Welcome to ${escape(workspaceName || 'TeamPulse')}, ${escape(userName)}! 👋</h2>
    <p style="color: ${TEXT_MUTED};">Your workspace account is verified and ready for collaboration. You can now access your squads, active sprints, and review pipelines.</p>
    <div class="card">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #cbd5e1;">Your Enterprise Workspace Access</p>
      <p style="margin: 0; color: ${TEXT_MUTED}; font-size: 14px;">Organization: <strong style="color: #ffffff;">${escape(workspaceName || 'Default')}</strong></p>
    </div>
    <a href="${loginUrl || 'http://localhost:5000'}" class="button">Access Your Workspace Dashboard</a>
  `;
  return emailWrapper(`Welcome to ${workspaceName || 'TeamPulse'}`, content);
};

exports.generateTaskAssignmentEmail = ({ userName, taskTitle, priority, dueDate, assignedByName, taskUrl }) => {
  const badgeColor = priority === 'Critical' ? '#ef4444' : priority === 'High' ? '#f59e0b' : '#3b82f6';
  const content = `
    <h2 style="margin-top: 0; font-size: 20px; color: ${TEXT_LIGHT};">New Task Assignment</h2>
    <p style="color: ${TEXT_MUTED};">Hello ${escape(userName)}, <strong>${escape(assignedByName || 'Your Team Leader')}</strong> has assigned you a new task.</p>
    <div class="card">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #ffffff;">${escape(taskTitle)}</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: ${TEXT_MUTED};">Priority:</td>
          <td style="padding: 6px 0; font-weight: bold; color: ${badgeColor};">${escape(priority || 'Medium')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: ${TEXT_MUTED};">Due Date:</td>
          <td style="padding: 6px 0; color: #e2e8f0;">${dueDate ? new Date(dueDate).toLocaleDateString() : 'Flexible'}</td>
        </tr>
      </table>
    </div>
    <a href="${taskUrl || 'http://localhost:5000'}" class="button">View Task in TeamPulse</a>
  `;
  return emailWrapper(`New Task: ${taskTitle}`, content);
};

exports.generateTaskReviewDecisionEmail = ({ employeeName, taskTitle, decision, reviewerName, feedback, taskUrl }) => {
  const isApproved = decision === 'Approved';
  const statusColor = isApproved ? '#10b981' : '#f59e0b';
  const statusIcon = isApproved ? '🎉' : '🔄';
  const content = `
    <h2 style="margin-top: 0; font-size: 20px; color: ${TEXT_LIGHT};">${statusIcon} Task Quality Review ${decision}</h2>
    <p style="color: ${TEXT_MUTED};">Hello ${escape(employeeName)}, your submission for <strong>"${escape(taskTitle)}"</strong> has been evaluated by <strong>${escape(reviewerName || 'Team Leader')}</strong>.</p>
    <div class="card" style="border-left: 4px solid ${statusColor};">
      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${statusColor};">Decision: ${decision}</p>
      ${feedback ? `<p style="margin: 8px 0 0 0; color: #e2e8f0; font-style: italic;">"${escape(feedback)}"</p>` : ''}
      ${isApproved ? '<p style="margin: 12px 0 0 0; color: #34d399; font-size: 13px;">+50 Experience Points (XP) awarded to your developer profile!</p>' : '<p style="margin: 12px 0 0 0; color: #fbbf24; font-size: 13px;">Task status reverted to "In Progress" for suggested refinements.</p>'}
    </div>
    <a href="${taskUrl || 'http://localhost:5000'}" class="button">Open Task Board</a>
  `;
  return emailWrapper(`Review ${decision}: ${taskTitle}`, content);
};

function escape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
