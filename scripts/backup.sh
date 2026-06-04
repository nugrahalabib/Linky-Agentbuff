#!/usr/bin/env bash
# Linky database backup — runs on the VPS via cron.
# Backs up SQLite (file:) or Postgres (postgres://) based on DATABASE_URL, with retention.
#
# Usage:
#   DATABASE_URL=... BACKUP_DIR=/var/backups/linky RETENTION_DAYS=30 ./scripts/backup.sh
#
# Cron example (every 6h):
#   0 */6 * * * cd /opt/linky && DATABASE_URL=$(grep ^DATABASE_URL .env.production|cut -d= -f2-) BACKUP_DIR=/var/backups/linky ./scripts/backup.sh >> /var/log/linky-backup.log 2>&1
set -euo pipefail

DB_URL="${DATABASE_URL:-file:./linky.db}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

if [[ "$DB_URL" == postgres* ]]; then
  OUT="$BACKUP_DIR/linky-$STAMP.dump"
  echo "[backup] pg_dump -> $OUT"
  pg_dump --no-owner --format=custom "$DB_URL" > "$OUT"
  gzip -f "$OUT"
  echo "[backup] done: $OUT.gz"
else
  # SQLite: use the online backup API so it's consistent even under WAL writes.
  DB_PATH="${DB_URL#file:}"
  OUT="$BACKUP_DIR/linky-$STAMP.db"
  echo "[backup] sqlite3 .backup $DB_PATH -> $OUT"
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$DB_PATH" ".backup '$OUT'"
  else
    # Fallback: file copy (WAL checkpoint first if possible).
    cp "$DB_PATH" "$OUT"
  fi
  gzip -f "$OUT"
  echo "[backup] done: $OUT.gz"
fi

# Retention: delete backups older than RETENTION_DAYS.
find "$BACKUP_DIR" -name 'linky-*.gz' -type f -mtime "+$RETENTION_DAYS" -delete 2>/dev/null || true
echo "[backup] retention applied (>${RETENTION_DAYS}d removed)"
