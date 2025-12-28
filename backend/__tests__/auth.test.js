const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const database = require('../database');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Use a test database
const TEST_DB_PATH = './test_diary.db';

describe('Authentication API', () => {
  beforeAll(async () => {
    // Initialize test database
    await database.connect();
  });

  afterAll(async () => {
    // Clean up test database
    await database.close();
    // Optionally delete test database file
    // const fs = require('fs');
    // if (fs.existsSync(TEST_DB_PATH)) {
    //   fs.unlinkSync(TEST_DB_PATH);
    // }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const uniqueUsername = `testuser${Date.now()}`;
      const uniqueEmail = `test${Date.now()}@example.com`;
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: uniqueUsername,
          email: uniqueEmail,
          password: 'testpass123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(uniqueUsername);
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `testuser2${Date.now()}`
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: `testuser3${Date.now()}`,
          email: `test3${Date.now()}@example.com`,
          password: '12345'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('at least 6 characters');
    });

    it('should reject duplicate username', async () => {
      const uniqueUsername = `duplicateuser${Date.now()}`;
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          username: uniqueUsername,
          email: `dup1${Date.now()}@example.com`,
          password: 'testpass123'
        });

      // Try to register again with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: uniqueUsername,
          email: `dup2${Date.now()}@example.com`,
          password: 'testpass123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    let loginUsername;
    let loginEmail;

    beforeEach(async () => {
      // Create a test user for login tests
      loginUsername = `logintest${Date.now()}`;
      loginEmail = `login${Date.now()}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          username: loginUsername,
          email: loginEmail,
          password: 'testpass123'
        });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: loginUsername,
          password: 'testpass123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(loginUsername);
    });

    it('should login with email instead of username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: loginEmail,
          password: 'testpass123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: loginUsername,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: `nonexistent${Date.now()}`,
          password: 'testpass123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: loginUsername
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});

