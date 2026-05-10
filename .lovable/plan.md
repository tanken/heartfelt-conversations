## Truth Spiral — v1 Completion Plan

Building on the foundation (landing, solo, local, live rooms, basic recap), this plan closes the loop on virality, async play, and identity.

### 1. Landing Page Polish
- Keep current hero + spiral, add three primary CTAs in a unified band: **Play Solo**, **In-Person**, **Join / Create Room**.
- Add a compact "Join with code" input directly on the landing hero (6-letter input → `/room/$code`).
- Add a short looping "trailer" panel: layered spiral animation cycling through layer colors (Surface → Soul) with prompt snippets fading in/out.

### 2. Player Setup (shared component)
- New `PlayerSetup` component used before Solo, Local, and Room entry.
- Fields: **Display name** (required), **Avatar** (pick 1 of 8 generated cosmic glyph avatars — emoji-style SVGs, no upload).
- Persisted to `localStorage` (`ts:profile`) so returning users skip setup.
- Local mode: lets host add 2–8 named players quickly.

### 3. Solo Mode (complete)
- Already drafted. Add: persist answers to `localStorage` per session, progress indicator showing layer 1→5, "Close the spiral" → recap.
- Optionally save to Cloud `sessions` (mode=`solo`) for share links — only if user toggles "save & share".

### 4. Live Room Flow (complete)
- Already drafted. Add:
  - **Copy invite link** + **Copy code** buttons on lobby and in-room header (with toast confirmation).
  - "Join with code" form on landing routes to `/room/$code` (existing `join.tsx` route).
  - Player list with avatars + active-turn highlight.
  - End-of-session button → recap synced from Cloud answers.

### 5. Async Mode (new)
- New routes: `/async/new`, `/async/$id`.
- Flow: Player A picks a card from any layer → writes their answer → gets a unique link → shares it.
- Player B opens the link, sees A's prompt + answer revealed only after B writes their own.
- Side-by-side thread view; can continue spiraling card by card in the same thread.
- Backed by `sessions` (mode=`async`) + `answers`; thread = ordered answers under one session id.

### 6. Shareable Answer Cards (new)
- New route `/share/$answerId` — public read view of a single answer.
- Beautiful gradient card themed to its layer color, prompt + answer + watermark.
- "Share" button on each answer in any mode → marks `answers.is_shared = true` → opens `/share/$id` with copy-link + **Download as image** (client-side `html-to-image` → PNG).
- OG meta tags (`/share/$id` server head) so links unfurl with title and description.

### 7. Connection Recap (upgrade)
- Existing `/recap/local` upgraded:
  - **Depth reached** (highest layer touched) + Connection Score (depth × honesty × spirals).
  - **Standout quote** (longest non-reflection answer, or user can pick).
  - **Per-player rings** showing layers each touched (in group modes).
  - **Export recap as image** (html-to-image → PNG, 1080×1350 story format).
  - **Share recap link** for room sessions (`/recap/$sessionId`, public read).

### 8. Database additions (small)
Migration adds:
- `sessions.mode` already exists — accept values: `solo`, `local`, `room`, `async`.
- `sessions.share_token` (text, unique, nullable) — for public recap/async share links without leaking session ids.
- `session_players.avatar_key` (text, nullable) — chosen glyph id.
- `answers.is_shared` already exists — used by `/share/$id`.

No new tables. RLS already allows public read/insert/update — matches the guest-friendly model.

### Technical notes
- `html-to-image` for PNG export (small client-side lib).
- Avatars: 8 inline SVG glyphs in `src/lib/avatars.tsx` — no asset bloat.
- Async unlock logic: client fetches answer; if no answer from current viewer's "side" yet, hides A's text behind a blur + "Write yours to reveal" CTA.
- All public share routes use the existing public-read RLS; no auth required.
- Realtime already wired for `sessions`, `session_players`, `answers` — covers async too (B sees A's reveal live if both open).

### Out of scope
- Accounts / login (still fully guest).
- Push notifications for async turns (link-based only).
- Custom decks (Core deck only).
