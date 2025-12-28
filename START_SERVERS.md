# How to Start the Web Diary Servers

## Quick Start (Easiest Method)

From the `web-diary` directory, run:

```bash
./server-control.sh start
```

This will start both backend and frontend servers automatically.

## Server Control Commands

All commands should be run from the `web-diary` directory:

### Start Both Servers
```bash
./server-control.sh start
```

### Check Server Status
```bash
./server-control.sh status
```

### Stop Both Servers
```bash
./server-control.sh stop
```

### Restart Both Servers
```bash
./server-control.sh restart
```

## Server URLs

Once started, the servers will be available at:
- **Frontend**: http://localhost:3000 (opens automatically in browser)
- **Backend**: http://localhost:5001

## Manual Start (Alternative Method)

If the script doesn't work, you can start servers manually:

### Start Backend
```bash
cd backend
npm start
```

### Start Frontend (in a new terminal)
```bash
cd frontend
npm start
```

## Troubleshooting

### Port Already in Use Error

If you see "EADDRINUSE" error, it means a server is already running. Try:

1. Check what's running:
   ```bash
   ./server-control.sh status
   ```

2. Stop all servers:
   ```bash
   ./server-control.sh stop
   ```

3. If that doesn't work, kill processes manually:
   ```bash
   # Kill backend (port 5001)
   lsof -ti:5001 | xargs kill -9
   
   # Kill frontend (port 3000)
   lsof -ti:3000 | xargs kill -9
   ```

4. Then start again:
   ```bash
   ./server-control.sh start
   ```

### View Server Logs

To see what's happening with the servers:

```bash
# Backend logs
tail -f backend.log

# Frontend logs
tail -f frontend.log
```

### Server Keeps Crashing

If servers keep stopping:

1. Check the logs for errors:
   ```bash
   tail -20 backend.log
   tail -20 frontend.log
   ```

2. Make sure you're in the correct directory:
   ```bash
   cd /Users/red/projects/web-diary
   ```

3. Check if dependencies are installed:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

## Quick Reference Card

Save this for quick access:

```bash
# Start servers
cd /Users/red/projects/web-diary && ./server-control.sh start

# Check status
cd /Users/red/projects/web-diary && ./server-control.sh status

# Stop servers
cd /Users/red/projects/web-diary && ./server-control.sh stop

# Restart servers
cd /Users/red/projects/web-diary && ./server-control.sh restart
```


