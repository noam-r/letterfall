# Roadmap notes (Phase 0 → Phase 2)

_Source: LetterFall specification, sections “🛣️ Roadmap” and “🧩 Features”._

## Delivered in this milestone

- Phase 0 — Project scaffold (Vite + React + TS, dependency stack, theming baseline).
- Phase 1 — Core loop skeleton completed (Pixi canvas, falling letters, click-to-collect, credit drain).
- Phase 2 (partial) — Word selection, progress tracking, fairness guard, pause/onboarding flows, and win/lose summary overlay with audio.
- Settings, Help, About overlays wired into view management.

## Upcoming priority work

1. **Phase 2 completion**
   - Broaden topic catalog to the ten packs listed in the spec (~50 words each) and add recency avoidance.
   - Persist last-session metadata for analytics and surface a topic selector experience.

2. **Phase 3 polish**
   - Animations/SFX polish (hit/miss transitions, fairness pulses), cross-off transitions, and construction tray cues.
   - Fairness tuning metrics, color-blind palettes, and enhanced HUD alerts.

3. **Phase 4 expansion**
   - Round summary deep-dive (session stats already in place; add per-word accuracy, streak history), pause menu refinements, and topic switching flow per spec.
   - Audio tuning (volume sliders, distinct cues), onboarding replay flows, and tutorial localization prep.

4. **Phase 5+ polish**
   - PWA packaging (Workbox), deterministic RNG/replay tooling, Vitest + Playwright coverage, and performance profiling.

Track these as TODOs in the state/store once gameplay tuning begins.
