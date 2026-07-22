# CLAUDE.md

## Project overview
This repository is a Next.js 14 + TypeScript app for syncing music playlists between platforms such as Spotify and YouTube Music. The current implementation includes marketing pages, auth screens, and a scaffolded transfer workflow.

## Tech stack
- Next.js 14 (App Router)
- React 18
- TypeScript
- CSS Modules
- jose for signed session cookies

## Key folders
- src/app/: route pages and API handlers
- src/components/: reusable UI components
- src/lib/: shared logic, domain types, provider adapters, and auth helpers

## Important architecture notes
- Use the App Router pattern in src/app.
- Keep UI components small and reusable under src/components.
- Put business logic, provider interfaces, and domain models under src/lib/.
- Follow the existing TypeScript and CSS Modules conventions.
- New providers should implement the interface defined in src/lib/core/MusicProvider.ts.

## Main entry points
- src/app/page.tsx: landing page
- src/app/login/page.tsx: login screen
- src/app/signup/page.tsx: signup screen
- src/app/app/page.tsx: transfer tool UI
- src/app/api/providers/route.ts: provider registry API endpoint
- src/lib/auth/session.ts: session cookie creation and verification
- src/lib/core/registerProviders.ts: provider registration wiring

## Development commands
- npm install
- npm run dev
- npm run build
- npm run lint

## Environment notes
- Session auth depends on SESSION_SECRET in .env.local.
- OAuth-related provider work is scaffolded and should be completed incrementally.

## Working conventions for changes
- Prefer minimal, focused edits.
- Preserve existing folder structure unless a clear refactor is needed.
- Keep component styling scoped with CSS Modules.
- Add or update types when introducing new data flow.
- When implementing providers, follow the existing adapter pattern rather than introducing a parallel structure.
