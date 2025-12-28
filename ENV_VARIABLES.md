# Environment Variables Reference

This document lists all environment variables required for production deployment.

## Frontend Environment Variables

### Required (Production)

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_BASE_URL` | Backend API base URL | `https://your-backend.onrender.com/api` |

**Note**: In development, this can be left empty to use Create React App's proxy (configured in `package.json`).

---

## Backend Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/database` |
| `JWT_SECRET` | Secret key for JWT tokens | Generate with: `openssl rand -base64 32` |
| `STORAGE_BUCKET` | S3-compatible bucket name | `my-diary-uploads` |
| `STORAGE_ACCESS_KEY_ID` | Storage access key ID | (from AWS/R2/Supabase) |
| `STORAGE_SECRET_ACCESS_KEY` | Storage secret access key | (from AWS/R2/Supabase) |
| `STORAGE_REGION` | AWS region (for S3) | `us-east-1` |

### Optional (but recommended)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PORT` | Server port | `5000` | (usually set by hosting platform) |
| `NODE_ENV` | Environment | (not set) | `production` |
| `APP_BASE_URL` | Frontend URL (for share links) | (none) | `https://your-frontend.vercel.app` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `*` (all) | `https://your-frontend.vercel.app` |
| `STORAGE_TYPE` | Storage type | `s3` | `s3` |
| `STORAGE_ENDPOINT` | Custom S3 endpoint (for R2, etc.) | (none) | `https://xxx.r2.cloudflarestorage.com` |
| `STORAGE_PUBLIC_URL` | Custom CDN URL for images | (auto-generated) | `https://cdn.yourdomain.com` |

---

## Environment Variable Setup by Platform

### Vercel (Frontend)

1. Go to your project → Settings → Environment Variables
2. Add:
   ```
   REACT_APP_API_BASE_URL=https://your-backend.onrender.com/api
   ```
3. Redeploy after adding variables

### Render (Backend)

1. Go to your service → Environment
2. Add all required variables (see table above)
3. Variables are automatically available on next deploy

### Local Development

Create `.env` files (not committed to Git):

**`frontend/.env`** (optional for development):
```
# Leave empty to use proxy, or set for testing:
# REACT_APP_API_BASE_URL=http://localhost:5001/api
```

**`backend/.env`**:
```
NODE_ENV=development
PORT=5001
DATABASE_URL=postgresql://user:pass@localhost:5432/webdiary
JWT_SECRET=your-development-secret-key
STORAGE_TYPE=s3
STORAGE_BUCKET=your-bucket
STORAGE_ACCESS_KEY_ID=your-key
STORAGE_SECRET_ACCESS_KEY=your-secret
STORAGE_REGION=us-east-1
CORS_ORIGIN=http://localhost:3000
APP_BASE_URL=http://localhost:3000
```

---

## Security Notes

1. **Never commit `.env` files** to Git
2. **Generate strong JWT_SECRET**: `openssl rand -base64 32`
3. **Use different secrets** for development and production
4. **Restrict CORS_ORIGIN** in production to your frontend domain(s) only
5. **Store secrets securely** (use hosting platform's secret management)

---

## Verification

After setting environment variables:

### Frontend
- Check build logs to verify `REACT_APP_API_BASE_URL` is set
- Test API calls in browser console

### Backend
- Check startup logs for database connection
- Test health endpoint: `GET /api/health`
- Verify file uploads work (should upload to S3)

