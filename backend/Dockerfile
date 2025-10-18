FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Create start script that runs migrations with error handling
ENTRYPOINT ["/bin/sh", "-c"]
CMD ["echo 'Running migrations...' && npx prisma migrate deploy --skip-generate && echo 'Migrations complete!' && echo 'Starting app...' && node dist/index.js"]
