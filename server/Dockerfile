FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Prisma client generation inside container
RUN npx prisma generate

EXPOSE 4000

# Deploy migrations then start server
CMD sh -c "npx prisma migrate deploy && node prisma/seed.js && node index.js"
