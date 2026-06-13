/**
 * Excel Export with Auto-Alerts
 * Generates XLSX reports and triggers email notifications on changes
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { sendAlert, alertTeamAtRisk, alertHighAnomaly, alertMissedCheckin, alertConceptDrift, alertTimelineSlip } = require('./email');

const EXPORTS_DIR = path.join(__dirname, 'exports');
if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR);

const STYLE = {
  header: { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a8a' } }, alignment: { horizontal: 'center', vertical: 'center' } },
  warning: { font: { color: { argb: 'FFDC2626' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } } },
  success: { font: { color: { argb: 'FF059669' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } } },
  center: { alignment: { horizontal: 'center', vertical: 'center' } },
};

async function exportTeamsReport(teams, anomalies, checkins, summaries) {
  const workbook = new ExcelJS.Workbook();

  // Teams Sheet
  const teamsSheet = workbook.addWorksheet('Teams');
  teamsSheet.columns = [
    { header: 'Team ID', key: 'id', width: 10 },
    { header: 'Task', key: 'task', width: 40 },
    { header: 'Timeline', key: 'timeline', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Progress %', key: 'prog', width: 12 },
    { header: 'Size', key: 'size', width: 8 },
    { header: 'Lead', key: 'lead', width: 12 },
    { header: 'Missed Check-ins', key: 'missed', width: 15 },
  ];
  teamsSheet.getRow(1).style = STYLE.header;

  teams.forEach((team, idx) => {
    const row = teamsSheet.addRow({
      id: team.id,
      task: team.task,
      timeline: team.timeline,
      status: team.status,
      prog: team.prog,
      size: team.size,
      lead: team.lead,
      missed: team.missedCheckins.length,
    });
    if (team.status === 'at-risk') row.style = STYLE.warning;
    if (team.prog >= 80) teamsSheet.getRow(idx + 2).getCell('E').style = STYLE.success;
  });

  // Anomalies Sheet
  const anomaliesSheet = workbook.addWorksheet('Anomalies');
  anomaliesSheet.columns = [
    { header: 'Rule', key: 'rule', width: 30 },
    { header: 'Team', key: 'team', width: 12 },
    { header: 'Member', key: 'member', width: 12 },
    { header: 'Severity', key: 'severity', width: 10 },
    { header: 'Detail', key: 'detail', width: 50 },
    { header: 'Action', key: 'action', width: 20 },
    { header: 'Resolved', key: 'resolved', width: 10 },
  ];
  anomaliesSheet.getRow(1).style = STYLE.header;

  anomalies.forEach((a, idx) => {
    const row = anomaliesSheet.addRow({
      rule: a.rule,
      team: a.team,
      member: a.member || 'Team-wide',
      severity: a.severity,
      detail: a.detail,
      action: a.action,
      resolved: a.resolved ? '✓' : '✗',
    });
    if (a.severity === 'high') row.style = STYLE.warning;
  });

  // Checkins Sheet
  const checkinsSheet = workbook.addWorksheet('Check-ins');
  checkinsSheet.columns = [
    { header: 'Time', key: 'time', width: 20 },
    { header: 'Team', key: 'team', width: 10 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Confirmed', key: 'confirmed', width: 10 },
    { header: 'Expected', key: 'expected', width: 10 },
    { header: 'Status', key: 'completed', width: 10 },
  ];
  checkinsSheet.getRow(1).style = STYLE.header;

  checkins.forEach((c) => {
    checkinsSheet.addRow({
      time: c.time,
      team: c.team,
      type: c.type,
      confirmed: c.confirmed,
      expected: c.expected,
      completed: c.completed ? '✓' : 'Pending',
    });
  });

  // Summaries Sheet
  const summariesSheet = workbook.addWorksheet('Summaries');
  summariesSheet.columns = [
    { header: 'Team', key: 'team', width: 10 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Summary', key: 'summary', width: 60 },
    { header: 'Decisions', key: 'decisions', width: 40 },
    { header: 'Risk', key: 'risk', width: 10 },
  ];
  summariesSheet.getRow(1).style = STYLE.header;

  summaries.forEach((s) => {
    summariesSheet.addRow({
      team: s.team,
      date: s.date,
      type: s.type,
      summary: s.summary,
      decisions: s.decisions.join('; '),
      risk: s.risk,
    });
  });

  const filename = `pm-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
  const filepath = path.join(EXPORTS_DIR, filename);
  await workbook.xlsx.writeFile(filepath);
  console.log(`✅ Excel exported: ${filepath}`);
  return filepath;
}

async function checkAndAlertChanges(oldState, newState) {
  // Check for team status changes
  newState.teams.forEach((team) => {
    const oldTeam = oldState.teams.find(t => t.id === team.id);
    if (oldTeam) {
      // Status changed to at-risk
      if (oldTeam.status !== 'at-risk' && team.status === 'at-risk') {
        alertTeamAtRisk(team);
      }
      // Progress dropped significantly
      if (oldTeam.prog - team.prog >= 10) {
        alertTimelineSlip(team, team.prog, team.timeline === 'weekend' ? 1 : team.timeline === 'sprint' ? 30 : 180);
      }
      // New missed check-in
      if (team.missedCheckins.length > oldTeam.missedCheckins.length) {
        const newMissed = team.missedCheckins.find(m => !oldTeam.missedCheckins.includes(m));
        if (newMissed) alertMissedCheckin(team, newMissed);
      }
    }
  });

  // Check for new high-severity anomalies
  newState.anomalies.forEach((anomaly) => {
    const oldAnomaly = oldState.anomalies.find(a => a.rule === anomaly.rule && a.team === anomaly.team);
    if (!oldAnomaly && anomaly.severity === 'high') {
      alertHighAnomaly(anomaly);
    }
    // Check for concept drift
    if (anomaly.rule.includes('Concept drift') && !oldAnomaly) {
      const match = anomaly.detail.match(/\d+\.\d+/);
      if (match) alertConceptDrift(anomaly.team, parseFloat(match[0]));
    }
  });
}

module.exports = {
  exportTeamsReport,
  checkAndAlertChanges,
};
