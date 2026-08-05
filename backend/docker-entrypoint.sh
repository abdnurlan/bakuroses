#!/bin/sh
set -e

SCHEMA=src/prisma/schema.prisma

echo "→ applying database migrations"
# Postgres may still be finishing its first-boot init even after the healthcheck
attempt=1
until npx prisma migrate deploy --schema "$SCHEMA"; do
  if [ "$attempt" -ge 10 ]; then
    echo "✗ migrations failed after $attempt attempts" >&2
    exit 1
  fi
  echo "  migrate deploy failed (attempt $attempt), retrying in 3s…"
  attempt=$((attempt + 1))
  sleep 3
done

if [ "$SEED_ON_START" = "true" ]; then
  echo "→ seeding database"
  npx ts-node src/prisma/seed.ts || echo "  seed failed, continuing"
fi

echo "→ starting: $*"
exec "$@"
