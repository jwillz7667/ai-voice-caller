# Repository Guidelines

## Project Structure & Module Organization
- `webapp/`: Next.js 14 app (TypeScript, App Router). Key folders: `app/`, `components/`, `lib/`, `prisma/`, `public/`.
- `websocket-server/`: TypeScript Express/WebSocket server bridging Twilio ↔ OpenAI ↔ UI. Source in `src/`, build to `dist/`.
- Assets & docs: screenshots and top-level `README.md`. Environment templates live in `webapp/.env.example`.

## Build, Test, and Development Commands
- Webapp dev: `cd webapp && npm run dev` — runs Next.js on `localhost:3000`.
- Webapp build/start: `npm run build && npm start` — builds and serves production.
- DB helpers (webapp): `npm run db:migrate | db:push | db:seed | db:studio | db:reset` — Prisma migrations, seeding, and Studio.
- Lint (webapp): `npm run lint` — Next.js ESLint rules.
- Server dev: `cd websocket-server && npm run dev` — ts-node + nodemon.
- Server build/start: `npm run build && npm start` — compiles to `dist/` and runs.
- Optional tunnel: `npm run start:ngrok` (server) — starts server and ngrok; updates related `.env` values if supported.

## Coding Style & Naming Conventions
- Language: TypeScript (React 18, Next.js). Indentation: 2 spaces.
- Components: PascalCase filenames in `webapp/components` (e.g., `CallPanel.tsx`). Hooks/utilities: camelCase (e.g., `useCalls.ts`, `formatPhone.ts`).
- Styling: Tailwind CSS; prefer utility classes over ad‑hoc CSS.
- Linting: Fix issues surfaced by `npm run lint` before pushing.

## Testing Guidelines
- No formal unit test suite. Validate by:
  - Type checks/builds: `webapp/npm run build`, `websocket-server/npm run build`.
  - Lint: `webapp/npm run lint`.
  - Smoke scripts (webapp): `node test-db.js`, `node test-login.js` when applicable.
- Add focused tests or scripts alongside the feature if behavior is complex.

## Commit & Pull Request Guidelines
- Commit style: Conventional Commits (e.g., `feat: add recordings page`, `fix: clamp OpenAI temperature`). Keep messages imperative and scoped.
- PRs must include:
  - Clear description, steps to reproduce/verify, and any migrations/env changes.
  - Linked issue(s). Screenshots/GIFs for UI changes.
  - Scope: separate PRs for frontend/server when possible; otherwise label cross-cutting changes and note coordination steps.

## Security & Configuration Tips
- Secrets: never commit `.env`; copy from `webapp/.env.example` and create `websocket-server/.env` as needed.
- Update Twilio webhooks to the current public URL (e.g., ngrok) and keep `PUBLIC_URL`/frontend backend URL in sync.
