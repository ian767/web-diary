const express = require('express');
const cors = require('cors');
require('dotenv').config();

const database = require('./database');
const authRoutes = require('./routes/auth');
const diaryRoutes = require('./routes/diary');
const taskRoutes = require('./routes/tasks');
const publicRoutes = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
// Production: Use CORS_ORIGIN environment variable (comma-separated list)
// Development: Allow all origins (default)
const corsOptions = {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : '*',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Note: In production, uploaded files are served from S3-compatible storage
// No need for /uploads static route

// Routes
// Public routes (no authentication required)
app.use('/api/public', publicRoutes);

// Protected routes (authentication required)
app.use('/api/auth', authRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Web Diary API is running',
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start server
database.connect()
  .then(() => {
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0';
    app.listen(PORT, host, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      if (process.env.NODE_ENV === 'production') {
        console.log(`Production mode - Ensure all environment variables are set`);
      }
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  await database.close();
  process.exit(0);
});



