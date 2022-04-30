# Initial Setup
FROM node:16-alpine
WORKDIR /app

# Copy and download dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy the source files into the image
COPY . .

EXPOSE 5100

CMD npm start
