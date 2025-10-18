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

# Create start script that runs migrations then starts app
RUN echo '#!/bin/sh\nset -e\necho "Running migrations..."\nnpx prisma migrate deploy\necho "Starting app..."\nnode dist/index.js' > /app/start.sh && chmod +x /app/start.sh

# Expose port
EXPOSE 5000

# Start the application
CMD ["/app/start.sh"]
