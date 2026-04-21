# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage — Nginx SPA server
FROM nginx:alpine
# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom Nginx config with SPA routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
