# Production Deployment Guide

This guide explains how to deploy the Web Diary app to production using Vercel (frontend) and Render (backend).

## Architecture

- **Frontend**: Vercel (static build from Create React App)
- **Backend**: Render (Node/Express API)
- **Database**: PostgreSQL (Render or Supabase)
- **Storage**: S3-compatible (AWS S3, Cloudflare R2, or Supabase Storage)

---

## Prerequisites

1. **Accounts**:
   - Vercel account (free): https://vercel.com
   - Render account (free tier): https://render.com
   - PostgreSQL database (Render PostgreSQL or Supabase)
   - S3-compatible storage (AWS S3, Cloudflare R2, or Supabase Storage)

2. **GitHub repository** with your code

---

## Step 1: Database Setup (PostgreSQL)

### Option A: Render PostgreSQL

1. In Render dashboard, create a new **PostgreSQL** database
2. Copy the **Internal Database URL** (format: `postgresql://user:pass@dpg-xxx.oregon-postgres.render.com/dbname`)
3. Note: Use the "Internal Database URL" for Render services on the same account

### Option B: Supabase

1. Create a new project at https://supabase.com
2. Go to Settings → Database
3. Copy the **Connection string** (format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)

---

## Step 2: Storage Setup (S3-Compatible)

### Option A: AWS S3

1. Create an S3 bucket in AWS Console
2. Enable **Public read** access (or use signed URLs for private)
3. Get your **Access Key ID** and **Secret Access Key**
4. Note your **region** (e.g., `us-east-1`)

### Option B: Cloudflare R2

1. Create an R2 bucket in Cloudflare Dashboard
2. Create API token with R2 permissions
3. Get **Endpoint URL** (format: `https://[account-id].r2.cloudflarestorage.com`)
4. Get **Access Key ID** and **Secret Access Key**

### Option C: Supabase Storage

1. In Supabase project, go to Storage
2. Create a public bucket (e.g., `diary-uploads`)
3. Get **Storage URL** and API keys from Settings → API

---

## Step 3: Backend Deployment (Render)

1. **Create new Web Service** in Render:
   - Connect your GitHub repository
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`

2. **Set Environment Variables** in Render:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://user:pass@host:port/database
   APP_BASE_URL=https://your-frontend.vercel.app
   CORS_ORIGIN=https://your-frontend.vercel.app
   
   # Storage Configuration
   STORAGE_TYPE=s3
   STORAGE_ENDPOINT=                    # Leave empty for AWS S3
   STORAGE_REGION=us-east-1            # Your S3 region
   STORAGE_BUCKET=your-bucket-name
   STORAGE_ACCESS_KEY_ID=your-access-key
   STORAGE_SECRET_ACCESS_KEY=your-secret-key
   STORAGE_PUBLIC_URL=                 # Optional: Custom CDN URL
   
   # JWT Secret (generate with: openssl rand -base64 32)
   JWT_SECRET=your-jwt-secret-here
   ```

3. **Deploy**:
   - Render will automatically deploy on git push
   - Copy your backend URL (e.g., `https://web-diary-backend.onrender.com`)

---

## Step 4: Frontend Deployment (Vercel)

1. **Import Project** in Vercel:
   - Connect your GitHub repository
   - Root Directory: `frontend`
   - Framework Preset: **Create React App**
   - Build Command: `npm run build`
   - Output Directory: `build`

2. **Set Environment Variables** in Vercel:
   ```
   REACT_APP_API_BASE_URL=https://your-backend.onrender.com
   ```
   **Note**: Use the backend domain only (no `/api` prefix). All API endpoints explicitly include `/api/`.

3. **Deploy**:
   - Vercel will automatically build and deploy
   - Copy your frontend URL (e.g., `https://web-diary.vercel.app`)

4. **Update Backend CORS**:
   - Go back to Render backend settings
   - Update `CORS_ORIGIN` to match your Vercel URL
   - Update `APP_BASE_URL` to match your Vercel URL
   - Redeploy backend

---

## Step 5: Verify Deployment

1. **Health Check**:
   - Visit: `https://your-backend.onrender.com/api/health`
   - Should return: `{"status":"OK","message":"Web Diary API is running"}`

2. **Frontend**:
   - Visit your Vercel URL
   - Should load the login page

3. **Test Registration/Login**:
   - Create a new account
   - Login should work

4. **Test File Upload**:
   - Create a diary entry with a photo
   - Verify photo displays correctly (should load from S3)

---

## Environment Variables Reference

### Frontend (.env or Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_BASE_URL` | Backend domain only (no /api prefix, required in production) | `https://backend.onrender.com` |

### Backend (Render)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (Render sets this automatically) | No |
| `NODE_ENV` | Environment (set to `production`) | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `APP_BASE_URL` | Frontend URL (for generating share links) | Yes |
| `CORS_ORIGIN` | Allowed frontend origins (comma-separated) | Recommended |
| `STORAGE_TYPE` | Storage type (`s3`) | Yes |
| `STORAGE_ENDPOINT` | S3 endpoint (empty for AWS, custom for R2) | Optional |
| `STORAGE_REGION` | AWS region | Yes |
| `STORAGE_BUCKET` | Bucket name | Yes |
| `STORAGE_ACCESS_KEY_ID` | Storage access key | Yes |
| `STORAGE_SECRET_ACCESS_KEY` | Storage secret key | Yes |
| `STORAGE_PUBLIC_URL` | Custom CDN URL for images | Optional |
| `JWT_SECRET` | Secret for JWT tokens | Yes |

---

## Troubleshooting

### Backend Issues

1. **Database connection fails**:
   - Verify `DATABASE_URL` is correct
   - For Render PostgreSQL, use "Internal Database URL" if backend is on same account
   - Check database is running and accessible

2. **File uploads fail**:
   - Verify all `STORAGE_*` environment variables are set
   - Check bucket permissions (public read for images)
   - Verify access keys are correct

3. **CORS errors**:
   - Ensure `CORS_ORIGIN` matches your frontend URL exactly
   - Include protocol (`https://`)
   - No trailing slash

### Frontend Issues

1. **API calls fail**:
   - Verify `REACT_APP_API_BASE_URL` is set correctly
   - Check backend is running (health check)
   - Check browser console for errors

2. **Images not loading**:
   - Verify images are uploaded to S3 successfully
   - Check S3 bucket public access settings
   - Verify `file_url` in database contains correct URL

---

## Security Notes

1. **Never commit `.env` files** to Git
2. **Use strong JWT_SECRET** (generate with `openssl rand -base64 32`)
3. **Restrict CORS** to your frontend domain(s) only
4. **Use HTTPS** for all production URLs
5. **Keep storage credentials secure** (use environment variables only)
6. **Review S3 bucket permissions** (public read for images, private for sensitive files)

---

## Database Migration from SQLite

If you have existing data in SQLite:

1. **Export data** from SQLite database
2. **Import to PostgreSQL** (may require data transformation)
3. **Update attachment URLs**: Old `file_path` values need to be migrated to `file_url` (S3 URLs)
4. **Note**: Files in local `uploads/` directory need to be uploaded to S3 manually

---

## Support

For deployment issues:
- Check Render logs: Dashboard → Your Service → Logs
- Check Vercel logs: Dashboard → Your Project → Deployments → View Function Logs
- Verify all environment variables are set correctly
- Test backend health endpoint independently

