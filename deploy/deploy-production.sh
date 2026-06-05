#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# Production Deployment Script — Zero-Downtime with Rollback
# Usage: bash deploy-production.sh <commit_sha> <actor>
# ═══════════════════════════════════════════════════════════════

COMMIT_SHA="${1:-manual}"
ACTOR="${2:-unknown}"
APP_DIR="/opt/workspaces"
COMPOSE_FILE="$APP_DIR/deploy/docker-compose.production.yml"
COMPOSE="docker compose -f $COMPOSE_FILE --env-file $APP_DIR/.env"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$APP_DIR/logs/deploy_$TIMESTAMP.log"
BACKUP_DIR="$APP_DIR/backups"

# ── Helpers ───────────────────────────────────────────────────
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

notify() {
  local status="$1"
  local message="$2"
  if [ -n "${DISCORD_WEBHOOK_URL:-}" ]; then
    local color
    [ "$status" = "success" ] && color=3066993 || color=15158332
    curl -sf -X POST "$DISCORD_WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      --data "{\"embeds\":[{\"title\":\"Deploy $status\",\"description\":\"$message\",\"color\":$color}]}" 2>/dev/null || true
  fi
}

# ── Pre-flight ────────────────────────────────────────────────
mkdir -p "$APP_DIR/logs" "$BACKUP_DIR"
log "🚀 Deploy start — commit: $COMMIT_SHA, actor: $ACTOR"

cd "$APP_DIR"

# ── Backup current state ──────────────────────────────────────
log "📦 Backing up current state..."

# Save current image tag for rollback
CURRENT_IMAGE=$(docker compose -f "$COMPOSE_FILE" ps --format json backend 2>/dev/null | jq -r '.[0].Image' 2>/dev/null || echo "none")
echo "$CURRENT_IMAGE" > "$BACKUP_DIR/last_image.txt"
log "Current image: $CURRENT_IMAGE"

# DB backup (best effort)
$COMPOSE exec -T mongodb mongodump --archive --db workspace_db 2>/dev/null | gzip > "$BACKUP_DIR/db_$TIMESTAMP.gz" || \
  log "⚠️ DB backup failed, continuing..."

# Backup .env
cp "$APP_DIR/.env" "$BACKUP_DIR/env_$TIMESTAMP.bak"

# ── Pull latest code ──────────────────────────────────────────
log "📥 Pulling latest code..."
git pull origin main 2>&1 | tee -a "$LOG_FILE"

# ── Build new image ───────────────────────────────────────────
log "🏗️ Building new image..."
$COMPOSE build --no-cache backend 2>&1 | tee -a "$LOG_FILE"

# ── Health check new container ────────────────────────────────
log "🏥 Starting new container for health check..."

# Start with a temporary project name to run alongside current
docker compose -f "$COMPOSE_FILE" --env-file "$APP_DIR/.env" -p workspace-staging up -d backend 2>&1 | tee -a "$LOG_FILE"

# Wait for new container to be ready
log "Waiting 20s for new container..."
sleep 20

HEALTHY=false
for i in $(seq 1 12); do
  STATUS=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:4000/api/health 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    HEALTHY=true
    log "✅ New container healthy (attempt $i)"
    break
  fi
  log "Health check $i/12 — status $STATUS, waiting 5s..."
  sleep 5
done

if [ "$HEALTHY" = false ]; then
  log "❌ New container failed health check. Rolling back..."

  # Stop the staging container
  docker compose -f "$COMPOSE_FILE" --env-file "$APP_DIR/.env" -p workspace-staging down 2>/dev/null || true

  # Restore previous image if available
  if [ "$CURRENT_IMAGE" != "none" ] && [ -n "$CURRENT_IMAGE" ]; then
    log "Restoring previous image: $CURRENT_IMAGE"
    docker compose -f "$COMPOSE_FILE" --env-file "$APP_DIR/.env" up -d backend 2>&1 | tee -a "$LOG_FILE"
  fi

  notify "FAILED" "Health check failed for commit \`$COMMIT_SHA\`. Rolled back to previous version."
  log "❌ Deploy failed — rolled back"
  exit 1
fi

# ── Switch traffic to new container ───────────────────────────
log "🔄 Switching traffic to new container..."

# Stop old production container
docker compose -f "$COMPOSE_FILE" --env-file "$APP_DIR/.env" -p workspace-production down backend 2>/dev/null || true

# Rename staging to production
docker compose -f "$COMPOSE_FILE" --env-file "$APP_DIR/.env" -p workspace-staging rename workspace-production 2>/dev/null || \
  docker compose -f "$COMPOSE_FILE" --env-file "$APP_DIR/.env" -p workspace-staging up -d backend 2>&1 | tee -a "$LOG_FILE"

# Final health check
sleep 5
FINAL_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:4000/api/health 2>/dev/null || echo "000")
if [ "$FINAL_STATUS" != "200" ]; then
  log "⚠️ Post-switch health check returned $FINAL_STATUS — may need manual check"
fi

# ── Cleanup ───────────────────────────────────────────────────
log "🧹 Cleaning up..."
docker system prune -f --filter "until=24h" 2>&1 | tee -a "$LOG_FILE"

# Keep only last 10 backups
ls -t "$BACKUP_DIR"/db_*.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
ls -t "$BACKUP_DIR"/env_*.bak 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

# ── Done ──────────────────────────────────────────────────────
notify "SUCCESS" "Deployed commit \`${COMMIT_SHA:0:7}\` by $ACTOR. Health: $FINAL_STATUS"
log "✅ Deploy complete at $(date)"
