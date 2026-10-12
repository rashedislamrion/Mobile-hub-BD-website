#!/usr/bin/env bash
# ==============================================================================
# NovaMobile Production Zero-Downtime Deployment Script
# Target: Single Hostinger KVM VPS
#
# Server Layout:
# - Application Repository: /var/www/novamobile/app
# - Persistent Uploads:     /var/www/novamobile/uploads (OUTSIDE the repo)
# - Backups Directory:      /var/www/novamobile/backups
#
# Safety Rules:
# - Strictly uses "npx prisma migrate deploy" (NEVER db push or migrate reset)
# - Installs ALL dependencies (devDependencies needed for nest build, next build, prisma db seed)
# - NEVER uses --omit=dev
# - NEVER touches or deletes the persistent uploads directory
# - NEVER runs git clean
# - Performs atomic reload of PM2 processes via ecosystem.config.js
# ==============================================================================

set -euo pipefail

# Refuse to run as root unless explicitly overridden
if [ "$(id -u)" -eq 0 ] && [ "${ALLOW_ROOT:-0}" != "1" ]; then
    echo "❌ ERROR: deploy.sh must not be run as root! Use a non-root deploy user (e.g., deploy / www-data) or set ALLOW_ROOT=1." >&2
    exit 1
fi

APP_DIR="${APP_DIR:-/var/www/novamobile/app}"
UPLOAD_DIR="${UPLOAD_ROOT:-/var/www/novamobile/uploads}"

echo "================================================================="
echo "🚀 Starting NovaMobile Production Deployment"
echo "   Time: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "   Target Directory: $APP_DIR"
echo "   Uploads Directory: $UPLOAD_DIR"
echo "================================================================="

# 1. Ensure persistent uploads folder exists outside the repo with correct permissions
if [ ! -d "$UPLOAD_DIR" ]; then
    echo "📁 Creating persistent uploads directory outside repo: $UPLOAD_DIR"
    mkdir -p "$UPLOAD_DIR"
fi
chmod 755 "$UPLOAD_DIR" || true

# 2. Navigate to repo & pull latest code
cd "$APP_DIR"
echo "📥 [1/6] Pulling latest changes from repository..."
git pull --ff-only
DEPLOYED_COMMIT=$(git rev-parse HEAD)
echo "   ✅ Deployed Commit: $DEPLOYED_COMMIT"

# 3. Install ALL dependencies using npm ci (strictly prevents modifying package-lock.json)
echo "📦 [2/6] Installing backend dependencies (npm ci)..."
cd "$APP_DIR/api"
npm ci

echo "📦 [2/6] Installing frontend dependencies (npm ci)..."
cd "$APP_DIR"
npm ci

# 4. Run Prisma database migrations (Non-destructive)
echo "🗄️  [3/6] Applying pending Prisma database migrations..."
cd "$APP_DIR/api"
npx prisma generate
npx prisma migrate deploy

# 5. Build applications with memory limit safety
echo "⚙️  [4/6] Building NestJS Backend API (NODE_OPTIONS=--max-old-space-size=2048)..."
NODE_OPTIONS="--max-old-space-size=2048" npm run build

echo "⚙️  [4/6] Building Next.js Frontend Web (NODE_OPTIONS=--max-old-space-size=2048)..."
cd "$APP_DIR"
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# 6. PM2 Zero-downtime Reload via ecosystem.config.js
echo "🔄 [5/6] Reloading PM2 processes via ecosystem.config.js..."
cd "$APP_DIR"
pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js
pm2 save

# 7. Post-deployment Health Check Verification
echo "🩺 [6/6] Verifying service health..."
sleep 3

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/api/v1/health || true)
if [ "$API_STATUS" != "200" ]; then
    echo "❌ HEALTH CHECK FAILED: Backend API returned HTTP $API_STATUS at http://127.0.0.1:4000/api/v1/health (expected 200)" >&2
    exit 1
fi
echo "   ✅ Backend API Health: HTTP $API_STATUS OK"

WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 || true)
if [ "$WEB_STATUS" != "200" ]; then
    echo "❌ HEALTH CHECK FAILED: Frontend Web returned HTTP $WEB_STATUS at http://127.0.0.1:3000 (expected 200)" >&2
    exit 1
fi
echo "   ✅ Frontend Web Health: HTTP $WEB_STATUS OK"

echo "================================================================="
echo "✅ NovaMobile Deployment Completed Successfully!"
echo "   Commit: $DEPLOYED_COMMIT"
echo "🔒 SAFEGUARD VERIFICATION: Uploads directory ($UPLOAD_DIR) was preserved."
echo "================================================================="
