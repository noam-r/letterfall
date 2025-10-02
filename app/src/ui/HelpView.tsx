import { APP_VIEW } from '@app/routes';
import { useAppStore } from '@app/store';
import { useI18n, useTranslations } from '@shared/i18n';

export function HelpView() {
  const requestOnboarding = useAppStore((state) => state.requestOnboarding);
  const setView = useAppStore((state) => state.setView);
  const t = useTranslations();
  const { isRTL } = useI18n();

  return (
    <div className="help-view" dir={isRTL ? 'rtl' : 'ltr'}>
      <h2>{t.howToPlay}</h2>
      <ol>
        <li>{t.helpStep1}</li>
        <li>{t.helpStep2}</li>
        <li>{t.helpStep3}</li>
        <li>{t.helpStep4}</li>
      </ol>
      <p>{t.needRefresher}</p>
      <button type="button" className="ghost" onClick={() => { requestOnboarding(); setView(APP_VIEW.Playing); }}>
        {t.replayOnboarding}
      </button>
      <p>
        {t.milestoneNote}
      </p>
      <button type="button" className="ghost" onClick={() => setView(APP_VIEW.About)}>
        {t.readAbout}
      </button>
    </div>
  );
}
