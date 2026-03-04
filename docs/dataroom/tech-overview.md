# Technical Overview

**Route:** `/tech-overview`
**4-layer architecture: Frontend, Backend, AI Engine, External Services**

---

## Key Numbers

| Metric | Value |
|--------|-------|
| API Endpoints | 24+ |
| Languages | 3 (EN/FR/ES) |
| External Services | 6 integrated |
| Platforms | 2 (Web + Mobile) |

---

## Architecture Layers

### Layer 1: Frontend
| Technology | Detail |
|-----------|--------|
| Next.js 16 | App Router, SSR, API routes |
| React 19 | Latest with Server Components |
| TypeScript | End-to-end type safety |
| Tailwind CSS 4 | Utility-first styling |
| Framer Motion | Smooth animations & transitions |
| Recharts 3.6 | Interactive data visualizations |
| Radix UI | Accessible headless components |
| React Hook Form + Zod | Form handling & validation |

### Layer 2: Backend & Database
| Technology | Detail |
|-----------|--------|
| Supabase PostgreSQL | Primary database with real-time subscriptions |
| Supabase Auth | Google OAuth + magic links + session management |
| Row Level Security | Database-level access control per user |
| Next.js API Routes | 24+ REST endpoints with middleware |
| Zustand + TanStack Query | Client state & server cache management |
| Rate Limiting | Custom per-route throttling (public, auth, AI) |

### Layer 3: AI Engine
| Technology | Detail |
|-----------|--------|
| Anthropic Claude API | Primary LLM for all AI features |
| Claude Haiku | Cost-optimized conversations (~€1.80/user/mo) |
| Claude Sonnet | Complex tasks — summaries, pattern analysis |
| Bloom Chat | AI companion for member self-reflection |
| Bloom Assist | Practitioner copilot for clinical notes |

### Layer 4: External Services
| Service | Purpose | Detail |
|---------|---------|--------|
| Supabase | Database, Auth & Real-time | PostgreSQL with RLS, Google OAuth, magic links, real-time subscriptions |
| Anthropic Claude | AI / LLM Engine | Haiku for chat, Sonnet for complex analysis. Powers Bloom companion + practitioner assist |
| Google Calendar | Session Scheduling | OAuth 2.0 with offline refresh tokens, calendar sync, availability management |
| Postmark | Email Delivery | Transactional emails from hi@bloomsline.com — notifications, invitations, reminders |
| PostHog | Product Analytics | EU-hosted (GDPR compliant), autocapture events, session recordings |
| HubSpot | CRM & Feedback | API v3 — ticket creation from feedback, file uploads, bug/feature/question categories |

---

## API Endpoints (26 total)

| Domain | Endpoints | Count |
|--------|----------|-------|
| Auth & Users | Setup member, create profile, update language, Google OAuth | 4 |
| Bloom AI | Chat, greeting, patterns, assist, extract, summarize, practitioner chat | 7 |
| Calendar & Booking | Google OAuth flow, calendar events, create/update bookings, sync | 6 |
| Notifications | Fetch, send, mark read, mark all read, preferences | 5 |
| Resources & Content | Create resource, check access, early access, feedback → HubSpot | 4 |

---

## AI Features

| Feature | Description |
|---------|-------------|
| Bloom Chat | Conversational AI companion for member self-reflection and wellbeing tracking |
| Bloom Assist | Quick-action AI for practitioners — summarize sessions, extract themes, suggest focus areas |
| Pattern Detection | Identifies wellbeing trends across mood and activity data logged by members |
| Notifications | Email and in-app notifications for session reminders, member invitations, milestone updates via Postmark |

---

## Security & Compliance

| Feature | Detail |
|---------|--------|
| AES-256-GCM encryption | OAuth tokens & sensitive data encrypted at rest |
| Row Level Security | Postgres RLS on every table — data isolation per user |
| Rate limiting | Per-route throttling — public, auth, AI, summary tiers |
| GDPR-ready | EU-hosted analytics (PostHog EU), cookie consent, data control |

---

## Mobile App

- **Framework:** Expo (React Native)
- **Platforms:** iOS + Android
- **Purpose:** Cross-platform member mobile app
- **Features:** Moment capture (photo, voice, text), Bloom AI chat, mood tracking, daily rituals, milestone progress
