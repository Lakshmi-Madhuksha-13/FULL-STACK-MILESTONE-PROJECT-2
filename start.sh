#!/bin/bash

echo "🚀 Starting Technical Fest Consolidated Services..."

# 1. Initialize MariaDB if data directory is empty
if [ ! -d "/app/mysql-data/mysql" ]; then
    echo "📦 Initializing MariaDB database..."
    mariadb-install-db --user=user --datadir=/app/mysql-data --auth-root-authentication-method=normal
fi

# 2. Start MariaDB in background
echo "🐬 Starting MariaDB server..."
mariadbd --datadir=/app/mysql-data --port=3306 --socket=/tmp/mysql.sock --bind-address=127.0.0.1 &

# Wait for database to start
echo "⏳ Waiting for MariaDB to become ready..."
until mysqladmin --socket=/tmp/mysql.sock ping --silent; do
    sleep 1
done

# Create the ticket_booking database
echo "🗄️ Ensuring database exists..."
mariadb --socket=/tmp/mysql.sock -e "CREATE DATABASE IF NOT EXISTS ticket_booking;"

# 3. Start Eureka Server
echo "🧬 Starting Eureka Registry Server..."
java -jar /app/eureka-server.jar > /tmp/eureka.log 2>&1 &

# Wait for Eureka (port 8761)
echo "⏳ Waiting for Eureka Server to boot..."
until curl -s http://localhost:8761/actuator/health >/dev/null; do
    sleep 2
done
echo "✅ Eureka Server is active."

# 4. Start Spring Boot Microservices
echo "⚙️ Starting User Service..."
java -Dspring.datasource.url=jdbc:mysql://localhost:3306/ticket_booking?useSSL=false -Dspring.datasource.username=root -Dspring.datasource.password= -jar /app/user-service.jar > /tmp/user-service.log 2>&1 &

echo "⚙️ Starting Event Service..."
java -Dspring.datasource.url=jdbc:mysql://localhost:3306/ticket_booking?useSSL=false -Dspring.datasource.username=root -Dspring.datasource.password= -jar /app/event-service.jar > /tmp/event-service.log 2>&1 &

echo "⚙️ Starting Booking Service..."
java -Dspring.datasource.url=jdbc:mysql://localhost:3306/ticket_booking?useSSL=false -Dspring.datasource.username=root -Dspring.datasource.password= -jar /app/booking-service.jar > /tmp/booking-service.log 2>&1 &

# 5. Start Nginx reverse proxy in foreground (keeps container alive)
echo "🌐 Starting Nginx Web Server on port 7860..."
nginx -g "daemon off; pid /tmp/nginx.pid;"
