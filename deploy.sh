#!/bin/bash
set -e

echo "========================================"
echo "  SmartStudent — Oracle ARM Deploy"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/home/ubuntu/smartStudent"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

cd "$PROJECT_DIR"

echo -e "${YELLOW}[1/8] Updating system packages...${NC}"
sudo apt-get update -qq
sudo apt-get install -y -qq nginx sqlite3 curl git build-essential openssl

echo -e "${YELLOW}[2/8] Installing Node.js (LTS)...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y -qq nodejs
fi
node -v
npm -v

echo -e "${YELLOW}[3/8] Installing backend dependencies...${NC}"
cd "$BACKEND_DIR"
npm ci

if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating backend .env...${NC}"
    cp .env.example .env
    JWT_SECRET="$(openssl rand -base64 32)"
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
fi

echo -e "${YELLOW}[4/8] Generating Prisma client & migrating DB...${NC}"
npx prisma generate
npx prisma migrate deploy

echo -e "${YELLOW}[5/8] Building backend...${NC}"
npm run build

echo -e "${YELLOW}[6/8] Building frontend...${NC}"
cd "$FRONTEND_DIR"
npm ci
npm run build

echo -e "${YELLOW}[7/8] Configuring Nginx...${NC}"
sudo cp "$PROJECT_DIR/deploy/nginx.conf" /etc/nginx/sites-available/smartstudent
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/smartstudent /etc/nginx/sites-enabled/smartstudent
sudo nginx -t && sudo systemctl reload nginx

echo -e "${YELLOW}[8/8] Installing systemd service...${NC}"
sudo cp "$PROJECT_DIR/deploy/smartstudent.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable smartstudent
sudo systemctl restart smartstudent

echo ""
echo -e "${GREEN}✅ SmartStudent deployed successfully!${NC}"
echo ""
echo "Access the app at: http://$(curl -s ifconfig.me)"
echo "API health:        http://$(curl -s ifconfig.me)/health"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status smartstudent   # Check backend status"
echo "  sudo journalctl -u smartstudent -f   # Watch backend logs"
echo "  sudo systemctl restart smartstudent  # Restart backend"
echo "  sudo systemctl reload nginx          # Reload nginx"
echo ""
