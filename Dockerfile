# ============================================================
# Amarillo WiFi — Dockerfile multi-stage
# Stage 1: Build frontend (Vite)
# Stage 2: Run Express API + serve built frontend
# ============================================================

# ---- Stage 1: Build Vite frontend ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build the React frontend (outputs to /app/dist)
RUN npm run build

# ---- Stage 2: Production server ----
FROM node:20-alpine AS runner

WORKDIR /app

# Only install production deps + tsx to run TypeScript directly
COPY package*.json ./
RUN npm ci --omit=dev && npm install tsx

# Copy built frontend from Stage 1
COPY --from=builder /app/dist ./dist

# Copy server source files
COPY server.ts ./
COPY db/ ./db/
COPY tsconfig.json ./

# Expose the API port (default 3001, configurable via API_PORT env)
EXPOSE 3001

# Start the API server (it will also serve dist/ as static files)
CMD ["npx", "tsx", "server.ts"]
