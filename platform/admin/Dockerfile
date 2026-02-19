FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS dev
# VITE_API_URL is read from process.env at dev-server startup (set via docker-compose.yml).
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS build
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
