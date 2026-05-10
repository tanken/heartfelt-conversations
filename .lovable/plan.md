# v1.1 — Trust, Continuity & Reach

Five focused upgrades. Each is independently shippable.

## 1. Open Graph previews that render everywhere

The current `/share/$id` and `/recap/$id` routes set generic head meta with no `og:image`, so X/iMessage/Instagram show a blank or fallback unfurl.

- Add a server route `src/routes/api/og.$kind.$id.ts` (`kind = "answer" | "recap"`) that returns a 1200×630 PNG built with `@vercel/og` (Workers-compatible, ships WASM). Image renders the same gradient/layer styling as `ShareCard`/`RecapCard` but at OG ratio.
- Update `share.$id.tsx` and `recap.$id.tsx` `head()` to include:
  - `og:image`, `og:image:width=1200`, `og:image:height=630`, `og:image:alt`
  - `twitter:card=summary_large_image`, `twitter:image`, `twitter:title`, `twitter:description`
  - Absolute URLs (use request origin from loader, fall back to `VITE_PUBLIC_URL`).
- Pull the actual prompt + truncated answer text into `og:title`/`og:description` via a tiny loader (`createServerFn`) that reads `answers`/`sessions` (public RLS already allows it).
- Instagram: it doesn't unfurl links in posts, so we add a "Save image" CTA (already exists) and ensure stories preview correctly via `og:image`.

## 2. Reconnect & resume in live rooms

`room.$code.tsx` currently stores nothing about *who* the local user is in the session — a refresh creates a fresh anon player.

- On join, store `{ sessionId, playerId, code }` in `localStorage` under `ts:room:<code>`.
- On mount: if a stored playerId exists and is still in `session_players`, rebind without inserting a new row. Otherwise re-insert.
- Add a heartbeat: every 15s update `session_players.joined_at` (reuse column as `last_seen`); show a "Reconnecting…" banner when the realtime channel emits `CHANNEL_ERROR`/`TIMED_OUT` and auto-resubscribe with backoff (1s, 2s, 4s, max 8s).
- If `current_player_id` matches the stored playerId on resume, the turn UI re-enables automatically (already driven by state).
- Add an explicit "Resume last room" chip on the landing page when `localStorage` has any active `ts:room:*` key with `closed_at` null.

## 3. Report button + hide-from-shares

- Migration: new table `reports (id, target_type 'answer'|'session', target_id uuid, reason text, created_at)` and a column `answers.is_hidden boolean default false`. RLS: public insert into `reports`; public select on answers stays but `/share/$id` filters `is_hidden = false`.
- Tiny `<ReportButton />` component opens a popover with 4 reasons (Harmful, Personal info, Spam, Other + free text) → inserts into `reports`.
- Threshold rule (client-side, idempotent): if `reports` count for an answer ≥ 3, set `answers.is_hidden = true` (RLS already allows update). Cheap and good enough without a backend job.
- Show on: each answer in `CardStage` recent list (when `dbBacked`), the `share.$id` page, and recap featured-quote area.
- Hidden answers render as "This answer was hidden" on `/share/$id` and are skipped in recap "featured quote" selection.

## 4. Accessibility

- `Spiral` and trailer animation: read `prefers-reduced-motion` via a `useReducedMotion()` hook; when true, render a static SVG (no rotation, no opacity pulses) and set `framer-motion` `MotionConfig reducedMotion="user"` at the root.
- Card draw + transitions in `CardStage`: respect the same hook (instant fade instead of slide/rotate).
- Add ARIA: `role="status" aria-live="polite"` on layer indicator, `aria-label` on icon-only buttons (Copy, Report, Share, Avatar picker), `aria-current="step"` on the active layer pip, focus ring tokens via `focus-visible:ring-2 focus-visible:ring-gold`.
- Keyboard: `Cmd/Ctrl+Enter` submits the answer textarea, `Esc` clears, room code input auto-advances + accepts paste of full code, `Tab` order audited on landing CTAs.
- Add a "Reduce motion" toggle in a small footer settings menu, persisted to `localStorage` (`ts:a11y:reducedMotion`) — overrides system preference when set.

## 5. Internal admin view

- New route `/admin` gated by a query token: `?key=<ADMIN_KEY>` matched against `import.meta.env.VITE_ADMIN_KEY` (set via secret). Not bulletproof but appropriate for an internal dashboard with no auth system. Memoise the unlocked state in `sessionStorage`.
- Migration: add `share_clicks (id, target_type, target_id, created_at, referrer text, ua text)`. Increment via a tiny `/api/track-share` server route called from `/share/$id` and `/recap/$id` on mount (debounced once per pageview via sessionStorage key).
- Admin view shows:
  - Rooms today / this week / total (group by `mode`)
  - Completion depth distribution (max layer reached per closed session, pulled from `MAX(answers.layer)` per session)
  - Top share links by click count (join `share_clicks` to `answers`/`sessions`)
  - Reports queue with one-click "hide answer" / "dismiss"
- Read via `createServerFn` using `supabaseAdmin` so we don't widen RLS further. Auth: server fn checks `process.env.ADMIN_KEY` against an `x-admin-key` header set client-side from the unlocked state.

## Technical details

- Packages: `@vercel/og` (works on Cloudflare Workers via WASM). No sharp/canvas.
- DB migration combines: `answers.is_hidden`, `reports`, `share_clicks`. All RLS public-insert / restricted-update where appropriate.
- `og.$kind.$id.ts` uses dynamic font fetch from a CDN at build, cached with `Cache-Control: public, max-age=86400, immutable`.
- All five features can ship in parallel; admin and OG depend on the new tables/route, so we run the migration first.

## Out of scope

- Real auth-based moderation queue (we use a simple report-count threshold).
- Custom domains for OG (uses request origin).
- Realtime presence indicators beyond simple last-seen heartbeat.
