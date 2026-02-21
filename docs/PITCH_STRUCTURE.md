# Bloomsline — Pitch Deck Structure

## Overview

Two pitch decks exist:
- **`/pitch`** — Full detailed version (16 slides, 2426 lines)
- **`/pitch-new`** — Condensed investor version (11 slides, ~1700 lines)

Both support EN/FR language toggle, keyboard navigation (arrow keys/space), and Framer Motion slide transitions.

---

## Condensed Pitch (`/pitch-new`) — 11 Slides

### Slide 1: Hero
- **Message:** "Reimagining therapeutic care"
- **Subtext:** "Where small moments become meaningful change."
- **CTA:** View Pitch button
- **Badge:** Seed Round 2026

### Slide 2: Problem
- **Hook:** "Therapy is 1 hour a week. Life is the other 167."
- **Visual:** Ratio bar (1h teal vs 167h gray)
- **3 consequences:** Catching up, no visibility, feeling alone
- **3 stats with sources:** ~50% session time catching up (APA), 86% no treatment (WHO), 49% use AI (Sentio)

### Slide 3: Solution
- **Title:** "Bloomsline fills the 167."
- **Two pillars:** For Members (Companion App) / For Practitioners (Visibility Dashboard)
- **4 features each** with outcomes
- **Bridge:** "One platform. Two sides of care. Connected."

### Slide 4: Why Now
- **4 tailwinds:** Destigmatization, AI acceptance, Medicare coverage, insurance demands
- **TAM/SAM/SOM:** $47B / $5.5B / $500M
- **Market growth:** 20% CAGR
- **Wedge:** Each practitioner brings 20-50 members

### Slide 5: Differentiation
- **Visual gap layout:** Practice tools (left) ←→ Wellness apps (right)
- **Red gap question:** "Who connects the practitioner and the client between sessions?"
- **Green answer:** "Bloomsline. The between-session care platform."

### Slide 6: Traction
- **Research stats:** 68 practitioners / 7 countries, 119 user interviews
- **Pivot story:** Doctalink → discovered real gap → Bloomsline
- **Timeline:** Q1 2025 → Q3 2026 (6 milestones)
- **Quote:** "We didn't just build a product. We earned the insight to build the right one."

### Slide 7: Execution
- **Title:** "Four pillars. One company."
- **Connecting line:** "Build it. Be found. Close it. Make it feel right."
- **4 columns with branded concepts:**
  - Product → BCS (Bloom Context System)
  - Digital Presence → PLG (Practitioner-Led Growth)
  - Sales → CNE (Care Network Effect)
  - Gentle UX → GUX (Gentle UX)
- Each has: highlighted concept card + supporting bullet + status badge

### Slide 8: Business Model
- **Model:** B2B SaaS
- **Revenue:** Practitioner subscription (€29-79/mo), members free, clinic tiers
- **GTM:** Europe first → Global → Partnerships
- **Metrics:** €29-79/mo, 90%+ gross margin

### Slide 9: Team
- **Two founders:** Aditya (Product & Tech), Sarah (Sales & Ops)
- **Why Us:** Personal connection, full-stack execution, domain obsession (187 interviews)

### Slide 10: The Ask
- **Amount:** €500K - €750K (Seed, 18 months runway)
- **Use of funds:** Product 40%, Team 30%, GTM 20%, Ops 10%
- **4 milestones:** PMF, team expansion, European presence, AI enhancement
- **Vision teaser:** "Beyond an app. A research lab for humanity."

### Slide 11: Contact
- **CTA:** Book a Meeting + Email Us
- **Email:** hi@bloomsline.com
- **Booking:** Google Calendar link

---

## Key Design Decisions

| Decision | Reasoning |
|----------|-----------|
| 11 slides (not 16) | Investors have short attention spans — every slide must earn its place |
| Problem as big typography | Visceral impact — investors should feel it, not read it |
| Visual gap (not comparison table) | Tables invite scrutiny on accuracy; the gap concept is simpler |
| Branded concepts in Execution | Gives investors memorable anchors to discuss — "Tell me more about BCS" |
| Vision teaser on Ask slide | Plants the seed of bigger ambition without a dedicated slide |

---

## Technical Implementation

- **Framework:** Next.js 16 (app router), `'use client'`
- **Animations:** Framer Motion (`motion`, `AnimatePresence`)
- **i18n:** `useLanguage()` from `@/lib/i18n/context`, full EN/FR translations
- **Navigation:** Keyboard (arrows/space) + click dots + click arrows
- **Colors:** Teal (#059669) primary, Peach (#D4856A) accent
- **Icons:** Lucide React
- **File:** `src/app/pitch-new/page.tsx`
