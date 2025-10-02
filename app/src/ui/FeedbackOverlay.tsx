import { useEffect, useState } from 'react';

import { useAppStore } from '@app/store';
import { useI18n, useTranslations } from '@shared/i18n';

export function FeedbackOverlay() {
  const flash = useAppStore((state) => state.feedbackFlash);
  const [visible, setVisible] = useState(flash);
  const t = useTranslations();
  const { isRTL } = useI18n();

  const messages = {
    hit: t.greatCatch,
    miss: t.missedLetter,
    fairness: t.boostingNeeded,
  } as const;

  useEffect(() => {
    if (!flash) {
      return;
    }
    setVisible(flash);
    const timeout = window.setTimeout(() => {
      setVisible(null);
    }, 1400);
    return () => window.clearTimeout(timeout);
  }, [flash]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`feedback-overlay feedback-overlay--${visible.type}`}
      role="status"
      aria-live="polite"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {messages[visible.type]}
    </div>
  );
}
