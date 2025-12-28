# Web Diary Application

A full-stack web application for managing your personal diary entries and tasks with support for daily, weekly, monthly, and yearly views. Features include photo attachments, stickers, article uploads, and integrated task management.

## Features

- 📅 **Multiple View Modes**: Daily, Weekly, Monthly, and Yearly calendar views
- 📝 **Diary Entries**: Create, edit, and delete diary entries with rich content
- 📎 **Attachments**: 
  - Multiple photo uploads
  - Sticker support (emoji-based)
  - Document/article attachments (PDF, DOC, TXT)
- ✅ **Task Management**: Integrated task system with priorities and due dates
- 🔐 **Authentication**: Secure user accounts with password protection
- 🎨 **Modern UI**: Beautiful, responsive design with gradient backgrounds

## Tech Stack

### Backend
- Node.js & Express.js
- SQLite database
- JWT authentication
- Multer for file uploads
- bcryptjs for password hashing

### Frontend
- React 18
- React Router for navigation
- React Calendar for date selection
- Axios for API calls
- date-fns for date manipulation

## Project Structure

```
web-diary/
├── backend/
│   ├── database.js          # Database setup and initialization
│   ├── server.js             # Express server
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── diary.js         # Diary entry routes
│   │   └── tasks.js         # Task routes
│   └── uploads/             # Uploaded files storage
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   └── utils/          # Utility functions
│   └── public/             # Static files
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Quick Start (Recommended)

Use the server control script to start both servers at once:

```bash
# Start both backend and frontend servers
./server-control.sh start

# Check server status
./server-control.sh status

# Stop both servers
./server-control.sh stop

# Restart both servers
./server-control.sh restart
```

The servers will run on:
- **Backend**: `http://localhost:5001`
- **Frontend**: `http://localhost:3000`

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (the server-control.sh script creates this automatically):
```bash
PORT=5001
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
```

4. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:5001`

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults to localhost:5001):
```
REACT_APP_API_URL=http://localhost:5001/api
```

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Usage

### Getting Started

1. **Register/Login**: Create a new account or login with existing credentials
2. **Select View**: Choose Daily, Weekly, Monthly, or Yearly view
3. **Create Entry**: Click "New Entry" to write a diary entry
4. **Add Attachments**: 
   - Upload photos or documents
   - Add emoji stickers
5. **Manage Tasks**: Create tasks with priorities and due dates
6. **Navigate**: Use the calendar or navigation buttons to move between dates

### Diary Entries

- **Date Selection**: Choose any date for your entry
- **Title & Content**: Write your thoughts and experiences
- **Mood Tracking**: Select your mood for the day
- **Attachments**: 
  - Photos: Upload multiple images (JPEG, PNG, GIF, WebP)
  - Documents: Attach PDF, DOC, DOCX, or TXT files
  - Stickers: Add emoji stickers to express yourself

### Tasks

- **Create Tasks**: Add tasks with titles, descriptions, and due dates
- **Priorities**: Set task priority (Low, Medium, High)
- **Completion**: Toggle task completion status
- **Integration**: Link tasks to specific diary entries

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify token

### Diary Entries
- `GET /api/diary` - Get entries (supports view, date, startDate, endDate params)
- `GET /api/diary/:id` - Get single entry
- `POST /api/diary` - Create entry (multipart/form-data)
- `PUT /api/diary/:id` - Update entry
- `DELETE /api/diary/:id` - Delete entry
- `DELETE /api/diary/:id/attachments/:attachmentId` - Delete attachment

### Tasks
- `GET /api/tasks` - Get tasks (supports diary_entry_id, completed, due_date params)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/toggle` - Toggle task completion

## Database Schema

### Users
- id, username, email, password, created_at

### Diary Entries
- id, user_id, date, title, content, mood, created_at, updated_at

### Tasks
- id, user_id, diary_entry_id, title, description, due_date, completed, priority, created_at, updated_at

### Attachments
- id, diary_entry_id, type, filename, original_filename, file_path, mime_type, size, created_at

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- File upload validation and size limits (10MB)
- User-specific data isolation
- SQL injection protection via parameterized queries

## Additional Suggestions

Here are some features you might want to consider adding:

1. **Search Functionality**: Search diary entries by keywords or dates
2. **Export/Import**: Export diary entries as PDF or JSON
3. **Tags/Categories**: Organize entries with tags
4. **Reminders**: Set reminders for tasks
5. **Statistics**: View statistics about your diary (entries per month, mood trends)
6. **Dark Mode**: Toggle between light and dark themes
7. **Rich Text Editor**: WYSIWYG editor for diary entries
8. **Image Editing**: Basic image editing capabilities
9. **Backup**: Automatic cloud backup functionality
10. **Sharing**: Share specific entries (with privacy controls)
11. **Mobile App**: React Native version for mobile devices
12. **Offline Support**: Service workers for offline functionality

## Development

### Running in Development Mode

Backend with auto-reload:
```bash
cd backend
npm run dev
```

Frontend with hot-reload:
```bash
cd frontend
npm start
```

### Building for Production

Frontend:
```bash
cd frontend
npm run build
```

The build folder will contain the production-ready static files.

## License

This project is open source and available for personal use.

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.



