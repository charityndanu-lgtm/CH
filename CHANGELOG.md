# PM Hub v2 Changelog

## [2.0.0] - 2026-06-13

### ✨ New Features

- **Excel Export** 
  - Auto-export reports every hour
  - Manual export via UI button
  - 4 sheets: Teams, Anomalies, Check-ins, Summaries
  - Color-coded status (at-risk, on-track, success)
  - Stored in `./exports/` directory

- **Email Alerts**
  - Automated notifications on state changes
  - 6 alert types: status change, anomalies, missed check-ins, timeline slip, concept drift, new members
  - Gmail SMTP integration
  - Alert checks every 5 minutes

- **SQLite Persistence**
  - Local database (`pm-hub.db`)
  - 6 tables: teams, checkins, anomalies, summaries, metrics, events
  - Full audit log of all state changes
  - Auto-sync every 30 seconds
  - Easy backup/restore

- **Analytics Engine**
  - Team health score (0-100)
  - Velocity prediction (hours to completion)
  - Trend detection (improving, declining, stalled)
  - Time-series metrics tracking
  - Actionable insights generation

- **Enhanced UI v2**
  - 4 tabs: Overview, Analytics, Alerts, AI Assistant
  - Real-time metrics dashboard
  - Team analytics per-team
  - Live feed with SSE updates
  - Improved styling (gradient colors, animations)
  - Responsive design (mobile-friendly)
  - Better error handling

- **Deployment Options**
  - Docker support (Dockerfile, docker-compose.yml)
  - Heroku deployment guide
  - AWS EC2 setup with Nginx
  - PM2 process management
  - Health check endpoints

### 🐛 Bug Fixes

- Fixed: Team status changes now properly trigger alerts
- Fixed: Anomaly resolution properly broadcasts SSE events
- Fixed: Database sync issues with concurrent updates
- Fixed: Email service graceful fallback when SMTP unavailable
- Fixed: Memory leaks in SSE client management
- Fixed: Proper error handling in Claude API calls
- Fixed: State consistency between UI and database

### 🔧 Improvements

- Modular architecture (db.js, email.js, excel.js, analytics.js)
- Comprehensive logging for debugging
- Environment variable configuration
- Security headers in HTTP responses
- CORS properly configured
- Input validation on all endpoints
- Database indexes for performance
- Graceful shutdown handling

### 📚 Documentation

- Complete setup guide (SETUP.md)
- Deployment guide (DEPLOYMENT.md)
- API reference included
- Troubleshooting section
- Architecture diagrams

### 🔐 Security

- No hardcoded secrets
- Environment variables for all config
- CORS configured properly
- Rate limiting ready (Nginx config included)
- Database backups supported
- Audit log for all changes

### 📦 Dependencies

```json
{
  "uuid": "^9.0.0",
  "nodemailer": "^6.9.7",
  "exceljs": "^4.4.0",
  "sqlite3": "^5.1.6"
}
```

### 🚀 Performance

- Database query optimization
- Efficient Excel generation
- Email sending in background
- Event broadcasting via SSE
- Metrics caching

### 📱 Browser Support

- Chrome/Chromium
- Firefox
- Safari
- Edge
- Mobile browsers

---

## Migration from v1

If upgrading from v1:

```bash
# Backup old database
cp pm-hub.db pm-hub.db.v1.backup

# Install new dependencies
npm install

# Start v2 server
npm start  # uses server-v2.js
```

New database will be created automatically.
