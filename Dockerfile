# Multi-stage Dockerfile for Next.js dashboard

# 1) Build app
FROM node:20-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=512

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# 2) Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Reuse node_modules from builder — avoids a second npm install
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.* ./

EXPOSE 3000

# Next.js start (uses PORT=3000 by default)
CMD ["npm", "start"]
