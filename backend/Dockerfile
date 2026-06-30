FROM node:20-slim

# Install build tools for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Data directory — mount a Fly volume here for persistence
RUN mkdir -p /data
ENV LUNA_DATA_DIR=/data
ENV PORT=3001

EXPOSE 3001
CMD ["node", "server.js"]
