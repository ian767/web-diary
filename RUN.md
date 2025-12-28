# How to Run Web Diary

## Quick Start (Easiest Method)

Use the startup script:

```bash
cd /Users/red/projects/web-diary
./start.sh
```

This will:
- Install dependencies if needed
- Create `.env` file automatically
- Start both backend and frontend servers

## Manual Setup (Step by Step)

### Step 1: Start Backend Server

Open Terminal 1:

```bash
cd /Users/red/projects/web-diary/backend

# Install dependencies (first time only)
npm install

# Create .env file (first time only)
cat > .env << EOF
PORT=5000
JWT_SECRET=$(openssl rand -hex 32)
NODE_ENV=development
EOF

# Start backend server
npm start
```

Backend will run on: **http://localhost:5000**

### Step 2: Start Frontend Server

Open Terminal 2:

```bash
cd /Users/red/projects/web-diary/frontend

# Install dependencies (first time only)
npm install

# Start frontend server
npm start
```

Frontend will run on: **http://localhost:3000**

The browser should automatically open to http://localhost:3000

## Access the Application

1. Open your browser and go to: **http://localhost:3000**
2. Click "Register" to create a new account
3. Login with your credentials
4. Start creating diary entries and tasks!

## Troubleshooting

### Port Already in Use
If you get "port already in use" error:
- Backend: Change `PORT=5000` to another port (e.g., `PORT=5001`) in `backend/.env`
- Frontend: React will prompt you to use a different port (press `y`)

### Database Issues
The database is created automatically on first run. If you need to reset:
```bash
cd backend
rm diary.db
npm start
```

### Dependencies Not Installed
Make sure you've run `npm install` in both `backend/` and `frontend/` directories.

## Stopping the Application

- **Using startup script**: Press `Ctrl+C` in the terminal
- **Manual method**: Press `Ctrl+C` in both terminal windows



