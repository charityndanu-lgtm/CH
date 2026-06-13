# Deployment Guide

## Prerequisites

- Node.js 14+
- npm
- SQLite3
- SMTP credentials (Gmail recommended)

## Environment Setup

### Local Development

```bash
npm install

# Set environment variables
export ANTHROPIC_API_KEY="sk-ant-..."
export SMTP_USER="your-email@gmail.com"
export SMTP_PASS="your-app-password"  # Use App Password, not regular password
export ALERT_EMAIL="alerts@yourcompany.com"
export PM_EMAIL="pm@yourcompany.com"

npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server-v2.js"]
```

### Heroku Deployment

```bash
# Create app
heroku create pm-hub

# Set config vars
heroku config:set ANTHROPIC_API_KEY="sk-ant-..."
heroku config:set SMTP_USER="..."
heroku config:set SMTP_PASS="..."
heroku config:set ALERT_EMAIL="..."
heroku config:set PM_EMAIL="..."

# Deploy
git push heroku main
```

### AWS EC2 Deployment

1. Launch t2.micro instance (Ubuntu 22.04)
2. Security group: Allow 80, 443, 3000
3. SSH into instance

```bash
sudo apt update && sudo apt install -y nodejs npm sqlite3
git clone <repo-url>
cd CH
npm install
export NODE_ENV=production
export PORT=3000
# Set env vars
npm start
```

Use PM2 for process management:

```bash
sudo npm install -g pm2
pm2 start server-v2.js --name pm-hub
pm2 startup
pm2 save
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name pm-hub.yourdomain.com;

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

## Monitoring

- **Logs**: Check `pm-hub.db` and console output
- **Metrics**: Access `/api/analytics/team/:id` for individual team metrics
- **Exports**: Check `./exports/` directory for generated Excel files
- **Health**: Simple GET to `/api/state` returns 200 if healthy

## Email Configuration (Gmail)

1. Enable 2-Factor Authentication on Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use generated password as `SMTP_PASS`

## Database Backups

```bash
# Backup
cp pm-hub.db pm-hub.db.backup.$(date +%s)

# Restore
cp pm-hub.db.backup.12345 pm-hub.db
```

## Scaling

- Add caching layer (Redis) for state queries
- Use message queue (RabbitMQ) for email sending
- Load balance with multiple instances behind Nginx
- Archive old metrics to separate database

## Troubleshooting

**Email not sending?**
- Check SMTP credentials
- Verify App Password (not regular password)
- Check Gmail "Less secure apps" setting if applicable
- Review logs for SMTP errors

**Database locked?**
- Close all instances: `killall node`
- Delete `.db-journal` file
- Restart application

**Memory issues?**
- Export and archive old metrics monthly
- Implement pagination for large datasets
- Monitor with `pm2 monit`
