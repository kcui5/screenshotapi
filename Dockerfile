# Use the official Playwright image as our base image
FROM mcr.microsoft.com/playwright:v1.43.0-jammy
# Set the working directory
WORKDIR /app
# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./
# Install dependencies
RUN npm ci
# Copy the rest of the application code to the working directory
COPY . .
# Expose the port the app will run on
EXPOSE 3000
# Start the application
CMD ["npm", "start"]