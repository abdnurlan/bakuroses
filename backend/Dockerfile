# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Express + Prisma + Socket.IO backend
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS base
WORKDIR /app
# Prisma query engine links against OpenSSL
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# builder
# ---------------------------------------------------------------------------
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate --schema src/prisma/schema.prisma
RUN npm run build

# ---------------------------------------------------------------------------
# runner — keeps the full dependency tree so `prisma migrate deploy` and the
# ts-node seed script can run inside the container.
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3002

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY package.json tsconfig.json ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
 && mkdir -p uploads

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3002/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
