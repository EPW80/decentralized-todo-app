#!/bin/bash

echo "🛑 Stopping Decentralized Todo App Development Environment"
echo "=========================================================="

if [ -f /tmp/dev-pids.txt ]; then
  while read pid; do
    if ps -p $pid > /dev/null 2>&1; then
      echo "Stopping process $pid..."
      kill $pid 2>/dev/null
    fi
  done < /tmp/dev-pids.txt
  rm /tmp/dev-pids.txt
fi

# Cleanup any remaining processes on our ports
lsof -ti:8545 | xargs kill -9 2>/dev/null
lsof -ti:5000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "✓ All services stopped"
echo "=========================================================="
