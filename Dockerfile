# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Next.js 16 frontend — standalone output (see next.config.ts `output`)
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ---------------------------------------------------------------------------
# deps — install with --ignore-scripts: ffmpeg-static (only used by the
# hero-frame extraction script) would otherwise download a ~80MB binary, and
# sharp / unrs-resolver ship prebuilt platform packages that need no build step.
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ---------------------------------------------------------------------------
# builder
# ---------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* is inlined into the client bundle at build time, and
# next.config.ts rewrites are serialised into the standalone server, so
# BACKEND_URL must be known here too.
ARG NEXT_PUBLIC_API_URL=http://localhost:3002
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:3002
ARG NEXT_PUBLIC_WHATSAPP_NUMBER=
ARG BACKEND_URL=http://backend:3002
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL \
    NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER \
    BACKEND_URL=$BACKEND_URL \
    NEXT_OUTPUT_STANDALONE=1 \
    NODE_ENV=production

RUN npm run build

# ---------------------------------------------------------------------------
# runner
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# `server.js` serves ./public and ./.next/static only if they are copied in
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
