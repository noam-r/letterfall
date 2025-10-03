import { useAppStore } from '@app/store';
import { useI18n, useTranslations } from '@shared/i18n';

export function ConstructionBar() {
  const activeWord = useAppStore((state) => state.activeWord);
  const words = useAppStore((state) => state.words);
  const construction = useAppStore((state) => state.construction);
  const roundPhase = useAppStore((state) => state.roundPhase);
  const t = useTranslations();
  const { isRTL } = useI18n();

  const activeEntry = activeWord ? words.find((word) => word.word === activeWord) : undefined;
  const progress = activeEntry?.progress ?? '';
  const nextLetter = activeWord ? activeWord[progress.length] ?? null : null;

  const statusMessage = (() => {
    if (roundPhase === 'won') return t.allWordsComplete;
    if (roundPhase === 'lost') return t.outOfCredits;
    if (roundPhase === 'paused') return t.paused;
    if (roundPhase === 'idle') return t.tapStartToPlay;
    return null;
  })();

  return (
    <footer className="construction-bar" dir={isRTL ? 'rtl' : 'ltr'} role="contentinfo">
      <div className="construction-bar__content">
        <div className="construction-bar__word" role="status" aria-live="polite">
          <span className="label" id="target-word-label">{t.targetWord}</span>
          <strong aria-labelledby="target-word-label">{activeWord ?? t.autoSelectingNext}</strong>
        </div>
        <div className="construction-bar__progress" role="status" aria-live="polite">
          <span className="label" id="progress-label">{t.progress}</span>
          <span 
            className="construction-bar__letters" 
            dir={isRTL ? 'rtl' : 'ltr'}
            aria-labelledby="progress-label"
            aria-label={`Built: ${progress || 'none'}, Next letter needed: ${nextLetter || 'none'}`}
          >
            <span className="construction-bar__built" aria-label="Letters built">
              {progress || '—'}
            </span>
            {nextLetter ? (
              <span className="construction-bar__next" aria-label={`Next letter: ${nextLetter}`}>
                {nextLetter}
              </span>
            ) : null}
          </span>
        </div>
        <div className="construction-bar__tray" role="status" aria-live="polite">
          <span className="label" id="tray-label">{t.tray}</span>
          <span 
            className="construction-bar__letters" 
            dir={isRTL ? 'rtl' : 'ltr'}
            aria-labelledby="tray-label"
            aria-label={`Letter tray: ${statusMessage ?? (roundPhase === 'playing' ? construction || 'empty' : construction || 'empty')}`}
          >
            {statusMessage ?? (roundPhase === 'playing' ? construction || t.tapLettersToBuild : construction || '—')}
          </span>
        </div>
      </div>
    </footer>
  );
}
