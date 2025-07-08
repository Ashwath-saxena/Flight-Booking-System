# Use official Node.js LTS image as base
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm install

# Copy the rest of the app
COPY . .

# Build Next.js app
RUN npm run build

# Production image: only minimal files
FROM node:20-alpine AS runner

WORKDIR /app

# If you use custom fonts/images/public assets, copy them
COPY --from=builder /app/public ./public

# Copy built app and node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set environment variables (should be provided via docker run or .env)
ENV NODE_ENV=production

# Expose port 3000
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]