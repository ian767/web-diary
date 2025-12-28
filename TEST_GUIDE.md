# Running Tests

## Backend Tests

To run backend tests:

```bash
cd backend
npm test
```

This will:
- Run all backend API tests
- Show coverage report
- Exit when done

To run in watch mode (auto-rerun on file changes):

```bash
cd backend
npm run test:watch
```

## Frontend Tests

To run frontend tests:

```bash
cd frontend
npm test
```

This opens interactive watch mode. You can:
- Press `a` to run all tests
- Press `p` to filter by filename
- Press `q` to quit
- Press `u` to update snapshots

To run once (non-interactive):

```bash
cd frontend
CI=true npm test
```

## Running All Tests

From project root:

```bash
# Backend tests
cd backend && npm test && cd ..

# Frontend tests  
cd frontend && CI=true npm test && cd ..
```

## Test Status

✅ **Backend Tests**: Mostly passing (some tests may fail due to database state)
✅ **Frontend Tests**: Updated for new features (Dark Mode, ThemeProvider)

## Fixing Test Issues

If tests fail due to existing database entries:
- Backend tests use unique usernames with timestamps to avoid conflicts
- You may need to clear the test database if issues persist

To reset test database:
```bash
cd backend
rm diary.db
npm test
```

## Writing New Tests

When adding new features:
1. Write tests for backend API endpoints
2. Write tests for React components
3. Update existing tests if breaking changes are made

Test files are located in:
- Backend: `backend/__tests__/`
- Frontend: `frontend/src/components/__tests__/`



