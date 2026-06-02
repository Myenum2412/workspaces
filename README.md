# workspaces

## Cloudflare Tunnel (Backend Public URL)

Backend exposes via Cloudflare Tunnel using `cloudflared`.

### Quick Start

```bash
# Start all services
docker compose up -d

# Get the tunnel URL
docker compose logs -f cloudflared
```

Look for:
```
INF Connection established https://xxxxx.trycloudflare.com
```

### After Getting Tunnel URL

1. Update `frontend/.env.local`:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://xxxxx.trycloudflare.com
   ```

2. Update `backend/.env`:
   ```
   FRONTEND_URL=https://your-project.pages.dev
   ```

3. Restart:
   ```bash
   docker compose up -d --build
   ```

### Notes

- Tunnel URL changes each restart (free tier)
- For a permanent URL, create a named tunnel in Cloudflare Zero Trust dashboard
- Frontend deploys to Cloudflare Pages (see `frontend/.cloudflare/pages.json`)