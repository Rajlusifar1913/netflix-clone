# THE NEOTIA UNIVERSITY
**Sarisa, Diamond Harbour Road, 24 Parganas (South), West Bengal - 743368**

---

# INTERNSHIP PROJECT REPORT
## **NETFLIX CLONE (STREAMLY)**

**Submitted in Partial Fulfillment of the Requirements for the Internship Programme**

### **GROUP B**

**School of Science and Technology**  
**Bachelor of Technology (B.Tech)**  
**Computer Science & Engineering (Cyber Security)**  

**Internship Organization:**  
**Global Secora Private Limited Academic**  

**Session : 2025–2026**

---

### **Submitted by**

| Sl. No. | Member Name | UID (College ID) | Project Role |
| :---: | :---: | :---: | :---: |
| **1** | **Rajkrishna Das** | **TNU2023020100030** | Full Frontend Development & UI/UX Design |
| **2** | **Sudipto Gayen** | **TNU2023020100022** | Full Backend Development, Database & MongoDB Architecture |

---
\pagebreak

# TABLE OF CONTENTS

| SL. NO. | CONTENT | PAGE NO. |
| :---: | :--- | :---: |
| **1** | **Introduction** | **3** |
| **2** | **Objectives & Problem Statement** | **3** |
| **3** | **Technologies & System Requirements** | **3–4** |
| **4** | **Major Features** | **4** |
| **5** | **System Architecture & Workflow** | **4** |
| **6** | **Module Description** | **5** |
| **7** | **Frontend Implementation** | **5** |
| **8** | **Backend, Database & Authentication** | **5** |
| **9** | **Media Streaming, Catalog & Subscription Integration** | **5** |
| **10** | **Testing & Challenges** | **6** |
| **11** | **Future Scope** | **6** |
| **12** | **Input-Output Examples & UI Demonstrations** | **7–9** |
| **13** | **Member Contributions (Detailed Work Distribution)** | **10–11** |
| **14** | **References** | **12** |
| **15** | **Conclusion & Source Code** | **12** |

---
\pagebreak

# 1. INTRODUCTION

**Netflix Clone (Streamly)** is a modern, high-performance, full-stack video-on-demand streaming web application designed to emulate the rich user experience, responsive interface, and robust cloud architecture of commercial streaming services such as Netflix. The system integrates a dynamic, animated client-side Single Page Application (SPA) built with React 19, TypeScript, and Tailwind CSS with a resilient, secure RESTful API backend powered by Node.js, Express.js, and MongoDB.

Users can register for an account, choose customized subscription tiers, log in securely via JSON Web Token (JWT) authentication, create and manage up to five personalized viewer profiles (including specialized Kids profiles), browse dynamically categorized movies and TV shows, watch high-definition video streams with an interactive custom media player, save titles to a personalized watchlist ("My List"), track playback progress across sessions, and manage billing profiles through Stripe integration. Additionally, the platform provides a comprehensive administrative dashboard with real-time metrics, user management, and content catalog CRUD controls.

---

# 2. OBJECTIVES & PROBLEM STATEMENT

### Objectives
- **Develop a High-End Video Streaming Web Application:** Deliver a pixel-perfect, highly responsive dark-themed UI mirroring Netflix's industry-standard user experience.
- **Implement Secure Authentication & Session Management:** Utilize salted cryptographic password hashing (bcryptjs) and stateless JSON Web Tokens (JWT) stored in secure HTTP-only cookies.
- **Multi-Profile Viewer Environment:** Provide support for up to five user profiles per account with custom avatars, PIN code security, and parental control Kids Mode filtering.
- **Dynamic Media Discovery & Streaming Engine:** Implement dynamic Hero featured banners, horizontal sliding carousels, genre-based filtering, instant debounced search, and interactive detail modals.
- **Custom Interactive Media Player:** Build an on-demand video player featuring custom scrubbers, playback rate adjustment, audio/subtitle toggling, 10-second skip/rewind, and resume-from-last-watched position tracking.
- **Payment Gateway Integration:** Incorporate Stripe payment workflows for subscription plan billing and membership management.
- **Administrative Portal & Analytics:** Provide administrators with role-based access control (RBAC), real-time user metrics, content catalog editing, and subscription plan management.
- **Demonstrate Full-Stack Engineering Excellence:** Apply clean architecture, modular TypeScript patterns, robust error handling, and comprehensive API testing.

### Problem Statement
Traditional media streaming and educational video delivery platforms often suffer from rigid user interfaces, lack of multi-profile personalization, vulnerable authentication workflows, poor responsive scaling, and complicated subscription management. **Netflix Clone (Streamly)** addresses these limitations by providing a scalable, end-to-end full-stack streaming architecture that delivers low-latency media browsing, fine-grained profile segregation, role-based security, automated watch history synchronization, and secure digital payment processing in a single unified web platform.

---

# 3. TECHNOLOGIES & SYSTEM REQUIREMENTS

### Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** | Component-based declarative UI and efficient Virtual DOM rendering |
| **Language (Frontend)** | **TypeScript** | Static typing, interface definitions, and compile-time error prevention |
| **Build Tool & Bundler** | **Vite (v6)** | High-speed Hot Module Replacement (HMR) and optimized production builds |
| **Styling & Design System**| **Tailwind CSS (v4)** | Utility-first responsive styling, smooth dark themes, and custom layout tokens |
| **Animations** | **Motion (Framer Motion)**| Smooth page transitions, startup logo unfolding splash, and card hover effects |
| **Routing** | **React Router DOM (v7)** | Client-side dynamic routing, protected route guards, and URL parameter handling |
| **Icons** | **Lucide React** | Modern, lightweight, accessible SVG iconography |
| **Backend Runtime** | **Node.js (v20+)** | Non-blocking, event-driven server-side JavaScript runtime environment |
| **Web Framework** | **Express.js (v4.21)** | RESTful API routing, middleware chaining, and HTTP request handling |
| **Database** | **MongoDB / MongoDB Atlas** | Scalable NoSQL document database for users, profiles, media, and plans |
| **ODM** | **Mongoose (v8.10)** | Schema modeling, data validation, population, and database indexing |
| **Authentication** | **JWT (jsonwebtoken)** | Cryptographically signed access and refresh tokens for stateless auth |
| **Security** | **bcryptjs** | Salted cryptographic password hashing |
| **Middleware Security** | **Helmet & Express Rate Limit**| HTTP security headers, CORS origin protection, and brute-force mitigation |
| **Data Validation** | **Zod** | Strict schema validation for incoming client request payloads |
| **Payments** | **Stripe API (@stripe/stripe-js)** | Secure credit card processing, payment intents, and plan subscriptions |
| **Version Control** | **Git & GitHub** | Distributed source code version control and team collaboration |
| **Testing Tools** | **Vitest, Jest, Supertest** | Automated unit testing, REST API integration testing, and load verification |

---
\pagebreak

### System Requirements

#### Hardware Requirements
- **Processor:** Dual-Core 2.0 GHz or higher (Intel Core i3/i5/i7 or AMD Ryzen equivalent).
- **RAM:** Minimum 4 GB RAM (8 GB recommended for optimal multi-container or full-stack development).
- **Storage:** Minimum 2 GB free disk space for Node.js modules, MongoDB database storage, and media caching.
- **Peripherals:** Standard keyboard, pointing device (mouse/touchpad), and high-definition display (1080p recommended).
- **Network:** Stable broadband internet connection (minimum 5 Mbps for seamless video streaming).

#### Software Requirements
- **Operating System:** Windows 10/11, macOS, or Linux (Ubuntu 20.04+).
- **Runtime Environment:** Node.js v18.x or v20.x+ with Node Package Manager (npm v9+).
- **Database Server:** MongoDB Community Server v6.0+ or MongoDB Atlas Cloud Cluster.
- **Web Browser:** Google Chrome (v110+), Microsoft Edge, Mozilla Firefox, or Brave with HTML5 Video and JavaScript enabled.
- **Development Tools:** Visual Studio Code IDE, Git CLI, Postman API Client, and Browser Developer Tools.

---

# 4. MAJOR FEATURES

- **Animated Cinematic Splash Screen:** Left-to-right letter unfolding startup animation with crimson glow and smooth route suspense fallback preloaders.
- **Robust User Authentication & Security:** Complete registration, login, logout, password recovery flow, bcrypt password hashing, and JWT authorization with HTTP-only cookies.
- **Multi-Profile Management System:** Support for up to 5 profiles per account, customizable avatars, parental control Kids Mode (content filtering), and profile-specific PIN protection.
- **Dynamic Browse Dashboard:** Feature-rich homepage with auto-playing muted Hero video banner, audio toggles, and metadata overlays.
- **Categorized Media Carousel Rows:** Infinite-style horizontal carousels with smooth scrolling buttons, lazy loading, and hover expansion preview cards with quick actions.
- **Real-Time Search & Genre Filtering:** Instant search with query debouncing, live result grid, and dynamic genre tag filtering across movies and TV shows.
- **Rich Media Info Modal:** Interactive pop-up with embedded trailer preview, synopsis, match percentage, release year, age certification, cast, audio/subtitles, and similar recommendations.
- **Custom Interactive Video Player:** Immersive video player with custom controls, time scrubber, volume slider, 10s skip/rewind, playback speed controller (0.5x to 2x), subtitle/audio selectors, and auto-next episode triggers.
- **Persistent Watchlist ("My List") & Watch History:** Real-time bookmarking and automatic playback timestamp synchronization stored per profile in MongoDB.
- **Subscription Plans & Stripe Checkout:** Multiple subscription tiers (Mobile, Basic, Standard, Premium) with dynamic billing cycles and secure Stripe payment integration.
- **Comprehensive Admin Management Dashboard:** Role-protected admin portal with platform analytics (active users, MRR, catalog size), user management CRUD, video catalog editor, and subscription plan controllers.

---

# 5. SYSTEM ARCHITECTURE & WORKFLOW

### System Architecture
The Netflix Clone (Streamly) platform is engineered following a modern **3-Tier Client-Server Architecture**:
1. **Presentation Tier (Frontend Client):** A Single Page Application (SPA) built with React 19, TypeScript, and Tailwind CSS. It communicates with the backend via asynchronous HTTP requests (`Fetch API` / `Axios`) with credentials included for secure cookie exchange.
2. **Application / Business Logic Tier (REST API Server):** An Express.js application running on Node.js. It manages route middleware, request rate limiting, input validation via Zod, JWT token verification, password hashing, payment intent processing, and catalog curation.
3. **Data Tier (Database):** A MongoDB database managed via Mongoose ODM, utilizing normalized schemas for Users, Profiles, Media Catalog items, Subscription Plans, and System Notifications, complete with compound indexing for low-latency queries.

```
+-----------------------------------------------------------------------------------+
|                            PRESENTATION TIER (React 19 SPA)                       |
|   [ Startup Splash ] <---> [ Navbar & Search ] <---> [ Browse & Hero Banner ]     |
|   [ Profiles & Auth ] <---> [ Info Modal ] <---> [ Custom Video Player ]          |
|   [ Stripe Checkout ] <---> [ My List / History ] <---> [ Admin Control Panel ]   |
+-----------------------------------------------------------------------------------+
                                         |
                                         |  HTTPS REST API (JSON / Cookies)
                                         v
+-----------------------------------------------------------------------------------+
|                        APPLICATION TIER (Node.js & Express REST API)               |
|   [ Helmet & Rate Limiters ]  --->  [ JWT Auth Middleware ]                       |
|   [ Auth Controller ]   [ Profile Controller ]   [ Media & Catalog Controller ]   |
|   [ Stripe Payment Controller ]                  [ Admin Analytics Controller ]   |
+-----------------------------------------------------------------------------------+
                                         |
                                         |  Mongoose ODM (BSON)
                                         v
+-----------------------------------------------------------------------------------+
|                               DATA TIER (MongoDB Database)                        |
|   [ Users Collection ]       [ Profiles Collection ]     [ Media Catalog ]        |
|   [ Subscription Plans ]     [ Notifications ]           [ Watch History ]        |
+-----------------------------------------------------------------------------------+
```

### System Workflow
$$\text{User Registration/Login} \longrightarrow \text{JWT Authentication} \longrightarrow \text{Profile Selection} \longrightarrow \text{Catalog Browse} \longrightarrow \text{Media Details} \longrightarrow \text{Video Streaming \& Progress Save} \longrightarrow \text{Subscription Upgrade (Stripe)} \longrightarrow \text{Admin Oversight}$$

1. **User Access & Auth:** The user visits the application, watches the animated startup splash, and registers or logs in. Credentials are validated, passwords hashed with bcrypt, and a signed JWT is returned via an HTTP-only cookie.
2. **Profile Selection:** The user selects or creates a viewer profile (specifying avatar, profile name, and optional Kids mode / PIN protection).
3. **Content Discovery:** The client loads personalized browse data from `/api/v1/media/browse`. The user interacts with the Hero banner, filters genres, or searches titles.
4. **Media Details & Playback:** Clicking a title triggers the `InfoModal` or directly launches the `Watch` page. The custom video player initializes playback, checks for previously saved watch progress, and streams the media.
5. **Progress & List Sync:** As the video plays, progress timestamps are periodically dispatched to `/api/v1/profiles/:id/history`. Users can toggle titles into `/api/v1/profiles/:id/mylist`.
6. **Billing & Administration:** Users can select subscription plans through Stripe. System administrators access `/admin` to monitor KPIs, manage user accounts, and update catalog items.

---
\pagebreak

# 6. MODULE DESCRIPTION

### 1. User Authentication & Authorization Module
Manages user account registration, credential authentication, session persistence, and password recovery. Uses bcrypt for salted password hashing (10 salt rounds) and generates cryptographically signed JWT tokens with 7-day expiration. Includes rate limiting on login routes to prevent brute-force attacks.

### 2. Multi-Profile Management Module
Enables up to five isolated user profiles per master account. Each profile maintains its own display name, avatar icon, Kids content restriction flag, 4-digit security PIN, independent "My List" bookmarks, and watch history records.

### 3. Browse & Hero Banner Discovery Module
Fetches and aggregates categorized media collections (Trending Now, Top 10 Today, Action Movies, TV Dramas, Comedies, Sci-Fi & Fantasy, Documentaries). Features an automated Hero Banner that displays featured release details with background video trailer playback, audio toggle, and quick play buttons.

### 4. Search & Genre Filtering Module
Provides high-speed, live search across movie and TV show titles, cast members, and keywords with debounced input processing. Includes dynamic genre filter bars allowing instant content sorting.

### 5. Custom Video Streaming & Media Player Module
A custom-built HTML5 video player providing play/pause controls, dynamic time scrub bar, volume and mute control, 10-second skip forward/backward, playback speed modifier (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x), subtitle/audio track picker, picture-in-picture mode, fullscreen toggle, and auto-advancing next episode triggers.

### 6. Watchlist ("My List") & Playback History Module
Allows users to bookmark movies and TV series to their personal watchlist with real-time UI state toggles. Tracks playback timestamps to enable seamless "Resume Watching" across sessions and devices.

### 7. Subscription & Stripe Payment Module
Integrates the Stripe API to handle credit card validation, payment intent creation, and subscription status updates across Basic, Standard, and Premium tiers.

### 8. Admin Control Panel & Analytics Module
A role-protected administrative suite featuring KPI summary cards (Total Users, Active Subscriptions, Total Catalog Titles, Monthly Recurring Revenue), real-time user management CRUD, video catalog management CRUD, and subscription plan pricing editors.

---

# 7. FRONTEND IMPLEMENTATION

The frontend is constructed with **React 19**, **TypeScript**, and **Vite**, prioritizing performance, visual aesthetics, and modularity:
- **Design System & Aesthetics:** Built using Tailwind CSS v4 with curated dark-theme color palettes (pure black `#141414`, crimson accent `#e50914`, translucent glassmorphic overlays, and Google Outfit typography).
- **Startup Splash & Micro-Animations:** Motion (Framer Motion) powers the signature left-to-right letter unfolding startup splash screen, animated route transitions via `AnimatePresence`, and hover expansion cards.
- **State Management:** Centralized state managed via the `AppProvider` React Context, synchronizing active user credentials, active profiles, global watchlist, theme preferences, and global toast notifications.
- **Routing & Route Guards:** Utilizes React Router DOM v7 with lazy-loaded page modules (`React.lazy` and `Suspense`) and specialized `AdminRouteGuard` components to prevent unauthorized access.
- **Responsive Layout:** Engineered with fluid responsive breakpoints supporting screens from mobile viewports (320px) up to ultra-wide 4K displays.

---

# 8. BACKEND, DATABASE & AUTHENTICATION

The backend is built using **Node.js**, **Express.js**, and **MongoDB with Mongoose ODM**:
- **RESTful API Design:** Modular controller-route structure partitioned into `/auth`, `/profiles`, `/media`, `/payments`, and `/admin`.
- **Database Modeling:** Schemas with strict type definitions:
  - `User`: Email, hashed password, role (`user` / `admin`), subscription tier, billing history, and active status.
  - `Profile`: User reference, profile name, avatar URL, isKids flag, PIN code, my-list array, and watch history array.
  - `Media`: Title, description, type (`movie` / `tv`), genres, release year, age rating, duration, video URL, trailer URL, thumbnail, backdrop, cast, and trending score.
  - `Plan`: Plan name, price, resolution (HD/4K), screen limits, and Stripe price ID.
- **Security & Middleware:** HTTP security headers via `helmet`, CORS configuration, `express-rate-limit` for rate limiting, Zod schema validation, and centralized async error handling middleware.
- **Authentication Workflow:**
$$\text{Client Credentials} \xrightarrow{\text{POST /login}} \text{Rate Limiter} \xrightarrow{\text{Zod Validate}} \text{Find User} \xrightarrow{\text{bcrypt.compare}} \text{Sign JWT} \xrightarrow{\text{Set HttpOnly Cookie}} \text{Response}$$

---

# 9. MEDIA STREAMING, CATALOG & SUBSCRIPTION INTEGRATION

- **Media Pipeline & Caching:** The backend provides seamless media streaming and catalog metadata. The server integrates a local seeded MongoDB catalog paired with dynamic TMDB (The Movie Database) live API proxying and memory caching to guarantee high availability and fast response times.
- **Video Progress Synchronization:** Video playback emits heartbeat updates every 5 seconds to the backend `/history` endpoint, preserving the exact timestamp, duration, and completion status.
- **Stripe Billing Integration:** Implements the official Stripe Node.js SDK and `@stripe/react-stripe-js` on the frontend, handling card tokenization, payment confirmation, and automated account tier upgrades.

---
\pagebreak

# 10. TESTING & CHALLENGES

### Testing Procedures
- **Authentication & Security Testing:** Validated registration, login, token issuance, invalid credential rejection, password hashing verification, and route protection using Postman and Jest.
- **Profile & Data Isolation Testing:** Verified that watchlist items, watch progress, and Kids Mode content restrictions remain strictly isolated between different profiles of the same user.
- **Media Browsing & Video Streaming Testing:** Tested carousel scrolling, debounced search queries, modal previews, video player playback rates, time scrubbing, and fullscreen toggling across Chrome, Edge, and Firefox.
- **Payment & Stripe Integration Testing:** Executed test card transactions using Stripe test tokens and validated subscription tier activations.
- **API Integration & Stress Testing:** Automated REST API endpoint verification with Supertest and performed concurrent connection stress testing using Autocannon.

### Challenges Faced & Solutions
1. **Challenge:** Synchronizing video playback timestamps in real time without overwhelming the server.  
   **Solution:** Implemented client-side throttling with a 5-second interval heartbeat and debounced state dispatches on player pause or unmount events.
2. **Challenge:** Crafting a smooth, Netflix-style hover card preview with video playback inside overflowing horizontal carousels without clipping.  
   **Solution:** Utilized Framer Motion with CSS portal layers and dynamic z-index elevation, ensuring hover cards expand above neighboring carousels.
3. **Challenge:** Mitigating brute-force attacks and ReDoS (Regular Expression Denial of Service) vulnerabilities on search endpoints.  
   **Solution:** Integrated `express-rate-limit` on authentication endpoints and sanitized all search inputs using regex character escaping before executing database queries.
4. **Challenge:** Preserving admin security and preventing client-side privilege escalation.  
   **Solution:** Enforced strict server-side Role-Based Access Control (`adminOnly` middleware) verifying JWT claims directly against MongoDB records.

---

# 11. FUTURE SCOPE

- **Adaptive Bitrate Video Streaming (HLS / DASH):** Integration of HTTP Live Streaming (HLS) with ffmpeg encoding to dynamically adjust video resolution based on network bandwidth.
- **AI-Powered Recommendation Engine:** Implementation of machine learning collaborative filtering algorithms (TensorFlow.js / Python microservice) to generate hyper-personalized movie suggestions.
- **Watch Party & Synchronized Live Viewing:** Implementation of WebSockets (Socket.io) to enable multi-user synchronized video playback with real-time text and voice chat.
- **Offline Video Downloads (PWA):** Integration of Service Workers and IndexedDB to support offline video caching and download management on mobile and desktop devices.
- **Multi-Language Audio & Subtitle Parsing:** Dynamic parsing of `.vtt` and `.srt` subtitle tracks with multi-language audio track switching inside the custom player.
- **Cloud Native Deployment & Global CDN:** Containerization using Docker and orchestration with Kubernetes, paired with AWS CloudFront CDN for global, low-latency video streaming.

---
\pagebreak

# 12. INPUT AND OUTPUT EXAMPLES

### 12.1 User Registration & Plan Selection
- **Input:** Name: `Rajkrishna Das`, Email: `rajkrishna@streamly.com`, Password: `Password@123`, Selected Plan: `Premium (4K Ultra HD)`.
- **Output:** Account successfully created in MongoDB, password salted and hashed with bcrypt, JWT issued, and user redirected to profile setup.

```
+-----------------------------------------------------------------------+
|  STREAMLY                             Sign In  |  Help                |
|                                                                       |
|                     Create a password to start                        |
|                          your membership                              |
|                                                                       |
|       [ Name: Rajkrishna Das                                    ]     |
|       [ Email: rajkrishna@streamly.com                          ]     |
|       [ Password: ••••••••••••••                                ]     |
|       [ Plan: Premium ($19.99/mo - 4K+HDR)                     v]     |
|                                                                       |
|                       [  Get Started  >  ]                            |
|                                                                       |
|  * By clicking Get Started, you agree to our Terms of Service.        |
+-----------------------------------------------------------------------+
```

### 12.2 User Login & Authentication
- **Input:** Email: `demo@streamly.com`, Password: `Password123`.
- **Output:** Credentials verified against MongoDB; JWT set into HTTP-only cookie; user redirected to Profile Selection.

```
+-----------------------------------------------------------------------+
|  STREAMLY                                                             |
|                                                                       |
|                     +---------------------------+                     |
|                     | Sign In                   |                     |
|                     |                           |                     |
|                     | [ Email or phone number ] |                     |
|                     | [ Password              ] |                     |
|                     |                           |                     |
|                     |       [ Sign In ]         |                     |
|                     |                           |                     |
|                     | [x] Remember me   Need help?|                   |
|                     |                           |                     |
|                     | New to Streamly? Sign up  |                     |
|                     +---------------------------+                     |
+-----------------------------------------------------------------------+
```

### 12.3 Multi-Profile Selection & Kids Mode
- **Input:** User clicks profile "Rajkrishna" or adds a new profile with Kids Mode enabled.
- **Output:** Active profile ID stored in session state; content catalog filtered accordingly; user redirected to `/browse`.

```
+-----------------------------------------------------------------------+
|  STREAMLY                                                             |
|                                                                       |
|                          Who's watching?                              |
|                                                                       |
|     +-----------+     +-----------+     +-----------+     +-------+   |
|     |  [Avatar] |     |  [Avatar] |     |   [Kids]  |     |  (+)  |   |
|     |           |     |           |     |           |     |  Add  |   |
|     |Rajkrishna |     |  Sudipto  |     |   Junior  |     |Profile|   |
|     +-----------+     +-----------+     +-----------+     +-------+   |
|                                                                       |
|                        [ Manage Profiles ]                            |
+-----------------------------------------------------------------------+
```

---
\pagebreak

### 12.4 Browse Page & Dynamic Hero Video Banner
- **Input:** User navigates to `/browse`.
- **Output:** Featured movie trailer auto-plays in the Hero section with mute toggle; categorized horizontal movie rows populate smoothly below.

```
+-----------------------------------------------------------------------+
|  STREAMLY   Home   TV Shows   Movies   New & Popular   My List   [Q] [!] [V]|
|                                                                       |
|   =================================================================   |
|   |  STRANGER THINGS                                              |   |
|   |  When a young boy vanishes, a small town uncovers a mystery  |   |
|   |  involving secret experiments and terrifying supernatural forces| |
|   |                                                               |   |
|   |  [ > Play ]   [ (i) More Info ]                    [(<) Audio] |   |
|   =================================================================   |
|                                                                       |
|   Trending Now                                                        |
|   [Movie 1]  [Movie 2]  [Movie 3]  [Movie 4]  [Movie 5]  [Movie 6] >  |
|                                                                       |
|   Top 10 Movies in India Today                                        |
|   [ 1 ] [Poster]   [ 2 ] [Poster]   [ 3 ] [Poster]   [ 4 ] [Poster] > |
|                                                                       |
|   Action & Adventure                                                  |
|   [Movie A]  [Movie B]  [Movie C]  [Movie D]  [Movie E]  [Movie F] >  |
+-----------------------------------------------------------------------+
```

### 12.5 Title Details & Info Modal View
- **Input:** User clicks "More Info" on a media card.
- **Output:** Detailed modal pop-up opens with video trailer preview, match percentage, release year, age rating, full cast, genres, and a grid of similar recommended titles.

```
+-----------------------------------------------------------------------+
|  +-----------------------------------------------------------------+  |
|  | [ Video Trailer Preview Area with Auto-Playback ]               |  |
|  |                                                         [ (X) ] |  |
|  | STRANGER THINGS                                                 |  |
|  | [ > Resume S1:E3 ]   [ (+) My List ]   [ (thumbs up) ]          |  |
|  |                                                                 |  |
|  | 98% Match   2024   4 Seasons   Ultra HD 4K   Spatial Audio   [16+] |
|  |                                                                 |  |
|  | Synopsis: When a young boy vanishes, a small town uncovers a    |  |
|  | mystery involving secret experiments and terrifying forces...   |  |
|  | Cast: Millie Bobby Brown, Finn Wolfhard, Winona Ryder           |  |
|  | Genres: Sci-Fi, Horror, Drama, Mystery                          |  |
|  |                                                                 |  |
|  | More Like This:                                                 |  |
|  | [ Dark ]       [ Locke & Key ]      [ The Witcher ]             |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
```

### 12.6 Custom Video Streaming Player with Controls
- **Input:** User clicks "Play" on any movie or episode.
- **Output:** High-definition video player launches fullscreen with interactive controls, time scrubbers, speed modifier, audio/subtitle selectors, and automated progress tracking.

```
+-----------------------------------------------------------------------+
|  (< Back)   Stranger Things - S1:E1 "Chapter One: The Vanishing"      |
|                                                                       |
|                                                                       |
|                      [  HD VIDEO PLAYBACK AREA  ]                     |
|                                                                       |
|                                                                       |
|  -------------------------------------------------------------------  |
|  [||]  [(< 10s)]  [(10s >)]  [(#) Volume]   24:15 / 48:30             |
|                                     [1.0x Speed] [Subtitles] [Next] [Full]|
+-----------------------------------------------------------------------+
```

---
\pagebreak

### 12.7 Watchlist ("My List") Management
- **Input:** User clicks `+` icon on any media item.
- **Output:** Media ID appended to profile's `myList` array in MongoDB; instant visual checkmark confirmation; item rendered in `/my-list`.

```
+-----------------------------------------------------------------------+
|  STREAMLY   Home   TV Shows   Movies   New & Popular   My List (4)    |
|                                                                       |
|  My List                                                              |
|  +----------------+  +----------------+  +----------------+           |
|  | [Poster Card]  |  | [Poster Card]  |  | [Poster Card]  |           |
|  | Inception      |  | Interstellar   |  | Breaking Bad   |           |
|  | [ > Play ] [v] |  | [ > Play ] [v] |  | [ > Play ] [v] |           |
|  +----------------+  +----------------+  +----------------+           |
+-----------------------------------------------------------------------+
```

### 12.8 Subscription Plans & Stripe Checkout
- **Input:** User selects plan tier and enters credit card details in `StripePaymentModal`.
- **Output:** Stripe Payment Intent confirmed; user subscription tier updated in MongoDB to "Premium".

```
+-----------------------------------------------------------------------+
|                    Set up your credit or debit card                   |
|                                                                       |
|     Selected Plan: Premium ($19.99 / month - 4K UHD + HDR)            |
|                                                                       |
|     Card Number:      [ 4242 •••• •••• 4242              [VISA] ]     |
|     Expiration Date:  [ MM / YY ]       CVC: [ CVC ]                  |
|     Name on Card:     [ Rajkrishna Das                          ]     |
|                                                                       |
|                 [  Start Membership (Pay $19.99)  ]                  |
|                                                                       |
|     End-to-End 256-bit Encrypted SSL Checkout via Stripe              |
+-----------------------------------------------------------------------+
```

### 12.9 Administrative Dashboard & Analytics Portal
- **Input:** Admin user logs into `/admin/login` and navigates to `/admin`.
- **Output:** Analytics KPI overview, real-time user tables, catalog editor, and subscription plan controllers.

```
+-----------------------------------------------------------------------+
|  STREAMLY ADMIN PORTAL                             Admin | [ Logout ] |
|                                                                       |
|  [ Total Users: 1,420 ]     [ Active Subs: 1,180 ]     [ MRR: $18,450 ]|
|  [ Total Media: 340   ]     [ Active Streams: 85 ]     [ Server: 99.9%]|
|                                                                       |
|  User Management                      [ + Add New User ]              |
|  +--------------------+-----------------------+------------+--------+ |
|  | Email              | Plan                  | Role       | Action | |
|  | raj@streamly.com   | Premium ($19.99)      | User       | [Edit] | |
|  | sudipto@streamly...| Standard ($14.99)     | User       | [Edit] | |
|  | admin@streamly.com | Master                | Admin      | [View] | |
|  +--------------------+-----------------------+------------+--------+ |
|                                                                       |
|  Catalog Management                   [ + Add New Title ]             |
|  [ Title: Stranger Things ]  [ Type: TV ]  [ 4K UHD ]  [Edit] [Delete]|
+-----------------------------------------------------------------------+
```

---
\pagebreak

# 13. MEMBER CONTRIBUTION

### **Member 1 – Rajkrishna Das**
- **Student Name:** Rajkrishna Das
- **College ID (UID):** TNU2023020100030
- **College Name:** THE NEOTIA UNIVERSITY
- **Assigned Project Role:** Full Frontend Development, UI/UX Architecture & Client-Side Integration

#### Key Contributions & Deliverables:
- **Core Architecture & UI Design System:**
  - Architected the complete Single Page Application (SPA) utilizing React 19, TypeScript, and Vite.
  - Implemented the entire design system using Tailwind CSS v4, creating reusable components, custom dark theme palettes (`#141414`, `#e50914`), typography hierarchies, and glassmorphic overlays.
  - Developed the animated cinematic **Startup Splash Screen** featuring a left-to-right letter unfolding transition with crimson radial glows using Motion (Framer Motion).
  - Built the fallback route loading spinner wave animation for React Suspense transitions.

- **Page Layouts & Component Engineering:**
  - Developed the dynamic **Navbar** (`Navbar.tsx`) with transparent-to-black scroll responsiveness, notification dropdowns, live search input, and profile switcher.
  - Built the **Home Landing Page** (`Home.tsx`) featuring hero email registration, feature benefit sections, and an interactive accordion FAQ component (`FAQ.tsx`).
  - Implemented client-side **Authentication Pages** (`Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`) with password visibility toggles, strength meters, demo credential auto-fill helpers, and input validation.
  - Engineered the **Multi-Profile Management System** (`Profiles.tsx`) enabling profile creation, custom avatar selection, PIN code protection, and Kids mode toggling.
  - Built the main **Browse Page** (`Browse.tsx`), **Movies Page** (`Movies.tsx`), **TV Shows Page** (`TVShows.tsx`), and **New & Popular Page** (`NewPopular.tsx`) with genre filtering bars (`GenreFilterBar.tsx`).
  - Created the horizontal **Movie Carousel Rows** (`MovieRow.tsx`) featuring smooth left/right slider controls, responsive breakpoints, lazy loading, and hover expansion preview cards.
  - Developed the rich **Title Details Modal** (`InfoModal.tsx`) and dedicated title page (`TitleDetail.tsx`) showing trailers, match score, audio/subtitle tags, cast lists, and similar title recommendations.

- **Custom Media Player & Account Features:**
  - Built the complete **Custom Video Streaming Player** (`Watch.tsx`) supporting play/pause, time scrubber, volume slider, 10s skip/rewind, playback speed controller (0.5x to 2x), subtitle/audio track picker, picture-in-picture, fullscreen, and auto-next episode triggers.
  - Developed the **My List Page** (`MyList.tsx`) and **Live Search Page** (`Search.tsx`) with instant query debouncing and result grids.
  - Built the **Account Settings Page** (`Account.tsx`) allowing users to manage subscription tiers, view simulated invoice histories, update payment cards, and configure security settings.
  - Engineered the **Admin Portal UI** (`Admin.tsx`, `AdminLogin.tsx`, `AdminRouteGuard.tsx`) with analytical KPI cards, user management tables, catalog editors, and plan managers.
  - Configured client-side state management using React Context (`AppProvider.tsx`), global toast notification alerts (`ToastContainer.tsx`), and REST API communication utilities (`api.ts`).

---
\pagebreak

### **Member 2 – Sudipto Gayen**
- **Student Name:** Sudipto Gayen
- **College ID (UID):** TNU2023020100022
- **College Name:** THE NEOTIA UNIVERSITY
- **Assigned Project Role:** Full Backend Development, Database Modeling & Server Architecture

#### Key Contributions & Deliverables:
- **Server Architecture & Database Design:**
  - Architected and implemented the production-grade Node.js and Express.js REST API server using TypeScript and modern ES Modules (`NodeNext`).
  - Designed and configured the NoSQL database schemas in MongoDB using Mongoose ODM for `User`, `Profile`, `Media`, `Plan`, and `Notification` models with compound indexing.
  - Configured resilient database connection pooling, reconnect logic, and database health monitoring endpoints (`/health`).
  - Created database seeding utilities (`seedData.ts`) to populate MongoDB with demo users, subscription tiers, and media catalogs.

- **Authentication, Security & Middleware Engineering:**
  - Built the secure authentication engine (`authController.ts`, `authRoutes.ts`) implementing salted password hashing using `bcryptjs` (10 salt rounds).
  - Implemented stateless JSON Web Token (JWT) issuance and verification with secure `httpOnly`, `sameSite`, and `secure` cookie configurations.
  - Developed token validation middlewares (`protect`, `adminOnly`) supporting Role-Based Access Control (RBAC) to guard privileged endpoints.
  - Integrated HTTP security headers via `helmet`, cross-origin resource sharing via `cors`, and request rate limiting via `express-rate-limit` to prevent brute-force and DDoS attacks.
  - Implemented strict request payload validation schemas using Zod and centralized asynchronous error-handling middleware (`errorHandler.ts`).

- **RESTful API Controllers & Business Logic:**
  - Engineered **Profile REST APIs** (`profileController.ts`, `profileRoutes.ts`) supporting profile CRUD operations, avatar assignment, Kids mode filters, My List toggles, and video playback progress tracking.
  - Developed **Media & Catalog APIs** (`mediaController.ts`, `mediaRoutes.ts`) supporting categorized content queries, debounced search with ReDoS regex sanitization, and TMDB live API proxy caching.
  - Built **Admin Management APIs** (`adminController.ts`, `adminRoutes.ts`) for real-time analytics aggregation (user counts, active subscriptions, revenue calculations), user CRUD, video catalog management, and plan configuration.
  - Integrated **Stripe Payment Gateway** (`paymentController.ts`, `paymentRoutes.ts`) to process payment intents, validate credit card checkouts, and automatically update user subscription tiers.
  - Engineered **Notification APIs** (`notificationController.ts`, `notificationRoutes.ts`) for system alert broadcasts and read state tracking.

- **Quality Assurance & Performance Optimization:**
  - Conducted extensive API endpoint integration testing using Supertest and Jest.
  - Performed server stress testing and concurrent load verification using Autocannon.
  - Optimized MongoDB query execution times through field projection and compound indexing.

---
\pagebreak

# 14. REFERENCES

1. **React 19 Documentation:** Official Guide and API Reference — *https://react.dev*
2. **TypeScript Documentation:** Typed JavaScript at Any Scale — *https://www.typescriptlang.org*
3. **Node.js Documentation:** Node.js v20 LTS Server Runtime API — *https://nodejs.org*
4. **Express.js Framework Reference:** Fast, unopinionated, minimalist web framework for Node.js — *https://expressjs.com*
5. **MongoDB & Mongoose Documentation:** Elegant MongoDB object modeling for Node.js — *https://mongoosejs.com*
6. **JSON Web Token (JWT) Standards (RFC 7519):** Stateless authentication standard — *https://jwt.io*
7. **Stripe API Documentation:** Online payment processing for internet businesses — *https://stripe.com/docs*
8. **Tailwind CSS Documentation:** Utility-first CSS framework for modern web development — *https://tailwindcss.com*
9. **Motion (Framer Motion) Documentation:** Declarative animations and gestures for React — *https://motion.dev*
10. **The Movie Database (TMDB) API Documentation:** Media metadata and image catalog API — *https://developer.themoviedb.org*
11. **MDN Web Docs:** HTML5 Video API, Web APIs, CSS Flexbox & Grid — *https://developer.mozilla.org*

---

# 15. CONCLUSION

The **Netflix Clone (Streamly)** project successfully demonstrates the design, development, and deployment of an enterprise-grade, full-stack video streaming web application. By combining the reactive rendering capabilities of React 19, the type safety of TypeScript, the speed of Vite, and the rich styling of Tailwind CSS on the frontend with the asynchronous power of Node.js, Express.js, and MongoDB on the backend, the platform delivers an authentic, high-performance streaming service.

Key accomplishments include seamless multi-profile management with Kids Mode filtering, real-time debounced catalog searching, a custom interactive media player with playback progress synchronization, end-to-end token-based security with HTTP-only cookies, Stripe payment gateway integration, and a comprehensive administrative portal.

Throughout this project, the team gained hands-on expertise in full-stack architecture design, NoSQL database optimization, JWT authentication security, asynchronous REST API engineering, state management, and modern UI/UX design.

---

### **SOURCE CODE REPOSITORY**
- **Project Name:** NETFLIX CLONE (STREAMLY)
- **Group:** GROUP B
- **Source Code Repository:** [GitHub - Netflix Clone](https://github.com/Rajlusifar1913/netflix-clone)
