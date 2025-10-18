FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --production=false

# Copy source code
COPY src ./src/
COPY tsconfig.json ./
COPY start-app.js ./

# Build TypeScript
RUN npm run build

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start the application with migrations
CMD ["node", "start-app.js"]
