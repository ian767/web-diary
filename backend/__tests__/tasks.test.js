const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const taskRoutes = require('../routes/tasks');
const database = require('../database');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

describe('Tasks API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    await database.connect();
    
    // Register and login a test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: `tasktestuser${Date.now()}`,
        email: `tasktest${Date.now()}@example.com`,
        password: 'testpass123'
      });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body).toHaveProperty('token');
    expect(registerResponse.body).toHaveProperty('user');
    
    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await database.close();
  });

  describe('POST /api/tasks', () => {
    it('should create a task with authentication', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'This is a test task',
          due_date: '2024-12-31',
          priority: 'high'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should reject task creation without title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Task without title'
        });

      expect(response.status).toBe(400);
    });

    it('should reject task creation without authentication', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Unauthorized Task'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create test tasks
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task 1',
          completed: false,
          priority: 'high'
        });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task 2',
          completed: true,
          priority: 'low'
        });
    });

    it('should get all tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter tasks by completion status', async () => {
      const response = await request(app)
        .get('/api/tasks?completed=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(task => {
        expect(task.completed).toBe(1);
      });
    });
  });

  describe('PATCH /api/tasks/:id/toggle', () => {
    let taskId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task to Toggle',
          completed: false
        });
      taskId = response.body.id;
    });

    it('should toggle task completion status', async () => {
      // Get initial status
      const initialResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);
      const initialCompleted = initialResponse.body.completed;

      // Toggle
      const toggleResponse = await request(app)
        .patch(`/api/tasks/${taskId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(toggleResponse.status).toBe(200);
      expect(toggleResponse.body.completed).toBe(!initialCompleted);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task to Delete'
        });
      taskId = response.body.id;
    });

    it('should delete a task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');
    });
  });
});

