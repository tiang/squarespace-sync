FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS dev
RUN npm install
COPY . .
RUN npx prisma generate
CMD ["npm", "run", "dev"]

FROM base AS prod
RUN npm install --omit=dev
COPY . .
RUN npx prisma generate
CMD ["npm", "start"]
