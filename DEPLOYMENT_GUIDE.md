# Deployment Guide

This guide walks you through deploying the Web Diary application to production.

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Railway or Render account (for backend)
- PostgreSQL database (Railway, Supabase, or Neon)

## Option 1: Vercel (Frontend) + Railway (Backend) - Recommended

### Step 1: Prepare Backend for Production

#### 1.1 Update Database to PostgreSQL

Create `backend/database-postgres.js`:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Similar structure to SQLite database.js but using PostgreSQL
// Update all queries to use pool.query() instead of db.run/get/all
```

#### 1.2 Update Environment Variables

Create `backend/.env.production`:
```
PORT=5001
JWT_SECRET=your-production-secret-key
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
```

#### 1.3 Update package.json

Add PostgreSQL dependency:
```bash
cd backend
npm install pg
```

### Step 2: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository
   - Select the `backend` folder

3. **Configure Environment Variables**
   - Add `JWT_SECRET` (generate a strong secret)
   - Add `DATABASE_URL` (Railway will provide PostgreSQL)
   - Add `NODE_ENV=production`

4. **Deploy**
   - Railway will automatically detect Node.js and deploy
   - Note the deployment URL (e.g., `https://your-app.railway.app`)

### Step 3: Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the `frontend` folder

3. **Configure Environment Variables**
   - Add `REACT_APP_API_URL` = `https://your-app.railway.app/api`

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - You'll get a URL like `https://your-app.vercel.app`

### Step 4: Update CORS Settings

In `backend/server.js`, update CORS:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-app.vercel.app',
  credentials: true
}));
```

## Option 2: Full Stack on Render

### Step 1: Prepare for Render

1. **Update start script** in `backend/package.json`:
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

2. **Create `render.yaml`** in project root:

```yaml
services:
  - type: web
    name: web-diary-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: web-diary-db
          property: connectionString

  - type: web
    name: web-diary-frontend
    env: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: ./frontend/build
    envVars:
      - key: REACT_APP_API_URL
        value: https://web-diary-backend.onrender.com/api

databases:
  - name: web-diary-db
    databaseName: webdiary
    user: webdiary
```

### Step 2: Deploy to Render

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - New → PostgreSQL
   - Note the connection string

3. **Deploy Backend**
   - New → Web Service
   - Connect GitHub repo
   - Select backend folder
   - Add environment variables
   - Deploy

4. **Deploy Frontend**
   - New → Static Site
   - Connect GitHub repo
   - Select frontend folder
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/build`
   - Add environment variable: `REACT_APP_API_URL`

## Option 3: Docker Deployment

### Create Dockerfile for Backend

`backend/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5001

CMD ["node", "server.js"]
```

### Create Dockerfile for Frontend

`frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

`docker-compose.yml`:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5001:5001"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/webdiary
      - JWT_SECRET=your-secret
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=webdiary
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## File Storage Setup

### Option 1: Cloudinary (Recommended for Images)

1. **Sign up** at https://cloudinary.com
2. **Install SDK**:
```bash
cd backend
npm install cloudinary multer-storage-cloudinary
```

3. **Update upload route** to use Cloudinary instead of local storage

### Option 2: AWS S3

1. **Create S3 bucket**
2. **Install AWS SDK**:
```bash
cd backend
npm install aws-sdk multer-s3
```

3. **Configure S3** in upload routes

## Database Migration from SQLite to PostgreSQL

1. **Export SQLite data**:
```bash
sqlite3 diary.db .dump > backup.sql
```

2. **Convert to PostgreSQL** (manual or use migration tool)

3. **Import to PostgreSQL**:
```bash
psql -d webdiary -f backup.sql
```

## Post-Deployment Checklist

- [ ] Test registration and login
- [ ] Test creating diary entries
- [ ] Test file uploads
- [ ] Verify HTTPS is working
- [ ] Check CORS settings
- [ ] Test on mobile devices
- [ ] Set up error monitoring (Sentry)
- [ ] Configure custom domain (optional)
- [ ] Set up backups
- [ ] Document API endpoints

## Monitoring & Maintenance

### Error Tracking
- Set up Sentry for error tracking
- Monitor application logs

### Performance
- Use Vercel Analytics (for frontend)
- Monitor API response times

### Backups
- Regular database backups
- Automated backup schedule

## Custom Domain Setup

### Vercel
1. Go to project settings
2. Add your domain
3. Update DNS records as instructed

### Render
1. Go to service settings
2. Add custom domain
3. Update DNS records

---

## Quick Start Commands

```bash
# Local development
cd backend && npm start
cd frontend && npm start

# Production build
cd frontend && npm run build

# Docker
docker-compose up -d
```

For detailed implementation of any step, let me know!




