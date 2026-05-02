# Single-stage build - ensures devDependencies are available for tsc + vite build
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDeps needed for build)
RUN npm install

# Copy all source files
COPY . .

# Build the React app (generates /app/dist)
RUN npm run build

# Expose Cloud Run's expected port
EXPOSE 8080

# Start the Express server
CMD ["node", "server.js"]
