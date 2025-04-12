# Using official Node.js runtime as parent image
FROM node:22.14.0-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose the port where the app runs
EXPOSE 3000

# Run the app
CMD [ "npm", "run", "start" ]