#!/bin/bash

# Setup script for mobile access on local network

echo "📱 Setting up Web Diary for mobile access..."
echo ""

# Get local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac
    LOCAL_IP=$(ipconfig getifaddr en0)
    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows (Git Bash)
    LOCAL_IP=$(ipconfig | grep "IPv4" | head -1 | awk '{print $NF}')
else
    echo "❌ Could not detect OS type. Please set LOCAL_IP manually."
    exit 1
fi

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not detect local IP address."
    echo "Please run: ifconfig (Mac/Linux) or ipconfig (Windows) and set it manually."
    exit 1
fi

echo "✅ Detected local IP: $LOCAL_IP"
echo ""

# Update frontend .env file
echo "📝 Updating frontend configuration..."
cd "$(dirname "$0")/frontend"

cat > .env << EOF
HOST=0.0.0.0
REACT_APP_API_URL=http://${LOCAL_IP}:5001/api
EOF

echo "✅ Frontend .env created with:"
echo "   HOST=0.0.0.0"
echo "   REACT_APP_API_URL=http://${LOCAL_IP}:5001/api"
echo ""

# Check if backend server.js needs update
cd "../backend"
if grep -q "app.listen(PORT, '0.0.0.0'" server.js 2>/dev/null; then
    echo "✅ Backend already configured for network access"
else
    echo "⚠️  Backend needs update - please check server.js listens on '0.0.0.0'"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📱 To access from your phone:"
echo "   1. Make sure your phone is on the same WiFi network"
echo "   2. Open browser on phone and go to:"
echo "      http://${LOCAL_IP}:3000"
echo ""
echo "🔄 Next steps:"
echo "   1. Restart the servers:"
echo "      ./server-control.sh restart"
echo ""
echo "   2. If connection fails, check:"
echo "      - Firewall settings (allow ports 3000 and 5001)"
echo "      - Both devices are on the same WiFi network"
echo "      - Servers are running: ./server-control.sh status"
echo ""

