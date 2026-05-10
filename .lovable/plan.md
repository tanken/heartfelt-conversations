
# Sparks for Lift'd — Sister Prototype Plan

A new `/sparks` surface that demos how the Truth Spiral mechanic would live inside Lift'd's Connect feature. Truth Spiral routes (`/`, `/play/*`, `/room/*`, `/async/*`, `/recap/*`) stay untouched. Sparks gets its own visual language (Lift'd-warm, less cosmic) so it reads as a Connect feature, not the same game.

## Scope (Phase 1)

- 4 depth modes: **Light**, **Honest**, **Deep**, **Prayerful** — all visible to everyone, Prayerful clearly labeled with a faith icon + "faith-shaped, optional" tagline.
- Three play modes: **Solo**, **With a friend** (link share), **Group round** (pass-the-device).
- Per card actions: Answer, Pass, Shuffle.
- After answering, card afterlife = full set: **Save as Reflection**, **Save as Prayer**, **Save as Gratitude**, **Save as Action item**, **Share to Connect**.
- Saved entries live in a local "Reflections" drawer (mock Lift'd journal) so users can see the afterlife loop end-to-end without wiring real Lift'd APIs.

## Routes

```text
/sparks                  Connect-style home: depth picker, mode picker, recent reflections
/sparks/draw             Active card view (depth + mode in URL search params)
/sparks/share/$id        Sent-to-friend card landing
/sparks/reflections      Local journal of saved cards by type
```

All under a shared `/sparks` layout with a soft Lift'd header (not the cosmic spiral hero).

## Decks

Curated, ~20 prompts per depth × 4 depths = ~80 cards, stored as a static TS module (`src/lib/sparks/decks.ts`). No DB writes for v1 — decks are local data so the prototype is fast and offline-friendly. Prayerful deck is gentle/inclusive, not denominational.

## Data & persistence

- **localStorage only** for v1 (`liftd:sparks:reflections`, `liftd:sparks:prefs`).
- Each saved entry: `{ id, prompt, answer, depth, type: 'reflection'|'prayer'|'gratitude'|'action', createdAt }`.
- Friend-share uses an encoded URL payload (no backend round-trip needed) so `/sparks/share/$id` can render without a session.
- No Supabase changes. No auth. Truth Spiral's tables stay as-is.

## Visual direction

Distinct from Truth Spiral's cosmic palette:
- Warm cream + sage + soft amber (Lift'd-leaning), rounded soft cards, hand-drawn-feel divider.
- Depth chips color-coded: Light=amber, Honest=rose, Deep=indigo, Prayerful=sage with a small flame glyph.
- Tokens added to `src/styles.css` under a `.sparks` scope so they don't bleed into Truth Spiral routes.

## Components

```text
src/components/sparks/
  SparksHeader.tsx        Lift'd-style top bar with Connect breadcrumb
  DepthPicker.tsx         4 mode chips with descriptions + pass-safe note
  SparkCard.tsx           Prompt card, action row, depth badge
  AfterlifeMenu.tsx       Reflection / Prayer / Gratitude / Action / Share to Connect
  ReflectionList.tsx      Saved entries grouped by type
  PassSafeNote.tsx        Small reminder: "You can always pass."
```

## Cross-link from Truth Spiral

Add a single small footer link on the landing page: "Built for Lift'd? See it as Sparks →" pointing to `/sparks`. Non-intrusive, keeps the two prototypes discoverable without merging.

## Out of scope (explicit)

- Group admin controls / deck gating
- Nomi / AI-personalized prompts (Phase 3)
- Real Lift'd backend integration (journal, groups, Connect feed)
- Telegram, sermon mode, session log integration
- Any database migrations

## Technical notes

- Pure frontend feature; no server functions, no Supabase, no env vars.
- Reuses existing `framer-motion`, shadcn primitives, and `useReducedMotion` hook.
- Each route file gets its own `head()` with Sparks-specific OG title/description.
- Friend-share payload kept under ~1.5KB (URL-safe base64 of `{prompt, depth, fromName}`); answer text is never in the URL — recipient writes their own.

## Deliverable

A self-contained `/sparks` flow you can demo to the Lift'd team: pick depth → draw → answer → save into one of four journal types or share to a "friend." Truth Spiral remains fully intact alongside it.
