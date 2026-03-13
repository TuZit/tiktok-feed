# TikTok Feed

## Topic

Implement a TikTok-style feed with multiple video players.

---

## 1) Fundamentals

### Questions

1. How would you auto-play a video only when it is visible on screen?
2. Why can’t we rely only on `onScroll` for visibility detection?
3. How do you ensure only one video plays at a time?
4. What states should each video item own locally?
5. How would you show loading and error UI for a video?
6. How do you prevent memory leaks when video components unmount?

### Expected Answers

- Uses **IntersectionObserver** for visibility.
- Pauses current/other videos before playing the active one.
- Mentions local states like `isLoading`, `isPlaying`, `isMuted`, `hasError`.
- Adds cleanup in `useEffect` for listeners/observers.
- Handles errors with fallback UI and retry.

### Evaluation Rubric

- **0–1**: React basics only; misses video lifecycle.
- **2**: Correct idea, incomplete edge cases.
- **3**: Practical implementation with clean flow.
- **4**: Handles rapid scroll, load failures, and cleanup correctly.

---

## 2) Mid Level (Architecture + Performance)

### Questions

1. How would you split responsibilities between `Feed`, `VideoCard`, and a shared playback controller?
2. How do you coordinate a single active player across many cards?
3. How would you implement infinite scroll with request cancellation?
4. What preload strategy would you choose?
5. How do you avoid unnecessary re-renders?
6. How do you preserve playback progress when items leave and re-enter viewport?
7. How would you instrument watch analytics (e.g., 2s watched)?
8. What integration tests are essential?

### Expected Answers

- Clear component boundaries and state ownership.
- Shared active-video state via context/store/ref registry.
- Uses `AbortController` for cancellation.
- Preloads nearby items only (active ±1).
- Uses memoization and stable callbacks.
- Stores progress keyed by `videoId`.
- Analytics based on visibility + threshold duration.
- Tests autoplay handoff, pagination, and error states.

### Evaluation Rubric

- **0–1**: Working UI but weak architecture/performance rationale.
- **2**: Good structure but partial edge-case handling.
- **3**: Strong architecture + robust async behavior.
- **4**: Production-ready trade-off thinking + testability.

---

## 3) Senior Level (System Design Trade-offs)

### Questions

1. How would you scale to thousands of videos while preserving smooth UX?
2. Virtualized list vs full list: when and why?
3. How do you design a robust playback coordinator under rapid scrolling?
4. How do you adapt behavior for low-end devices and poor networks?
5. Which product and technical metrics define success?
6. How would you avoid duplicate/noisy analytics events?
7. What accessibility concerns are critical in gesture-heavy UIs?
8. What production failure modes do you expect and how would you mitigate them?

### Expected Answers

- Clear trade-offs among virtualization, buffering, and prefetch budget.
- State-machine-like playback orchestration.
- Adaptive strategy by network/device constraints.
- Idempotent analytics event model and event batching.
- A11y support: keyboard controls, captions, focus management, reduced motion.
- Operational observability plan: performance telemetry + logs.

### Evaluation Rubric

- **0–1**: Implementation-only discussion.
- **2**: Some trade-offs, weak reliability/operational plan.
- **3**: Strong architecture + reliability + metrics.
- **4**: End-to-end system thinking across product, perf, and operations.

---

## 4) Unified Scoring Matrix

Score each category 1–4:

1. Correctness (autoplay, pause, single-active-player)
2. Performance (render cost, preloading, scalability)
3. Architecture (separation of concerns, state flow)
4. Async robustness (cancellation, race handling, retry strategy)
5. UX/A11y (loading/error, interaction quality, accessibility)
6. Testing/Observability (tests, analytics, metrics)

### Score Interpretation

- **6–10**: Needs significant support
- **11–16**: Hireable junior / developing mid
- **17–21**: Solid mid-level
- **22–24**: Strong senior signal

---

## 5) Live Coding Prompt

Build a vertical video feed where:

- videos autoplay when visible and pause when not,
- only one video can play at a time,
- infinite scroll uses mocked API,
- each item shows loading/error states.

### Stretch Goals

- Preserve playback position per `videoId`
- Preload next item
- Emit `view_start` and `view_2s` analytics

---

## 6) 90-Minute Interview Script (Minute-by-Minute)

### 0–10 min: Setup + Framing

- Clarify requirements and constraints.
- Ask candidate to state assumptions.

**What to look for:** communication clarity, requirement slicing.

### 10–20 min: High-Level Design

- Candidate sketches component/state architecture.
- Discuss where autoplay logic and active-player ownership live.

**Signals:** separation of concerns, predictable state flow.

### 20–55 min: Core Implementation

- Implement feed list and `VideoCard`.
- Add visibility detection and autoplay/pause logic.
- Enforce single active player.

**Signals:** correctness under scroll, clean React hooks usage.

### 55–70 min: Data + UX Robustness

- Add infinite scroll + loading/error states.
- Add cancellation (`AbortController`) to avoid stale updates.

**Signals:** async safety and UX resilience.

### 70–80 min: Performance Pass

- Discuss/render optimization and preload strategy.
- Optional: virtualization decision and trade-offs.

**Signals:** practical performance reasoning, not premature optimization.

### 80–90 min: Testing + Wrap-up

- Candidate outlines test plan.
- Discuss edge cases and production metrics.

**Signals:** engineering maturity and operational mindset.

---

## 7) Interviewer Reference: Model Answer Outline

### A) Suggested Architecture

- `FeedPage`
  - owns paginated data and loading states
  - tracks `activeVideoId`
- `VideoCard`
  - presentational + local UI (`isMuted`, transient loading)
  - reports visibility changes
- `PlaybackController` (context/store/hook)
  - central API: `setActive(videoId)`, `pauseAllExcept(videoId)`

### B) Visibility + Playback Strategy

- Use `IntersectionObserver` with threshold (e.g., 0.6).
- When card becomes active:
  1. set `activeVideoId`
  2. pause previous active element
  3. play current element
- Guard against race conditions by checking current active ID before calling `play()`.

### C) Pagination and Request Safety

- Trigger next-page fetch near list bottom.
- Track `cursor` and `hasMore`.
- Cancel in-flight fetch on unmount or query change via `AbortController`.

### D) Performance Baseline

- Memoize `VideoCard`.
- Keep callbacks stable with `useCallback`.
- Preload only adjacent media.
- Consider virtualization once list size/DOM cost becomes the bottleneck.

### E) Analytics Baseline

- `view_start`: fired when item crosses visibility threshold.
- `view_2s`: fired once per item after continuous 2s watch.
- De-duplicate by session + video ID + event type.

### F) Test Plan

- Unit: visibility-to-active selection logic.
- Integration:
  - only one video plays at once,
  - autoplay handoff during rapid scroll,
  - load error and retry,
  - pagination append behavior,
  - cancellation prevents stale state writes.

---

## 8) Follow-up Variants (for repeat practice)

1. Add global mute with per-video override.
2. Start feed at deep-linked `videoId`.
3. Add optimistic like/follow actions with rollback.
4. Add reduced-motion mode and keyboard navigation.
5. Add low-bandwidth mode (smaller preload budget).
