FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm globally - alpine has npm in PATH properly
RUN npm install -g pnpm@9

# Copy package files AND patches before install (patches needed during pnpm install)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all source files
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:22-alpine AS runner
WORKDIR /app

# Install pnpm for production
RUN npm install -g pnpm@9

# Copy package files and patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Expose port (Railway sets PORT env var)
EXPOSE 3000

# Start the server
CMD ["node", "dist/_core/index.js"]
