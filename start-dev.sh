#!/bin/bash

echo "🚀 Starting Decentralized Todo App Development Environment"
echo "=========================================================="
echo ""

# Kill any existing processes on the ports we need
echo "Cleaning up existing processes..."
lsof -ti:8545 | xargs kill -9 2>/dev/null
lsof -ti:5000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start Hardhat node in background
echo ""
echo "Step 1/5: Starting Hardhat local blockchain..."
cd contracts && npx hardhat node > /tmp/hardhat.log 2>&1 &
HARDHAT_PID=$!
echo "✓ Hardhat node started (PID: $HARDHAT_PID)"

# Wait for Hardhat to be ready
echo "Waiting for Hardhat node to initialize..."
sleep 5

# Deploy contracts and sync frontend config
echo ""
echo "Step 2/5: Deploying smart contracts..."
cd /home/erikwilliams/dev/decentralized-todo-app/contracts
npm run deploy:sync

# Start backend in background
echo ""
echo "Step 3/5: Starting backend server..."
cd /home/erikwilliams/dev/decentralized-todo-app
npm run dev:backend > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "✓ Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
sleep 5

# Start frontend in background
echo ""
echo "Step 4/5: Starting frontend development server..."
npm run dev:frontend > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✓ Frontend started (PID: $FRONTEND_PID)"

# Save PIDs for cleanup
echo "$HARDHAT_PID" > /tmp/dev-pids.txt
echo "$BACKEND_PID" >> /tmp/dev-pids.txt
echo "$FRONTEND_PID" >> /tmp/dev-pids.txt

echo ""
echo "✅ All services started successfully!"
echo ""
echo "=========================================================="
echo "📱 Your app is ready:"
echo "   Frontend:    http://localhost:5173"
echo "   Backend:     http://localhost:5000"
echo "   Blockchain:  http://localhost:8545"
echo ""
echo "📋 Logs:"
echo "   Hardhat:  tail -f /tmp/hardhat.log"
echo "   Backend:  tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""
echo "🛑 To stop all services, run: ./stop-dev.sh"
echo "=========================================================="
