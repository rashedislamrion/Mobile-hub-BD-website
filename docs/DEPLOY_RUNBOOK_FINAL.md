# Production Deployment Runbook (Final Release)

This document provides complete, repeatable instructions for deploying the Mobile Shop Website & ERP platform into production environments.

---

## 1. System Architecture & Requirements

- **Runtime**: Node.js `v20.x` LTS or `v22.x`
- **Database**: PostgreSQL `v15.x` or `v16.x`
- **Reverse Proxy**: Nginx `1.22+` with SSL (Certbot / Let's Encrypt)
- **Process Manager**: PM2 `v5.x+` or `systemd`
- **Memory**: Minimum 2 GB RAM (4 GB recommended for Next.js build)
- **Disk**: Minimum 20 GB SSD

### Architecture Overview
```
Clients (Web & Mobile Browsers)
          │
          ▼
   Nginx (Port 443 / SSL)
    ├── /api/v1/*  ──▶  NestJS API Daemon (Port 4000) ──▶ PostgreSQL (Port 5432)
    └── /*          ──▶  Next.js Storefront (Port 3000)
```

---

## 2. Environment Configuration

The production environment relies on strictly validated configuration files. Validate them using the included environment validator before launching any builds or processes.

### Pre-Flight Environment Validation
Run the validator to guarantee no missing or placeholder keys exist in production:
```bash
# Validate frontend environment
node scripts/check-env.mjs .env.production .env.production.example

# Validate backend environment
node scripts/check-env.mjs api/.env api/.env.production.example
```
If any required variables are missing or retain example placeholders (`yourdomain.com`, `GENERATE_`, `CHANGEME`), the script exits non-zero and lists only the variable names (never values).

### Generating Secure Secrets
Generate high-entropy cryptographic secrets:
```bash
openssl rand -hex 32
```
Use distinct secrets for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `REVALIDATION_SECRET` (the revalidation secret must match in both `api/.env` and `.env.production`).

---

## 3. Deployment Procedure (Step-by-Step)

### Step 1: Pre-Flight Repository Hygiene
```bash
# Pull production release branch
git fetch origin
git checkout main
git pull --ff-only origin main

# Confirm working tree is clean
git status --porcelain
# Expected output: (empty)
```

### Step 2: Environment File Verification
```bash
# Verify all required variables are set and zero placeholders exist
node scripts/check-env.mjs .env.production .env.production.example
node scripts/check-env.mjs api/.env api/.env.production.example
```

### Step 3: Database Creation & Migration
Ensure PostgreSQL 14+ is running. On a fresh installation, create the empty database and apply all migrations:
```bash
# On the VPS PostgreSQL server (if creating a fresh database from scratch):
# createdb -U postgres novamobile

# Apply all Prisma migrations cleanly from zero:
cd api
npx prisma migrate deploy
npx prisma generate
cd ..
```

### Step 4: Production Bootstrap (Mandatory on Empty DB)
> [!IMPORTANT]
> Never run `npm run seed` or `npm run seed:prod` on a production database! The legacy seed contains hardcoded demo accounts, sample customers, and demo credentials.
> Always use `npm run bootstrap:prod`.

Run the production-safe bootstrap:
```bash
cd api
NODE_ENV=production \
SEED_ADMIN_EMAIL="owner@mobilehubbd.tech" \
SEED_ADMIN_PASSWORD="YourStrongPasswordMinimum14Chars!" \
SEED_ADMIN_NAME="Super Administrator" \
npm run bootstrap:prod
cd ..
```

**Bootstrap Guarantees:**
- Refuses execution unless `NODE_ENV=production`.
- Refuses missing passwords, passwords shorter than 14 characters, or known demo/insecure passwords (e.g. legacy seed passwords).
- Never logs or prints the password.
- Synchronizes the permission catalog and system roles (`Admin`, `Branch Manager`, `Product Uploader`, `Technician`, `Inventory Auditor`...).
- Creates the Super Admin with all-branches scope (`branchId: null`).
- Idempotent: re-running preserves existing admin passwords and existing settings without duplication.
- Creates zero demo products, customers, orders, or fake branches.
- Initializes clean, neutral business settings with empty contact details for the owner to configure.

### Step 5: Emergency Super Admin Password Reset (If Needed)
If the Super Admin password is lost or requires an immediate rotation:
```bash
cd api
NODE_ENV=production \
SEED_ADMIN_EMAIL="owner@mobilehubbd.tech" \
SEED_ADMIN_PASSWORD="YourNewStrongPasswordMinimum14Chars!" \
npm run admin:reset-password
cd ..
```

### Step 6: Upload Directories & Permissions
Ensure storage directories exist with restricted permissions:
```bash
# Create upload root and private documents root
mkdir -p api/uploads api/private-uploads
chmod 755 api/uploads
chmod 750 api/private-uploads

# If migrating an existing server with prior uploads, move sensitive documents:
npx ts-node scripts/migrate-private-uploads.ts --apply
```

### Step 7: Build & Launch API Daemon
```bash
cd api
# Install production dependencies
npm ci --omit=dev

# Compile TypeScript
npm run build

# Start or reload API in PM2
pm2 start dist/src/main.js --name "novamobile-api" --time
cd ..
```

### Step 8: Build & Launch Storefront
```bash
# Clean install dependencies
npm ci

# Compile Next.js bundle
npm run build

# Start or reload Next.js in PM2
pm2 start npm --name "novamobile-web" -- start -- -p 3000
```

### Step 9: Save PM2 Configuration
```bash
pm2 save
pm2 startup
```

---

## 4. Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/novamobile.conf`:

```nginx
# Rate limiting zone (10 requests/sec per IP)
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$host$request_uri;
}

# ----------------- API DOMAIN -----------------
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    client_max_body_size 12M;

    # Security Headers
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    # Private uploads MUST never be served statically
    location ^~ /private-uploads/ {
        deny all;
        return 404;
    }

    # Public static uploads
    location ^~ /uploads/ {
        alias /var/www/novamobile/api/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # API Proxy
    location / {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}

# ----------------- STOREFRONT DOMAIN -----------------
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    client_max_body_size 5M;

    # Security Headers
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;

    # Next.js Static Assets
    location /_next/static/ {
        alias /var/www/novamobile/.next/static/;
        expires 365d;
        access_log off;
    }

    # Public Storefront Static Files
    location /images/ {
        alias /var/www/novamobile/public/images/;
        expires 30d;
        access_log off;
    }

    # Next.js Application Proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload Nginx:
```bash
ln -sf /etc/nginx/sites-available/novamobile.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## 5. Post-Deployment Verification

Run the automated live smoke verification tool:
```bash
node scripts/qa/smoke_production.mjs --url=https://api.yourdomain.com --store-url=https://yourdomain.com
```

Confirm all 12+ tests report `[PASS]` and complete manual verification items in [`docs/POST_DEPLOY_CHECKLIST.md`](file:///Users/rashedislam/Desktop/Mobile-shop-website/docs/POST_DEPLOY_CHECKLIST.md).

---

## 6. Rollback Procedures

If a critical issue occurs during deployment:

### Fast Code Rollback
```bash
# 1. Rollback to previous Git tag or commit
git reset --hard PREVIOUS_STABLE_COMMIT_HASH

# 2. Re-install & Re-build
cd api && npm ci && npm run build && cd ..
npm ci && npm run build

# 3. Reload PM2 processes
pm2 reload all
```

### Database Rollback
If a schema migration corrupted state:
```bash
# 1. Stop app traffic
pm2 stop novamobile-api

# 2. Restore pre-deployment database backup
dropdb -U postgres novamobile
createdb -U postgres novamobile
psql -U postgres novamobile < /var/backups/novamobile_pre_deploy.sql

# 3. Restart app
pm2 restart novamobile-api
```

---

## 7. Maintenance & Operations

- **PM2 Log Inspection**: `pm2 logs --lines 100`
- **Nginx Error Logs**: `tail -f /var/log/nginx/error.log`
- **PostgreSQL Service**: `systemctl status postgresql`
- **Restart Application**: `pm2 restart all`
