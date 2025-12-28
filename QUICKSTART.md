# Quick Start Guide

## Prerequisites
- Node.js (v14 or higher) and npm installed

## Quick Setup (Automated)

Run the startup script:
```bash
cd /Users/red/projects/web-diary
./start.sh
```

This will:
1. Install all dependencies
2. Create a `.env` file with a secure JWT secret
3. Start both backend and frontend servers

## Manual Setup

### Step 1: Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```bash
PORT=5000
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
```

Start backend:
```bash
npm start
```

### Step 2: Frontend Setup

In a new terminal:
```bash
cd frontend
npm install
npm start
```

## Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## First Steps

1. Open http://localhost:3000 in your browser
2. Click "Register" to create a new account
3. Login with your credentials
4. Start creating diary entries and tasks!

## Troubleshooting

### Port Already in Use
If port 5000 or 3000 is already in use:
- Backend: Change `PORT` in `backend/.env`
- Frontend: React will prompt to use a different port

### Database Issues
The database (`diary.db`) is created automatically on first run. If you need to reset:
```bash
cd backend
rm diary.db
npm start
```

### File Upload Issues
Make sure the `backend/uploads` directory exists and has write permissions.



