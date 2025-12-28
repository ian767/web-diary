# ngrok Troubleshooting Guide

## ✅ Fixed: "Invalid Host Header" Error

If you see "Invalid Host Header" error when accessing via ngrok, the `.env` file needs to be configured correctly.

### Solution Applied:

The `.env` file in `frontend/` directory has been updated to:

```
DANGEROUSLY_DISABLE_HOST_CHECK=true
HOST=0.0.0.0
```

**Important Notes:**
- ✅ `DANGEROUSLY_DISABLE_HOST_CHECK=true` - Required to allow ngrok domains
- ✅ `HOST=0.0.0.0` - Allows network access
- ❌ **Do NOT** set `REACT_APP_API_URL` - We want relative URLs for proxy to work

### After Updating .env:

**You must restart the frontend server:**

```bash
cd /Users/red/projects/web-diary
./server-control.sh restart
```

Or just restart the frontend:
```bash
# Stop frontend
lsof -ti:3000 | xargs kill

# Start frontend again
cd frontend
npm start
```

---

## Common Issues

### 1. "Invalid Host Header" Error

**Symptom:** Cannot access site via ngrok URL, see error in browser console

**Fix:** 
- Make sure `.env` has `DANGEROUSLY_DISABLE_HOST_CHECK=true`
- Restart frontend server
- Make sure `.env` does NOT have `REACT_APP_API_URL` set

### 2. API Calls Fail (404 or Network Error)

**Symptom:** Login fails, API requests return 404

**Fix:**
- Check that `package.json` has `"proxy": "http://127.0.0.1:5001"`
- Make sure `.env` does NOT have `REACT_APP_API_URL` set
- Verify backend is running: `./server-control.sh status`

### 3. Images Not Loading

**Symptom:** Uploaded images don't display

**Fix:**
- Images should load via `/uploads/...` path
- Check browser console for 404 errors
- Verify backend serves uploads: `http://localhost:5001/uploads/...`

### 4. ngrok Shows "Tunnel session expired"

**Symptom:** ngrok free tier session timeout

**Fix:**
- Just restart ngrok: `ngrok http 3000`
- Get new URL and use that one
- Free tier has session timeouts - this is normal

---

## Quick Checklist

Before accessing via ngrok, verify:

- [ ] Frontend `.env` has `DANGEROUSLY_DISABLE_HOST_CHECK=true`
- [ ] Frontend `.env` has `HOST=0.0.0.0`
- [ ] Frontend `.env` does NOT have `REACT_APP_API_URL`
- [ ] `package.json` has `"proxy": "http://127.0.0.1:5001"`
- [ ] Frontend server is running (restarted after .env change)
- [ ] Backend server is running
- [ ] ngrok tunnel is active: `ngrok http 3000`
- [ ] Using HTTPS URL from ngrok (not HTTP)

---

## Current .env Configuration

Your `frontend/.env` should look like this:

```
DANGEROUSLY_DISABLE_HOST_CHECK=true
HOST=0.0.0.0
```

**That's it!** No other variables needed when using proxy.

