FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port for API
EXPOSE 3001

# Command to run the application
CMD ["npm", "run", "dev"]
