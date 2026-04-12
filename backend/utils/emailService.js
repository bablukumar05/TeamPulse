const nodemailer = require('nodemailer');

let cachedTransporter = null;

const createTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  // If no SMTP credentials provided in .env, create Ethereal account
  if (!process.env.SMTP_HOST) {
    console.log("No SMTP details found. Generating Ethereal test account...");
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, 
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return cachedTransporter;
  }

  // Use real credentials
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return cachedTransporter;
};

exports.sendTaskAssignedEmail = async (employeeEmail, employeeName, taskTitle) => {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: '"Management System" <no-reply@company.com>',
      to: employeeEmail,
      subject: `New Task Assigned: ${taskTitle}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Hello ${employeeName},</h2>
          <p>A new task has just been assigned to you: <strong>${taskTitle}</strong>.</p>
          <p>Please log in to the Employee Dashboard to review and accept your new assignment.</p>
          <br/>
          <p>Regards,<br/>The Management Team</p>
        </div>
      `,
    });
    console.log(`Task Assignment Email sent to ${employeeEmail}. Preview: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    console.error("Failed to send task assignment email:", error);
  }
};

exports.sendTaskStatusEmail = async (adminEmails, employeeName, taskTitle, status) => {
  if (!adminEmails || adminEmails.length === 0) return;
  
  try {
    const transporter = await createTransporter();
    
    const info = await transporter.sendMail({
      from: '"Management System" <no-reply@company.com>',
      to: adminEmails.join(', '), // Send to multiple admins
      subject: `Task Status Update: ${taskTitle} is now ${status}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Task Update Alert</h2>
          <p>Employee <strong>${employeeName}</strong> has updated the status of their assigned task.</p>
          <p>Task: <strong>${taskTitle}</strong></p>
          <p>New Status: <strong style="color: ${status === 'Completed' ? 'green' : 'red'};">${status}</strong></p>
          <br/>
          <p>View the Kanban board for detailed tracking.</p>
        </div>
      `,
    });
    console.log(`Task Status Update Email sent to admins. Preview: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    console.error("Failed to send task status email:", error);
  }
};

exports.sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: '"Management System" <no-reply@company.com>',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Please click the button below to set a new password.</p>
          <a href="${resetUrl}" style="display:inline-block; padding:10px 20px; background-color:#10b981; color:white; text-decoration:none; border-radius:5px; margin-top:10px;">Reset Password</a>
          <p style="margin-top:20px; font-size: 12px; color: #888;">If you did not request this, please ignore this email.</p>
          <p style="margin-top:10px; font-size: 10px; color: #888;">Or copy and paste this link: <a href="${resetUrl}">${resetUrl}</a></p>
        </div>
      `,
    });
    console.log(`Password reset email sent. Preview: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }
};
