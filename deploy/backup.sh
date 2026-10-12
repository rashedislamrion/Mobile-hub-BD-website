#!/usr/bin/env bash
# ==============================================================================
# NovaMobile Automated Daily Backup Script
# Targets: PostgreSQL Database + Uploads Media Directory
# Retention: 7 days
#
# Recommended Crontab (Run daily at 2:00 AM UTC):
# 0 2 * * * /var/www/novamobile/app/deploy/backup.sh >> /var/log/novamobile-backup.log 2>&1
#
# Non-Interactive PostgreSQL Authentication (~/.pgpass setup):
# pg_dump needs a password and will fail in non-interactive cron jobs unless
# credentials are saved in ~/.pgpass of the run/deploy user.
# One-time setup:
#   echo "localhost:5432:novamobile:novamobile_user:YOUR_STRONG_PASSWORD" >> ~/.pgpass
#   chmod 600 ~/.pgpass
#
# Restore Instructions:
# To restore the database from a backup:
#   gunzip -c /var/www/novamobile/backups/db_novamobile_YYYYMMDD_HHMMSS.sql.gz | psql -U novamobile_user -h localhost -d novamobile
# To restore the uploads media directory:
#   tar -xzf /var/www/novamobile/backups/uploads_YYYYMMDD_HHMMSS.tar.gz -C /var/www/novamobile/
# ==============================================================================

set -euo pipefail

export PGPASSFILE="${PGPASSFILE:-$HOME/.pgpass}"

BACKUP_DIR="${BACKUP_DIR:-/var/www/novamobile/backups}"
APP_DIR="${APP_DIR:-/var/www/novamobile/app}"
UPLOAD_DIR="${UPLOAD_ROOT:-/var/www/novamobile/uploads}"
DB_NAME="${DB_NAME:-novamobile}"
DB_USER="${DB_USER:-novamobile_user}"
RETENTION_DAYS=7
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

echo "================================================================="
echo "💾 Starting NovaMobile Daily Backup"
echo "   Timestamp: $TIMESTAMP"
echo "   Backup Destination: $BACKUP_DIR"
echo "   Auth PGPASSFILE: $PGPASSFILE"
echo "================================================================="

mkdir -p "$BACKUP_DIR"

# 1. PostgreSQL Database Dump (Gzip Compressed)
DB_BACKUP_FILE="$BACKUP_DIR/db_${DB_NAME}_${TIMESTAMP}.sql.gz"
echo "🗄️  [1/3] Dumping PostgreSQL database '${DB_NAME}'..."
if pg_dump -U "$DB_USER" -h localhost -d "$DB_NAME" | gzip > "$DB_BACKUP_FILE"; then
    # Verify backup file exists and is not empty (0 bytes)
    if [ ! -s "$DB_BACKUP_FILE" ]; then
        echo "    ❌ ERROR: Database backup file is empty (0 bytes): $DB_BACKUP_FILE" >&2
        rm -f "$DB_BACKUP_FILE"
        exit 1
    fi
    # Verify gzip archive integrity
    if ! gzip -t "$DB_BACKUP_FILE" 2>/dev/null; then
        echo "    ❌ ERROR: Database backup file is corrupted (invalid gzip): $DB_BACKUP_FILE" >&2
        rm -f "$DB_BACKUP_FILE"
        exit 1
    fi
    echo "    ✅ Database backup created: $DB_BACKUP_FILE ($(du -h "$DB_BACKUP_FILE" | cut -f1))"
else
    echo "    ❌ ERROR: Database backup failed!" >&2
    rm -f "$DB_BACKUP_FILE"
    exit 1
fi

# 2. Uploads Directory Archive (Tar + Gzip)
UPLOADS_BACKUP_FILE="$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"
echo "📁 [2/3] Archiving uploads directory '${UPLOAD_DIR}'..."
if [ -d "$UPLOAD_DIR" ]; then
    tar -czf "$UPLOADS_BACKUP_FILE" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"
    echo "    ✅ Uploads backup created: $UPLOADS_BACKUP_FILE ($(du -h "$UPLOADS_BACKUP_FILE" | cut -f1))"
else
    echo "    ⚠️ Warning: Uploads directory does not exist yet at $UPLOAD_DIR. Skipping uploads archive."
fi

# 3. Clean up backups older than RETENTION_DAYS (7 days)
echo "🧹 [3/3] Pruning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -type f -name "db_${DB_NAME}_*.sql.gz" -mtime +"$RETENTION_DAYS" -exec rm -v {} \;
find "$BACKUP_DIR" -type f -name "uploads_*.tar.gz" -mtime +"$RETENTION_DAYS" -exec rm -v {} \;

echo "================================================================="
echo "🎉 Daily Backup Completed Successfully!"
echo "Current backups in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"
echo "================================================================="
