/**
 * Email Alert System
 * Sends automated emails on timeline-critical changes
 */

const nodemailer = require('nodemailer');

const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const ALERT_EMAIL = process.env.ALERT_EMAIL || 'alerts@company.com';
const PM_EMAIL = process.env.PM_EMAIL || 'pm@company.com';

let transporter = null;

if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  console.log('📧 Email service initialized');
} else {
  console.warn('⚠️  Email not configured. Set SMTP_USER and SMTP_PASS.');
}

async function sendAlert(subject, html, to = PM_EMAIL) {
  if (!transporter) return console.log(`[EMAIL MOCK] ${subject}`);

  try {
    await transporter.sendMail({
      from: ALERT_EMAIL,
      to,
      subject: `🚨 ${subject}`,
      html,
    });
    console.log(`✅ Email sent: ${subject}`);
  } catch (err) {
    console.error('Email error:', err.message);
  }
}

function alertTeamAtRisk(team) {
  const html = `
    <h2>⚠️ Team At Risk</h2>
    <p><strong>Team ${team.id}</strong> is now <strong style="color:red;">AT-RISK</strong></p>
    <ul>
      <li>Task: ${team.task}</li>
      <li>Progress: ${team.prog}%</li>
      <li>Timeline: ${team.timeline}</li>
      <li>Lead: ${team.lead}</li>
      <li>Missed Check-ins: ${team.missedCheckins.length}</li>
    </ul>
    <p><a href="http://localhost:3000">View Dashboard</a></p>
  `;
  return sendAlert(`Team ${team.id} Status Change`, html);
}

function alertHighAnomaly(anomaly) {
  const html = `
    <h2>🔴 High Severity Anomaly</h2>
    <p><strong>${anomaly.rule}</strong></p>
    <p>${anomaly.detail}</p>
    <p><strong>Action:</strong> ${anomaly.action}</p>
    <p><strong>Team:</strong> ${anomaly.team} | <strong>Severity:</strong> ${anomaly.severity}</p>
  `;
  return sendAlert(`Anomaly: ${anomaly.rule}`, html);
}

function alertMissedCheckin(team, member) {
  const html = `
    <h2>📋 Missed Check-in</h2>
    <p><strong>${member}</strong> missed a check-in for <strong>Team ${team.id}</strong></p>
    <p>Task: ${team.task}</p>
    <p>Missed check-ins so far: ${team.missedCheckins.length}</p>
    <p><strong>Action:</strong> Follow up with ${member} immediately.</p>
  `;
  return sendAlert(`Missed Check-in: Team ${team.id}`, html);
}

function alertConceptDrift(team, driftScore) {
  const html = `
    <h2>🌀 Concept Drift Alert</h2>
    <p><strong>Team ${team.id}</strong> is experiencing high concept drift.</p>
    <p><strong>Drift Score:</strong> ${driftScore} (threshold: 0.7)</p>
    <p>Team members are bouncing between ideas. Recommend emergency scope-lock meeting.</p>
    <p>Task: ${team.task}</p>
  `;
  return sendAlert(`Concept Drift: Team ${team.id}`, html);
}

function alertTimelineSlip(team, percentComplete, daysRemaining) {
  const html = `
    <h2>⏱️ Timeline Slip Warning</h2>
    <p><strong>Team ${team.id}</strong> may slip their <strong>${team.timeline}</strong> deadline.</p>
    <p><strong>Current Progress:</strong> ${percentComplete}%</p>
    <p><strong>Time Remaining:</strong> ${daysRemaining} days</p>
    <p>At current velocity, team will not complete on time.</p>
    <p><a href="http://localhost:3000">View Dashboard</a></p>
  `;
  return sendAlert(`Timeline Slip: Team ${team.id}`, html);
}

function alertDiscordJoin(name, recommendation) {
  const html = `
    <h2>👤 New Team Member</h2>
    <p><strong>${name}</strong> joined Discord #team-formation</p>
    <p><strong>Recommendation:</strong></p>
    <p>${recommendation}</p>
    <p><a href="http://localhost:3000">Approve Assignment</a></p>
  `;
  return sendAlert(`New Member: ${name}`, html);
}

module.exports = {
  sendAlert,
  alertTeamAtRisk,
  alertHighAnomaly,
  alertMissedCheckin,
  alertConceptDrift,
  alertTimelineSlip,
  alertDiscordJoin,
};
