# music-migrate

One Next.js + TypeScript app: marketing site, login/signup, the transfer
tool UI, and the API routes that will power it — all in one project now
(previously a separate Vite frontend + Express backend, merged here).

## Running locally

```bash
npm install
cp .env.example .env.local
# fill in SPOTIFY_CLIENT_ID/SECRET, GOOGLE_CLIENT_ID/SECRET when you get to that step
npm run dev
```

Visit `http://localhost:3000`.

This was scaffolded in a sandboxed environment with no internet access,
so `npm install` has not actually been run or tested end-to-end yet.
The framework-independent logic (`src/lib/types`, `src/lib/core`) was
typechecked directly with `tsc --strict` and passes with zero errors.
The page/component files follow standard Next.js App Router + React
patterns but haven't been booted in a real dev server — if something
doesn't compile on your machine, it's most likely a small import typo,
easy to spot from the error message.

## What's fully built

- **Landing page** (`/`) — hero with a signature visual (three track
  rows mid-transfer between platform columns), "how it works" steps,
  supported-platforms list, footer
- **Login page** (`/login`) and **signup page** (`/signup`) — styled
  forms, share a layout component (`AuthLayout`) so they can't visually
  drift apart. **Static only**: submitting just shows a note that
  there's no backend wired up. See the `// NOTE:` comments in
  `src/app/login/page.tsx` and `src/app/signup/page.tsx` for exactly
  where to add a real request once you have an auth API.
- **Design system** — carried over and refined: warm graphite
  background, Fraunces display serif, Archivo body, IBM Plex Mono for
  labels, single signal-green accent. All CSS uses CSS Modules
  (`*.module.css`) scoped per component, which is the standard Next.js
  pattern — no global classnames to worry about colliding.

## What's scaffolded (minimal structure, yours to build out)

This is intentionally left thin so you have real room to learn by
extending it yourself:

- **`/app` page** (`src/app/app/page.tsx`) — the actual transfer tool
  screen. Right now it just fetches `/api/providers` and shows the
  From/To picker. Nothing happens when you click "Connect accounts" —
  that's the next thing to build.
- **`src/lib/core/MusicProvider.ts`** — the adapter interface every
  platform must implement. Don't change this lightly; everything else
  depends on its shape.
- **`src/lib/adapters/spotify/SpotifyProvider.ts`** and
  **`src/lib/adapters/ytmusic/YtMusicProvider.ts`** — adapter classes.
  OAuth authorization URL builders work. Every other method
  (`exchangeCodeForToken`, `getPlaylists`, `searchTrack`, etc.) is a
  `throw new Error(...)` with a comment describing exactly which API
  endpoint to call and how. This is where most of your own work will
  go — see the TODO comments in each file.
- **`src/app/api/providers/route.ts`** — the only API route that
  exists so far. It's a good template for how to write the others
  (e.g. `src/app/api/auth/spotify/callback/route.ts` for the OAuth
  redirect handler).

## Project layout

```
src/
  app/
    page.tsx                 Landing page
    page.module.css
    layout.tsx                Root layout (fonts, <html>/<body>)
    globals.css                Design tokens (colors, fonts) — :root vars
    login/page.tsx             Login page (static form)
    signup/page.tsx            Signup page (static form)
    app/page.tsx               Transfer tool screen (minimal, your TODO)
    app/page.module.css
    api/
      providers/route.ts       GET /api/providers — lists registered adapters
  components/
    Nav.tsx                    Marketing-site nav bar
    TransferVisual.tsx         Landing page signature visual
    AuthLayout.tsx              Shared shell for login/signup
    AuthForm.module.css         Shared input/button styles for both forms
    TransferPicker.tsx          From/To platform picker (used on /app)
  lib/
    types/domain.ts             Shared types: NormalizedTrack, MatchResult, etc.
    providerMeta.ts             Display names for known provider keys
    core/
      MusicProvider.ts           The adapter interface (READ THIS FIRST)
      ProviderRegistry.ts         Lookup table, register/get/list by name
      registerProviders.ts        Wires adapters into the registry at boot
    adapters/
      spotify/SpotifyProvider.ts
      ytmusic/YtMusicProvider.ts
```

## Suggested order to keep building

1. Implement `SpotifyProvider.exchangeCodeForToken` — that's the
   first real network call, good place to get OAuth working end to end.
2. Build `src/app/api/auth/spotify/callback/route.ts` to receive the
   redirect, call `exchangeCodeForToken`, and store the result
   somewhere (a cookie/session to start, a database later).
3. Repeat for YouTube (`YtMusicProvider`).
4. Once both adapters can list a real user's playlists, update
   `/app/page.tsx` to show actual playlists instead of just platform
   names.
5. Build the matcher (ISRC-first, fuzzy title/artist fallback) as a
   new file in `src/lib/core/matcher.ts`.
6. Build the "Connect accounts" button on `/app` to actually kick off
   `getAuthorizationUrl()` and redirect there.
7. When you're ready for real signup/login, add a database (SQLite is
   the simplest start) and wire the forms in `/login` and `/signup` to
   real `/api/auth/*` routes.
