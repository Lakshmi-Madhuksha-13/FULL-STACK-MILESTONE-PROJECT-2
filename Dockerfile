# ==========================================
# 1. BUILD BACKEND SERVICES
# ==========================================
FROM maven:3.9-eclipse-temurin-17-alpine AS backend-build
WORKDIR /app

# Copy and build eureka-server
COPY eureka-server/pom.xml ./eureka-server/
COPY eureka-server/src ./eureka-server/src
RUN mvn -f eureka-server/pom.xml clean package -DskipTests

# Copy and build user-service
COPY user-service/pom.xml ./user-service/
COPY user-service/src ./user-service/src
RUN mvn -f user-service/pom.xml clean package -DskipTests

# Copy and build event-service
COPY event-service/pom.xml ./event-service/
COPY event-service/src ./event-service/src
RUN mvn -f event-service/pom.xml clean package -DskipTests

# Copy and build booking-service
COPY booking-service/pom.xml ./booking-service/
COPY booking-service/src ./booking-service/src
RUN mvn -f booking-service/pom.xml clean package -DskipTests

# ==========================================
# 2. BUILD FRONTEND STATIC ASSETS
# ==========================================
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ==========================================
# 3. FINAL RUNTIME IMAGE
# ==========================================
FROM ubuntu:22.04

# Avoid prompts during package installations
ENV DEBIAN_FRONTEND=noninteractive

# Install Java 17 JRE, MariaDB (MySQL), Nginx, and tools
RUN apt-get update && apt-get install -y \
    openjdk-17-jre-headless \
    mariadb-server \
    nginx \
    curl \
    gettext-base \
    && rm -rf /var/lib/apt/lists/*

# Create app user (Hugging Face runs as user 1000)
RUN useradd -m -u 1000 user
WORKDIR /app

# Copy built jars
COPY --from=backend-build /app/eureka-server/target/*.jar ./eureka-server.jar
COPY --from=backend-build /app/user-service/target/*.jar ./user-service.jar
COPY --from=backend-build /app/event-service/target/*.jar ./event-service.jar
COPY --from=backend-build /app/booking-service/target/*.jar ./booking-service.jar

# Copy built frontend assets
COPY --from=frontend-build /app/dist /var/www/html

# Copy configurations
COPY nginx.conf /etc/nginx/sites-available/default
COPY start.sh ./start.sh

# Set up directories and permissions for user 1000
RUN mkdir -p /app/mysql-data /var/lib/mysql /var/run/mysqld /var/log/mysql /var/log/nginx /var/lib/nginx \
    && chown -R user:user /app /var/lib/mysql /var/run/mysqld /var/log/mysql /var/log/nginx /var/lib/nginx /var/www/html /etc/nginx/sites-available/default \
    && chmod +x ./start.sh

USER user
EXPOSE 7860
ENTRYPOINT ["./start.sh"]
