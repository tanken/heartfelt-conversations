
# Truth Spiral — Plan

A conversational card game that turns vulnerability into a game. Players spiral inward through escalating layers of intimacy, earning a shared "Connection Score" as they go. Built to be playable solo (reflection), in-person (one device), or in live virtual rooms with friends — with every answer instantly shareable.

## The Concept

**The Spiral** is a 5-layer journey, each turn pulling players one notch deeper:

1. **Surface** — playful icebreakers ("What's a song you'd reincarnate as?")
2. **Story** — formative memories ("Describe the room you grew up in.")
3. **Mirror** — self-perception ("What do people misunderstand about you?")
4. **Shadow** — fears and regrets ("What's a goodbye you never said?")
5. **Soul** — core truths ("What would you do if no one was watching?")

Each turn the active player draws a card and chooses one of three actions:
- **Answer** — respond honestly (+depth points)
- **Reflect** — pass and write a private note instead (solo-friendly)
- **Spiral** — answer + ask everyone else the same card (high reward, viral hook)

Sessions end when players reach the Soul layer or tap "Close the Spiral." A **Connection Recap** is generated: depth reached, vulnerable moments, a standout quote, and a shareable card image.

## Play Modes (v1)

| Mode | How it works |
|---|---|
| **Solo** | Personal reflection journal. Cards become prompts; answers are saved privately. |
| **In-person** | One device, pass-and-play. No account needed to start. |
| **Live virtual room** | Host creates a room, shares a 6-letter code or link. Real-time turn sync via Lovable Cloud realtime. |
| **Async** | Send a card to a friend by link. They answer in their own time; both answers unlock side-by-side. |

## Viral Hooks

1. **Shareable Answer Cards** — Every answer can be exported as a beautifully designed image (gradient card with question, answer, and Truth Spiral watermark) for IG stories / TikTok.
2. **Invite Link to Live Room** — One tap to copy a join link. Friend lands directly in the room, no signup gate for guests.
3. **Connection Recap** — Post-session shareable card showing layers reached, a "depth score," and a highlighted quote.

## Aesthetic Direction

Dark, cosmic, hypnotic — the spiral as a visual motif throughout.
- **Palette:** deep indigo background (`oklch(0.18 0.04 280)`), molten gold accent (`oklch(0.78 0.16 75)`), soft cream text. Per-layer accent shifts hue (blue → violet → magenta → red → gold) as the spiral deepens.
- **Typography:** Display serif (e.g. Fraunces) for cards, clean sans (Geist) for UI. No Inter/Poppins.
- **Motion:** Cards rotate in along a spiral arc with framer-motion. Layer transitions show the spiral tightening. Subtle grain overlay.
- **Layout:** Mobile-first, full-bleed cards, generous negative space, single focal element per screen.

## Build Steps

### 1. Foundation
- Enable Lovable Cloud (auth, database, realtime, storage).
- Set up design tokens in `src/styles.css` (cosmic palette, layer hues, gradients, shadow system).
- Add Fraunces + Geist via Google Fonts.

### 2. Routes (TanStack Start)
- `/` — landing: hero with animated spiral, three CTAs (Solo / Group / Join Room).
- `/play/solo` — solo journal mode.
- `/play/local` — pass-and-play with player name entry.
- `/room/$code` — live virtual room (realtime sync).
- `/async/$id` — async card view.
- `/share/$id` — public shareable answer card (SSR for OG image).
- `/recap/$id` — session recap.
- `/_authenticated/journal` — saved answers and past sessions.
- `/login` — email + Google sign-in (optional; guests can play without).

### 3. Database (Lovable Cloud)
- `profiles` — display name, avatar.
- `decks` — curated card sets (start with Core deck; future: Lovers, Family, Strangers).
- `cards` — { deck_id, layer (1–5), prompt, tags }.
- `sessions` — { mode, host_id, room_code, status, depth_reached }.
- `session_players` — { session_id, user_id or guest_name }.
- `answers` — { session_id, card_id, player_id, text, is_shared, created_at }.
- `user_roles` table + `has_role()` security-definer fn (admin can curate cards).
- RLS: players only read their own session data; shared answers are public-read by id.

### 4. Card Content
- Seed ~120 cards across 5 layers in the Core deck (hand-curated for emotional range).

### 5. Game Engine
- Turn state machine (whose turn, current card, layer progression).
- Spiral mechanic: answering N cards in a layer unlocks the next.
- Scoring: depth points + bonus for "Spiral" actions.

### 6. Live Rooms (realtime)
- Supabase realtime channel per room; broadcast turn changes and answer reveals.
- 6-letter join codes; QR code for in-person handoff.

### 7. Shareables
- Client-side canvas/SVG export for answer cards (no server image rendering needed in v1).
- `/share/$id` route with proper OG meta tags for link previews.

### 8. Recap
- End-of-session computed view: layers reached, total answers, a featured quote, exportable image.

## Technical Notes

- Stack stays TanStack Start + Lovable Cloud + Tailwind v4 (per template).
- Realtime via `supabase.realtime` channels, not polling.
- Guest play uses `localStorage` session id; convertible to a real account later.
- All protected reads behind `requireSupabaseAuth` server fns; public share routes use `supabaseAdmin` server fns with explicit "is_shared = true" filter.
- Use framer-motion (already common) for spiral and card motion.

## Out of Scope for v1

- Multiple decks beyond Core (architecture supports it; content later).
- Push notifications for async turns (use email link in v1).
- Voice/video in live rooms.
- Monetization / premium decks.

## Open Question

Sign-in: require account to **save** sessions but allow fully **guest play** for solo / in-person / joining a room? (Recommended default — lowest friction, highest virality.)
