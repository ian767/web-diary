# ngrok Setup Guide - Step by Step

## ✅ Step 1: Install ngrok (Already Done!)

ngrok is now installed. You can verify with:
```bash
ngrok version
```

---

## 🚀 Step 2: Start ngrok Tunnels

You need **TWO terminal windows** - one for frontend, one for backend.

### Terminal 1 - Frontend Tunnel:
```bash
ngrok http 3000
```

You'll see something like:
```
Forwarding  https://abc123-def456.ngrok.io -> http://localhost:3000
```

**Copy the HTTPS URL** (the one starting with `https://`)

### Terminal 2 - Backend Tunnel:
```bash
ngrok http 5001
```

You'll see something like:
```
Forwarding  https://xyz789-uvw012.ngrok.io -> http://localhost:5001
```

**Copy the HTTPS URL** (the one starting with `https://`)

---

## ⚙️ Step 3: Update Frontend Configuration

1. **Update the frontend .env file:**
   ```bash
   cd /Users/red/projects/web-diary/frontend
   echo "REACT_APP_API_URL=https://YOUR_BACKEND_NGROK_URL/api" > .env
   ```
   
   Replace `YOUR_BACKEND_NGROK_URL` with the backend ngrok URL from Terminal 2.
   
   Example:
   ```bash
   echo "REACT_APP_API_URL=https://xyz789-uvw012.ngrok.io/api" > .env
   ```

2. **Restart the frontend server:**
   ```bash
   cd /Users/red/projects/web-diary
   ./server-control.sh restart
   ```

---

## 🌐 Step 4: Access Your Site

1. **Get your frontend ngrok URL** from Terminal 1 (the `https://` URL)

2. **Open that URL in any browser, anywhere:**
   - On your phone (mobile data or any WiFi)
   - On another computer
   - Share with friends/family

Example: `https://abc123-def456.ngrok.io`

---

## 📝 Quick Reference

**Frontend ngrok URL:** `https://xxxx-xxxx-xxxx.ngrok.io`  
**Backend ngrok URL:** `https://yyyy-yyyy-yyyy.ngrok.io`

**Frontend .env should contain:**
```
REACT_APP_API_URL=https://yyyy-yyyy-yyyy.ngrok.io/api
```

---

## ⚠️ Important Notes

1. **Keep both ngrok terminals open** - closing them will stop the tunnels
2. **URLs change** - Each time you restart ngrok, you get new URLs
3. **Free tier limitations:**
   - Session timeout after inactivity
   - URL changes on restart
   - Good for testing, not production

---

## 🔧 Troubleshooting

### Can't connect?
- ✅ Make sure both ngrok terminals are running
- ✅ Check that servers are running: `./server-control.sh status`
- ✅ Verify .env file has correct backend URL
- ✅ Make sure you're using HTTPS URLs (not HTTP)

### API calls failing?
- ✅ Check browser console for errors
- ✅ Verify `REACT_APP_API_URL` in frontend/.env matches backend ngrok URL
- ✅ Make sure backend ngrok tunnel is running

### ngrok session expired?
- Just restart the ngrok commands in both terminals
- Update the .env file with new backend URL
- Restart frontend server

---

## 🎯 Next Steps

Once you have ngrok working, you can:
- Share the frontend URL with anyone
- Access from any device, anywhere
- Test on mobile devices using mobile data

For permanent deployment, see `PUBLIC_ACCESS.md` for Vercel + Railway setup.

