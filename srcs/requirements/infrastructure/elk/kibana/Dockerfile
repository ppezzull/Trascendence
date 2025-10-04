# Minimal Dockerfile placeholder
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .
CMD ["node", "dist/src/app.js"]
