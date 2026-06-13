# 🚀 AI Program Manager Hub v2 — Complete Setup Guide

## ✅ What's Included

✓ **Excel Export** — Auto-generate XLSX reports with team data, anomalies, check-ins  
✓ **Email Alerts** — Automated notifications on timeline-critical changes  
✓ **Persistence** — SQLite database for all state, events, metrics  
✓ **Analytics** — Team health scores, velocity prediction, trend detection  
✓ **Bug Fixes** — Proper error handling, logging, state sync  
✓ **Real-time UI v2** — Enhanced dashboard with tabs, analytics, live feed  
✓ **Deployment Ready** — Docker, Heroku, EC2, PM2 configurations  

---

## 📋 Prerequisites

- **Node.js** 14+ ([download](https://nodejs.org/))
- **npm** 6+ (comes with Node.js)
- **Git**
- **Gmail account** with 2FA (for email alerts)
- **Anthropic API key** (for Claude AI features)

---

## 🔧 Installation (5 minutes)

### 1. Clone & Install

```bash
cd CH
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # Gmail App Password (16 chars with spaces)
ALERT_EMAIL=alerts@yourcompany.com
PM_EMAIL=pm@yourcompany.com
PORT=3000
NODE_ENV=development
```

**How to get Gmail App Password:**
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Windows Computer" (or your device)
3. Generate password → Copy the 16-character code
4. Paste into `SMTP_PASS` (include spaces)

### 3. Run Locally

```bash
npm start
# or: npm run dev
```

**Output:**
```
✅ PM Hub v2 running → http://localhost:3000
📊 Features: Excel export | Email alerts | Persistence | Analytics
🔑 Anthropic API key detected — AI features active.

Press Ctrl+C to stop.
```

Open **http://localhost:3000** in your browser.

---

## 📊 Using the Dashboard

### Overview Tab
- **Teams Status** — See all 13 teams with progress bars, status, and missed check-ins
- **Anomalies & Alerts** — High-priority issues flagged automatically
- **Check-ins** — Upcoming meetings with confirmation counts
- **Discord Joins** — New team members with AI recommendations

### Analytics Tab
- Select a team to see:
  - **Health Score** (0-100)
  - **Progress %**
  - **Estimated hours to completion**
  - **On-track prediction**

### Alerts Tab
- Live feed of all state changes
- Email alerts logged in real-time
- Export confirmations

### AI Assistant Tab
- Ask Claude about team status, scheduling, risks
- Context-aware responses based on current state
- Example: *"Which teams are at risk and why?"*

---

## 🔔 Email Alerts (Automatic)

The system sends automated emails when:

✉️ **Team Status Change** → `at-risk`  
✉️ **High Anomaly Detected** → Concept drift, missed check-ins, velocity drop  
✉️ **Check-in Missed** → Dev didn't confirm attendance  
✉️ **Timeline Slip Warning** → Progress too low for deadline  
✉️ **New Discord Member** → With AI team recommendation  
✉️ **Excel Report Ready** → Hourly export completion  

**Alert checks run every 5 minutes.**

---

## 📄 Excel Reports

### Auto-Export Schedule
- **Triggered**: Every hour + manually via "📊 Export Report" button
- **Location**: `./exports/pm-report-YYYY-MM-DD.xlsx`
- **Sheets**:
  - **Teams** — Status, progress, missed check-ins
  - **Anomalies** — Severity, detail, action items
  - **Check-ins** — Upcoming, confirmations, type
  - **Summaries** — Team meeting notes, decisions, risk

### Download Report
1. Click **"📊 Export Report"** button (top right)
2. File auto-downloads
3. Email notification sent to PM
4. Excel file opens in Google Sheets / Excel

---

## 💾 Database (SQLite)

### Location
```
./pm-hub.db
```

### Tables
- `teams` — All team state + history
- `checkins` — Check-in attendance tracking
- `anomalies` — Detected issues with timestamps
- `summaries` — Meeting notes & decisions
- `metrics` — Time-series performance data
- `events` — Full audit log of state changes

### Backup Database

```bash
# Backup
cp pm-hub.db pm-hub.db.backup.$(date +%s)

# Restore
cp pm-hub.db.backup.123456789 pm-hub.db
```

---

## 🐳 Docker Deployment (2 minutes)

### Build Image

```bash
docker build -t pm-hub-v2 .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY="sk-ant-..." \
  -e SMTP_USER="your-email@gmail.com" \
  -e SMTP_PASS="abcd efgh ijkl mnop" \
  -e ALERT_EMAIL="alerts@company.com" \
  -e PM_EMAIL="pm@company.com" \
  -v $(pwd)/exports:/app/exports \
  -v $(pwd)/pm-hub.db:/app/pm-hub.db \
  pm-hub-v2
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  pm-hub:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - ALERT_EMAIL=${ALERT_EMAIL}
      - PM_EMAIL=${PM_EMAIL}
    volumes:
      - ./exports:/app/exports
      - ./pm-hub.db:/app/pm-hub.db
    restart: unless-stopped
```

Run:
```bash
docker-compose up -d
```

---

## ☁️ Heroku Deployment (5 minutes)

### 1. Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# or download from heroku.com/download
```

### 2. Login & Create App

```bash
heroku login
heroku create pm-hub-v2
```

### 3. Set Config Variables

```bash
heroku config:set ANTHROPIC_API_KEY="sk-ant-..."
heroku config:set SMTP_USER="your-email@gmail.com"
heroku config:set SMTP_PASS="abcd efgh ijkl mnop"
heroku config:set ALERT_EMAIL="alerts@company.com"
heroku config:set PM_EMAIL="pm@company.com"
heroku config:set NODE_ENV="production"
```

### 4. Deploy

```bash
git push heroku excel-automation-deploy:main
```

### 5. View Logs

```bash
heroku logs --tail
```

### 6. Open App

```bash
heroku open
```

**Your app is now live at:** `https://pm-hub-v2.herokuapp.com`

---

## 🔥 AWS EC2 Deployment (10 minutes)

### 1. Launch EC2 Instance

- **AMI**: Ubuntu 22.04 LTS
- **Type**: t2.micro (or t2.small)
- **Storage**: 20GB GP2
- **Security Group**: Allow ports 80, 443, 3000 from anywhere

### 2. SSH into Instance

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### 3. Install Dependencies

```bash
sudo apt update && sudo apt install -y nodejs npm sqlite3 git
```

### 4. Clone & Setup

```bash
git clone https://github.com/charityndanu-lgtm/CH.git
cd CH
npm install
```

### 5. Create .env

```bash
cat > .env << EOF
ANTHROPIC_API_KEY=sk-ant-...
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
ALERT_EMAIL=alerts@company.com
PM_EMAIL=pm@company.com
PORT=3000
NODE_ENV=production
EOF
```

### 6. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
pm2 start server-v2.js --name pm-hub
pm2 startup
pm2 save
```

### 7. Setup Nginx Reverse Proxy

```bash
sudo apt install -y nginx
```

Edit `/etc/nginx/sites-available/default`:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Restart Nginx:

```bash
sudo systemctl restart nginx
```

### 8. Access Your App

**http://<EC2_PUBLIC_IP>**

---

## 🛠️ Troubleshooting

### Port 3000 Already in Use

```bash
# Kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

### Email Not Sending

✓ Verify SMTP credentials  
✓ Check Gmail App Password (not regular password)  
✓ Enable "Less secure app access" if needed  
✓ Check console logs for SMTP errors  

```bash
# View logs
heroku logs --tail  # Heroku
pm2 logs           # PM2
```

### Database Locked

```bash
# Close all Node processes
killall node

# Delete lock files
rm pm-hub.db-journal

# Restart
npm start
```

### CORS Errors

→ Already configured with `*` origin  
→ If still issues, check browser console  
→ Verify API endpoints in `server-v2.js`

### Out of Memory

```bash
# Increase heap size
node --max-old-space-size=2048 server-v2.js

# Or export old metrics
rm exports/*.xlsx  # Keep last week only
```

---

## 📈 Monitoring & Analytics

### Check System Health

```bash
# GET /api/state
curl http://localhost:3000/api/state

# Returns:
# - Teams with status
# - Anomalies
# - Metrics (behind, missed, etc)
# - Insights
```

### View Team Analytics

```bash
curl http://localhost:3000/api/analytics/team/Alpha

# Returns:
# - Health score
# - Progress
# - Completion estimate
# - Missed check-ins
```

### Export via CLI

```bash
curl -X POST http://localhost:3000/api/export
# Creates: ./exports/pm-report-2024-06-13.xlsx
```

---

## 🔐 Security Best Practices

✓ Never commit `.env` to Git  
✓ Use strong SMTP passwords (generate via Gmail)  
✓ Rotate API keys monthly  
✓ Use HTTPS in production (Heroku auto-enables)  
✓ Run behind Nginx with rate limiting  
✓ Backup database weekly  
✓ Monitor logs for errors  

---

## 📞 Support

- **Issues?** Check GitHub Issues
- **Errors?** Check console logs & `pm-hub.db`
- **Email not working?** Verify SMTP config in `.env`
- **Performance?** Archive old exports, increase heap size

---

## 🎯 Next Steps

1. ✅ **Complete setup** using one deployment option above
2. ✅ **Test email alerts** → Make a team status change
3. ✅ **Export Excel report** → Check `./exports/`
4. ✅ **Monitor analytics** → Check team health scores
5. ✅ **Ask Claude** → Use AI Assistant for insights

---

## 📝 API Reference

| Method | Endpoint | Purpose |
|--------|----------|----------|
| GET | `/api/state` | Fetch all dashboard data |
| GET | `/api/analytics/team/:id` | Team metrics & predictions |
| POST | `/api/ai` | Ask Claude AI |
| POST | `/api/agenda` | Schedule meeting |
| POST | `/api/checkin-summary` | Summarize check-in |
| POST | `/api/discord-match` | Match new member to team |
| POST | `/api/export` | Generate Excel report |
| PATCH | `/api/team/:id/progress` | Update team progress |
| PATCH | `/api/anomaly/:idx/resolve` | Mark anomaly resolved |
| GET | `/api/events` | SSE real-time stream |

---

## 🎓 Architecture

```
Server (server-v2.js)
  ├── Express Router
  ├── SSE Broadcaster
  ├── Database Layer (db.js)
  │   └── SQLite pm-hub.db
  ├── Email Service (email.js)
  │   └── Nodemailer → Gmail SMTP
  ├── Excel Export (excel.js)
  │   └── ExcelJS → XLSX files
  ├── Analytics Engine (analytics.js)
  │   └── Metrics, predictions, insights
  └── Claude API (async)
      └── AI insights & recommendations

UI (index-v2.html)
  ├── Metrics Dashboard
  ├── Teams Overview
  ├── Anomalies Panel
  ├── Analytics Tab
  ├── Live Feed (SSE)
  └── AI Assistant
```

---

## 🚀 You're Ready!

**Start the server and open http://localhost:3000**

Enjoy your AI-powered Program Manager Hub! 🎉
