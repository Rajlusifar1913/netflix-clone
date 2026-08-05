# Streamly Backend Server (Node.js + MongoDB)

Production-ready, highly secure, scalable RESTful API backend built for the Streamly (Netflix Clone) web interface.

## Features

- **Architecture**: Modular TypeScript architecture using ES Modules (`NodeNext`).
- **Framework**: Express.js with custom async error handling and Zod request validation.
- **Database**: MongoDB with Mongoose ODM (indexing, connection pooling, schemas).
- **Security**:
  - `helmet` for HTTP security headers
  - `cors` configured for cross-origin access
  - `express-rate-limit` for rate limiting & brute-force protection
  - `bcryptjs` for salted password hashing
  - `jsonwebtoken` for JWT auth & HTTP-only cookies
- **Data Persistence**:
  - User authentication & credentials
  - Multiple profiles per user (up to 5) with Kids mode & custom avatars
  - User profile "My List" management (add/remove titles)
  - Profile "Watch History" & video progress tracking
  - TMDB catalog caching with local MongoDB fallback
- **Health Monitoring**: Dedicated `/health` status endpoint.

---

## Environment Variables

Configure environment variables in `.env` (derived from `.env.example`):

| Variable | Default | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Environment mode (`development` / `production`) |
| `PORT` | `5000` | HTTP server port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/netflix_clone` | MongoDB connection string |
| `JWT_SECRET` | Secret string | Secret key for signing access JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | Token validity duration |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |
| `TMDB_API_KEY` | *(Optional)* | TMDB API v3 key for live data |
| `TMDB_ACCESS_TOKEN` | *(Optional)* | TMDB API Read Access Bearer Token |

---

## Setup & Running

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Database Seeding (Optional)
Populate MongoDB with default demo users, profiles, and media catalogue:
```bash
npm run seed
```

**Demo User Credentials:**
- Email: `demo@streamly.com`
- Password: `Password123`

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build & Start Production Server
```bash
npm run build
npm run start
```

---

## API Endpoints Overview

### Health
- `GET /health` - System health check, MongoDB connection state, and uptime.

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` - Create user account (returns JWT).
- `POST /api/v1/auth/login` - Sign in user (returns JWT & sets cookie).
- `POST /api/v1/auth/logout` - Clear auth cookies.
- `GET /api/v1/auth/me` - Get current logged-in user and profiles.

### Profiles (`/api/v1/profiles`)
- `GET /api/v1/profiles` - Get all profiles for current user.
- `POST /api/v1/profiles` - Create a new profile.
- `PUT /api/v1/profiles/:profileId` - Update profile settings.
- `DELETE /api/v1/profiles/:profileId` - Delete profile.
- `GET /api/v1/profiles/:profileId/mylist` - Get My List items.
- `POST /api/v1/profiles/:profileId/mylist` - Toggle item in My List.
- `POST /api/v1/profiles/:profileId/history` - Save watch progress.

### Media (`/api/v1/media`)
- `GET /api/v1/media/browse` - Fetch homepage browse content (featured + rows).
- `GET /api/v1/media/search?q=query` - Search movies & TV shows.
- `GET /api/v1/media/details/:type/:id` - Fetch item details & trailers.
