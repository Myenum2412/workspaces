FROM node:22-alpine
WORKDIR /app

# Install cloudflared
RUN apk add --no-cache curl && \
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && \
    chmod +x /usr/local/bin/cloudflared

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

EXPOSE 4000

# Start backend + cloudflared tunnel side-by-side
CMD ["sh", "-c", "(node dist/server.js &) && sleep 3 && cloudflared tunnel --url http://localhost:4000 --no-autoupdate 2>&1"]
