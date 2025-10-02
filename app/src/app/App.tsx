import { useEffect } from 'react';

import { AboutView } from '@ui/AboutView';
import { GameView } from '@ui/GameView';
import { HelpView } from '@ui/HelpView';
import { SettingsPanel } from '@ui/SettingsPanel';
import { StartScreen } from '@ui/StartScreen';
import { I18nProvider, useTranslations } from '@shared/i18n';

import { APP_VIEW, type AppView } from './routes';
import { useAppStore } from './store';

function AppContent() {
  const view = useAppStore((state) => state.view);
  const setView = useAppStore((state) => state.setView);
  const t = useTranslations();

  useEffect(() => {
    const VIEW_TITLES: Record<AppView, string> = {
      [APP_VIEW.Start]: t.appTitle,
      [APP_VIEW.Playing]: `${t.appTitle} — ${t.playing}`,
      [APP_VIEW.Settings]: `${t.appTitle} — ${t.settings}`,
      [APP_VIEW.Help]: `${t.appTitle} — ${t.help}`,
      [APP_VIEW.About]: `${t.appTitle} — ${t.about}`,
    };
    document.title = VIEW_TITLES[view];
  }, [view, t]);

  return (
    <div className={`app app--${view}`}>
      {view === APP_VIEW.Start && <StartScreen />}
      {view === APP_VIEW.Playing && <GameView />}
      {view === APP_VIEW.Settings && (
        <section className="overlay">
          <button className="overlay__close" type="button" onClick={() => setView(APP_VIEW.Start)}>
            {t.close}
          </button>
          <SettingsPanel />
        </section>
      )}
      {view === APP_VIEW.Help && (
        <section className="overlay">
          <button className="overlay__close" type="button" onClick={() => setView(APP_VIEW.Start)}>
            {t.close}
          </button>
          <HelpView />
        </section>
      )}
      {view === APP_VIEW.About && (
        <section className="overlay">
          <button className="overlay__close" type="button" onClick={() => setView(APP_VIEW.Start)}>
            {t.close}
          </button>
          <AboutView />
        </section>
      )}
    </div>
  );
}

export function App() {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  useEffect(() => {
    // Update HTML dir attribute for RTL support
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return (
    <I18nProvider language={language} onLanguageChange={setLanguage}>
      <AppContent />
    </I18nProvider>
  );
}
