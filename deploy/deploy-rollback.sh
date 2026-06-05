#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# Rollback Script — Restore previous backend version
# Usage: bash deploy-rollback.sh [manual]
# ═══════════════════════════════════════════════════════════════

APP_DIR="/opt/workspaces"
COMPOSE_FILE="$APP_DIR/deploy/docker-compose.production.yml"
COMPOSE="docker compose -f $COMPOSE_FILE --env-file $APP_DIR/.env"
BACKUP_DIR="$APP_DIR/backups"
LOG_FILE="$APP_DIR/logs/rollback_$(date +%Y%m%d_%H%M%S).log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

notify() {
  local message="$1"
  if [ -n "${DISCORD_WEBHOOK_URL:-}" ]; then
    curl -sf -X POST "$DISCORD_WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      --data "{\"embeds\":[{\"title\":\"🔄 Rollback Executed\",\"description\":\"$message\",\"color\":15158332}]}" 2>/dev/null || true
  fi
}

mkdir -p "$APP_DIR/logs"
cd "$APP_DIR"

log "🔄 Rollback initiated"

# ── Option 1: Restore from backup env ─────────────────────────
if [ -f "$BACKUP_DIR/last_image.txt" ]; then
  LAST_IMAGE=$(cat "$BACKUP_DIR/last_image.txt")
  log "Last known image: $LAST_IMAGE"

  if [ "$LAST_IMAGE" != "none" ] && [ -n "$LAST_IMAGE" ]; then
    log "Stopping current container..."
    $COMPOSE down backend 2>&1 | tee -a "$LOG_FILE"

    log "Starting previous version..."
    $COMPOSE up -d backend 2>&1 | tee -a "$LOG_FILE"

    sleep 10

    # Health check
    for i in $(seq 1 6); do
      STATUS=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:4000/api/health 2>/dev/null || echo "000")
      if [ "$STATUS" = "200" ]; then
        log "✅ Rollback successful — backend healthy"
        notify "Rollback successful. Backend healthy after restoring previous version."
        exit 0
      fi
      log "Health check $i/6 — status $STATUS..."
      sleep 5
    done

    log "❌ Rollback health check failed"
    notify "Rollback completed but health check failed. Manual intervention needed."
    exit 1
  fi
fi

# ── Option 2: List available images ───────────────────────────
log "Available backend images:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}" | grep -i workspace | head -10 | tee -a "$LOG_FILE"

log ""
log "To manually rollback:"
log "  1. Find the previous image tag from the list above"
log "  2. Edit $COMPOSE_FILE to pin the image"
log "  3. Run: $COMPOSE up -d backend"

notify "Rollback attempted but no previous image found. Manual intervention may be needed."
