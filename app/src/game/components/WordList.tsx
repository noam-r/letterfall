import clsx from 'clsx';

import { useAppStore } from '@app/store';

export function WordList() {
  const words = useAppStore((state) => state.words);
  const activeWord = useAppStore((state) => state.activeWord);
  const selectWord = useAppStore((state) => state.selectWord);
  const roundPhase = useAppStore((state) => state.roundPhase);
  const disabled = roundPhase !== 'playing';

  if (words.length === 0) {
    return (
      <aside className="word-list">
        <h2>Word List</h2>
        <p>Words will appear here once a round starts.</p>
      </aside>
    );
  }

  return (
    <aside className="word-list">
      <h2>Word List</h2>
      <ul>
        {words.map((entry) => {
          const isActive = entry.word === activeWord;
          const length = entry.word.length;
          const progress = entry.progress.length;
          const percent = Math.round((progress / length) * 100);
          return (
            <li key={entry.word}>
              <button
                type="button"
                onClick={() => selectWord(entry.word)}
                className={clsx('word-list__item', {
                  'word-list__item--active': isActive && !entry.found,
                  'word-list__item--found': entry.found,
                })}
                disabled={entry.found || disabled}
              >
                <div className="word-list__row">
                  <span className="word-list__letters">
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
                  {entry.found ? <span className="word-list__status">✓</span> : null}
                </div>
                {!entry.found ? (
                  <div className="word-list__progress" aria-hidden>
                    <span>{progress}</span>
                    <div className="word-list__progress-bar">
                      <div style={{ width: `${percent}%` }} />
                    </div>
                    <span>{length}</span>
                  </div>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
