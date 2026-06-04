#!/bin/bash
# Digital Ocean Droplet Setup
# Run this ONCE on a fresh Ubuntu 24.04 Droplet
set -euo pipefail

REPO_URL="${1:-https://github.com/Myenum2412/workspaces.git}"
APP_DIR="/opt/workspaces"

echo "=== 1. Installing Docker & dependencies ==="
apt-get update -qq
apt-get install -y -qq ca-certificates curl git

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "=== 2. Creating deploy user ==="
id -u deploy &>/dev/null || useradd -m -s /bin/bash deploy
usermod -aG docker deploy

# Create SSH key for GitHub Actions deploy
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# Generate a deploy key (no passphrase)
if [ ! -f /home/deploy/.ssh/deploy_key ]; then
  ssh-keygen -t ed25519 -f /home/deploy/.ssh/deploy_key -N "" -C "github-actions-deploy"
fi

# Allow SSH login with this key (copy public key to authorized_keys)
cp /home/deploy/.ssh/deploy_key.pub /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

echo ""
echo "=== ✅ DEPLOY KEY (add to GitHub Secrets as DO_SSH_KEY) ==="
echo "-----BEGIN OPENSSH PRIVATE KEY-----"
cat /home/deploy/.ssh/deploy_key | grep -v "BEGIN OPENSSH" | grep -v "END OPENSSH" | head -5
echo "... (copy the full key below) ..."
echo "-----END OPENSSH PRIVATE KEY-----"
echo ""
echo "Run this on your local machine to add it:"
echo "  gh secret set DO_SSH_KEY < /home/deploy/.ssh/deploy_key"
echo "  gh secret set DO_HOST <this-droplet-ip>"
echo "  gh secret set DO_USER deploy"
echo ""

echo "=== 3. Cloning repo ==="
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR" && git pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

echo "=== 4. Creating .env from template ==="
if [ ! -f .env ]; then
  cp deploy/.env.production .env
  echo ">>> EDIT .env with your production secrets!"
  echo "    nano $APP_DIR/.env"
else
  echo ".env already exists — skipping"
fi

echo "=== 5. Building and starting ==="
docker compose -f deploy/docker-compose.production.yml --env-file .env up -d --build

echo ""
echo "=== ✅ DONE ==="
echo "Backend:   http://$(curl -s http://checkip.amazonaws.com):4000/api/health"
echo "Logs:      docker compose -f deploy/docker-compose.production.yml logs -f"
echo "SSH:       ssh deploy@<droplet-ip>"
echo ""
echo "=== NEXT STEPS ==="
echo "1. nano $APP_DIR/.env    ← set all secrets"
echo "2. Run deploy/setup-tunnel.sh on your LOCAL machine to create Cloudflare Tunnel"
echo "3. Add GitHub secrets and push to trigger auto-deploy"
