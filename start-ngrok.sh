#!/bin/bash

# Quick ngrok starter script

echo "🌐 Starting ngrok tunnels for Web Diary..."
echo ""
echo "This will open TWO terminal windows for ngrok tunnels."
echo ""
echo "Press Enter to continue, or Ctrl+C to cancel..."
read

# Get the project directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start frontend tunnel in new terminal
echo "🚀 Starting frontend tunnel (port 3000)..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_DIR' && echo 'Frontend ngrok tunnel - Port 3000' && ngrok http 3000\""
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    gnome-terminal -- bash -c "cd '$PROJECT_DIR' && echo 'Frontend ngrok tunnel - Port 3000' && ngrok http 3000; exec bash" 2>/dev/null || \
    xterm -e "cd '$PROJECT_DIR' && ngrok http 3000" 2>/dev/null || \
    echo "Please open a terminal and run: ngrok http 3000"
fi

sleep 2

# Start backend tunnel in new terminal
echo "🚀 Starting backend tunnel (port 5001)..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_DIR' && echo 'Backend ngrok tunnel - Port 5001' && ngrok http 5001\""
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    gnome-terminal -- bash -c "cd '$PROJECT_DIR' && echo 'Backend ngrok tunnel - Port 5001' && ngrok http 5001; exec bash" 2>/dev/null || \
    xterm -e "cd '$PROJECT_DIR' && ngrok http 5001" 2>/dev/null || \
    echo "Please open a terminal and run: ngrok http 5001"
fi

echo ""
echo "✅ Two terminal windows should have opened with ngrok tunnels"
echo ""
echo "📋 Next steps:"
echo "1. In the frontend ngrok terminal, copy the HTTPS URL (starts with https://)"
echo "2. In the backend ngrok terminal, copy the HTTPS URL (starts with https://)"
echo "3. Update frontend .env file with backend URL:"
echo "   cd $PROJECT_DIR/frontend"
echo "   echo 'REACT_APP_API_URL=https://YOUR_BACKEND_NGROK_URL/api' > .env"
echo "4. Restart frontend: cd $PROJECT_DIR && ./server-control.sh restart"
echo "5. Access your site using the frontend ngrok URL!"
echo ""
echo "See NGROK_GUIDE.md for detailed instructions."


