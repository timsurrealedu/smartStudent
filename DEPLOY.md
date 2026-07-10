# SmartStudent — Oracle Cloud ARM64 Deployment Guide

## Prerequisites
- Oracle Cloud Free Tier ARM A1-Flex instance (Ubuntu 22.04/24.04)
- SSH access to the instance
- VCN security list rules allowing inbound HTTP (port 80)

## Step 1: Upload Code

From your local machine:

```bash
# Option A: git clone on the server
git clone <your-repo> /home/ubuntu/smartStudent

# Option B: rsync local files
rsync -avz --exclude node_modules --exclude dist \
  ./smartStudent/ ubuntu@YOUR_INSTANCE_IP:/home/ubuntu/smartStudent/
```

## Step 2: Run Deploy Script

SSH into your instance and run:

```bash
cd /home/ubuntu/smartStudent
chmod +x deploy.sh
./deploy.sh
```

This script will:
1. Install Node.js 20, nginx, sqlite3
2. Install backend & frontend dependencies
3. Run Prisma migrations
4. Build both backend (TypeScript → JS) and frontend (Vite → dist)
5. Configure nginx reverse proxy
6. Install & start systemd service

## Step 3: Configure Environment

Copy and edit the environment file:

```bash
cd /home/ubuntu/smartStudent/backend
cp .env.example .env
nano .env
```

**Required changes:**
```env
JWT_SECRET=your-super-random-secret-here-change-me
NODE_ENV=production
PORT=3001
DATABASE_URL=file:./prisma/dev.db
```

Generate a strong JWT secret:
```bash
openssl rand -base64 32
```

Then restart:
```bash
sudo systemctl restart smartstudent
```

## Step 4: Open Firewall

In Oracle Cloud Console:
1. Go to **Networking → Virtual Cloud Networks**
2. Click your VCN → **Security Lists**
3. Add ingress rule: **Stateless=No, Source=0.0.0.0/0, IP Protocol=TCP, Destination Port=80**

## Architecture

```
┌─────────────┐     HTTP      ┌──────────┐     proxy_pass   ┌─────────────┐
│   Browser   │ ────────────→ │  Nginx   │ ───────────────→ │   Express   │
│  (PWA app)  │               │  :80     │                  │   :3001     │
└─────────────┘               └──────────┘                  └─────────────┘
                                     │
                                     │ serves static
                                     ↓
                              ┌──────────────┐
                              │ frontend/dist│
                              │ (SPA build)  │
                              └──────────────┘
```

## File Structure on Server

```
/home/ubuntu/smartStudent/
├── backend/
│   ├── dist/              # Compiled JS
│   ├── prisma/
│   │   ├── dev.db         # SQLite database
│   │   └── schema.prisma
│   ├── .env               # Secrets (not in git)
│   └── package.json
├── frontend/
│   └── dist/              # Built static files
├── browser-extension/     # Chrome extension (load locally)
├── deploy/
│   ├── nginx.conf
│   └── smartstudent.service
└── deploy.sh
```

## Useful Commands

```bash
# Backend logs
sudo journalctl -u smartstudent -f

# Backend status
sudo systemctl status smartstudent

# Restart backend
sudo systemctl restart smartstudent

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Database
sqlite3 /home/ubuntu/smartStudent/backend/prisma/dev.db '.tables'

# Update deployment (after code changes)
cd /home/ubuntu/smartStudent
./deploy.sh
```

## Browser Extension Setup

1. On your **local computer** (not the server), open Chrome → Extensions → Developer mode ON
2. Load unpacked → Select `browser-extension/` folder
3. Click the extension popup → enter your server's public IP/domain
4. Visit BinusMaya while logged in → data auto-syncs to your Oracle instance

## Updating After Code Changes

```bash
cd /home/ubuntu/smartStudent
git pull  # or rsync new files
./deploy.sh
```

The script is idempotent — safe to run multiple times.
