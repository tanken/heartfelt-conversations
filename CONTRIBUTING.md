# Contributing to Truth Spiral

Thanks for your interest in contributing. Truth Spiral is a small, opinionated project focused on meaningful conversation. Contributions that align with that spirit — better prompts, accessibility, multiplayer reliability, sharing polish — are very welcome.

## Code of Conduct

Be kind. Assume good faith. The product is about vulnerability and depth; the community around it should reflect that.

## Local Setup

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **Bun** 1.1+ (preferred) or npm/pnpm
- A **Supabase** project (or use Lovable Cloud, which provisions one automatically)

### Install

```bash
git clone https://github.com/<your-fork>/truth-spiral.git
cd truth-spiral
bun install
```

### Environment variables

Copy `.env.example` to `.env` (if present) or create `.env` with:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>
```

For server-side scripts and migrations you may also need:

```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server only, never commit
```

> **Never commit `.env`.** Service-role keys bypass Row-Level Security.

### Database

Apply migrations to your Supabase project:

```bash
bunx supabase db push          # if using the Supabase CLI
```

Migrations live in `supabase/migrations/`. Each migration is plain SQL and includes RLS policies and GRANTs.

## Commands

| Command            | What it does                                          |
| ------------------ | ----------------------------------------------------- |
| `bun run dev`      | Start the Vite dev server with HMR at `localhost:3000` |
| `bun run build`    | Production build (Cloudflare Workers target)          |
| `bun run build:dev`| Development-mode build (faster, source-mapped)        |
| `bun run preview`  | Serve the production build locally                    |
| `bun run lint`     | Run ESLint across the project                         |
| `bun run format`   | Run Prettier with project config                      |

Replace `bun run` with `npm run` or `pnpm` if you prefer.

## Running Lint

```bash
bun run lint
```

ESLint config lives in `eslint.config.js`. Fix issues automatically where possible:

```bash
bunx eslint . --fix
```

## Running Tests

The project does not yet ship a test suite. When adding tests:

- Place unit tests next to the file under test as `*.test.ts(x)`.
- Use **Vitest** (`bun add -d vitest @testing-library/react @testing-library/jest-dom jsdom`).
- Run with:

  ```bash
  bunx vitest run            # one-shot
  bunx vitest                # watch mode
  ```

PRs that introduce new logic should include at least one test for the happy path and one for an edge case where practical.

## Project Conventions

- **Routing:** TanStack Router file-based. Filenames use dot-separated paths; `createFileRoute("...")` uses slash-separated. Never edit `src/routeTree.gen.ts` manually.
- **Server logic:** Use `createServerFn` from `@tanstack/react-start`. Do **not** add Supabase Edge Functions.
- **Styling:** Tailwind CSS v4 via `src/styles.css`. Use semantic tokens (`--background`, `--gold`, etc.) — never raw colors in components.
- **Database:** Every `CREATE TABLE public.*` migration MUST include `GRANT` statements for the roles its RLS policies allow, and enable RLS.
- **Accessibility:** Honor `prefers-reduced-motion`. Add ARIA labels to interactive elements. Keyboard-navigable by default.
- **Imports:** Prefer absolute imports (`@/components/...`) over deep relative paths.

## Pull Request Process

1. Fork the repo and create a feature branch: `git checkout -b feat/short-description`.
2. Make focused commits. One logical change per commit is ideal.
3. Run `bun run lint` and `bun run build` locally before pushing.
4. Open a PR against `main` with:
   - A short description of the change.
   - Screenshots or screen recordings for any UI change.
   - A note on any new env vars, migrations, or breaking changes.
5. Be open to feedback. Most reviews are about scope and clarity, not correctness.

## Adding Cards / Prompts

- **Truth Spiral cards** live in the `cards` table. New prompts should be filed as a migration so contributors share the same deck.
- **Sparks prompts** are static in `src/lib/sparks/decks.ts`. Edit there directly and keep tone consistent with the existing depth label.

## Reporting Issues

Open an issue with:

- What you expected to happen.
- What actually happened.
- Steps to reproduce.
- Browser/device if the issue is visual or realtime-related.

## License

By contributing you agree your contributions will be licensed under the MIT License (see [`LICENSE`](./LICENSE)).
