#!/bin/bash
# Cloudflare Tunnel Setup — run on YOUR local machine (not the Droplet)
# Requires: cloudflared CLI, Cloudflare API token with Tunnel:Edit permission
set -euo pipefail

echo "=== Cloudflare Named Tunnel Setup ==="
echo ""
echo "Prerequisites:"
echo "  1. Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
echo "  2. Log in: cloudflared tunnel login"
echo "  3. Have your domain's DNS in Cloudflare"
echo ""

# ── Config ──────────────────────────────────────────────────
read -rp "Tunnel name [workspace-backend]: " TUNNEL_NAME
TUNNEL_NAME="${TUNNEL_NAME:-workspace-backend}"

read -rp "Public domain (e.g., api.yourdomain.com): " PUBLIC_DOMAIN
if [ -z "$PUBLIC_DOMAIN" ]; then
  echo "ERROR: Public domain required"
  exit 1
fi

# ── Step 1: Create tunnel —──────────────────────────────────
echo ""
echo "=== Creating tunnel: $TUNNEL_NAME ==="
cloudflared tunnel create "$TUNNEL_NAME"

# Get tunnel ID from credentials file
TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
if [ -z "$TUNNEL_ID" ]; then
  # Fallback: find the JSON file
  TUNNEL_ID=$(ls ~/.cloudflared/*.json | head -1 | xargs basename | sed 's/\.json//')
fi

echo "Tunnel ID: $TUNNEL_ID"

# ── Step 2: Get tunnel token for docker-compose ─────────────
echo ""
echo "=== Getting tunnel token ==="
TUNNEL_TOKEN=$(cloudflared tunnel token "$TUNNEL_ID")
echo "Token: ${TUNNEL_TOKEN:0:20}..."

echo ""
echo "=== Add this to your .env on the Droplet ==="
echo "TUNNEL_TOKEN=$TUNNEL_TOKEN"

# ── Step 3: Create DNS record ───────────────────────────────
echo ""
echo "=== Creating DNS CNAME for $PUBLIC_DOMAIN ==="
cloudflared tunnel route dns "$TUNNEL_ID" "$PUBLIC_DOMAIN"

# ── Step 4: Generate config file (optional) ─────────────────
echo ""
echo "=== Generating tunnel config file ==="
cat > "$TUNNEL_NAME.yml" << EOF
tunnel: $TUNNEL_ID
credentials-file: /home/cloudflared/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: $PUBLIC_DOMAIN
    service: http://backend:4000
  - service: http_status:404
EOF

echo "Config written to $TUNNEL_NAME.yml"
echo ""
echo "=== NEXT STEPS ==="
echo "1. Copy the TUNNEL_TOKEN into your Droplet's .env file"
echo "2. On the Droplet, restart:"
echo "   docker compose -f deploy/docker-compose.production.yml down"
echo "   docker compose -f deploy/docker-compose.production.yml --env-file .env up -d"
echo ""
echo "3. Verify: curl https://$PUBLIC_DOMAIN/api/health"
