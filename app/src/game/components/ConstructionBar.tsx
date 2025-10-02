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
    <footer className="construction-bar" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="construction-bar__content">
        <div className="construction-bar__word">
          <span className="label">{t.targetWord}</span>
          <strong>{activeWord ?? t.autoSelectingNext}</strong>
        </div>
        <div className="construction-bar__progress">
          <span className="label">{t.progress}</span>
          <span className="construction-bar__letters" dir={isRTL ? 'rtl' : 'ltr'}>
            <span className="construction-bar__built">{progress || '—'}</span>
            {nextLetter ? <span className="construction-bar__next">{nextLetter}</span> : null}
          </span>
        </div>
        <div className="construction-bar__tray">
          <span className="label">{t.tray}</span>
          <span className="construction-bar__letters" dir={isRTL ? 'rtl' : 'ltr'}>
            {statusMessage ?? (roundPhase === 'playing' ? construction || t.tapLettersToBuild : construction || '—')}
          </span>
        </div>
      </div>
    </footer>
  );
}
