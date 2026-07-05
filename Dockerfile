# ==========================================
# BUILD BACKEND MONOLITH (Maven only)
# The frontend/dist is pre-built and committed to the repo
# Spring Boot 4.x requires Java 21
# ==========================================
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /app

# Copy pom.xml first for dependency caching
COPY standalone-app/pom.xml ./standalone-app/pom.xml

# Copy the pre-built frontend dist assets
COPY frontend/dist ./frontend/dist

# Copy backend source code
COPY standalone-app/src ./standalone-app/src

# Build the monolithic JAR (pom.xml copies ../frontend/dist into the JAR)
RUN mvn -f standalone-app/pom.xml clean package -DskipTests

# ==========================================
# FINAL RUNTIME IMAGE
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=backend-build /app/standalone-app/target/standalone-app-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
