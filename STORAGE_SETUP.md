# Storage Setup Checklist

This document lists the required environment variables for file uploads to work.

## Required Environment Variables for Render (Backend)

The following environment variables **must** be set in your Render backend service for file uploads to work:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `STORAGE_BUCKET` | S3-compatible bucket name | `my-diary-uploads` |
| `STORAGE_ACCESS_KEY_ID` | Storage access key ID | (from AWS/R2/Supabase) |
| `STORAGE_SECRET_ACCESS_KEY` | Storage secret access key | (from AWS/R2/Supabase) |
| `STORAGE_REGION` | AWS region (for S3) | `us-east-1` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `STORAGE_TYPE` | Storage type | `s3` | `s3` |
| `STORAGE_ENDPOINT` | Custom S3 endpoint (for R2, Supabase, etc.) | (none) | `https://xxx.r2.cloudflarestorage.com` |
| `STORAGE_PUBLIC_URL` | Custom CDN URL for images | (auto-generated) | `https://cdn.yourdomain.com` |

---

## Setup by Provider

### AWS S3

1. Create an S3 bucket in AWS Console
2. Get your **Access Key ID** and **Secret Access Key** (IAM user with S3 permissions)
3. Note your **region** (e.g., `us-east-1`)
4. Enable **Public read** access on the bucket (or use signed URLs)
5. Set in Render:
   ```
   STORAGE_BUCKET=your-bucket-name
   STORAGE_ACCESS_KEY_ID=your-access-key-id
   STORAGE_SECRET_ACCESS_KEY=your-secret-key
   STORAGE_REGION=us-east-1
   STORAGE_TYPE=s3
   ```
   (Leave `STORAGE_ENDPOINT` empty for AWS S3)

### Cloudflare R2

1. Create an R2 bucket in Cloudflare Dashboard
2. Create API token with R2 permissions (under R2 → Manage R2 API Tokens)
3. Get **Access Key ID** and **Secret Access Key**
4. Get **Endpoint URL** from R2 bucket settings (format: `https://[account-id].r2.cloudflarestorage.com`)
5. Set in Render:
   ```
   STORAGE_BUCKET=your-r2-bucket-name
   STORAGE_ACCESS_KEY_ID=your-r2-access-key-id
   STORAGE_SECRET_ACCESS_KEY=your-r2-secret-key
   STORAGE_REGION=auto
   STORAGE_TYPE=s3
   STORAGE_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
   ```

### Supabase Storage

1. In Supabase project, go to Storage
2. Create a public bucket (e.g., `diary-uploads`)
3. Get API keys from Settings → API
4. Set in Render:
   ```
   STORAGE_BUCKET=diary-uploads
   STORAGE_ACCESS_KEY_ID=your-supabase-key
   STORAGE_SECRET_ACCESS_KEY=your-supabase-secret
   STORAGE_REGION=us-east-1
   STORAGE_TYPE=s3
   STORAGE_ENDPOINT=https://[project-id].supabase.co/storage/v1/s3
   ```
   (Note: Supabase Storage uses S3-compatible API)

---

## Verification

After setting environment variables:

1. **Check backend logs** when creating an entry with attachments
2. **Look for errors** like:
   - "Storage bucket not configured"
   - "Storage credentials not configured"
   - "Error uploading file: ..."
3. **Test upload** by creating a diary entry with an image
4. **Verify in database** that `attachments` table has entries with `file_url` populated
5. **Check that images load** when viewing the entry

---

## Troubleshooting

### Uploads Fail Silently

- Check backend logs for storage errors
- Verify all required environment variables are set
- Check that credentials have correct permissions

### "Storage bucket not configured" Error

- Ensure `STORAGE_BUCKET` is set in Render environment variables
- Restart the backend service after adding variables

### "Storage credentials not configured" Error

- Ensure `STORAGE_ACCESS_KEY_ID` and `STORAGE_SECRET_ACCESS_KEY` are set
- Verify credentials are correct (copy-paste carefully, no extra spaces)

### "Access Denied" or Permission Errors

- For AWS S3: Check IAM user has `s3:PutObject` and `s3:GetObject` permissions
- For R2: Ensure API token has read/write permissions
- For Supabase: Ensure bucket is set to "public" or service role key is used

### Images Don't Load After Upload

- Check `file_url` in database matches the actual file location
- Verify bucket has public read access (or use signed URLs)
- Check CORS settings if loading from different domain

---

## Quick Checklist

Before deploying, verify:

- [ ] `STORAGE_BUCKET` is set
- [ ] `STORAGE_ACCESS_KEY_ID` is set
- [ ] `STORAGE_SECRET_ACCESS_KEY` is set
- [ ] `STORAGE_REGION` is set (or `STORAGE_ENDPOINT` for R2/Supabase)
- [ ] Credentials have correct permissions
- [ ] Bucket exists and is accessible
- [ ] Backend service has been restarted after setting variables

