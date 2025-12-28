# ngrok Setup with Frontend Proxy (Single Tunnel)

This setup uses **only ONE ngrok tunnel** on port 3000. The frontend dev server proxies all API requests to the backend.

## ✅ Setup Complete!

The following changes have been made:

1. ✅ Added `"proxy": "http://127.0.0.1:5001"` to `frontend/package.json`
2. ✅ Updated API service to use relative URLs (`/api`) when proxy is configured
3. ✅ Updated upload URLs to use relative paths (empty base URL)
4. ✅ Backend routes are already prefixed with `/api`

## 🚀 How to Use

### Step 1: Start Your Servers

```bash
cd /Users/red/projects/web-diary
./server-control.sh start
```

### Step 2: Start ngrok (Only ONE tunnel needed!)

```bash
ngrok http 3000
```

You'll see:
```
Forwarding  https://abc123-def456.ngrok.io -> http://localhost:3000
```

**Copy the HTTPS URL** (the one starting with `https://`)

### Step 3: Update frontend .env file

Create/update `.env` file in the frontend directory:

```bash
cd /Users/red/projects/web-diary/frontend
cat > .env << 'EOF'
DANGEROUSLY_DISABLE_HOST_CHECK=true
HOST=0.0.0.0
EOF
```

**Important:** 
- `DANGEROUSLY_DISABLE_HOST_CHECK=true` allows ngrok domains (required!)
- `HOST=0.0.0.0` allows network access
- Do NOT set `REACT_APP_API_URL` - we want relative URLs for the proxy

### Step 4: Access from Your Phone

1. Open the ngrok HTTPS URL on your phone: `https://abc123-def456.ngrok.io`
2. All API calls will automatically go through the proxy to your backend
3. Login should work perfectly!

## 🔧 How It Works

- **Frontend** runs on `localhost:3000`
- **Backend** runs on `localhost:5001` (not exposed via ngrok)
- **ngrok** tunnels port 3000 only
- **CRA proxy** forwards all `/api/*` requests to `http://127.0.0.1:5001`
- **Uploads** at `/uploads/*` are also proxied to backend

### Request Flow:

```
Phone → ngrok URL (https://xxx.ngrok.io)
      → Frontend Dev Server (localhost:3000)
      → Proxy forwards /api/* → Backend (localhost:5001)
      → Proxy forwards /uploads/* → Backend (localhost:5001)
```

## ✅ Benefits

- ✅ Only ONE ngrok tunnel needed (free tier friendly!)
- ✅ Backend stays private (not exposed via ngrok)
- ✅ No need to set REACT_APP_API_URL
- ✅ Works automatically - no configuration needed
- ✅ All requests go through same domain (no CORS issues)

## 🆘 Troubleshooting

### Login still fails?

1. **Make sure frontend .env file is removed:**
   ```bash
   cd frontend
   rm -f .env
   ```

2. **Restart frontend server:**
   ```bash
   ./server-control.sh restart
   ```

3. **Check browser console** on your phone - look for API errors

4. **Verify proxy is working:**
   - Open browser DevTools on computer
   - Go to Network tab
   - Access `http://localhost:3000`
   - Try logging in
   - Check if `/api/auth/login` request goes through successfully

### Images not loading?

- Images should load via `/uploads/...` which the proxy forwards
- Check that backend is serving uploads correctly: `http://localhost:5001/uploads/...`

### Need to check proxy is configured?

Look in `frontend/package.json` - should have:
```json
"proxy": "http://127.0.0.1:5001"
```

---

That's it! Much simpler than running two ngrok tunnels. 🎉

