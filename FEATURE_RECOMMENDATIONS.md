# Streamly / Netflix Clone - Feature Enhancement Roadmap

This document outlines technical recommendations, feature enhancements, and architectural upgrades for both the **Client (React/Vite)** and **Server (Node.js/Express)** to bring the project to enterprise, production-ready standards.

---

## 1. Authentication & Security Enhancements

### 🔒 Short-Lived Access Tokens + HTTP-Only Refresh Tokens
- **Current State**: Access tokens expire after 7 days without refresh token rotation.
- **Improvement**: Implement short-lived Access Tokens (15 minutes) sent via `Authorization: Bearer <token>` paired with HTTP-only, `SameSite=Strict` Refresh Tokens stored in cookies. Rotate refresh tokens upon each generation and store session hashes in MongoDB.

### 🔑 Server-Side OAuth 2.0 (Google & GitHub)
- **Current State**: Client uses mock/stub OAuth handlers.
- **Improvement**: Integrate Passport.js or native OAuth SDKs on the backend (`/api/v1/auth/google`, `/api/v1/auth/github`) with callback redirects to set cookies and redirect users securely.

### 📧 Email Verification & Password Recovery
- **Current State**: Basic email/password authentication without verification via email.
- **Improvement**: Add endpoints for `/forgot-password` and `/reset-password` using signed URL tokens via Nodemailer or Resend.

---

## 2. Server & Backend Architecture

### 📹 Video Streaming with Range Request Support (`HTTP 206`)
- **Current State**: Media details return static trailer URLs or external iframe embeds.
- **Improvement**: Create an Express streaming endpoint (`GET /api/v1/media/stream/:id`) supporting `Range` headers (`206 Partial Content`) for native HTML5 video buffering, chunking, and fast seeking.

### ⚡ Redis Caching Layer for TMDB API
- **Current State**: Direct API requests to TMDB or local MongoDB media lookup.
- **Improvement**: Intercept external TMDB API requests with a Redis caching layer (e.g., 1–6 hour TTL for trending/genre lists) to minimize latency, save bandwidth, and protect against rate limits.

### 🤖 Personalization & Recommendation Engine
- **Current State**: Content categories are fixed or TMDB-driven.
- **Improvement**: Build a recommendation algorithm (`GET /api/v1/media/recommendations/:profileId`) that analyzes user `watchHistory` and `myList` genres to generate dynamic rows like *"Because you watched [Title]"*.

---

## 3. Client & User Experience (UX)

### 🎬 Fullscreen Custom Video Player (`/watch/:id`)
- **Current State**: Media played inside `InfoModal`.
- **Improvement**: Dedicated fullscreen player view with a custom control bar:
  - 10-second skip forward/backward buttons.
  - Video resolution selector (4K / 1080p / 720p).
  - Subtitle & Audio track selection.
  - "Next Episode" auto-play overlay with countdown timer for TV series.

### 🔍 Interactive Search & Multi-Filtering Page
- **Current State**: Quick search in header.
- **Improvement**: Full search page (`/search?q=...`) featuring debounced inputs, category pills, and multi-facet filtering (genre, year, age rating, media type).

### 📊 "Continue Watching" Row with Visual Progress
- **Current State**: History recorded via API.
- **Improvement**: Display a "Continue Watching" row on `/browse` with visual progress bars on movie poster cards calculated from `watchHistory` (e.g., 75% completed).

### 🛡️ Profile PIN Protection & Parental Controls
- **Current State**: Profiles switch freely without restriction.
- **Improvement**: Add a 4-digit security PIN for adult profiles and restrict Kids profiles to G / PG content.

---

## 4. Standout Advanced Features

### 🍿 "Watch Party" (Real-Time Synchronized Viewing)
- **Technology**: `Socket.io` + `Express`
- **Description**: Allow users to create private Watch Party rooms, share a link, and watch videos with synchronized play/pause/seek controls alongside a live chat sidebar.

### 📱 Progressive Web App (PWA) & Offline Mode
- **Technology**: Service Workers + Cache Storage API
- **Description**: Turn the client into a PWA so users can browse cached media catalog metadata even when offline.

---

## 💡 Summary Checklist & Prioritization

| Priority | Scope | Feature | Objective |
| :--- | :--- | :--- | :--- |
| 🔴 **High** | Full-Stack | Auth Event Sync & Refresh Tokens | Fix login loop & secure sessions |
| 🔴 **High** | Client | Custom Video Player Page (`/watch/:id`) | Core streaming experience |
| 🟡 **Medium** | Server | Redis Caching Layer | Speed up API & avoid rate limits |
| 🟡 **Medium** | Client | "Continue Watching" Row & Progress Bars | User engagement & progress retention |
| 🟢 **Low** | Full-Stack | Socket.io Watch Party | Major portfolio differentiator |
