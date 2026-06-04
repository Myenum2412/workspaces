# Production Deployment

API URL: **https://workspaceapi.myenum.in**

## Architecture

```
User ── https://workspaceapi.myenum.in ──┐
                                 ├── Cloudflare Tunnel ── Digital Ocean Droplet
Cloudflare Pages (frontend)  ────┘                        ├── Backend (Express, :4000)
                                                          └── MongoDB Atlas
```

Frontend calls `https://workspaceapi.myenum.in` → Cloudflare DNS → Cloudflare Tunnel → Backend on DO

## Prerequisites

- Cloudflare account with `myenum.in` DNS managed by Cloudflare
- Digital Ocean account
- MongoDB Atlas (connection string in `.env`)
- Resend API key (transactional email)

## Setup (one-time, in order)

### 1. Create Droplet

Create an Ubuntu 24.04 Droplet (minimum 2GB RAM, 2 CPU). Then:

```bash
ssh root@<droplet-ip>
curl -fsSL https://raw.githubusercontent.com/Myenum2412/workspaces/main/deploy/setup-droplet.sh | bash
```

This installs Docker, creates `deploy` user, clones repo, generates `.env`.

### 2. Configure tunnel + DNS

Run on your **local machine**:

```bash
# Install cloudflared
# macOS: brew install cloudflare/cloudflare/cloudflared
# Linux: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel + DNS for workspaceapi.myenum.in
bash deploy/config-tunnel.sh
```

This creates:
- Named tunnel `workspace-backend`
- DNS CNAME `workspaceapi.myenum.in` → tunnel
- Outputs `TUNNEL_TOKEN` — copy this

### 3. Finish Droplet setup

```bash
ssh deploy@<droplet-ip>

# Paste TUNNEL_TOKEN into .env
nano /opt/workspaces/.env
# Add: TUNNEL_TOKEN=<paste-from-step-2>

# Fill in other secrets:
#   MONGODB_URI, JWT_SECRET, RESEND_API_KEY, COOKIE_SECRET
#   R2_*, GOOGLE_CLIENT_*, SUPER_ADMIN_EMAILS

# Start
docker compose -f deploy/docker-compose.production.yml --env-file .env up -d
```

### 4. Verify

```bash
curl https://workspaceapi.myenum.in/api/health
# → {"success":true,"status":"healthy","uptime":...}
```

### 5. Auto-deploy from GitHub

```bash
# On your local machine:
chmod +x deploy/setup-github-secrets.sh
./deploy/setup-github-secrets.sh
```

Then every `git push` to `main` touching `backend/` auto-deploys.

## Secrets Reference

| Secret | Where | Source |
|--------|-------|--------|
| `DO_HOST` | GitHub | Droplet IP |
| `DO_SSH_KEY` | GitHub | `/home/deploy/.ssh/deploy_key` on Droplet |
| `DO_USER` | GitHub | `deploy` |
| `DO_DOMAIN` | GitHub | `workspaceapi.myenum.in` |
| `TUNNEL_TOKEN` | Droplet `.env` | `deploy/config-tunnel.sh` output |
| `MONGODB_URI` | Droplet `.env` | MongoDB Atlas |
| `JWT_SECRET` | Droplet `.env` | `openssl rand -hex 32` |
| `RESEND_API_KEY` | Droplet `.env` | Resend dashboard |
| `COOKIE_SECRET` | Droplet `.env` | `openssl rand -hex 32` |

## Maintenance

```bash
# View logs
ssh deploy@<droplet-ip>
docker compose -f /opt/workspaces/deploy/docker-compose.production.yml logs -f backend
docker compose -f /opt/workspaces/deploy/docker-compose.production.yml logs -f cloudflared

# Manual deploy
git push  # triggers GitHub Actions

# Or SSH + manual
ssh deploy@<droplet-ip>
cd /opt/workspaces && git pull && docker compose -f deploy/docker-compose.production.yml up -d --build
```

## Security

- **Zero open ports**: Cloudflare Tunnel connects outbound from the Droplet — no firewall rules needed
- Backend only listens on localhost (no public IP exposure)
- `COOKIE_SECURE=true` in production (HTTPS-only cookies)
