import { useEffect } from 'react';

import { AboutView } from '@ui/AboutView';
import { GameView } from '@ui/GameView';
import { HelpView } from '@ui/HelpView';
import { SettingsPanel } from '@ui/SettingsPanel';
import { StartScreen } from '@ui/StartScreen';

import { APP_VIEW, type AppView } from './routes';
import { useAppStore } from './store';

const VIEW_TITLES: Record<AppView, string> = {
  [APP_VIEW.Start]: 'LetterFall',
  [APP_VIEW.Playing]: 'LetterFall — Playing',
  [APP_VIEW.Settings]: 'LetterFall — Settings',
  [APP_VIEW.Help]: 'LetterFall — Help',
  [APP_VIEW.About]: 'LetterFall — About',
};

export function App() {
  const view = useAppStore((state) => state.view);
  const setView = useAppStore((state) => state.setView);

  useEffect(() => {
    document.title = VIEW_TITLES[view];
  }, [view]);

  return (
    <div className={`app app--${view}`}>
      {view === APP_VIEW.Start && <StartScreen />}
      {view === APP_VIEW.Playing && <GameView />}
      {view === APP_VIEW.Settings && (
        <section className="overlay">
          <button className="overlay__close" type="button" onClick={() => setView(APP_VIEW.Start)}>
            Close
          </button>
          <SettingsPanel />
        </section>
      )}
      {view === APP_VIEW.Help && (
        <section className="overlay">
          <button className="overlay__close" type="button" onClick={() => setView(APP_VIEW.Start)}>
            Close
          </button>
          <HelpView />
        </section>
      )}
      {view === APP_VIEW.About && (
        <section className="overlay">
          <button className="overlay__close" type="button" onClick={() => setView(APP_VIEW.Start)}>
            Close
          </button>
          <AboutView />
        </section>
      )}
    </div>
  );
}
