import { useI18n, useTranslations } from '@shared/i18n';

export function AboutView() {
  const t = useTranslations();
  const { isRTL } = useI18n();
  
  return (
    <div className="about-view" dir={isRTL ? 'rtl' : 'ltr'}>
      <h2>{t.aboutTitle}</h2>
      <p>{t.aboutDescription}</p>
      <p>{t.aboutBuild}</p>
      <p>{t.aboutPrivacy}</p>
    </div>
  );
}
