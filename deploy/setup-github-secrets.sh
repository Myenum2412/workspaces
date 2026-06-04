#!/bin/bash
# Run on your local machine after the Droplet is set up
# Requires: gh CLI (https://cli.github.com) + logged in
set -euo pipefail

echo "=== Setting up GitHub secrets for auto-deploy ==="
echo ""

# ── DO_HOST ──────────────────────────────────────────────────
read -rp "Droplet IP address: " DO_HOST

# ── DO_SSH_KEY ───────────────────────────────────────────────
echo ""
echo "Paste the private key from the Droplet's /home/deploy/.ssh/deploy_key"
echo "Press Ctrl+D when done:"
DO_SSH_KEY=$(</dev/stdin)

# ── DO_DOMAIN ────────────────────────────────────────────────
read -rp "Public domain (e.g., api.yourdomain.com): " DO_DOMAIN

# ── Set secrets ──────────────────────────────────────────────
echo ""
echo "Setting secrets in GitHub..."
echo "$DO_SSH_KEY" | gh secret set DO_SSH_KEY --repo Myenum2412/workspaces
gh secret set DO_HOST    --repo Myenum2412/workspaces --body "$DO_HOST"
gh secret set DO_USER    --repo Myenum2412/workspaces --body "deploy"
gh secret set DO_DOMAIN  --repo Myenum2412/workspaces --body "$DO_DOMAIN"

echo ""
echo "=== ✅ Secrets set ==="
echo "DO_HOST:   $DO_HOST"
echo "DO_USER:   deploy"
echo "DO_DOMAIN: $DO_DOMAIN"
echo ""
echo "Next push to main will auto-deploy."
echo "Or trigger manually: gh workflow run deploy-backend.yml"
