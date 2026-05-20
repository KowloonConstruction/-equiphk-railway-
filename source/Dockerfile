FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm matching the version in package.json packageManager field
RUN npm install -g pnpm@10.4.1

# Copy package files AND patches before install (patches needed during pnpm install)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install ALL dependencies (including devDeps - needed because esbuild uses --packages=external
# which means vite and other devDeps are imported at runtime, not bundled)
RUN pnpm install --frozen-lockfile

# Copy all source files
COPY . .

# Build the application
# - Server builds to /app/dist/index.js (esbuild, --packages=external)
# - Frontend (Vite) builds to /app/dist/public/ (per vite.config.ts outDir)
RUN pnpm build

# Production stage - keep all node_modules since devDeps are needed at runtime
FROM node:22-alpine AS runner
WORKDIR /app

# Copy everything from builder (including node_modules with all deps)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Expose port (Railway sets PORT env var)
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"]
