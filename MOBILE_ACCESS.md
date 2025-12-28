# Accessing Web Diary from Smartphone

**You don't need to switch to Vite** - Create React App works perfectly fine! 

## 🚀 Quick Setup (Recommended)

1. Run the setup script:
   ```bash
   cd /Users/red/projects/web-diary
   ./setup-mobile-access.sh
   ```

2. Restart servers:
   ```bash
   ./server-control.sh restart
   ```

3. Access from your phone:
   - Make sure phone is on **same WiFi network** as your computer
   - Open browser and go to: `http://192.168.0.45:3000` (or your detected IP)

That's it! 🎉

---

## Detailed Instructions

## Option 1: Local Network Access (Same WiFi) - Recommended for Testing

This allows phones on the same WiFi network to access your site. Great for testing and development.

### Step 1: Find Your Computer's Local IP Address

**On Mac (your system):**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Or use:
```bash
ipconfig getifaddr en0
```

You'll get something like: `192.168.1.100` or `10.0.0.5`

**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter (e.g., `192.168.1.100`)

**On Linux:**
```bash
hostname -I
```

### Step 2: Update Frontend to Accept Network Connections

Create React App by default only listens on `localhost`. We need to make it accessible on your local network.

**Option A: Use Environment Variable (Recommended)**

1. Create a file `.env` in the `frontend` directory:
```bash
cd /Users/red/projects/web-diary/frontend
cat > .env << EOF
HOST=0.0.0.0
REACT_APP_API_URL=http://YOUR_LOCAL_IP:5001/api
EOF
```

Replace `YOUR_LOCAL_IP` with your actual IP (e.g., `192.168.1.100`).

2. Restart the frontend server:
```bash
npm start
```

**Option B: Modify package.json (Alternative)**

1. Edit `frontend/package.json`:
```json
"scripts": {
  "start": "HOST=0.0.0.0 react-scripts start",
  ...
}
```

2. Also create `.env` file with API URL:
```bash
cd frontend
echo "REACT_APP_API_URL=http://YOUR_LOCAL_IP:5001/api" > .env
```

### Step 3: Update Backend to Accept Network Connections

The backend needs to listen on `0.0.0.0` (all network interfaces).

1. Check your backend `server.js` - it should already be listening on the right host, but verify:
```javascript
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

2. If not, update it to listen on `0.0.0.0` instead of `localhost`.

### Step 4: Configure Firewall (if needed)

**On Mac:**
```bash
# Allow Node.js through firewall (System Preferences > Security & Privacy > Firewall)
# Or use terminal:
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

**On Windows:**
- Windows Firewall may prompt you - click "Allow access"
- Or manually allow Node.js in Windows Firewall settings

**On Linux:**
```bash
# Ubuntu/Debian
sudo ufw allow 3000
sudo ufw allow 5001
```

### Step 5: Access from Your Phone

1. Make sure your phone is on the **same WiFi network** as your computer
2. On your phone's browser, go to:
   ```
   http://YOUR_LOCAL_IP:3000
   ```
   (Replace `YOUR_LOCAL_IP` with your actual IP, e.g., `192.168.1.100`)

### Step 6: Update server-control.sh (Optional)

To make this easier, you can update the startup script to automatically set HOST. I'll create an updated version below.

---

## Option 2: Deploy to a Public Server (For Remote Access)

For access from anywhere (not just same WiFi), you need to deploy to a cloud service:

### Quick Deploy Options:

1. **Vercel** (Easiest, Free Tier)
   - Frontend: Connect GitHub repo to Vercel
   - Backend: Deploy to Railway, Render, or Heroku
   - Set environment variables

2. **Netlify + Railway**
   - Netlify for frontend (free)
   - Railway for backend (free tier available)

3. **DigitalOcean / AWS / Azure**
   - Full control, but more setup required

See `DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

---

## Quick Setup Script

I'll create a helper script that makes local network access easier. But for now, here's what to do:

1. Find your IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
   ```

2. Set environment variables:
   ```bash
   cd /Users/red/projects/web-diary/frontend
   echo "HOST=0.0.0.0" > .env
   echo "REACT_APP_API_URL=http://$(ipconfig getifaddr en0):5001/api" >> .env
   ```

3. Restart servers:
   ```bash
   cd /Users/red/projects/web-diary
   ./server-control.sh restart
   ```

4. Access from phone at: `http://YOUR_IP:3000`

---

## Troubleshooting

### Can't connect from phone?
- ✅ Make sure phone and computer are on same WiFi
- ✅ Check firewall settings
- ✅ Verify IP address is correct
- ✅ Check that servers are running: `./server-control.sh status`
- ✅ Try accessing from computer first: `http://YOUR_IP:3000`

### API calls failing?
- ✅ Check `REACT_APP_API_URL` in `.env` file
- ✅ Make sure backend is accessible: `http://YOUR_IP:5001/api`
- ✅ Check browser console on phone for errors

### IP Address keeps changing?
- ✅ Configure router to assign static IP to your computer
- ✅ Or use a service like ngrok for a stable URL (see below)

---

## Alternative: Use ngrok for Easy Testing

If you want a public URL without deploying (great for testing):

1. Install ngrok: https://ngrok.com/download
2. Start your servers normally
3. Run ngrok:
   ```bash
   ngrok http 3000
   ```
4. You'll get a public URL like: `https://abc123.ngrok.io`
5. Update API URL to use ngrok backend tunnel too

**Note:** ngrok free tier has limitations (session timeout, URL changes). Good for testing, not for production.

