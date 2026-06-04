#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# Production Deployment Script — workspaceapi.myenum.in
# ═══════════════════════════════════════════════════════════════

APP_DIR="/opt/workspace-api"
BACKUP_DIR="$APP_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment at $TIMESTAMP"

# ── Pre-deployment backup ───────────────────────────────────
echo "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
docker compose -f "$APP_DIR/docker-compose.yml" exec -T mongodb mongodump --archive --db workspace_db | gzip > "$BACKUP_DIR/db_$TIMESTAMP.gz" || echo "⚠️ Backup failed, continuing..."

# ── Pull latest code ────────────────────────────────────────
cd "$APP_DIR"
git pull origin main

# ── Build & deploy ──────────────────────────────────────────
echo "🏗️ Building and deploying..."
docker compose build --no-cache backend
docker compose up -d backend

# ── Health check ────────────────────────────────────────────
echo "🏥 Health check..."
sleep 5
HEALTH=$(curl -sf http://localhost:4000/api/health | grep -o '"status":"healthy"' || echo "unhealthy")

if [ "$HEALTH" = '"status":"healthy"' ]; then
  echo "✅ Deployment successful! API is healthy."
else
  echo "❌ Health check failed!"
  exit 1
fi

# ── Cleanup ─────────────────────────────────────────────────
docker system prune -f
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

echo "✅ Deployment complete at $(date)"
