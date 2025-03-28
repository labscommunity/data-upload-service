# Base image
FROM node:20.18.3-alpine

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy app source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build app
RUN pnpm build

# Expose port
EXPOSE 3000


CMD ["sh", "-c", "pnpm db:migrate:prod && pnpm start:prod"]