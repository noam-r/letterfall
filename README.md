# LetterFall

LetterFall is a browser-friendly, topic-based falling-letters word game. Catch letters in real time, spell your way through five curated vocabulary words, and keep your credit meter alive. The project ships as a client-only React + PixiJS application licensed under the [PolyForm Noncommercial License](LICENSE).

## Highlights

- **React + PixiJS gameplay loop** with fairness guard, bursts of falling letters, and per-letter speed jitter.
- **Five-word sessions** sampled from topic packs with recency avoidance, word-progress tracking, and automatic advancement.
- **HUD insights** for credits, topic, and fairness pulses, plus pause/summary overlays with streak, win rate, and best-credit stats.
- **Audio & feedback** powered by Howler, with visual flashes for hits, misses, and fairness boosts (all muted by default).
- **Accessible UX** including reduced-motion fallbacks, clear word highlighting, responsive layout, and keyboard-friendly overlays.

## Getting Started

### Play Online

The latest version is automatically deployed and available at: **[https://noam-r.github.io/letterfall/](https://noam-r.github.io/letterfall/)**

### Local Development

Prerequisites: recent LTS Node.js (>=18) and npm.

```bash
cd app
npm install
# Development server
npm run dev
# Production build
npm run build
# Serve build locally
npm run preview
```

The Vite dev server prints the local URL (typically <http://localhost:5173>). Avoid opening `index.html` via `file://`; module imports require an HTTP server.

### Deployment

The game is automatically deployed to GitHub Pages on every push to the `master` branch using GitHub Actions. The deployment workflow:

1. Builds the application using `npm run build`
2. Deploys the `dist/` folder to GitHub Pages
3. Makes it available at the homepage URL listed in `package.json`

To manually trigger a deployment, you can use the "Run workflow" option in the Actions tab of the GitHub repository.

## Project Structure

```
app/
├── public/            # Static assets
├── src/
│   ├── app/           # Zustand store & view state
│   ├── game/          # Pixi runtime, engine, and HUD components
│   ├── ui/            # React UI overlays and screens
│   ├── shared/        # Cross-cutting utilities (audio bus, etc.)
│   └── styles/        # Global and component-tailored styles
└── docs/              # Roadmap notes and specification artifacts
```

## Gameplay & Controls

- **Start**: Tap/click Start for a random topic (or choose one in Settings). Each session picks five words.
- **Catch letters**: Click/tap falling glyphs that match the next required letter for your active word. Misses drain credits.
- **Switch words**: Use the word list on the right to jump between targets. Progress and highlights show where you stand.
- **Pause**: Hit the pause control in the HUD to freeze credits, review stats, or restart/change topics.

## Development Notes

- State management via [Zustand](https://github.com/pmndrs/zustand).
- Game loop rendered with [PixiJS](https://pixijs.com/).
- Finite state transitions oriented with [XState](https://stately.ai/docs/xstate).
- Audio effects handled by [Howler.js](https://howlerjs.com/).

Additional roadmap context lives in [`app/docs/roadmap-phase-notes.md`](app/docs/roadmap-phase-notes.md).

## Contributing

Issues and pull requests are welcome for noncommercial collaboration. By contributing you agree that your contributions will also fall under the PolyForm Noncommercial License.

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE). Commercial use is not permitted.
