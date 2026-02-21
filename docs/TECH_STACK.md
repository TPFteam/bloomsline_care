# Bloomsline — Tech Stack & Architecture

## Two Codebases

| Codebase | Path | Purpose |
|----------|------|---------|
| `bloomsline_care` | `/Users/adityachanne/lauchpad/bloomsline_care` | Web dashboard (practitioner-facing) |
| `bloomsline_app` | `/Users/adityachanne/lauchpad/bloomsline_app` | Mobile app (member-facing) |

---

## Web Dashboard (`bloomsline_care`)

### Stack
- **Framework:** Next.js 16 (app router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Charts:** Recharts 3.6
- **Toast:** Sonner (`import { toast } from 'sonner'`)
- **i18n:** Custom context — `useLanguage()` from `@/lib/i18n/context` → `{ t, locale }`, supports en/fr/es

### Page Pattern
```typescript
'use client'
import { createClient } from '@/lib/supabase/browser-client'

// Layout: <AppSidebar activeItem="..." /> + <AppHeader />
// Container: min-h-screen bg-gray-50 flex → flex-1 ml-64
// Auth: supabase.auth.getUser() → filter by practitioner_id
```

### Key Files
- **Supabase browser client:** `@/lib/supabase/browser-client`
- **Supabase server client:** `@/lib/supabase/server-client`
- **Types:** `@/types/` (Member, Session, Milestone, ProgressNote, User)
- **Components:** `@/components/ui/` (Button, Logo, etc.)
- **Pitch deck (condensed):** `src/app/pitch-new/page.tsx`
- **Pitch deck (full):** `src/app/pitch/page.tsx`

### Build
```bash
npx next build  # no --no-lint flag
```

### Key Types
```typescript
Member: { status: 'active' | 'inactive' | 'pending', last_session_at, engagement_level }
Session: { status: 'scheduled' | 'completed' | 'cancelled' | 'no_show', session_type, scheduled_at }
Milestone: { status: 'discovery' | 'planned' | 'building' | 'in_progress' | 'thriving' | 'independent' | 'achieved' }
```

---

## Mobile App (`bloomsline_app`)

### Stack
- **Framework:** Expo (React Native)
- **Router:** Expo Router (file-based routing)
- **Database:** Supabase
- **Auth:** Custom auth context (`@/lib/auth-context`)
- **Icons:** Lucide React Native
- **Animations:** React Native Animated

### Key Features
- **Moments capture:** Photo, voice, text — 10-second interactions
- **Seeds/Anchors:** Daily habits (grow/let-go types) with check-in tracking
- **Bloom AI:** Always-available AI companion
- **Progress analytics:** Week view, month grid, growth section

### Key Files
- **Seeds screen:** `app/seeds.tsx`
- **Seeds components:** `components/seeds/` (WeekView, MonthGrid, GrowthSection, ActivityHistory, useSeedsData, shared)
- **Analytics components:** `components/analytics/` (AnimatedSection, SectionHeader)
- **Progress tab:** `app/(tabs)/progress.tsx`

---

## Shared Infrastructure

### Supabase Tables (Key)
- `members` — member profiles
- `sessions` — therapy sessions
- `milestones` — member progress milestones
- `progress_notes` — session notes
- `member_anchors` — seeds/habits (grow/let-go)
- `anchor_logs` — daily seed check-ins
- `anchor_activity_logs` — seed activity history
- `moments` — captured moments (photos, voice, text)

### Design Tokens
- **Primary:** Teal (#059669)
- **Accent:** Peach (#D4856A)
- **Grow color:** Emerald (#059669)
- **Let-go color:** Amber (#d97706)
- **Background:** Gray-50 (#fafafa for mobile, bg-gray-50 for web)
- **Border radius:** 22px (cards), 12px (buttons), 999px (pills)

---

## API Routes (Web)
- `/api/auth/setup-member` — Expo app account creation
- `/api/bloom/*` — Bloom AI endpoints (CORS enabled for Expo)

---

## Deployment
- **Web:** Vercel (Next.js)
- **Mobile:** Expo EAS
