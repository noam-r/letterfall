import { useEffect, useState } from 'react';

import { useAppStore } from '@app/store';

const messages = {
  hit: 'Great catch!',
  miss: 'Missed letter — stay sharp!',
  fairness: 'Boosting needed letters…',
} as const;

export function FeedbackOverlay() {
  const flash = useAppStore((state) => state.feedbackFlash);
  const [visible, setVisible] = useState(flash);

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
    <div className={`feedback-overlay feedback-overlay--${visible.type}`} role="status" aria-live="polite">
      {messages[visible.type]}
    </div>
  );
}
