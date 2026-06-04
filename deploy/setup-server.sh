#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# Initial Server Setup — DigitalOcean VPS
# ═══════════════════════════════════════════════════════════════

echo "🔧 Setting up server for workspaceapi.myenum.in..."

apt update && apt upgrade -y
apt install -y curl wget git ufw fail2ban unattended-upgrades

# ── Firewall ────────────────────────────────────────────────
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# ── Docker ──────────────────────────────────────────────────
curl -fsSL https://get.docker.com | sh
usermod -aG docker root

# ── App directory ───────────────────────────────────────────
mkdir -p /opt/workspace-api/{logs,backups,uploads}
cd /opt/workspace-api

# ── Environment ─────────────────────────────────────────────
if [ ! -f .env ]; then
  cp backend/.env.example .env
  echo "⚠️ Edit .env with production values!"
fi

# ── SSL (Certbot) ───────────────────────────────────────────
apt install -y certbot
certbot certonly --standalone -d workspaceapi.myenum.in --email admin@myenum.in --agree-tos --no-eff-email

# ── Auto-renewal cron ──────────────────────────────────────
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'nginx -s reload'") | crontab -

# ── Nginx ───────────────────────────────────────────────────
apt install -y nginx
cp deploy/nginx.conf /etc/nginx/sites-available/workspaceapi
ln -sf /etc/nginx/sites-available/workspaceapi /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── Log rotation ────────────────────────────────────────────
cat > /etc/logrotate.d/workspace-api << 'EOF'
/opt/workspace-api/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 root root
}
EOF

dpkg-reconfigure -plow unattended-upgrades

echo "✅ Server setup complete!"
echo "Next steps:"
echo "  1. Edit /opt/workspace-api/.env with production values"
echo "  2. Run: docker compose up -d"
echo "  3. Run: docker compose exec backend npx tsx prisma/seed.ts"
