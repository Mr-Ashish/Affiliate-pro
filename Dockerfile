# Coupon Hub — production image (Next.js standalone) + migrate target.
#   docker build -t coupon-hub:local .
#   docker build --target migrate -t coupon-hub:migrate .
# Runtime env: DATABASE_URL, AUTH_SECRET, AUTH_URL, AUTH_TRUST_HOST
# Web: HOSTNAME=0.0.0.0 PORT=3000  →  node server.js

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma client for the build; dummy URL so generateStaticParams can fail closed.
# Not runtime secrets — override DATABASE_URL / AUTH_SECRET when running the container.
ARG DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
ARG AUTH_SECRET="build-time-placeholder-not-used-at-runtime"
ENV DATABASE_URL=$DATABASE_URL
ENV AUTH_SECRET=$AUTH_SECRET
ENV AUTH_TRUST_HOST="true"
# ISR home/store pages query Prisma at build time; there is no DB in the image.
ENV SKIP_DB_PRERENDER="1"
RUN pnpm exec prisma generate
RUN pnpm build

# Default: Next.js standalone server
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl wget \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]

# One-shot: prisma migrate deploy (override command for in-VPC seed)
FROM base AS migrate
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/src/lib ./src/lib
USER node
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]
