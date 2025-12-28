# Server Control Guide

This guide explains how to start and stop the backend and frontend servers for the Web Diary application.

## Quick Reference

### Start Both Servers (Recommended)
```bash
cd /Users/red/projects/web-diary
./start.sh
```

### Stop Servers
Press `Ctrl+C` in the terminal where the servers are running.

## Manual Control

### Backend Server (Port 5001)

**Start:**
```bash
cd /Users/red/projects/web-diary/backend
npm start
```

**Stop:**
- Press `Ctrl+C` in the terminal where it's running
- Or find and kill the process:
```bash
lsof -ti:5001 | xargs kill
```

**Check if running:**
```bash
lsof -ti:5001 && echo "Backend is running" || echo "Backend is not running"
```

### Frontend Server (Port 3000)

**Start:**
```bash
cd /Users/red/projects/web-diary/frontend
npm start
```

**Stop:**
- Press `Ctrl+C` in the terminal where it's running
- Or find and kill the process:
```bash
lsof -ti:3000 | xargs kill
```

**Check if running:**
```bash
lsof -ti:3000 && echo "Frontend is running" || echo "Frontend is not running"
```

## Starting Both Servers (Two Terminals)

### Terminal 1 - Backend:
```bash
cd /Users/red/projects/web-diary/backend
npm start
```

### Terminal 2 - Frontend:
```bash
cd /Users/red/projects/web-diary/frontend
npm start
```

## Using the Startup Script

The easiest way to start both servers:

```bash
cd /Users/red/projects/web-diary
./start.sh
```

This script will:
- Check if dependencies are installed
- Create `.env` file if needed
- Start backend server in background
- Start frontend server
- Show you both server URLs

Press `Ctrl+C` to stop both servers.

## Troubleshooting

### Port Already in Use

If you get "port already in use" error:

**Backend (port 5001):**
```bash
# Kill the process using port 5001
lsof -ti:5001 | xargs kill -9

# Then start again
cd backend && npm start
```

**Frontend (port 3000):**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Then start again
cd frontend && npm start
```

### Check Server Status

Check both servers:
```bash
# Backend
lsof -ti:5001 && echo "✅ Backend running" || echo "❌ Backend not running"

# Frontend
lsof -ti:3000 && echo "✅ Frontend running" || echo "❌ Frontend not running"
```

### Server Won't Start

1. **Check Node.js is installed:**
   ```bash
   node --version
   npm --version
   ```

2. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Check for errors in terminal output**

4. **Verify ports are free:**
   ```bash
   lsof -ti:5001  # Should return nothing if free
   lsof -ti:3000  # Should return nothing if free
   ```

## Development Mode

### Backend with Auto-Reload:
```bash
cd backend
npm run dev
```
(Requires nodemon - installed as dev dependency)

### Frontend with Hot Reload:
```bash
cd frontend
npm start
```
(React automatically reloads on file changes)

## Production Build

### Build Frontend:
```bash
cd frontend
npm run build
```

### Serve Backend Only:
```bash
cd backend
npm start
```

Serve the built frontend files separately (e.g., with nginx, or serve the `frontend/build` folder).

## Quick Commands Summary

| Action | Command |
|--------|---------|
| Start both | `./start.sh` |
| Start backend | `cd backend && npm start` |
| Start frontend | `cd frontend && npm start` |
| Stop all | `Ctrl+C` or kill processes |
| Kill backend | `lsof -ti:5001 \| xargs kill` |
| Kill frontend | `lsof -ti:3000 \| xargs kill` |
| Check status | `lsof -ti:5001 && lsof -ti:3000` |


