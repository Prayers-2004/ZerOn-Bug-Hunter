FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    ca-certificates \
    dumb-init

# Copy package files
COPY package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy frontend files
COPY client ./client

# Install frontend dependencies
WORKDIR /app/client
RUN npm ci --only=production && npm run build

# Return to app root
WORKDIR /app

# Copy application files
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose ports
EXPOSE 5000 3000

# Set environment variables
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Use dumb-init to handle signals properly
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Start application
CMD ["npm", "start"]
