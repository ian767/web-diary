const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
require('dotenv').config();

/**
 * Storage service for handling file uploads to S3-compatible storage
 * Supports: AWS S3, Cloudflare R2, Supabase Storage, etc.
 * 
 * Required environment variables:
 * - STORAGE_TYPE: 's3' (currently only S3-compatible is supported)
 * - STORAGE_ENDPOINT: S3 endpoint URL (leave empty for AWS S3, use custom for R2/Supabase)
 * - STORAGE_REGION: AWS region (e.g., 'us-east-1')
 * - STORAGE_BUCKET: Bucket name
 * - STORAGE_ACCESS_KEY_ID: Access key
 * - STORAGE_SECRET_ACCESS_KEY: Secret key
 * - STORAGE_PUBLIC_URL: (Optional) Custom public URL for serving images
 */

class StorageService {
  constructor() {
    const storageType = process.env.STORAGE_TYPE || 's3';
    
    if (storageType !== 's3') {
      throw new Error(`Unsupported storage type: ${storageType}. Only 's3' is currently supported.`);
    }

    const config = {
      region: process.env.STORAGE_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
      },
    };

    // Custom endpoint for S3-compatible services (R2, Supabase, etc.)
    if (process.env.STORAGE_ENDPOINT) {
      config.endpoint = process.env.STORAGE_ENDPOINT;
      // For non-AWS endpoints, disable SSL requirement or adjust as needed
      config.forcePathStyle = true; // Required for some S3-compatible services
    }

    this.s3Client = new S3Client(config);
    this.bucket = process.env.STORAGE_BUCKET;
    this.publicUrl = process.env.STORAGE_PUBLIC_URL; // Optional custom domain

    if (!this.bucket || !process.env.STORAGE_ACCESS_KEY_ID || !process.env.STORAGE_SECRET_ACCESS_KEY) {
      console.warn('Warning: Storage configuration incomplete. File uploads will fail.');
      console.warn('Required: STORAGE_BUCKET, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY');
    }
  }

  /**
   * Upload a file to S3-compatible storage
   * @param {Buffer} fileBuffer - File content as Buffer
   * @param {string} originalFilename - Original filename
   * @param {string} mimeType - MIME type of the file
   * @returns {Promise<{url: string, key: string}>} Public URL and storage key
   */
  async uploadFile(fileBuffer, originalFilename, mimeType) {
    // Check for required configuration
    if (!this.bucket) {
      throw new Error('Storage bucket not configured. Set STORAGE_BUCKET environment variable.');
    }
    if (!process.env.STORAGE_ACCESS_KEY_ID || !process.env.STORAGE_SECRET_ACCESS_KEY) {
      throw new Error('Storage credentials not configured. Set STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY environment variables.');
    }

    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const extension = originalFilename.split('.').pop();
    const key = `uploads/${uniqueSuffix}.${extension}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      // Make file publicly readable (adjust ACL based on your needs)
      ACL: 'public-read', // For R2, use 'public-read' or remove ACL if not supported
    });

    try {
      await this.s3Client.send(command);

      // Generate public URL
      let publicUrl;
      if (this.publicUrl) {
        // Use custom domain (e.g., https://cdn.yourdomain.com)
        publicUrl = `${this.publicUrl}/${key}`;
      } else if (process.env.STORAGE_ENDPOINT) {
        // For custom endpoints (R2, etc.), construct URL manually
        // Format depends on provider - adjust as needed
        const endpoint = process.env.STORAGE_ENDPOINT.replace(/^https?:\/\//, '');
        publicUrl = `https://${endpoint}/${this.bucket}/${key}`;
      } else {
        // Standard AWS S3 URL
        publicUrl = `https://${this.bucket}.s3.${process.env.STORAGE_REGION || 'us-east-1'}.amazonaws.com/${key}`;
      }

      return {
        url: publicUrl,
        key: key,
      };
    } catch (error) {
      console.error('Error uploading file to storage:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3-compatible storage
   * @param {string} key - Storage key (from file_url or key field)
   * @returns {Promise<void>}
   */
  async deleteFile(key) {
    if (!this.bucket) {
      throw new Error('Storage bucket not configured');
    }

    // Extract key from URL if full URL is provided
    let storageKey = key;
    if (key.startsWith('http')) {
      // Extract key from URL (e.g., https://bucket.s3.region.amazonaws.com/uploads/file.jpg -> uploads/file.jpg)
      const urlParts = key.split('/');
      const keyIndex = urlParts.findIndex(part => part === 'uploads');
      if (keyIndex >= 0) {
        storageKey = urlParts.slice(keyIndex).join('/');
      } else {
        throw new Error(`Could not extract storage key from URL: ${key}`);
      }
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file from storage:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Generate a signed URL for temporary access (if needed for private files)
   * @param {string} key - Storage key
   * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns {Promise<string>} Signed URL
   */
  async getSignedUrl(key, expiresIn = 3600) {
    if (!this.bucket) {
      throw new Error('Storage bucket not configured');
    }

    let storageKey = key;
    if (key.startsWith('http')) {
      const urlParts = key.split('/');
      const keyIndex = urlParts.findIndex(part => part === 'uploads');
      if (keyIndex >= 0) {
        storageKey = urlParts.slice(keyIndex).join('/');
      }
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });

    try {
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }
}

module.exports = new StorageService();

