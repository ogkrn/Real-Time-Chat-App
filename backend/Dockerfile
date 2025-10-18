FROM node:18-alpine

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm install --production=false

# Build TypeScript
RUN npm run build

# Generate Prisma Client
RUN npx prisma generate

# Create entrypoint script
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'set -e' >> /entrypoint.sh && \
    echo 'echo "Running Prisma migrations..."' >> /entrypoint.sh && \
    echo 'cd /app && npx prisma migrate deploy || true' >> /entrypoint.sh && \
    echo 'echo "Starting application..."' >> /entrypoint.sh && \
    echo 'node /app/dist/index.js' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["/entrypoint.sh"]
