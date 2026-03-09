# TikTok Feed Interview Side Project

Mobile-first TikTok-like feed built with `Vite + React + TypeScript`, focused on measurable frontend performance.

## What is implemented

- Fullscreen vertical feed with scroll-snap and TikTok-style overlays
- Mock API contract:
  - `GET /api/feed?cursor=<string>&limit=<number>` via `getFeed(...)`
  - `POST /api/interactions` via `postInteraction(...)`
- Windowed rendering strategy: only around `3-5` active video nodes mounted at a time
- Playback controller with single active video policy
- IntersectionObserver-based active item detection (no heavy scroll listeners)
- Prefetch strategy:
  - page cache
  - preload adjacent video metadata
  - preload adjacent poster images during idle time
- Optimistic interactions: like/save/share/comment
- Mock comments bottom sheet
- Optional performance probe logs with `?perf=1`

## Performance-oriented decisions

- One active player at a time, other videos paused immediately
- Feed virtualization by render window (`active +/- 2`)
- Prefetch constrained by capped preload links to avoid unbounded memory growth
- Non-critical work deferred with `requestIdleCallback` fallback

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Enable performance probe logs:

```text
http://localhost:5173/?perf=1
```

## Quality checks

```bash
npm run lint
npm run test
npm run build
npm run check
```

## Test coverage included

- Unit tests:
  - feed reducer behavior (dedupe, optimistic updates, rollback)
  - playback controller (single-active playback, preload cap)
- Smoke test:
  - app boot
  - feed load
  - active item switch by observer trigger
  - mounted video count guard (`<= 5`)

## Suggested interview demo flow

1. Show feed smoothness while swiping through many items.
2. Open DevTools Performance and show low dropped-frame behavior.
3. Toggle interactions and comments sheet while playback remains stable.
4. Explain architecture: mock API pipeline, reducer state, playback controller, virtualization window.
