#!/bin/bash

# PM Hub Deployment Script
# Usage: chmod +x deploy.sh && ./deploy.sh [heroku|ec2|docker]

set -e

echo "🚀 PM Hub Deployment"

if [ -z "$1" ]; then
  echo "Usage: ./deploy.sh [local|docker|heroku|ec2]"
  exit 1
fi

case $1 in
  local)
    echo "📦 Installing dependencies..."
    npm install
    echo ""
    echo "⚙️  Set environment variables:"
    echo "   export ANTHROPIC_API_KEY=sk-ant-..."
    echo "   export SMTP_USER=your-email@gmail.com"
    echo "   export SMTP_PASS=your-app-password"
    echo "   export ALERT_EMAIL=alerts@company.com"
    echo "   export PM_EMAIL=pm@company.com"
    echo ""
    echo "🚀 Starting server..."
    npm start
    ;;

  docker)
    echo "🐳 Building Docker image..."
    docker build -t pm-hub-v2 .
    echo ""
    echo "🚀 Running container..."
    docker run -p 3000:3000 \
      -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
      -e SMTP_USER=$SMTP_USER \
      -e SMTP_PASS=$SMTP_PASS \
      -e ALERT_EMAIL=$ALERT_EMAIL \
      -e PM_EMAIL=$PM_EMAIL \
      -v $(pwd)/exports:/app/exports \
      pm-hub-v2
    ;;

  heroku)
    echo "☁️  Deploying to Heroku..."
    git push heroku main
    echo "✅ Deployed! View at: $(heroku apps:info -s | grep web_url)"
    ;;

  ec2)
    echo "🖥️  Deploying to AWS EC2..."
    echo "Prerequisites: SSH key, security group configured"
    read -p "Enter EC2 public IP: " EC2_IP
    scp -r . ec2-user@$EC2_IP:~/pm-hub
    ssh ec2-user@$EC2_IP 'cd ~/pm-hub && npm install && npm start'
    ;;

  *)
    echo "❌ Unknown target: $1"
    exit 1
    ;;
esac
