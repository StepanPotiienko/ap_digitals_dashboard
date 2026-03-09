# Multi-stage Dockerfile for Next.js 16 dashboard

# 1) Install deps
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

# 2) Build app
FROM node:20-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# 3) Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install only prod deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

EXPOSE 3000

# Next.js start (uses PORT=3000 by default)
CMD ["npm", "start"]
