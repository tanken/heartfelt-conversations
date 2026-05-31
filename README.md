# Truth Spiral

A conversation card game designed to turn vulnerability into play. Five layers of depth. One card at a time. Play alone, in person, live with friends, or asynchronously.

**Live preview:** [https://id-preview--01f98f22-5104-498c-86dc-9ce2d2ba27e4.lovable.app](https://id-preview--01f98f22-5104-498c-86dc-9ce2d2ba27e4.lovable.app)

---

## Table of Contents

- [Objective](#objective)
- [What It Is](#what-it-is)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Game Modes](#game-modes)
- [Sparks for Lift'd](#sparks-for-liftd)
- [Accessibility](#accessibility)
- [Social Sharing & Open Graph](#social-sharing--open-graph)
- [Admin Dashboard](#admin-dashboard)
- [Content Moderation](#content-moderation)
- [Roadmap & Next Steps](#roadmap--next-steps)
- [Contributing](#contributing)
- [License](#license)

---

## Objective

Truth Spiral exists to make meaningful connection as effortless as opening a game. In a world of endless scrolling, it offers a deliberate, beautiful space to go deeper — with yourself, a close friend, or a group. The goal is not to win. The goal is to be seen.

---

## What It Is

### The Five Layers

Each session spirals through five depths of conversation, one card at a time:

| Layer | Name | Tone |
|-------|------|------|
| 1 | **Surface** | Playful icebreakers |
| 2 | **Story** | Formative memories |
| 3 | **Mirror** | Self-perception |
| 4 | **Shadow** | Fears & regrets |
| 5 | **Soul** | Core truths |

Players draw cards from the current layer. Answering a card unlocks the next layer. Passing keeps you on the same layer. The session ends when the spiral completes — or when the conversation naturally finds its close.

### Play Modes

- **Solo** — A private journaling experience. Draw, reflect, save.
- **In-person** — Pass the device. One card, one voice, one screen.
- **Live room** — Real-time multiplayer via Supabase Realtime. Create a room, share the 6-letter code, spiral together.
- **Async** — Send a single card to a friend. They answer on their own time.

---

## Architecture

This is a full-stack React application built on **TanStack Start v1**, designed to run on edge infrastructure (Cloudflare Workers).

### Server-side model

- **TanStack server functions** (`createServerFn`) handle all internal app logic — database queries, auth-protected reads, business operations.
- **Server routes** (`createFileRoute` with `server.handlers`) expose public HTTP endpoints for webhooks and external callbacks.
- No Supabase Edge Functions. All server logic lives in the TanStack layer.

### Client-side model

- File-based routing via TanStack Router with type-safe `<Link>` navigation.
- TanStack Query for server-state caching and synchronization.
- Framer Motion for orchestrated animations and transitions.
- Reduced-motion support throughout via a global `useReducedMotion` hook.

### Data flow

```
Browser → TanStack Router → Component
                ↓
        useServerFn / useQuery
                ↓
        TanStack Server Function
                ↓
        Supabase Client (RLS-scoped) OR Admin Client
                ↓
        PostgreSQL (Lovable Cloud)
```

### Realtime multiplayer

Live rooms use **Supabase Realtime** channels. Game state (current layer, active card, answers, turn order) is synchronized across all connected clients via broadcast and Postgres changes. If a player disconnects and reconnects, the app restores their session state from `localStorage` and rejoins the room automatically.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start v1 (React 19, SSR/SSG, file-based routing) |
| Build Tool | Vite 7 |
| Runtime | Cloudflare Workers (`nodejs_compat`) |
| Styling | Tailwind CSS v4 (native `@import` + `@theme`) |
| UI Components | shadcn/ui + Radix UI primitives |
| Animation | Framer Motion |
| Database | PostgreSQL via Lovable Cloud (Supabase) |
| Auth | Supabase Auth (email + Google OAuth) |
| Realtime | Supabase Realtime |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Image Export | html-to-image |
| Fonts | Fraunces (display), Geist (body) |

---

## Project Structure

```
src/
  components/           # Reusable UI components
    ui/                 # shadcn/ui primitives
    CardStage.tsx       # Core card drawing & answering UI
    Spiral.tsx          # Animated spiral hero graphic
    ShareCard.tsx       # Answer card export/share canvas
    RecapCard.tsx       # Session recap shareable card
    CopyButton.tsx      # Clipboard helper with feedback
    A11ySettings.tsx    # Accessibility preferences panel
    ReportButton.tsx    # Content flagging UI
    SiteHead.tsx        # SEO & meta management
    sparks/             # Sparks-specific components

  routes/               # TanStack file-based routes
    index.tsx           # Landing page
    play.solo.tsx       # Solo mode
    play.local.tsx      # Pass-the-device mode
    room.new.tsx        # Room creation
    room.$code.tsx      # Live room (dynamic)
    async.new.tsx       # Async card composer
    async.$id.tsx       # Async answer view
    recap.$id.tsx       # Session recap
    recap.local.tsx     # Local session recap
    share.$id.tsx       # Shared answer public page
    admin.tsx           # Internal analytics dashboard
    sparks.tsx          # Sparks layout wrapper
    sparks.index.tsx    # Sparks home
    sparks.draw.tsx     # Sparks card draw
    sparks.share.$token.tsx  # Sparks friend-share landing
    sparks.reflections.tsx    # Sparks local journal

  lib/                  # Business logic & utilities
    cards.ts            # Core deck loading
    spiral.ts           # Layer definitions & room codes
    share.ts            # Share URL & image generation
    rooms.ts            # Room persistence helpers
    profile.ts          # User profile logic
    reports.ts          # Content moderation
    og.functions.ts     # Open Graph metadata helpers
    a11y.ts             # Accessibility hooks & utils
    sparks/
      decks.ts          # Sparks prompt decks (~80 curated cards)
      storage.ts        # localStorage journal & friend-share encoding

  integrations/
    supabase/
      client.ts         # Browser Supabase client (DO NOT EDIT)
      client.server.ts  # Service-role admin client (DO NOT EDIT)
      auth-middleware.ts # Auth-protected server fn middleware
      auth-attacher.ts  # Attaches bearer token to server fn RPCs
      types.ts          # Auto-generated DB types (DO NOT EDIT)

  server.ts             # Cloudflare Worker SSR entry (error wrapper)
  start.ts              # TanStack Start bootstrap
  router.tsx            # Router configuration
  styles.css            # Design tokens, themes, Sparks scope
```

---

## Database Schema

Key tables managed via migrations:

- **`decks`** — Card deck definitions (slug, metadata)
- **`cards`** — Individual prompt cards (layer, prompt text, deck foreign key)
- **`sessions`** — Game sessions / rooms (code, status, share token)
- **`session_players`** — Player associations per session
- **`answers`** — Submitted answers (card, player, text, layer, share flag)
- **`reports`** — Content moderation reports (answer, reason, status)

Row-Level Security (RLS) policies protect all user-facing tables. The `reports` table enables community-driven content moderation.

---

## Environment Variables

The project uses two variable namespaces:

| Variable | Context | Purpose |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | Browser / Build | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser / Build | Anon/public API key |
| `VITE_SUPABASE_PROJECT_ID` | Browser / Build | Project identifier |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Admin client (bypasses RLS) |

> **Note:** `.env` is auto-generated by Lovable Cloud integration. Do not edit it manually.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 20+
- A Lovable Cloud / Supabase project (for database + auth)

### Install

```bash
bun install
```

### Development

```bash
bun run dev
```

Vite dev server starts at `http://localhost:3000`.

### Build

```bash
bun run build
```

TanStack Start emits a Cloudflare Worker-compatible bundle.

### Lint & Format

```bash
bun run lint
bun run format
```

---

## Game Modes

### Solo
Draw cards from any layer. Write reflections privately. Save or export answer cards as images.

### In-person (Local)
Set player names. Pass the device after each turn. The app tracks whose turn it is and surfaces the next card automatically.

### Live Room
Create a room → get a 6-letter code (e.g. `AB12CD`) → share it. All players see the same card in real time. The host controls progression through layers. Answers can be kept private or shared to the group recap.

### Async
Compose a card + message → send a link. The recipient opens it, answers, and the conversation continues at the pace of real life.

### Reconnect & Resume
If you refresh or lose connection during a live room, the app:

1. Checks `localStorage` for a stored room reference.
2. Rejoins the Supabase Realtime channel automatically.
3. Syncs missed state from the database.
4. Restores your turn position and active card.

---

## Sparks for Lift'd

**Sparks** is a sister prototype exploring how the Truth Spiral mechanic could live inside [Lift'd](https://www.lifted.app) — a journaling, mindfulness, and social community app.

### How It Differs

| | Truth Spiral | Sparks |
|---|---|---|
| **Palette** | Cosmic dark (indigo, violet, gold) | Warm daylight (cream, sage, amber) |
| **Depth model** | 5 layers (Surface → Soul) | 4 modes (Light, Honest, Deep, Prayerful) |
| **Tone** | Game / ritual | Journal / connection |
| **Persistence** | Supabase (rooms, answers, async) | `localStorage` (prototype) |
| **Target** | Standalone game | Lift'd Connect feature demo |

### Routes

- `/sparks` — Home: depth picker, play mode, recent reflections
- `/sparks/draw` — Active prompt card with answer + save flow
- `/sparks/share/:token` — Friend-share landing (stateless, URL-encoded)
- `/sparks/reflections` — Local journal of saved entries

### Card Afterlife

After answering a Sparks prompt, users can save it as:

- **Reflection** — A private journal entry
- **Prayer** — A faith-shaped offering
- **Gratitude** — A thankfulness note
- **Action item** — A commitment to carry forward

Or preview-share to a "Connect" feed (mocked for the prototype).

### Curated Decks

Sparks ships ~80 hand-curated prompts across four depths:

- **Light** (20) — Warm, low-risk conversation openers
- **Honest** (20) — Reflective, personal questions
- **Deep** (20) — Vulnerable, growth-oriented prompts
- **Prayerful** (20) — Faith-shaped, inclusive spiritual questions

The Prayerful deck is gentle and non-denominational, clearly labeled so non-faith users can skip it without friction.

---

## Accessibility

Truth Spiral is built with inclusive design as a first-class concern:

- **Keyboard navigation** — All cards, buttons, and menus are fully keyboard-operable. `Tab`, `Enter`, `Space`, and `Escape` work intuitively.
- **ARIA labels** — Cards announce their layer and prompt via `aria-label`. Live regions announce turn changes and save confirmations.
- **Reduced motion** — A global preference (persisted in `localStorage`) disables spiral animations, card transitions, and auto-scroll. Framer Motion reads this state and collapses to instant transitions.
- **Focus management** — Focus is restored to logical anchors after modal close, route change, and card draw.
- **Color contrast** — All text meets WCAG AA against the cosmic dark background. The Sparks daylight palette is verified for the same standard.
- **Screen reader support** — Card text is plain, semantic HTML. Decorative spiral graphics are `aria-hidden`.

Accessibility settings are available via the gear icon on the landing page footer.

---

## Social Sharing & Open Graph

Shared answer cards and recap links render rich Open Graph previews across X (Twitter), Instagram, iMessage, and standard link unfurlers:

- **Dynamic `og:title`** — Personalized with player name and session context.
- **`og:description`** — Preview of the prompt or answer excerpt.
- **`og:image`** — Generated fallback (`/og-default.jpg`) with branded cosmic gradient.
- **Twitter Cards** — `summary_large_image` cards for rich social display.
- **Shareable answer cards** — `html-to-image` renders a styled DOM node as a PNG for direct download or native share sheet.

Recap pages include a canonical URL and session-level metadata for SEO.

---

## Admin Dashboard

An internal `/admin` route provides operational visibility:

| Metric | Description |
|--------|-------------|
| Active rooms | Currently open live sessions |
| Share link clicks | Aggregated engagement on shared answers |
| Completion depth | How far users typically spiral (layer drop-off) |
| Report queue | Flagged content awaiting review |

The dashboard is protected by authentication. Access requires an authenticated session with admin privileges (checked server-side via `has_role`).

---

## Content Moderation

Users can report harmful or inappropriate content directly from answer cards and recaps:

1. Click the **Report** button on any shared answer.
2. Select a reason (harassment, misinformation, spam, other).
3. Optionally hide the content from future shares immediately.
4. The report is queued in the admin dashboard for review.

Reports write to the `reports` table with RLS policies ensuring reporters can only see their own submissions. Admin review uses the service-role client for full visibility.

---

## Roadmap & Next Steps

### Near term

- [ ] **Deck expansion** — Community-submitted cards with moderation pipeline.
- [ ] **Themed decks** — Holiday, grief, celebration, conflict-resolution, dating.
- [ ] **Improved async** — Threaded conversations, reminder nudges, read receipts.
- [ ] **Session recordings** — Optional audio/voice note attachments to answers.
- [ ] **Streaks & insights** — Weekly reflection summaries, most-visited layers, connection depth score.

### Medium term

- [ ] **Mobile native** — React Native or Capacitor wrapper for iOS/Android.
- [ ] **AI-assisted curation** — Personalized prompt ordering based on session history and mood.
- [ ] **Lift'd integration** — Real backend wiring for Sparks: Connect feed posts, group journaling, Nomi AI companion suggestions.
- [ ] **Telegram bot** — Play Sparks inside Telegram group chats.
- [ ] **Sermon / small-group mode** — Church and community leader tools with curated sermon-series-aligned decks.

### Open sourcing considerations

This repository is structured to make open-sourcing straightforward:

- **No hardcoded secrets** — All credentials are environment-driven.
- **Modular decks** — Cards live in plain TypeScript modules (`src/lib/sparks/decks.ts`, Supabase `cards` table). New decks require zero code changes beyond data.
- **Self-hostable backend** — The Supabase schema is fully migration-driven. A `supabase/config.toml` is present for local CLI development.
- **Contributor-friendly** — shadcn/ui primitives and Tailwind tokens make UI contributions predictable.
- **License-ready** — All runtime dependencies are permissively licensed (MIT, Apache-2.0, BSD). Verify `package.json` before selecting a final project license.

Recommended license: **MIT** or **AGPL-3.0** (if you want to ensure hosted derivatives remain open).

---

## Contributing

Contributions are welcome. Please open an issue before significant changes.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Follow existing code style (`bun run lint && bun run format`).
4. Ensure the build passes: `bun run build`.
5. Open a pull request with a clear description.

### Areas especially open to contribution

- New prompt decks (see `src/lib/sparks/decks.ts` for the format)
- Accessibility improvements
- Translation / i18n infrastructure
- Visual themes beyond cosmic dark and daylight

---

## License

This project is currently unlicensed. If you plan to open source, add a `LICENSE` file before publishing.

---

*Made for deeper conversations.*
