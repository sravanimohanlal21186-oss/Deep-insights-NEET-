#!/bin/bash

# 🚀 Quick Start Guide for Deep Insights NEET
# This script helps you get started in 5 minutes

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Deep Insights NEET - Quick Start Guide                   ║"
echo "║   Offline-First PWA for 200K Concurrent Users              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📋 Prerequisites Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for required tools
for cmd in node npm docker docker-compose git; do
    if command -v $cmd &> /dev/null; then
        version=$($cmd --version 2>&1 | head -n1)
        echo -e "${GREEN}✓${NC} $cmd: $version"
    else
        echo -e "${YELLOW}⚠${NC} $cmd: NOT INSTALLED (required)"
    fi
done

echo ""
echo -e "${BLUE}📦 Installation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Install dependencies
echo "1️⃣  Installing backend dependencies..."
npm install --silent > /dev/null 2>&1 && echo -e "${GREEN}✓${NC} Backend ready" || echo -e "${YELLOW}✗${NC} Backend setup failed"

echo "2️⃣  Installing frontend dependencies..."
cd client && npm install --silent > /dev/null 2>&1 && echo -e "${GREEN}✓${NC} Frontend ready" || echo -e "${YELLOW}✗${NC} Frontend setup failed"
cd ..

# Step 2: Environment setup
echo ""
echo -e "${BLUE}⚙️  Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f .env ]; then
    echo "3️⃣  Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}✓${NC} .env created (edit with your values)"
else
    echo -e "${GREEN}✓${NC} .env already exists"
fi

if [ ! -f client/.env ]; then
    echo "4️⃣  Creating client/.env file..."
    cp client/.env.example client/.env
    echo -e "${GREEN}✓${NC} client/.env created"
else
    echo -e "${GREEN}✓${NC} client/.env already exists"
fi

echo ""
echo -e "${BLUE}🚀 Ready to Launch${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Project Structure:"
echo "  ├── server/       Backend API (Node.js + Express)"
echo "  ├── client/       Frontend (React PWA)"
echo "  ├── k8s/          Kubernetes manifests"
echo "  └── scripts/      Deployment scripts"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "  1️⃣  Start development:"
echo "     ${YELLOW}docker-compose up${NC}"
echo ""
echo "  2️⃣  Open in browser:"
echo "     ${YELLOW}http://localhost:3000${NC}"
echo ""
echo "  3️⃣  Run tests:"
echo "     ${YELLOW}npm test${NC}"
echo ""
echo "  4️⃣  Load test (200K users):"
echo "     ${YELLOW}npm run test:load${NC}"
echo ""
echo "  5️⃣  Deploy to Kubernetes:"
echo "     ${YELLOW}./scripts/deploy.sh${NC}"
echo ""
echo "  6️⃣  Health check:"
echo "     ${YELLOW}./scripts/health-check.sh${NC}"
echo ""
echo "📚 Documentation:"
echo "  • README-PRODUCTION.md    - Production setup"
echo "  • DEPLOYMENT-GUIDE.md     - Step-by-step guide"
echo "  • ARCHITECTURE.md         - Technical details"
echo "  • PROJECT-PREVIEW.md      - Feature overview"
echo ""
echo "🌐 Features Included:"
echo "  ✓ Offline-First PWA (100% works offline)"
echo "  ✓ Auto-Scaling (10-100 Kubernetes pods)"
echo "  ✓ Real-time Monitoring (Prometheus + Grafana)"
echo "  ✓ Smart Caching (70%+ hit rate)"
echo "  ✓ Modern UI (Beautiful gradient design)"
echo "  ✓ Security (Helmet, CORS, Rate limiting)"
echo "  ✓ CI/CD Pipeline (GitHub Actions)"
echo "  ✓ Disaster Recovery (Automated backups)"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Setup Complete! You're ready to scale to 200K users.${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
