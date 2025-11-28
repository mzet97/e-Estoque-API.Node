# Multi-stage build for Node.js application
# Stage 1: Dependencies and Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm@latest
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create app directory and non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy built application and dependencies
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copy additional runtime files
COPY --chown=nextjs:nodejs ./scripts/ ./scripts/
COPY --chown=nextjs:nodejs ./docker/entrypoint.sh ./

# Create directories for runtime data
RUN mkdir -p /app/logs /app/tmp /app/uploads && \
    chown -R nextjs:nodejs /app/logs /app/tmp /app/uploads

# Create health check script
COPY --chown=nextjs:nodejs ./scripts/health-check.sh ./

# Switch to non-root user
USER nextjs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Set entrypoint
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/gateway/GatewayServer.js"]

# Labels for metadata
LABEL maintainer="e-Estoque Team <dev@eestoque.com>"
LABEL version="1.0.0"
LABEL description="E-Estoque Node.js API - Production Ready"
LABEL org.opencontainers.image.title="E-Estoque API"
LABEL org.opencontainers.image.description="Enterprise-grade inventory management API"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.created="2024-11-27"
LABEL org.opencontainers.image.source="https://github.com/eestoque/api"
LABEL org.opencontainers.image.licenses="MIT"