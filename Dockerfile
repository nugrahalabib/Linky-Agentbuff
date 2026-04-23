FROM node:22-bookworm-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV AUTH_SECRET=build-time-placeholder-change-at-runtime-please
ENV DATABASE_URL=file:./linky.db
ENV NEXT_PUBLIC_APP_URL=https://linky.agentbuff.id
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=1709
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y --no-install-recommends tini curl \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system --gid 1001 linky \
    && adduser --system --uid 1001 linky
COPY --from=builder --chown=linky:linky /app/.next ./.next
COPY --from=builder --chown=linky:linky /app/public ./public
COPY --from=builder --chown=linky:linky /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=linky:linky /app/node_modules ./node_modules
COPY --from=builder --chown=linky:linky /app/scripts ./scripts
COPY --from=builder --chown=linky:linky /app/next.config.ts ./
COPY --from=builder --chown=linky:linky /app/src/lib/db/schema.ts ./src/lib/db/schema.ts
USER linky
EXPOSE 1709
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -fsS http://localhost:1709/api/health >/dev/null || exit 1
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["npm", "start"]
