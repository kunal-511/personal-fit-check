# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
bun dev          # Start development server (port 3000)
bun run build    # Create optimized production build
bun start        # Run production server
bun run lint     # Run ESLint
```

This project uses **Bun** as the package manager.

## Database Setup

1. Copy `.env.example` to `.env.local` and add your PostgreSQL connection string
2. Run `db/schema.sql` against your database to create tables

## Authentication

Simple PIN-based auth for personal use. Add to `.env.local`:
```
AUTH_PIN=your_pin_here
```

- PIN protects all routes via middleware
- Cookie-based session (30 days)
- Logout via sidebar or header dropdown

## Architecture Overview

**Personal Fitness & Nutrition Tracker** - Full-stack Next.js app with PostgreSQL backend.

### Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes with postgres.js
- **Database**: PostgreSQL (Supabase/Neon/Railway compatible)
- **State**: Zustand (client), TanStack Query ready
- **UI**: Custom components based on shadcn/ui patterns
- **Fonts**: Geist Sans/Mono

### Project Structure

```
app/
├── (dashboard)/
│   ├── layout.tsx           # Dashboard shell with sidebar/nav
│   ├── page.tsx             # Main dashboard
│   ├── nutrition/           # Nutrition tracking
│   ├── workouts/            # Workout logging
│   └── health/              # Health metrics
├── api/
│   ├── nutrition/           # Nutrition API routes
│   ├── workouts/            # Workouts API routes
│   └── health/              # Health API routes
└── layout.tsx

components/
├── ui/                      # Base UI components (button, card, input, etc.)
├── layout/                  # Sidebar, MobileNav, Header
├── nutrition/               # (ready for feature components)
├── workouts/                # (ready for feature components)
└── health/                  # (ready for feature components)

lib/
├── db.ts                    # PostgreSQL client (postgres.js)
├── r2.ts                    # Cloudflare R2 storage client
├── api.ts                   # API client functions
├── store.ts                 # Zustand stores
└── utils.ts                 # cn() helper, formatters

types/
└── index.ts                 # All TypeScript types

db/
└── schema.sql               # PostgreSQL schema (13 tables)
```

## Key Conventions

- **Path alias**: Use `@/` for imports (e.g., `@/components/ui/button`)
- **Tailwind v4**: Uses `@import "tailwindcss"` with CSS variables
- **Dark mode first**: Primary theme is dark mode
- **App Router**: All pages in `app/` directory
- **API Routes**: Next.js route handlers in `app/api/`

## Design System

- **Primary**: Emerald (`hsl(160 84% 39%)`)
- **Accent**: Purple (`hsl(258 90% 66%)`)
- **Warning**: Amber (`hsl(38 92% 50%)`)
- **Background**: Deep slate (`hsl(222.2 84% 4.9%)`)
- **Style**: Glassmorphism cards with backdrop blur

### Macro Colors
- Protein: Emerald (`.text-protein`, `.stroke-protein`)
- Carbs: Blue (`.text-carbs`, `.stroke-carbs`)
- Fats: Amber (`.text-fats`, `.stroke-fats`)

## Database Tables

Key tables in `db/schema.sql`:
- `user_profile`, `nutrition_goals`
- `meals`, `food_items`, `water_logs`
- `workouts`, `exercises`, `exercise_sets`, `cardio_sessions`
- `body_metrics`, `progress_photos`
- `sleep_logs`, `heart_rate_logs`, `recovery_scores`

## API Endpoints

- `GET/POST /api/nutrition/daily` - Daily nutrition summary
- `POST/DELETE /api/nutrition/meals` - Meal CRUD
- `GET/POST /api/nutrition/water` - Water tracking
- `POST /api/nutrition/parse` - AI food parsing (Cloudflare AI)
- `GET/POST /api/workouts` - Workout CRUD
- `GET /api/workouts/[id]` - Get workout details
- `GET/POST /api/workouts/cardio` - Cardio session tracking
- `GET/POST /api/health/body` - Body measurements
- `GET/POST /api/health/recovery` - Recovery scores
- `GET/POST /api/health/photos` - Progress photos (upload/list)
- `GET/DELETE /api/health/photos/[id]` - Single photo operations

## AI Food Parsing (Cloudflare AI)

The app uses Cloudflare Workers AI (free tier) for intelligent food parsing.

**Setup Cloudflare AI:**
1. Go to https://dash.cloudflare.com/
2. Navigate to AI -> Workers AI
3. Get your Account ID (from the URL or dashboard)
4. Create an API Token with Workers AI permissions
5. Add to `.env.local`:
   ```
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   CLOUDFLARE_API_TOKEN=your_api_token
   ```

**Free Tier Limits:**
- 10,000 neurons/day (plenty for personal use)
- Uses Llama 3.1 8B model

**Usage examples:**
- "200g chicken breast with 100g rice"
- "2 eggs and toast"
- "1 cup oatmeal with banana"
- "protein shake"

Falls back to keyword-based parsing if AI is not configured.

## Progress Photos (Cloudflare R2)

The app uses Cloudflare R2 (S3-compatible) for storing progress photos.

**Setup Cloudflare R2:**
1. Go to https://dash.cloudflare.com/
2. Navigate to R2 -> Create bucket
3. Enable public access for the bucket (for direct URLs)
4. Go to R2 -> Manage R2 API Tokens -> Create API Token
5. Add to `.env.local`:
   ```
   CLOUDFLARE_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
   CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key_id
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
   CLOUDFLARE_R2_BUCKET_NAME=fitness-tracker
   CLOUDFLARE_R2_PUBLIC_URL=https://pub-<hash>.r2.dev
   ```

**Features:**
- Drag-and-drop photo upload
- Categories: front, side, back views
- Timeline gallery with horizontal scroll
- Lightbox with keyboard navigation
- Photos stored in `progress-photos/` prefix
