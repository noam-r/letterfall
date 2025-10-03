import clsx from 'clsx';

import { useAppStore } from '@app/store';
import { useI18n, useTranslations } from '@shared/i18n';
import { useGameKeyboardControls, useAudioCues } from '@shared/accessibility';
import { useCallback } from 'react';

export function WordList() {
  const words = useAppStore((state) => state.words);
  const activeWord = useAppStore((state) => state.activeWord);
  const selectWord = useAppStore((state) => state.selectWord);
  const roundPhase = useAppStore((state) => state.roundPhase);
  const disabled = roundPhase !== 'playing';
  const t = useTranslations();
  const { isRTL } = useI18n();
  const playAudioCue = useAudioCues();

  const handleWordSelection = useCallback((direction: 'next' | 'previous') => {
    if (disabled || words.length === 0) return;

    const availableWords = words.filter(w => !w.found);
    if (availableWords.length === 0) return;

    const currentIndex = activeWord ? availableWords.findIndex(w => w.word === activeWord) : -1;
    let nextIndex;

    if (direction === 'next') {
      nextIndex = currentIndex < availableWords.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : availableWords.length - 1;
    }

    const nextWord = availableWords[nextIndex];
    if (nextWord) {
      selectWord(nextWord.word);
      playAudioCue({ type: 'letter_collected', data: { word: nextWord.word } });
    }
  }, [disabled, words, activeWord, selectWord, playAudioCue]);

  // Set up keyboard controls for word selection
  useGameKeyboardControls(
    undefined, // onPause handled by GameHud
    undefined, // onResume handled by GameHud
    handleWordSelection
  );

  if (words.length === 0) {
    return (
      <aside className="word-list" dir={isRTL ? 'rtl' : 'ltr'} role="complementary" aria-label={t.wordList}>
        <h2 id="word-list-heading">{t.wordList}</h2>
        <p role="status" aria-live="polite">{t.wordsWillAppear}</p>
      </aside>
    );
  }

  return (
    <aside className="word-list" dir={isRTL ? 'rtl' : 'ltr'} role="complementary" aria-labelledby="word-list-heading">
      <h2 id="word-list-heading">{t.wordList}</h2>
      <ul role="list" aria-label="Available words to build">
        {words.map((entry) => {
          const isActive = entry.word === activeWord;
          const length = entry.word.length;
          const progress = entry.progress.length;
          const percent = Math.round((progress / length) * 100);
          
          const ariaLabel = entry.found 
            ? `${entry.word} - completed`
            : `${entry.word} - ${progress} of ${length} letters collected, ${percent}% complete${isActive ? ', currently selected' : ''}`;

          return (
            <li key={entry.word} role="listitem">
              <button
                type="button"
                onClick={() => selectWord(entry.word)}
                className={clsx('word-list__item', {
                  'word-list__item--active': isActive && !entry.found,
                  'word-list__item--found': entry.found,
                })}
                disabled={entry.found || disabled}
                aria-label={ariaLabel}
                aria-pressed={isActive && !entry.found}
                aria-describedby={`word-${entry.word}-progress`}
              >
                <div className="word-list__row">
                  <span className="word-list__letters" dir={isRTL ? 'rtl' : 'ltr'} aria-hidden="true">
                    {entry.word.split('').map((letter, index) => (
                      <span
                        key={index}
                        className={clsx('word-list__letter', {
                          'word-list__letter--matched': index < progress,
                          'word-list__letter--next': index === progress && isActive && !entry.found,
                        })}
                      >
                        {letter}
                      </span>
                    ))}
                  </span>
                  {entry.found ? (
                    <span className="word-list__status" aria-label="completed" role="img">
                      ✓
                    </span>
                  ) : null}
                </div>
                {!entry.found ? (
                  <div 
                    className="word-list__progress" 
                    id={`word-${entry.word}-progress`}
                    aria-label={`Progress: ${progress} of ${length} letters`}
                  >
                    <span aria-hidden="true">{progress}</span>
                    <div 
                      className="word-list__progress-bar" 
                      role="progressbar" 
                      aria-valuenow={percent} 
                      aria-valuemin={0} 
                      aria-valuemax={100}
                      aria-label={`${entry.word} progress: ${percent}%`}
                    >
                      <div style={{ width: `${percent}%` }} />
                    </div>
                    <span aria-hidden="true">{length}</span>
                  </div>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="sr-only" aria-live="polite" role="status">
        Use arrow keys to navigate between words. Press Enter or Space to select a word.
      </div>
    </aside>
  );
}
