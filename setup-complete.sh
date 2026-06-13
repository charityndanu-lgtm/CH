#!/bin/bash

# 🚀 COMPLETE SETUP SCRIPT
# This script automates the entire setup process
# Usage: chmod +x setup-complete.sh && ./setup-complete.sh

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🚀 AI Program Manager Hub v2 - Complete Setup                 ║"
echo "║     Excel Export | Email Alerts | Persistence | Analytics      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js: $(node -v)"
echo "✅ npm: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check for .env
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file (REQUIRED)..."
    cat > .env << 'EOF'
# AI Program Manager Hub Configuration

# Anthropic Claude API (required for AI features)
# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx

# Gmail SMTP (required for email alerts)
# 1. Enable 2FA on Gmail
# 2. Generate App Password: https://myaccount.google.com/apppasswords
# 3. Copy the 16-character password (with spaces)
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop

# Alert Recipients
ALERT_EMAIL=alerts@yourcompany.com
PM_EMAIL=pm@yourcompany.com

# Server Config
PORT=3000
NODE_ENV=development
EOF
    echo "❌ .env created with placeholders"
    echo ""
    echo "⚠️  NEXT STEP: Edit .env file with your credentials:"
    echo "   1. Get ANTHROPIC_API_KEY from https://console.anthropic.com/"
    echo "   2. Generate Gmail App Password at https://myaccount.google.com/apppasswords"
    echo "   3. Set SMTP_USER & SMTP_PASS"
    echo "   4. Set ALERT_EMAIL & PM_EMAIL"
    echo ""
    read -p "Press Enter after editing .env..."
else
    echo "✅ .env file exists"
fi

echo ""
echo "🧪 Running tests..."
npm start &
SERVER_PID=$!
sleep 3

if node test.js; then
    echo "✅ All tests passed!"
else
    echo "⚠️  Some tests failed - check configuration"
fi

kill $SERVER_PID 2>/dev/null || true

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ Setup Complete!                                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 To start the server, run:"
echo "   npm start"
echo ""
echo "📖 Documentation:"
echo "   SETUP.md         - Complete setup guide"
echo "   DEPLOYMENT.md    - Deployment options"
echo "   COMPLETE-SETUP.md - Full summary"
echo ""
echo "🌐 Open in browser: http://localhost:3000"
echo ""
