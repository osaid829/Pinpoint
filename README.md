# Pinpoint

Pinpoint is a daily geography game where players explore a 3D globe, drop pins based on clues, and compete for accuracy. It features cinematic reveals, streaks, leaderboards, shareable results, category-based challenges, and a mobile-first experience.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
npm start
```

The current vertical slice uses a typed local question set and client-side scoring to prove the gameplay loop. Production follow-up work is documented in `docs/GAME_DESIGN.md`, including server-authoritative scoring, accounts, persistence, and live leaderboards.
