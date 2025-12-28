const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const diaryRoutes = require('../routes/diary');
const database = require('../database');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/diary', diaryRoutes);

describe('Diary API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    await database.connect();
    
    // Register and login a test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'diarytestuser',
        email: 'diarytest@example.com',
        password: 'testpass123'
      });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await database.close();
  });

  describe('POST /api/diary', () => {
    it('should create a diary entry with authentication', async () => {
      const response = await request(app)
        .post('/api/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-01-15',
          title: 'Test Entry',
          content: 'This is a test diary entry',
          mood: 'happy'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should reject entry creation without authentication', async () => {
      const response = await request(app)
        .post('/api/diary')
        .send({
          date: '2024-01-15',
          title: 'Test Entry',
          content: 'This should fail'
        });

      expect(response.status).toBe(401);
    });

    it('should reject entry creation without date', async () => {
      const response = await request(app)
        .post('/api/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Entry',
          content: 'This should fail'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/diary', () => {
    let entryId;

    beforeEach(async () => {
      // Create a test entry
      const response = await request(app)
        .post('/api/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-01-20',
          title: 'Test Entry for GET',
          content: 'Test content'
        });
      entryId = response.body.id;
    });

    it('should get diary entries with authentication', async () => {
      const response = await request(app)
        .get('/api/diary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter entries by daily view', async () => {
      const response = await request(app)
        .get('/api/diary?view=daily&date=2024-01-20')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject getting entries without authentication', async () => {
      const response = await request(app)
        .get('/api/diary');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/diary/:id', () => {
    let entryId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-01-25',
          title: 'Single Entry Test',
          content: 'Test content for single entry'
        });
      entryId = response.body.id;
    });

    it('should get a single diary entry', async () => {
      const response = await request(app)
        .get(`/api/diary/${entryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(entryId);
      expect(response.body.title).toBe('Single Entry Test');
    });

    it('should return 404 for non-existent entry', async () => {
      const response = await request(app)
        .get('/api/diary/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/diary/:id', () => {
    let entryId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-01-30',
          title: 'Original Title',
          content: 'Original content'
        });
      entryId = response.body.id;
    });

    it('should update a diary entry', async () => {
      const response = await request(app)
        .put(`/api/diary/${entryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-01-30',
          title: 'Updated Title',
          content: 'Updated content',
          mood: 'excited'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('updated');
    });
  });

  describe('DELETE /api/diary/:id', () => {
    let entryId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-02-01',
          title: 'Entry to Delete',
          content: 'This will be deleted'
        });
      entryId = response.body.id;
    });

    it('should delete a diary entry', async () => {
      const response = await request(app)
        .delete(`/api/diary/${entryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');
    });
  });
});




