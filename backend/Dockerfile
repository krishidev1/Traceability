# Use the official lightweight Node.js Alpine image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package descriptor files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the application source code
COPY . .

# Expose the backend port (configured to 5000 by default)
EXPOSE 5000

# Run the server in production mode
CMD ["node", "server.js"]
