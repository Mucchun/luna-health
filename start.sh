#!/bin/bash
echo "Starting Luna Health..."

# Start backend
cd "$(dirname "$0")/backend"
# Load .env if it exists
[ -f "$(dirname "$0")/.env" ] && export $(grep -v '^#' "$(dirname "$0")/.env" | xargs)
node server.js &
BACKEND_PID=$!

# Start frontend
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Luna Health is running!"
echo "  App:  http://localhost:5173"
echo "  API:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'; exit" INT TERM
wait
