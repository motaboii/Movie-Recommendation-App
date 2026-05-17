# 🎬 CineAI — Movie Recommendation System

> A full-stack, AI-powered movie recommendation platform built with Next.js 14, Supabase, and FastAPI.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%2B%20Auth-green?style=flat-square&logo=supabase)
![FastAPI](https://img.shields.io/badge/FastAPI-ML%20Engine-teal?style=flat-square&logo=fastapi)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-blue?style=flat-square&logo=tailwindcss)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?style=flat-square&logo=docker)

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Supabase Setup](#supabase-setup)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [API Documentation](#api-documentation)
- [Recommendation Engine](#recommendation-engine)
- [Project Structure](#project-structure)

---

## 🏗 Architecture

```
┌─────────────────────┐     ┌──────────────────────┐
│   Next.js Frontend  │────▶│   Supabase           │
│   (Port 3000)       │     │   - PostgreSQL DB     │
│                     │     │   - Auth (JWT)        │
│   App Router        │     │   - Row Level Security│
│   TailwindCSS       │     └──────────────────────┘
│   Zustand           │
│                     │     ┌──────────────────────┐
│                     │────▶│   FastAPI Backend    │
└─────────────────────┘     │   (Port 8000)        │
                            │   - ML Recommender   │
                            │   - TF-IDF + SVD     │
                            └──────────────────────┘
```

---

## ✨ Features

- **🔐 Authentication** — Supabase Auth (email/password) with profile management
- **🎬 Movie Browsing** — Search, filter by genre, paginated grid view
- **🤖 AI Recommendations** — Hybrid ML engine (content-based + collaborative filtering)
- **❤️ Favorites** — Save and manage favorite movies
- **⭐ Ratings** — Rate movies (1-5 stars)
- **📊 Dashboard** — Personal stats, watch history, genre breakdown
- **🛠 Admin Panel** — Add, edit, delete movies
- **📱 Responsive** — Mobile-first design
- **🌙 Dark Theme** — Purple + teal accent color scheme

---

## 🔧 Prerequisites

| Tool | Version | Required For |
|------|---------|-------------|
| Node.js | ≥ 18.x | Frontend |
| npm | ≥ 9.x | Frontend |
| Python | ≥ 3.11 | Backend |
| Docker + Docker Compose | Latest | Full-stack deploy |
| Supabase Account | Free tier | Database + Auth |

---

## 🚀 Quick Start

### 1. Clone and Configure

```bash
cd movie-rec-system
cp .env.example .env
# Fill in your Supabase credentials (see Supabase Setup below)
```

### 2. Run with Docker (Recommended)

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 3. Seed the Database

```bash
cd backend
python seed.py
```

---

## 🗄 Supabase Setup

1. **Create a project** at [supabase.com](https://supabase.com) (free tier is enough)

2. **Run the schema** in SQL Editor (`supabase/schema.sql`):
   - Go to Project → SQL Editor → New Query
   - Paste contents of `supabase/schema.sql`
   - Click "Run"

3. **Get your credentials** from Project Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL` → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` → service_role key (secret!)

4. **Update `.env`** with your values

---

## 💻 Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000
# → API Docs: http://localhost:8000/docs
```

### Seed Database

```bash
cd backend
cp ../.env.example .env  # or use your filled .env
python seed.py
```

### Run Tests

```bash
cd backend
pytest tests/ -v --tb=short
```

---

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild a specific service
docker-compose up --build backend
```

---

## 📡 API Documentation

### FastAPI Endpoints

Interactive docs available at: `http://localhost:8000/docs`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| GET | `/api/recommendations/{user_id}` | Personalized recommendations |
| GET | `/api/recommendations/similar/{movie_id}` | Content-similar movies |

### Supabase (Direct Access)

The frontend calls Supabase directly for:

| Operation | Table |
|-----------|-------|
| GET/SEARCH movies | `movies` |
| User signup/login | `auth.users` (via Supabase Auth) |
| GET/POST favorites | `user_favorites` |
| GET/POST ratings | `user_ratings` |
| GET watch history | `watch_history` |
| GET/UPDATE profile | `profiles` |

---

## 🤖 Recommendation Engine

### Content-Based Filtering (40%)
- TF-IDF vectorization on: genres + director + cast + movie overview
- Cosine similarity matrix computed at server startup
- Returns movies most similar to the user's liked/rated films

### Collaborative Filtering (60%)
- Truncated SVD (50 components) on user-item rating matrix
- Predicts ratings for unseen movies based on similar users' preferences
- Cold-start fallback: uses content-based only for users with < 3 ratings

### Hybrid Merge
```
final_score = 0.4 × content_score + 0.6 × collaborative_score
```
Results are deduplicated and filtered to exclude already-seen movies.

---

## 📁 Project Structure

```
movie-rec-system/
├── frontend/                   # Next.js 14 App
│   ├── app/                    # App Router pages
│   │   ├── (auth)/            # Login, Signup
│   │   ├── browse/            # Movie browser
│   │   ├── dashboard/         # User dashboard
│   │   ├── admin/             # Admin panel
│   │   └── movie/[id]/        # Movie detail
│   ├── components/             # Reusable UI components
│   ├── lib/supabase/          # Supabase clients
│   ├── hooks/                  # Custom React hooks
│   ├── store/                  # Zustand state
│   └── types/                  # TypeScript types
├── backend/                    # FastAPI ML Engine
│   ├── app/
│   │   ├── api/               # Route handlers
│   │   ├── services/          # ML recommender
│   │   └── core/              # Config
│   ├── data/
│   │   ├── movies.csv         # Sample dataset (200+ movies)
│   │   └── ratings.csv        # Sample ratings
│   ├── tests/                  # Pytest tests
│   └── seed.py                 # DB seeder
├── supabase/
│   └── schema.sql              # DB schema + RLS policies
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔒 Security

- **RLS (Row Level Security)** on all tables — users can only access their own data
- **Supabase Auth** handles token refresh, PKCE flow, and session management
- **Service Role Key** is only used server-side (seed script, never in browser)
- CORS restricted to frontend origin in FastAPI

---

## 📝 License

MIT License — free to use and modify.
