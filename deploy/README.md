# NovaMobile Production Deployment & Runbook Guide

Complete operational guide for provisioning, deploying, restoring, and rolling back NovaMobile on an Ubuntu 22.04/24.04 VPS (Hostinger KVM).

---

## 1. First-Time Server Setup Order

### Step 1: Create Non-Root Deploy User & Directory Structure
```bash
sudo adduser --gecos "" deploy && sudo usermod -aG sudo deploy
sudo mkdir -p /var/www/novamobile/{app,uploads,backups}
sudo chown -R deploy:deploy /var/www/novamobile
```

### Step 2: Install System Prerequisites
```bash
sudo apt-get update && sudo apt-get install -y git curl nginx certbot python3-certbot-nginx postgresql postgresql-contrib chromium-browser
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs && sudo npm install -g pm2
```

### Step 3: Database & Non-Interactive Auth (~/.pgpass)
```bash
sudo -u postgres psql -c "CREATE USER novamobile_user WITH PASSWORD 'YOUR_STRONG_DB_PASS';"
sudo -u postgres psql -c "CREATE DATABASE novamobile OWNER novamobile_user;"
echo "localhost:5432:novamobile:novamobile_user:YOUR_STRONG_DB_PASS" >> /home/deploy/.pgpass
chmod 600 /home/deploy/.pgpass
```

### Step 4: Clone Repository & Setup Environment Files
```bash
cd /var/www/novamobile/app
git clone <REPO_URL> .
cp .env.production.example .env.production
cp api/.env.production.example api/.env.production
# Fill in real secrets (JWT, DB URL, domain URLs) in both .env.production files
```

### Step 5: Install Dependencies & Run Database Migrations
```bash
cd /var/www/novamobile/app/api && npm ci
npx prisma generate
npx prisma migrate deploy
```

### Step 6: Seed Super Administrator (SINGLE-Quoted Password)
```bash
# Note: Always single-quote password to prevent shell expansion of special characters (!, $, &)
SEED_ADMIN_EMAIL='admin@mobilehubbd.tech' SEED_ADMIN_PASSWORD='YourStrongSuperAdminPassword123!' SEED_DEMO=false npx prisma db seed
```

### Step 7: Install Frontend Dependencies & Build Applications
```bash
cd /var/www/novamobile/app && npm ci
cd /var/www/novamobile/app/api && NODE_OPTIONS=--max-old-space-size=2048 npm run build
cd /var/www/novamobile/app && NODE_OPTIONS=--max-old-space-size=2048 npm run build
```

### Step 8: Start PM2 Processes & Enable System Startup
```bash
cd /var/www/novamobile/app
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy
```

### Step 9: Configure Nginx & Setup Certbot SSL
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/novamobile
sudo ln -sf /etc/nginx/sites-available/novamobile /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d mobilehubbd.tech -d www.mobilehubbd.tech -d api.mobilehubbd.tech
```

### Step 10: Configure Automated Backups
```bash
chmod +x /var/www/novamobile/app/deploy/*.sh
crontab -e
# Add line: 0 2 * * * /var/www/novamobile/app/deploy/backup.sh >> /var/log/novamobile-backup.log 2>&1
```

---

## 2. Deploying Application Updates

Deployments are atomic and zero-downtime using the deployment script:
```bash
cd /var/www/novamobile/app
./deploy/deploy.sh
```
The script performs:
1. `git pull --ff-only` and logs git commit hash
2. Clean dependency installation via `npm ci` in `api/` and repo root
3. Non-destructive Prisma migration: `npx prisma migrate deploy`
4. Dual build with `NODE_OPTIONS=--max-old-space-size=2048`
5. `pm2 reload ecosystem.config.js`
6. Post-deploy health checks against `http://127.0.0.1:4000/api/v1/health` and `http://127.0.0.1:3000`

---

## 3. How to Restore a Backup

### Restore PostgreSQL Database:
```bash
# Decompress and stream dump into PostgreSQL
gunzip -c /var/www/novamobile/backups/db_novamobile_YYYYMMDD_HHMMSS.sql.gz | psql -U novamobile_user -h localhost -d novamobile
```

### Restore Persistent Uploads:
```bash
# Extract media assets back into persistent uploads folder
tar -xzf /var/www/novamobile/backups/uploads_YYYYMMDD_HHMMSS.tar.gz -C /var/www/novamobile/
```

---

## 4. How to Roll Back a Deployment

If an update needs to be reverted immediately:
```bash
cd /var/www/novamobile/app

# 1. Checkout the previous known-good git commit hash or tag
git checkout <PREVIOUS_COMMIT_HASH>

# 2. Re-run deployment pipeline to rebuild and reload PM2
./deploy/deploy.sh
```
*(When ready to re-align with trunk, run `git checkout main` and pull).*
