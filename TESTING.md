# Testing Guide

This document explains how to run tests for the Web Diary application.

## Overview

The project includes tests for both backend (API) and frontend (React components).

## Backend Tests

Backend tests use **Jest** and **Supertest** for API testing.

### Running Backend Tests

```bash
cd backend
npm test
```

### Running Tests in Watch Mode

```bash
cd backend
npm run test:watch
```

### Test Coverage

To see coverage report:

```bash
cd backend
npm test
```

Coverage report will be displayed in the terminal and saved to `coverage/` directory.

### Backend Test Structure

Tests are located in `backend/__tests__/`:
- `auth.test.js` - Authentication API tests
- `diary.test.js` - Diary entries API tests
- `tasks.test.js` - Tasks API tests

### Example Backend Test

```javascript
it('should create a diary entry', async () => {
  const response = await request(app)
    .post('/api/diary')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      date: '2024-01-15',
      title: 'Test Entry',
      content: 'Test content'
    });

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
});
```

## Frontend Tests

Frontend tests use **Jest** and **React Testing Library**.

### Running Frontend Tests

```bash
cd frontend
npm test
```

This will run tests in interactive watch mode. Press `a` to run all tests, or `q` to quit.

### Running Tests Once

```bash
cd frontend
CI=true npm test
```

### Frontend Test Structure

Tests are located in `frontend/src/components/__tests__/`:
- `Login.test.js` - Login/Register component tests
- `TaskList.test.js` - Task list component tests

### Example Frontend Test

```javascript
it('renders login form', () => {
  render(<Login />);
  expect(screen.getByText('Login')).toBeInTheDocument();
  expect(screen.getByLabelText('Username')).toBeInTheDocument();
});
```

## Running All Tests

### From Project Root

You can run both backend and frontend tests:

```bash
# Backend tests
cd backend && npm test && cd ..

# Frontend tests
cd frontend && npm test && cd ..
```

### Using a Test Script (Optional)

You can add a test script to the root `package.json`:

```json
{
  "scripts": {
    "test": "cd backend && npm test && cd ../frontend && npm test"
  }
}
```

## Test Configuration

### Backend Jest Configuration

Located in `backend/package.json`:

```json
{
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": ["/node_modules/", "/uploads/"],
    "testMatch": ["**/__tests__/**/*.test.js"]
  }
}
```

### Frontend Jest Configuration

React Scripts handles Jest configuration automatically. Custom setup is in `frontend/src/setupTests.js`.

## Writing New Tests

### Backend Test Template

```javascript
const request = require('supertest');
const express = require('express');
const yourRoutes = require('../routes/your-route');
const database = require('../database');

const app = express();
app.use(express.json());
app.use('/api/your-route', yourRoutes);

describe('Your API', () => {
  beforeAll(async () => {
    await database.connect();
  });

  afterAll(async () => {
    await database.close();
  });

  it('should do something', async () => {
    const response = await request(app)
      .get('/api/your-route')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });
});
```

### Frontend Test Template

```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const mockHandler = jest.fn();
    render(<YourComponent onClick={mockHandler} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

## Common Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run tests once (backend) or in watch mode (frontend) |
| `npm run test:watch` | Run tests in watch mode (backend only) |
| `CI=true npm test` | Run tests once without watch mode (frontend) |

## Troubleshooting

### Backend Tests

**Issue**: Database connection errors
- **Solution**: Make sure the database is properly initialized in `beforeAll`

**Issue**: Tests interfering with each other
- **Solution**: Use `beforeEach`/`afterEach` to clean up test data

### Frontend Tests

**Issue**: "Cannot find module" errors
- **Solution**: Make sure all dependencies are installed: `npm install`

**Issue**: Tests not updating
- **Solution**: Clear Jest cache: `npm test -- --clearCache`

**Issue**: Mock not working
- **Solution**: Ensure mocks are set up before imports: `jest.mock()` before `import`

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data after each test
3. **Descriptive Names**: Use clear test descriptions
4. **AAA Pattern**: Arrange, Act, Assert
5. **Mock External Dependencies**: Mock API calls and external services
6. **Test Edge Cases**: Test both success and failure scenarios

## Continuous Integration

For CI/CD pipelines, use:

```bash
# Backend
cd backend && npm test -- --coverage --watchAll=false

# Frontend
cd frontend && CI=true npm test -- --coverage --watchAll=false
```




