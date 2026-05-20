FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm matching the version in package.json packageManager field
RUN npm install -g pnpm@10.4.1

# Copy package files AND patches before install (patches needed during pnpm install)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all source files
COPY . .

# Build the application
# - Server builds to /app/dist/index.js
# - Frontend (Vite) builds to /app/dist/public/ (per vite.config.ts outDir)
RUN pnpm build

# Production stage
FROM node:22-alpine AS runner
WORKDIR /app

# Install pnpm matching the version in package.json packageManager field
RUN npm install -g pnpm@10.4.1

# Copy package files and patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built server and frontend from builder
# Both are under /app/dist/ (server: dist/index.js, frontend: dist/public/)
COPY --from=builder /app/dist ./dist

# Expose port (Railway sets PORT env var)
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"]
