# Production Deployment — workspaces

## Architecture

```
User → https://workspaceapi.myenum.in → Cloudflare Tunnel → DO Droplet
                                                       ├── Backend (Express, :4000)
                                                       ├── MongoDB Atlas
                                                       └── Redis

Frontend → Cloudflare Pages → https://myenum.in
         └── API calls → https://workspaceapi.myenum.in
```

## Environments

| Environment | Branch | URL | Port |
|-------------|--------|-----|------|
| Production | `main` | `https://workspaceapi.myenum.in` | 4000 |
| Staging | `develop` | `http://<droplet-ip>:4001` | 4001 |
| Development | local | `http://localhost:4000` | 4000 |

## Auto-Deploy Flow

```
git push origin main
  → GitHub Actions: lint + test
  → SSH to Droplet
  → deploy-production.sh (zero-downtime)
  → Health check (12 attempts, 60s)
  → Purge Cloudflare cache
  → Discord notification
```

## Setup (One-Time)

### 1. Create Droplet

Ubuntu 24.04, min 2GB RAM. Then:

```bash
ssh root@<droplet-ip>
curl -fsSL https://raw.githubusercontent.com/Myenum2412/workspaces/main/deploy/setup-droplet.sh | bash
```

### 2. Cloudflare Tunnel

On local machine:

```bash
# Install cloudflared
# macOS: brew install cloudflare/cloudflare/cloudflared
# Linux: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

cloudflared tunnel login
bash deploy/config-tunnel.sh
# → Outputs TUNNEL_TOKEN
```

On Droplet:

```bash
ssh deploy@<droplet-ip>
nano /opt/workspaces/.env
# Add: TUNNEL_TOKEN=<from above>
```

### 3. GitHub Secrets

```bash
# On local machine:
gh secret set DO_SSH_KEY < /home/deploy/.ssh/deploy_key
gh secret set DO_HOST --body "<droplet-ip>"
gh secret set DO_USER --body "deploy"
gh secret set DO_DOMAIN --body "workspaceapi.myenum.in"
gh secret set CF_ZONE_ID --body "<cloudflare-zone-id>"
gh secret set CF_API_TOKEN --body "<cloudflare-api-token>"
gh secret set CF_ACCOUNT_ID --body "<cloudflare-account-id>"
# Optional:
gh secret set DISCORD_WEBHOOK_URL --body "<webhook-url>"
```

### 4. Start

```bash
ssh deploy@<droplet-ip>
cd /opt/workspaces
docker compose -f deploy/docker-compose.production.yml --env-file .env up -d
```

### 5. Verify

```bash
curl https://workspaceapi.myenum.in/api/health
# → {"success":true,"status":"healthy",...}
```

## GitHub Secrets Reference

| Secret | Description |
|--------|-------------|
| `DO_HOST` | Droplet IP |
| `DO_SSH_KEY` | SSH private key (ed25519) |
| `DO_USER` | `deploy` |
| `DO_DOMAIN` | `workspaceapi.myenum.in` |
| `CF_ZONE_ID` | Cloudflare zone ID for `myenum.in` |
| `CF_API_TOKEN` | Cloudflare API token (Zone.Cache Purge) |
| `CF_ACCOUNT_ID` | Cloudflare account ID |
| `DISCORD_WEBHOOK_URL` | Discord webhook for notifications (optional) |

## Manual Operations

```bash
# View logs
docker compose -f deploy/docker-compose.production.yml logs -f backend
docker compose -f deploy/docker-compose.production.yml logs -f cloudflared

# Rollback
bash deploy/deploy-rollback.sh

# Staging
docker compose -f deploy/docker-compose.staging.yml --env-file .env up -d
curl http://localhost:4001/api/health

# Trigger deploy manually
gh workflow run deploy-production.yml
```

## Zero-Downtime Deploy

1. Build new container alongside old
2. Health check new container (port 4000)
3. If healthy: stop old, switch traffic
4. If failed: keep old running, notify failure

## Rollback

```bash
bash deploy/deploy-rollback.sh
```

Restores previous Docker image from backup. Health check after rollback.

## Security

- **Zero open ports**: Cloudflare Tunnel connects outbound — no public ports needed
- Backend only listens on localhost
- SSH key-only auth, fail2ban enabled
- Deploy user: `docker` group only, no sudo
- `COOKIE_SECURE=true` in production
- GitHub Actions: `concurrency` prevents parallel deploys
- Secrets never logged (`set +x` in scripts)

## File Structure

```
deploy/
  deploy-production.sh        # Zero-downtime deploy
  deploy-rollback.sh          # Rollback to previous version
  purge-cloudflare-cache.sh   # Cloudflare cache purge
  docker-compose.production.yml
  docker-compose.staging.yml
  nginx.conf                  # Reverse proxy config
  ecosystem.config.js         # PM2 config (alternative to Docker)
  setup-droplet.sh            # One-time Droplet setup
  setup-server.sh             # Server hardening
  setup-tunnel.sh             # Cloudflare Tunnel setup
  setup-github-secrets.sh     # GitHub secrets helper
  config-tunnel.sh            # Tunnel creation
  README.md
```
