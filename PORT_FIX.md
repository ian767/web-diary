# Port Configuration Fix

## Issue
Port 5000 is used by macOS AirPlay Receiver, causing connection errors.

## Solution
The backend has been moved to port **5001**.

## Updated Configuration

- **Backend**: http://localhost:5001
- **Frontend**: http://localhost:3000
- **API URL**: http://localhost:5001/api

## Files Updated
- `backend/.env` - Changed PORT to 5001
- `frontend/src/services/api.js` - Updated API_URL to use port 5001
- `frontend/src/components/DiaryEntryList.js` - Updated upload URL to use port 5001
- `start.sh` - Updated to use port 5001

## Next Steps
1. Restart both servers if they're running
2. Refresh your browser
3. Try registering again

The registration should now work!



