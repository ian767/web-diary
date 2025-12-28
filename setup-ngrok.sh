#!/bin/bash

# ngrok Setup Script for Web Diary

echo "🌐 Setting up ngrok for public access..."
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed."
    echo ""
    echo "Installing ngrok..."
    
    # Check if Homebrew is installed
    if command -v brew &> /dev/null; then
        echo "Using Homebrew to install ngrok..."
        brew install ngrok/ngrok/ngrok
    else
        echo "⚠️  Homebrew not found. Please install ngrok manually:"
        echo "   1. Go to: https://ngrok.com/download"
        echo "   2. Download for macOS"
        echo "   3. Extract and move to /usr/local/bin/"
        echo ""
        echo "Or install Homebrew first: https://brew.sh"
        exit 1
    fi
fi

echo "✅ ngrok is installed"
echo ""

# Check if servers are running
BACKEND_RUNNING=$(lsof -ti:5001 2>/dev/null)
FRONTEND_RUNNING=$(lsof -ti:3000 2>/dev/null)

if [ -z "$BACKEND_RUNNING" ] || [ -z "$FRONTEND_RUNNING" ]; then
    echo "⚠️  Servers are not running. Starting them now..."
    cd "$(dirname "$0")"
    ./server-control.sh start
    echo "Waiting 5 seconds for servers to start..."
    sleep 5
else
    echo "✅ Servers are running"
fi

echo ""
echo "📋 Next steps:"
echo ""
echo "1. Open TWO new terminal windows/tabs"
echo ""
echo "2. In Terminal 1 - Start frontend tunnel:"
echo "   ngrok http 3000"
echo ""
echo "3. In Terminal 2 - Start backend tunnel:"
echo "   ngrok http 5001"
echo ""
echo "4. Copy the HTTPS URLs from both ngrok windows"
echo "   Frontend URL: https://xxxx-xxxx-xxxx.ngrok.io"
echo "   Backend URL:  https://yyyy-yyyy-yyyy.ngrok.io"
echo ""
echo "5. Update frontend .env file:"
echo "   cd /Users/red/projects/web-diary/frontend"
echo "   echo 'REACT_APP_API_URL=https://YOUR_BACKEND_NGROK_URL/api' > .env"
echo ""
echo "6. Restart frontend server"
echo ""
echo "7. Access your site from anywhere using the frontend ngrok URL!"
echo ""
echo "💡 Tip: Keep both ngrok terminals open while using the app"
echo ""

