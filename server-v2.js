/**
 * AI Program Manager Hub — Enhanced Backend (v2)
 * Features: Excel export, email alerts, persistence, analytics
 * Run: node server-v2.js
 * Set ANTHROPIC_API_KEY, SMTP_USER, SMTP_PASS env variables
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { saveTeam, saveAnomaly, logEvent, getMetricsHistory, getEvents } = require('./db');
const { exportTeamsReport, checkAndAlertChanges } = require('./excel');
const { generateInsights, getTeamMetrics } = require('./analytics');
const {
  alertTeamAtRisk,
  alertHighAnomaly,
  alertMissedCheckin,
  alertConceptDrift,
  alertTimelineSlip,
  alertDiscordJoin,
} = require('./email');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY || '';

// ─── In-memory state (synced to SQLite) ───────────────────────────────────
let STATE = {
  teams: [
    { id:'Alpha',  size:5, timeline:'weekend',  status:'on-track', prog:78, lead:'Dev #003', task:'Explainable AI classifier (LIME)', members:['Dev #001','Dev #003','Dev #012','Dev #045','Dev #067'], missedCheckins:[] },
    { id:'Sigma',  size:6, timeline:'weekend',  status:'at-risk',  prog:31, lead:'Dev #019', task:'AI ethics audit tool',            members:['Dev #019','Dev #022','Dev #034','Dev #056','Dev #071','Dev #088'], missedCheckins:['Dev #071'] },
    { id:'Beta',   size:4, timeline:'weekend',  status:'on-track', prog:65, lead:'Dev #007', task:'Bias detection pipeline',         members:['Dev #007','Dev #028','Dev #041','Dev #093'], missedCheckins:['Dev #093'] },
    { id:'Omega',  size:6, timeline:'weekend',  status:'at-risk',  prog:44, lead:'Dev #015', task:'Model transparency dashboard',    members:['Dev #015','Dev #033','Dev #052','Dev #064','Dev #079','Dev #098'], missedCheckins:['Dev #079'] },
    { id:'Delta',  size:5, timeline:'sprint',   status:'at-risk',  prog:58, lead:'Dev #006', task:'Federated learning module',       members:['Dev #006','Dev #017','Dev #039','Dev #047','Dev #061'], missedCheckins:['Dev #047'] },
    { id:'Gamma',  size:6, timeline:'sprint',   status:'at-risk',  prog:49, lead:'Dev #011', task:'Anomaly detection API',           members:['Dev #011','Dev #024','Dev #038','Dev #055','Dev #072','Dev #084'], missedCheckins:['Dev #038'] },
    { id:'Epsilon',size:5, timeline:'sprint',   status:'on-track', prog:81, lead:'Dev #004', task:'Model monitoring service',        members:['Dev #004','Dev #021','Dev #043','Dev #066','Dev #082'], missedCheckins:[] },
    { id:'Zeta',   size:4, timeline:'sprint',   status:'on-track', prog:70, lead:'Dev #009', task:'Dataset versioning tool',         members:['Dev #009','Dev #027','Dev #048','Dev #075'], missedCheckins:[] },
    { id:'Eta',    size:6, timeline:'sprint',   status:'on-track', prog:63, lead:'Dev #014', task:'Synthetic data generator',        members:['Dev #014','Dev #029','Dev #053','Dev #068','Dev #083','Dev #096'], missedCheckins:['Dev #096'] },
    { id:'Theta',  size:5, timeline:'sprint',   status:'on-track', prog:74, lead:'Dev #002', task:'Privacy-preserving ML layer',     members:['Dev #002','Dev #031','Dev #049','Dev #077','Dev #091'], missedCheckins:[] },
    { id:'Iota',   size:6, timeline:'roadmap',  status:'on-track', prog:22, lead:'Dev #005', task:'Interpretability framework v2',   members:['Dev #005','Dev #020','Dev #036','Dev #057','Dev #073','Dev #090'], missedCheckins:[] },
    { id:'Kappa',  size:5, timeline:'roadmap',  status:'on-track', prog:31, lead:'Dev #008', task:'Regulatory compliance engine',    members:['Dev #008','Dev #025','Dev #044','Dev #062','Dev #086'], missedCheckins:['Dev #062'] },
    { id:'Lambda', size:4, timeline:'roadmap',  status:'on-track', prog:19, lead:'Dev #013', task:'Model card generator',            members:['Dev #013','Dev #030','Dev #059','Dev #094'], missedCheckins:[] },
  ],
  checkins: [
    { id:'ci1', time:'Today 3:00 PM',    team:'Alpha',   type:'Stand-up',       confirmed:5, expected:5, completed:false },
    { id:'ci2', time:'Today 4:30 PM',    team:'Delta',   type:'Blocker review', confirmed:4, expected:5, completed:false },
    { id:'ci3', time:'Today 6:00 PM',    team:'Sigma',   type:'Concept-lock',   confirmed:6, expected:6, completed:false },
    { id:'ci4', time:'Tomorrow 9:00 AM', team:'Gamma',   type:'Cross-team sync',confirmed:0, expected:8, completed:false },
    { id:'ci5', time:'Tomorrow 10:00 AM',team:'Epsilon', type:'Stand-up',       confirmed:0, expected:5, completed:false },
  ],
  summaries: [],
  anomalies: [
    { rule:'Consecutive missed check-ins ≥ 2', member:'Dev #047', team:'Delta',  severity:'high', detail:'Missed Tue 9am and Thu 9am stand-ups. Task T-14 unassigned-equivalent, blocking 2 others.', action:'Schedule 1:1', resolved:false },
    { rule:'Concept drift score > 0.7',         member:null,       team:'Sigma',  severity:'high', detail:'3 distinct concept directions in last 6 messages. Drift score: 0.83. No agreed scope at hour 26.', action:'Emergency scope-lock', resolved:false },
    { rule:'Blocker unresolved > 24h',          member:'Dev #024', team:'Gamma',  severity:'med',  detail:'Blocker logged at T+12h, still open at T+48h. Upstream API dependency on Team Theta.', action:'Cross-team sync', resolved:false },
    { rule:'Task velocity drop > 40%',          member:null,       team:'Omega',  severity:'med',  detail:'Commits/hr dropped from 2.1 to 0.8 between day 1 and day 2. Weekend challenge clock running.', action:'Check momentum', resolved:false },
  ],
  meetings: [],
  discordLog: [],
};

const OLD_STATE = JSON.parse(JSON.stringify(STATE)); // For change detection
const sseClients = new Set();

function broadcast(eventName, data) {
  const msg = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try { res.write(msg); } catch (_) { sseClients.delete(res); }
  }
}

// Sync state to database every 30 seconds
setInterval(async () => {
  for (const team of STATE.teams) {
    await saveTeam(team);
  }
  for (const anomaly of STATE.anomalies) {
    await saveAnomaly(anomaly);
  }
  console.log('💾 State synced to database');
}, 30000);

// Export report every hour
setInterval(async () => {
  try {
    const file = await exportTeamsReport(STATE.teams, STATE.anomalies, STATE.checkins, STATE.summaries);
    broadcast('export-ready', { file });
  } catch (e) {
    console.error('Export error:', e);
  }
}, 3600000);

// Check for changes and send alerts
setInterval(async () => {
  try {
    await checkAndAlertChanges(OLD_STATE, STATE);
  } catch (e) {
    console.error('Alert check error:', e);
  }
}, 300000); // Every 5 minutes

async function askClaude(systemPrompt, userPrompt) {
  if (!API_KEY) return '⚠️  No ANTHROPIC_API_KEY set. Set the environment variable and restart the server.';
  const https = require('https');
  const body = JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.error) return resolve(`Claude error: ${parsed.error.message}`);
          const text = (parsed.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
          resolve(text || 'No response.');
        } catch (e) { resolve('Parse error: ' + e.message); }
      });
    });
    req.on('error', e => resolve('Network error: ' + e.message));
    req.write(body);
    req.end();
  });
}

const SYSTEM = `You are the AI assistant for a program manager overseeing 100 programmers across 13 teams working on AI ethics tools. Teams have up to 6 members. Three timelines: Weekend challenge (48h), 4–6 week sprint, 6–8 month roadmap. Main pain points: meeting deadlines, concept drift (teams bouncing between ideas), missed check-ins. You use transparent explainable rules — no black-box decisions. Be direct, concise, and action-oriented. Plain text only, no markdown headers or bullet symbols.`;

function router(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const json = (data, code = 200) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  const body = () => new Promise(resolve => {
    let b = '';
    req.on('data', d => b += d);
    req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch { resolve({}); } });
  });

  // Static files
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(path.join(__dirname, 'index-v2.html')));
    return;
  }

  // SSE stream
  if (pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write('event: connected\ndata: {"ok":true}\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // GET /api/state
  if (pathname === '/api/state' && req.method === 'GET') {
    json({
      teams: STATE.teams,
      checkins: STATE.checkins,
      summaries: STATE.summaries,
      anomalies: STATE.anomalies,
      meetings: STATE.meetings,
      discordLog: STATE.discordLog,
      metrics: {
        total: 100,
        teams: STATE.teams.length,
        behind: STATE.teams.filter(t => t.status === 'at-risk').length,
        missed: STATE.teams.reduce((n, t) => n + t.missedCheckins.length, 0),
      },
      insights: generateInsights(STATE),
    });
    return;
  }

  // GET /api/analytics/team/:id
  if (pathname.startsWith('/api/analytics/team/') && req.method === 'GET') {
    const id = pathname.split('/')[4];
    const team = STATE.teams.find(t => t.id === id);
    if (!team) { json({ error: 'not found' }, 404); return; }
    json({ metrics: getTeamMetrics(team) });
    return;
  }

  // GET /api/export
  if (pathname === '/api/export' && req.method === 'GET') {
    exportTeamsReport(STATE.teams, STATE.anomalies, STATE.checkins, STATE.summaries)
      .then(file => json({ file, success: true }))
      .catch(e => json({ error: e.message }, 500));
    return;
  }

  // POST /api/ai
  if (pathname === '/api/ai' && req.method === 'POST') {
    body().then(async ({ prompt, context }) => {
      const full = context ? `${prompt}\n\nContext: ${context}` : prompt;
      const answer = await askClaude(SYSTEM, full);
      json({ answer });
      broadcast('ai-response', { prompt: prompt.slice(0, 60), answer: answer.slice(0, 120) });
    });
    return;
  }

  // POST /api/agenda
  if (pathname === '/api/agenda' && req.method === 'POST') {
    body().then(async ({ target, kind, context }) => {
      const prompt = `Draft a tight meeting agenda for ${target}. Meeting kind: ${kind}. Context: ${context}. Max 5 agenda items, each one line. Include time box in minutes per item. End with one clear decision to be made.`;
      const agenda = await askClaude(SYSTEM, prompt);
      const meeting = { id: uuidv4(), target, kind, agenda, scheduledAt: new Date().toISOString() };
      STATE.meetings.push(meeting);
      json({ meeting });
      broadcast('meeting-scheduled', { target, kind });
    });
    return;
  }

  // POST /api/discord-match
  if (pathname === '/api/discord-match' && req.method === 'POST') {
    body().then(async ({ name, skills, interest }) => {
      const teamSummaries = STATE.teams.map(t => `Team ${t.id} (${t.timeline}, ${t.size}/6 members): ${t.task}`).join('; ');
      const prompt = `New programmer joining Discord #team-formation. Name: ${name}. Skills: ${skills}. Interest: ${interest}.\nExisting teams: ${teamSummaries}\nRecommend the best team fit (max 2 sentences) and why. Also name 1–2 existing members they'd complement well. Keep it warm and under 80 words.`;
      const recommendation = await askClaude(SYSTEM, prompt);
      const entry = { name, skills, interest, recommendation, joinedAt: new Date().toISOString() };
      STATE.discordLog.push(entry);
      alertDiscordJoin(name, recommendation);
      json({ recommendation, entry });
      broadcast('discord-join', { name });
    });
    return;
  }

  // POST /api/checkin-summary
  if (pathname === '/api/checkin-summary' && req.method === 'POST') {
    body().then(async ({ team, notes }) => {
      const t = STATE.teams.find(x => x.id === team);
      const prompt = `Write a meeting summary for Team ${team} check-in. Team task: ${t ? t.task : 'unknown'}. Notes from the meeting: "${notes}". Format: 2–3 sentence narrative summary, then list key decisions as short phrases separated by "|". End with risk level: low, medium, or high.`;
      const raw = await askClaude(SYSTEM, prompt);
      const parts = raw.split('|');
      const summary = parts[0].trim();
      const decisions = parts.slice(1, -1).map(d => d.trim()).filter(Boolean);
      const riskLine = parts[parts.length - 1] || '';
      const risk = riskLine.toLowerCase().includes('high') ? 'high' : riskLine.toLowerCase().includes('med') ? 'med' : 'low';
      const entry = { team, date: new Date().toLocaleString(), type:'Check-in', summary, decisions, risk };
      STATE.summaries.unshift(entry);
      json({ entry });
      broadcast('summary-added', { team });
    });
    return;
  }

  // PATCH /api/team/:id/progress
  if (pathname.startsWith('/api/team/') && pathname.endsWith('/progress') && req.method === 'PATCH') {
    body().then(async ({ prog, status }) => {
      const id = pathname.split('/')[3];
      const team = STATE.teams.find(t => t.id === id);
      if (!team) { json({ error: 'not found' }, 404); return; }
      const oldStatus = team.status;
      const oldProg = team.prog;
      if (prog !== undefined) team.prog = Math.min(100, Math.max(0, Number(prog)));
      if (status) team.status = status;
      
      // Log event
      await logEvent('team-update', id, null, JSON.stringify({ prog: oldProg, status: oldStatus }), JSON.stringify({ prog: team.prog, status: team.status }), `Progress: ${oldProg}% → ${team.prog}%, Status: ${oldStatus} → ${team.status}`);
      
      // Check alerts
      if (oldStatus !== 'at-risk' && team.status === 'at-risk') {
        await alertTeamAtRisk(team);
      }
      
      json({ team });
      broadcast('team-updated', { id, prog: team.prog, status: team.status });
    });
    return;
  }

  // PATCH /api/anomaly/:idx/resolve
  if (pathname.startsWith('/api/anomaly/') && pathname.endsWith('/resolve') && req.method === 'PATCH') {
    const idx = parseInt(pathname.split('/')[3]);
    if (STATE.anomalies[idx]) {
      STATE.anomalies[idx].resolved = true;
      json({ ok: true });
      broadcast('anomaly-resolved', { idx });
    } else {
      json({ error: 'not found' }, 404);
    }
    return;
  }

  // POST /api/simulate-checkin-miss
  if (pathname === '/api/simulate-checkin-miss' && req.method === 'POST') {
    body().then(async ({ team, member }) => {
      const t = STATE.teams.find(x => x.id === team);
      if (t && member && !t.missedCheckins.includes(member)) {
        t.missedCheckins.push(member);
        if (t.missedCheckins.length >= 2) {
          t.status = 'at-risk';
          await alertTeamAtRisk(t);
        }
        await alertMissedCheckin(t, member);
      }
      json({ team: t });
      broadcast('checkin-missed', { team, member });
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
}

http.createServer(router).listen(PORT, () => {
  console.log(`\n✅ PM Hub v2 running → http://localhost:${PORT}`);
  console.log('📊 Features: Excel export | Email alerts | Persistence | Analytics');
  if (!API_KEY) console.warn('⚠️  ANTHROPIC_API_KEY not set — AI features will show placeholder.');
  else console.log('🔑 Anthropic API key detected — AI features active.');
  console.log('\nPress Ctrl+C to stop.\n');
});
