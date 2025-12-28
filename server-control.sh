#!/bin/bash

# Web Diary Server Control Script

case "$1" in
  start)
    echo "🚀 Starting Web Diary servers..."
    
    # Start backend
    cd "$(dirname "$0")/backend"
    if [ ! -d "node_modules" ]; then
      echo "Installing backend dependencies..."
      npm install
    fi
    
    if [ ! -f ".env" ]; then
      echo "Creating .env file..."
      cat > .env << EOF
PORT=5001
JWT_SECRET=$(openssl rand -hex 32)
NODE_ENV=development
EOF
    fi
    
    npm start > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo "✅ Backend started (PID: $BACKEND_PID, log: backend.log)"
    echo $BACKEND_PID > ../backend.pid
    
    sleep 2
    
    # Start frontend
    cd "../frontend"
    if [ ! -d "node_modules" ]; then
      echo "Installing frontend dependencies..."
      npm install
    fi
    
    npm start > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "✅ Frontend started (PID: $FRONTEND_PID, log: frontend.log)"
    echo $FRONTEND_PID > ../frontend.pid
    
    echo ""
    echo "✨ Servers are running!"
    echo "   Backend:  http://localhost:5001"
    echo "   Frontend: http://localhost:3000"
    echo ""
    echo "View logs: tail -f backend.log or tail -f frontend.log"
    echo "Stop servers: ./server-control.sh stop"
    ;;
    
  stop)
    echo "🛑 Stopping Web Diary servers..."
    
    if [ -f "backend.pid" ]; then
      BACKEND_PID=$(cat backend.pid)
      if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "✅ Backend stopped (PID: $BACKEND_PID)"
      else
        echo "⚠️  Backend process not found"
      fi
      rm backend.pid
    fi
    
    if [ -f "frontend.pid" ]; then
      FRONTEND_PID=$(cat frontend.pid)
      if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "✅ Frontend stopped (PID: $FRONTEND_PID)"
      else
        echo "⚠️  Frontend process not found"
      fi
      rm frontend.pid
    fi
    
    # Also kill any processes on the ports (fallback)
    lsof -ti:5001 | xargs kill -9 2>/dev/null
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    
    echo "✅ All servers stopped"
    ;;
    
  status)
    echo "📊 Server Status:"
    echo ""
    
    if lsof -ti:5001 > /dev/null 2>&1; then
      echo "✅ Backend:  Running on http://localhost:5001"
    else
      echo "❌ Backend:  Not running"
    fi
    
    if lsof -ti:3000 > /dev/null 2>&1; then
      echo "✅ Frontend: Running on http://localhost:3000"
    else
      echo "❌ Frontend: Not running"
    fi
    ;;
    
  restart)
    echo "🔄 Restarting servers..."
    $0 stop
    sleep 2
    $0 start
    ;;
    
  *)
    echo "Usage: $0 {start|stop|status|restart}"
    echo ""
    echo "Commands:"
    echo "  start   - Start both backend and frontend servers"
    echo "  stop    - Stop both servers"
    echo "  status  - Check if servers are running"
    echo "  restart - Restart both servers"
    exit 1
    ;;
esac


