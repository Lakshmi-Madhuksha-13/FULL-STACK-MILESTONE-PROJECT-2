@echo off
echo =======================================================================
echo   Technical Fest Standalone Application - Build and Launch Script 🚀
echo =======================================================================
echo.

echo [1/3] Compiling React frontend...
cd frontend
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend compilation failed!
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo [2/3] Compiling and packaging backend monolith JAR...
call mvn -f standalone-app/pom.xml clean package -DskipTests
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend compilation failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Launching Standalone Application...
echo.
echo The app will start on: http://localhost:8080/
echo Press Ctrl+C in this terminal window to stop the server.
echo.
java -jar standalone-app/target/standalone-app-0.0.1-SNAPSHOT.jar
pause
