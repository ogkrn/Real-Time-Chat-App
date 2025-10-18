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

# Start the application
CMD ["npm", "start"]
