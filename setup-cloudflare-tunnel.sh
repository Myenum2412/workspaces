#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Cloudflare Tunnel Setup
# Exposes backend via *.trycloudflare.com URL
# ─────────────────────────────────────────────────────────────

set -e

echo "🚀 Starting Cloudflare Tunnel..."
echo ""

# Option A: Run standalone (if backend already running on port 4000)
# cloudflared tunnel --url http://localhost:4000

# Option B: Run via docker-compose (recommended)
echo "Starting via docker-compose..."
echo "Run: docker compose up -d backend cloudflared"
echo ""
echo "Then check for the tunnel URL:"
echo "  docker compose logs -f cloudflared"
echo ""
echo "Look for line like:"
echo "  INF Connection established https://xxxxx.trycloudflare.com"
echo ""
echo "Once you have the URL, update frontend env:"
echo "  NEXT_PUBLIC_BACKEND_URL=https://xxxxx.trycloudflare.com"
echo ""
echo "And update backend FRONTEND_URL to your Cloudflare Pages URL:"
echo "  FRONTEND_URL=https://your-project.pages.dev"
