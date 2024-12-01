# Use the official Node.js image as a base image
FROM node:22

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all the source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the application port
# EXPOSE 8080

# Set environment variables (if any, can be overwritten in GCP console)
# ENV DB_HOST=localhost
ENV PORT=8080

# Start the server
CMD ["npm", "run", "start"]
