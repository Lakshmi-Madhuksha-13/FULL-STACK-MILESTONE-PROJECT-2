# ==========================================
# 1. BUILD FRONTEND STATIC ASSETS
# ==========================================
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ==========================================
# 2. BUILD CONSOLIDATED BACKEND MONOLITH
# ==========================================
FROM maven:3.9-eclipse-temurin-17-alpine AS backend-build
WORKDIR /app

# Copy pom.xml and source code of the monolith
COPY standalone-app/pom.xml ./standalone-app/
COPY standalone-app/src ./standalone-app/src

# Copy built frontend assets into the Maven build context
COPY --from=frontend-build /app/dist ./frontend/dist

# Build the monolithic JAR (which copies assets from ../frontend/dist based on pom.xml configuration)
RUN mvn -f standalone-app/pom.xml clean package -DskipTests

# ==========================================
# 3. FINAL RUNTIME IMAGE
# ==========================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built jar from the backend-build stage
COPY --from=backend-build /app/standalone-app/target/standalone-app-0.0.1-SNAPSHOT.jar app.jar

# Expose the app port
EXPOSE 8080

# Run the standalone JAR
ENTRYPOINT ["java", "-jar", "app.jar"]
