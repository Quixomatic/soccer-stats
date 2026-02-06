# Build frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm run build

# Build backend
FROM node:22-alpine AS backend-build
WORKDIR /app/backend
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY backend/ ./
RUN pnpm run build

# Production image
FROM node:22-alpine
WORKDIR /app

# Copy backend build and dependencies
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json ./

# Copy frontend build to public directory
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
