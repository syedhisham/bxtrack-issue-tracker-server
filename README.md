# Issue Tracker API

A RESTful backend API for a mini issue tracking application built with Node.js, Express, TypeScript, and MongoDB. This API provides endpoints for user authentication, issue management, and issue assignment functionality. Additionally, it includes bonus features for comment management and notification systems to enhance collaboration and activity tracking.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with HTTP-only cookies
- **Development**: nodemon, ts-node

## Project Structure

```
server/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Authentication & request middleware
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API route definitions
│   ├── scripts/        # Database seeding scripts
│   ├── services/       # Business logic layer
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions (JWT, validation, responses)
│   ├── app.ts          # Express app configuration
│   └── server.ts       # Server entry point
├── dist/               # Compiled JavaScript (generated)
└── package.json
```

## API Routes

### Authentication (`/api/auth`)

- `POST /api/auth/login` - Login with email (returns JWT token)
- `POST /api/auth/logout` - Logout (clears token cookie)

### Users (`/api/users`)

- `GET /api/users/all-users` - Get all users (for assignee dropdown) **[Protected]**

### Issues (`/api/issues`)

All issue routes require authentication.

- `POST /api/issues` - Create a new issue
- `GET /api/issues` - List all issues (with filters: status, priority, assignee, pagination)
- `GET /api/issues/my-issues` - Get issues assigned to logged-in user (with filters & pagination)
- `GET /api/issues/summary` - Get issue statistics (counts by status, priority, assignee)
- `GET /api/issues/:id` - Get a single issue by ID
- `PATCH /api/issues/:id` - Update an issue (status, assignee, title, description, priority)

### Health Check

- `GET /api/health` - Server health check endpoint

## Bonus Features

The following endpoints were implemented as bonus features to enhance the issue tracking functionality with activity tracking and notifications.

### Comments (`/api/comments`)

All comment routes require authentication. Comments allow users to add activity and discussions to issues, enabling better collaboration and issue tracking.

- `POST /api/comments` - Create a new comment on an issue
- `GET /api/comments/issue/:issueId` - Get all comments for a specific issue
- `PATCH /api/comments/:id` - Update a comment
- `DELETE /api/comments/:id` - Delete a comment

**Features:**
- Support for user mentions in comments using `@username` syntax
- Automatic notifications to mentioned users, issue creator, and assignee
- Full CRUD operations for comments
- Comments are linked to specific issues and include author information

### Notifications (`/api/notifications`)

All notification routes require authentication. The notification system provides updates about issue activities, assignments, and mentions.

- `GET /api/notifications` - Get all notifications for the logged-in user (with pagination)
- `PATCH /api/notifications/:id/read` - Mark a specific notification as read
- `PATCH /api/notifications/read-all` - Mark all notifications as read

**Notification Types:**
- Issue created
- Issue assigned
- Issue updated
- Status changed
- Priority changed
- Comment added
- User mentioned in comment

**Features:**
- Notification delivery
- Unread count tracking
- Pagination support for notification lists
- Bulk read operations
- Notifications include links to related issues for easy navigation

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory (see Environment Variables section below).

3. **Seed the database:**
   ```bash
   npm run seed
   ```
   This will populate the database with initial user data.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:5000` (or the port specified in `.env`).

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

```env
# Server Configuration
PORT=5000

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/issue-tracker
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/issue-tracker

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

### Required Variables

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for signing JWT tokens

### Optional Variables

- `PORT` - Server port (default: 5000)
- `JWT_EXPIRES_IN` - Token expiration time (default: 7d)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)
- `NODE_ENV` - Environment mode (development/production)

## Database Seeding

The seed script creates initial users in the database. Run:

```bash
npm run seed
```

**Seeded Users:**
- Syed Hisham Shah (syedhishamshah27@gmail.com)
- Ali Ahmed (aliahmed@gmail.com)
- Fatima Khan (fatimakhan@gmail.com)
- Ahmed Hassan (ahmedhassan@gmail.com)

> **Note:** The seed script will clear existing users before inserting new ones.

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Optional success message",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (only in development)"
}
```

## Authentication

The API uses JWT tokens for authentication. Tokens can be sent via:
- **HTTP-only cookies** (preferred)
- **Authorization header**: `Bearer <token>`

Protected routes require the `authenticate` middleware which validates the JWT token.

## Issue Model

- **title** (required): Issue title
- **description** (required): Issue description
- **priority** (required): Low | Medium | High
- **status** (required): Open | In Progress | Resolved
- **assignee** (optional): User ID reference (can be null for unassigned)
- **createdBy** (required): User ID of the creator
- **createdAt**: Auto-generated timestamp
- **updatedAt**: Auto-generated timestamp

## Pagination

List endpoints support pagination with query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

Response includes:
```json
{
  "issues": [...],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

## Filtering

The `GET /api/issues` endpoint supports filtering via query parameters:
- `status` - Filter by status (Open, In Progress, Resolved)
- `priority` - Filter by priority (Low, Medium, High)
- `assignee` - Filter by assignee ID or "unassigned"

Example: `GET /api/issues?status=Open&priority=High&page=1&limit=10`

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `500` - Internal Server Error

## Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run seed` - Seed database with initial users

