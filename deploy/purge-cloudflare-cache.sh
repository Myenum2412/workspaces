#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# Cloudflare Cache Purge — Purge all cached content
# Usage: bash purge-cloudflare-cache.sh
# Requires: CF_ZONE_ID and CF_API_TOKEN env vars
# ═══════════════════════════════════════════════════════════════

CF_ZONE_ID="${CF_ZONE_ID:-}"
CF_API_TOKEN="${CF_API_TOKEN:-}"

if [ -z "$CF_ZONE_ID" ] || [ -z "$CF_API_TOKEN" ]; then
  echo "❌ CF_ZONE_ID and CF_API_TOKEN required"
  exit 1
fi

echo "🧹 Purging Cloudflare cache for zone $CF_ZONE_ID..."

RESPONSE=$(curl -sf -X POST \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything": true}')

echo "Response: $RESPONSE"

SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ Cloudflare cache purged successfully"
else
  echo "❌ Cloudflare cache purge failed"
  exit 1
fi
