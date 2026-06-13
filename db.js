/**
 * SQLite Persistence Layer
 * Stores teams, check-ins, anomalies, and metrics
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'pm-hub.db'), (err) => {
  if (err) console.error('Database error:', err);
  else console.log('✅ SQLite connected');
});

// Initialize schema
function initSchema() {
  db.serialize(() => {
    // Teams table
    db.run(`CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      size INTEGER,
      timeline TEXT,
      status TEXT,
      prog INTEGER,
      lead TEXT,
      task TEXT,
      members TEXT,
      missedCheckins TEXT,
      createdAt DATETIME,
      updatedAt DATETIME
    )`);

    // Checkins table
    db.run(`CREATE TABLE IF NOT EXISTS checkins (
      id TEXT PRIMARY KEY,
      time TEXT,
      team TEXT,
      type TEXT,
      confirmed INTEGER,
      expected INTEGER,
      completed BOOLEAN,
      createdAt DATETIME
    )`);

    // Anomalies table
    db.run(`CREATE TABLE IF NOT EXISTS anomalies (
      id TEXT PRIMARY KEY,
      rule TEXT,
      member TEXT,
      team TEXT,
      severity TEXT,
      detail TEXT,
      action TEXT,
      resolved BOOLEAN,
      createdAt DATETIME,
      resolvedAt DATETIME
    )`);

    // Summaries table
    db.run(`CREATE TABLE IF NOT EXISTS summaries (
      id TEXT PRIMARY KEY,
      team TEXT,
      date TEXT,
      type TEXT,
      summary TEXT,
      decisions TEXT,
      risk TEXT,
      createdAt DATETIME
    )`);

    // Metrics table (time-series)
    db.run(`CREATE TABLE IF NOT EXISTS metrics (
      id TEXT PRIMARY KEY,
      timestamp DATETIME,
      total INTEGER,
      teams INTEGER,
      behind INTEGER,
      missed INTEGER,
      data TEXT
    )`);

    // Events log (for analytics)
    db.run(`CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      timestamp DATETIME,
      type TEXT,
      teamId TEXT,
      memberId TEXT,
      oldValue TEXT,
      newValue TEXT,
      details TEXT
    )`);

    console.log('📦 Schema initialized');
  });
}

// Insert/Update functions
function saveTeam(team) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO teams (id, size, timeline, status, prog, lead, task, members, missedCheckins, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [team.id, team.size, team.timeline, team.status, team.prog, team.lead, team.task, 
       JSON.stringify(team.members), JSON.stringify(team.missedCheckins)],
      (err) => err ? reject(err) : resolve()
    );
  });
}

function saveAnomaly(anomaly) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO anomalies (id, rule, member, team, severity, detail, action, resolved, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [Date.now().toString(), anomaly.rule, anomaly.member, anomaly.team, anomaly.severity, 
       anomaly.detail, anomaly.action, anomaly.resolved ? 1 : 0],
      (err) => err ? reject(err) : resolve()
    );
  });
}

function logEvent(type, teamId, memberId, oldValue, newValue, details) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO events (id, timestamp, type, teamId, memberId, oldValue, newValue, details)
       VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?)`,
      [Date.now().toString(), type, teamId, memberId, oldValue, newValue, details],
      (err) => err ? reject(err) : resolve()
    );
  });
}

function getMetricsHistory(hours = 24) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM metrics WHERE timestamp > datetime('now', '-' || ? || ' hours') ORDER BY timestamp`,
      [hours],
      (err, rows) => err ? reject(err) : resolve(rows || [])
    );
  });
}

function getEvents(hours = 24) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM events WHERE timestamp > datetime('now', '-' || ? || ' hours') ORDER BY timestamp DESC`,
      [hours],
      (err, rows) => err ? reject(err) : resolve(rows || [])
    );
  });
}

initSchema();

module.exports = {
  db,
  saveTeam,
  saveAnomaly,
  logEvent,
  getMetricsHistory,
  getEvents,
};
