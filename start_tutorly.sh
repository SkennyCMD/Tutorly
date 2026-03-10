#!/bin/bash

# Tutorly Startup Script

# Function to handle cleanup on exit
cleanup() {
    echo "Stopping services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C)
trap cleanup SIGINT


# Function to check and free a port
check_and_free_port() {
    local port=$1
    local name=$2
    pid=$(lsof -ti :$port)
    if [ -n "$pid" ]; then
        echo "Port $port ($name) is in use by PID $pid. Killing it..."
        kill -9 $pid
    fi
}

echo "========================================"
echo "   Starting Tutorly Infrastructure"
echo "========================================"

# 0. Cleanup ports
echo "[0/3] Checking ports..."
check_and_free_port 5432 "PostgreSQL"
check_and_free_port 8443 "Java Backend"
check_and_free_port 3000 "Node Frontend (HTTP)"
check_and_free_port 3443 "Node Frontend (HTTPS)"


# 1. Start Database
echo "[1/3] Starting Database (Docker)..."
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "Error starting Docker containers. Make sure Docker is running."
    exit 1
fi
echo "Database started."

# Wait for DB to be potentially ready (simple wait)
echo "Waiting 5 seconds for Database to initialize..."
sleep 5

# 2. Start Backend (Java)
echo "[2/3] Starting Java Backend..."
cd Java/backend-api
# Check if mvnw is executable
chmod +x mvnw
# Run in background
./mvnw spring-boot:run &
BACKEND_PID=$!
echo "Backend starting with PID $BACKEND_PID"
cd ../..

# 3. Start Frontend (Node.js)
echo "[3/3] Starting Node.js Frontend..."
cd Nodejs
# Ensure dependencies are installed (fast if already done)
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Ensure SSL certificates exist for HTTPS
if [ ! -f "ssl/certificate.pem" ] || [ ! -f "ssl/private-key.pem" ]; then
    echo "SSL certificates not found. Generating self-signed certificates..."
    chmod +x generate-ssl-cert.sh
    ./generate-ssl-cert.sh
fi

# Enable HTTPS
export USE_HTTPS=true

# Run in background
npm start &
FRONTEND_PID=$!
echo "Frontend starting with PID $FRONTEND_PID"
cd ..

echo "========================================"
echo "   All services launched!"
echo "   Backend: https://localhost:8443"
echo "   Frontend: https://localhost:3443 (HTTP: http://localhost:3000)"
echo "========================================"
echo "Press Ctrl+C to stop all services."

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
