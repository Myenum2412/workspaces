#!/bin/bash
# One-shot: create Cloudflare Tunnel + DNS for workspaceapi.myenum.in
# Run on your LOCAL machine (not the Droplet)
# Requires: cloudflared CLI, logged in, domain in Cloudflare
set -euo pipefail

DOMAIN="workspaceapi.myenum.in"
TUNNEL_NAME="workspace-backend"

echo "=== Creating Cloudflare Tunnel for $DOMAIN ==="

# 1. Create the tunnel
echo ">>> Creating tunnel: $TUNNEL_NAME"
cloudflared tunnel create "$TUNNEL_NAME"

# 2. Get tunnel ID
TUNNEL_ID=$(ls ~/.cloudflared/*.json | head -1 | xargs basename | sed 's/\.json//')
echo "Tunnel ID: $TUNNEL_ID"

# 3. Get tunnel token
echo ">>> Getting tunnel token"
TUNNEL_TOKEN=$(cloudflared tunnel token "$TUNNEL_ID")

# 4. Create DNS record
echo ">>> Creating DNS CNAME: $DOMAIN → tunnel"
cloudflared tunnel route dns "$TUNNEL_ID" "$DOMAIN"

# 5. Create config for reference
echo ">>> Writing tunnel config"
cat > "$TUNNEL_NAME.yml" << EOF
tunnel: $TUNNEL_ID
credentials-file: /home/cloudflared/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: $DOMAIN
    service: http://backend:4000
  - service: http_status:404
EOF

echo ""
echo "=== ✅ TUNNEL READY ==="
echo ""
echo "Add this to your Droplet's .env:"
echo "  TUNNEL_TOKEN=$TUNNEL_TOKEN"
echo ""
echo "Then on the Droplet:"
echo "  cd /opt/workspaces"
echo "  nano .env   # paste TUNNEL_TOKEN"
echo "  docker compose -f deploy/docker-compose.production.yml --env-file .env up -d"
echo ""
echo "Verify:"
echo "  curl https://$DOMAIN/api/health"
