# Production Readiness Checklist

This document summarizes the changes made to prepare the Web Diary app for production deployment.

## Changes Summary

### 1. Frontend (Create React App) ✅

- **API URL Configuration**:
  - Changed from `REACT_APP_API_URL` to `REACT_APP_API_BASE_URL`
  - Updated in: `services/api.js`, `components/DiaryEntryList.js`, `components/MonthlyEntryList.js`, `components/DiaryEntryForm.js`, `pages/Home.js`
  - Production requires: `REACT_APP_API_BASE_URL=https://your-backend.onrender.com` (domain only, no `/api`)
  - Development: Falls back to empty string (uses Create React App proxy with relative URLs)

- **Build Process**:
  - No changes needed - `npm run build` works as-is
  - Proxy in `package.json` is only used in development mode

- **Files Changed**:
  - `frontend/src/services/api.js`
  - `frontend/src/components/DiaryEntryList.js`
  - `frontend/src/components/MonthlyEntryList.js`
  - `frontend/src/components/DiaryEntryForm.js`
  - `frontend/src/pages/Home.js`
  - `frontend/package.json` (comment added)

### 2. Backend (Node/Express) ✅

- **Database Migration (SQLite → PostgreSQL)**:
  - Created new `backend/database.js` using `pg` (PostgreSQL)
  - Environment variable: `DATABASE_URL` (required)
  - Supports both development and production PostgreSQL databases
  - Compatibility wrapper for existing code (auth.js, tasks.js still use callback style)

- **Storage Migration (Filesystem → S3)**:
  - Created `backend/storage.js` for S3-compatible storage
  - Supports: AWS S3, Cloudflare R2, Supabase Storage
  - Environment variables: `STORAGE_TYPE`, `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_PUBLIC_URL`
  - Files uploaded to S3, URLs stored in database (`file_url` column)

- **Routes**:
  - Updated `backend/routes/diary.js` to use PostgreSQL and S3 storage
  - Created `backend/routes/public.js` for public share pages (`/api/public/share/:shareId`)
  - `backend/routes/auth.js` and `backend/routes/tasks.js` still use compatibility wrapper (works but could be optimized)

- **Server Configuration**:
  - Updated `backend/server.js` with environment variable support
  - CORS configurable via `CORS_ORIGIN` environment variable
  - Removed filesystem static route for `/uploads`
  - Added `/api/public` routes

- **Environment Variables**:
  - `PORT` (optional, defaults to 5000)
  - `NODE_ENV` (set to `production`)
  - `DATABASE_URL` (required)
  - `APP_BASE_URL` (for generating share links)
  - `CORS_ORIGIN` (comma-separated list of allowed origins)
  - Storage configuration (see DEPLOYMENT.md)

- **Files Changed**:
  - `backend/database.js` (complete rewrite for PostgreSQL)
  - `backend/storage.js` (new file)
  - `backend/server.js`
  - `backend/routes/diary.js` (complete rewrite)
  - `backend/routes/public.js` (new file)
  - `backend/package.json` (added `pg`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)

### 3. Database Schema ✅

- **PostgreSQL Schema**:
  - `users` table (unchanged)
  - `diary_entries` table:
    - Added `visibility` column (`private`, `unlisted`, `public`)
    - Added `share_id` column (unique identifier for public/unlisted entries)
  - `tasks` table (unchanged)
  - `attachments` table:
    - Changed from `file_path` to `file_url` (stores S3 URLs)
    - Removed filesystem dependency

- **Migration Notes**:
  - Schema automatically created on first run
  - Migration logic in `database.js` adds missing columns
  - Existing SQLite data needs manual migration (see DEPLOYMENT.md)

### 4. Image Storage ✅

- **S3-Compatible Storage**:
  - Files uploaded to S3-compatible storage (not filesystem)
  - Public URLs stored in database
  - Files deleted from S3 when attachments are deleted
  - Supports signed URLs for private files (if needed)

- **Files Changed**:
  - `backend/routes/diary.js` (uses `storage.js` for uploads/deletes)
  - `backend/storage.js` (new file)

### 5. Public Share Pages ✅

- **Public Routes**:
  - Created `backend/routes/public.js`
  - Route: `GET /api/public/share/:shareId`
  - Read-only access to entries with `visibility='public'` or `visibility='unlisted'`
  - No authentication required

- **Share ID Generation**:
  - Automatically generated when visibility is set to `public` or `unlisted`
  - Stored in `diary_entries.share_id` column

### 6. Security & Production Hygiene ✅

- **Environment Variables**:
  - All configuration via environment variables
  - No hardcoded secrets
  - JWT secret required (no default in production)

- **CORS**:
  - Configurable via `CORS_ORIGIN` environment variable
  - Development: Allows all origins
  - Production: Restrict to frontend domain(s)

- **Dev-Only Flags Removed**:
  - No `DANGEROUSLY_DISABLE_HOST_CHECK` needed in production
  - Frontend uses `REACT_APP_API_BASE_URL` in production (no proxy)

- **Filesystem Dependencies Removed**:
  - No local `uploads/` directory needed
  - All files stored in S3-compatible storage

## Remaining Tasks (Optional Improvements)

1. **Update auth.js and tasks.js routes**:
   - Currently use compatibility wrapper (works but not optimal)
   - Could be refactored to use PostgreSQL pool directly (async/await)

2. **Database Migration Script**:
   - Create script to migrate existing SQLite data to PostgreSQL
   - Migrate file paths to S3 URLs

3. **Error Handling**:
   - Add more comprehensive error handling
   - Add request validation middleware

4. **Logging**:
   - Add structured logging (e.g., Winston)
   - Add request logging middleware

5. **Rate Limiting**:
   - Add rate limiting to prevent abuse
   - Especially for public endpoints

## Testing Checklist

Before deploying to production:

- [ ] Test database connection with PostgreSQL
- [ ] Test file uploads to S3
- [ ] Test file deletions from S3
- [ ] Test public share pages (`/api/public/share/:shareId`)
- [ ] Test CORS configuration
- [ ] Test all CRUD operations (diary entries, tasks)
- [ ] Test authentication (register, login, verify)
- [ ] Verify no filesystem dependencies remain
- [ ] Verify all environment variables are set correctly

## Deployment Guide

See `DEPLOYMENT.md` for detailed deployment instructions.

