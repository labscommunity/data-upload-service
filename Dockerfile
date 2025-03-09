# Base image
FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN pnpm install

# Copy app source
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build app
RUN pnpm build

# Expose port
EXPOSE 3000

# Start app
CMD ["pnpm", "start:prod"]
