import { useAppStore } from '@app/store';

export function ConstructionBar() {
  const activeWord = useAppStore((state) => state.activeWord);
  const words = useAppStore((state) => state.words);
  const construction = useAppStore((state) => state.construction);
  const roundPhase = useAppStore((state) => state.roundPhase);

  const activeEntry = activeWord ? words.find((word) => word.word === activeWord) : undefined;
  const progress = activeEntry?.progress ?? '';
  const nextLetter = activeWord ? activeWord[progress.length] ?? null : null;

  const statusMessage = (() => {
    if (roundPhase === 'won') return 'All words complete!';
    if (roundPhase === 'lost') return 'Out of credits';
    if (roundPhase === 'paused') return 'Paused';
    if (roundPhase === 'idle') return 'Tap Start to play';
    return null;
  })();

  return (
    <footer className="construction-bar">
      <div className="construction-bar__content">
        <div className="construction-bar__word">
          <span className="label">Target word</span>
          <strong>{activeWord ?? 'Auto-selecting next word'}</strong>
        </div>
        <div className="construction-bar__progress">
          <span className="label">Progress</span>
          <span className="construction-bar__letters">
            <span className="construction-bar__built">{progress || '—'}</span>
            {nextLetter ? <span className="construction-bar__next">{nextLetter}</span> : null}
          </span>
        </div>
        <div className="construction-bar__tray">
          <span className="label">Tray</span>
          <span className="construction-bar__letters">
            {statusMessage ?? (roundPhase === 'playing' ? construction || 'Tap letters to build' : construction || '—')}
          </span>
        </div>
      </div>
    </footer>
  );
}
