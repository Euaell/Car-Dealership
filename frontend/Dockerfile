FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port for Next.js
EXPOSE 3000

# Command to run the application in development mode
CMD ["npm", "run", "dev"]
