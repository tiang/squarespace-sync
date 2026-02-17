FROM node:20-alpine AS base
# Install OpenSSL required by Prisma client on Alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./

FROM base AS dev
RUN npm install
COPY . .
RUN npx prisma generate
CMD ["sh", "-c", "npx prisma generate && npm run dev"]

FROM base AS prod
RUN npm install --omit=dev
COPY . .
RUN npx prisma generate
CMD ["npm", "start"]
