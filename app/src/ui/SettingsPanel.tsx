import { useMemo } from 'react';

import { listTopics } from '@data/topics';
import { useAppStore } from '@app/store';
import type { Difficulty, SpeedSetting } from '@app/store';
import { useI18n, useTranslations, type Language } from '@shared/i18n';

export function SettingsPanel() {
  const difficulty = useAppStore((state) => state.difficulty);
  const setDifficulty = useAppStore((state) => state.setDifficulty);
  const speed = useAppStore((state) => state.speed);
  const setSpeed = useAppStore((state) => state.setSpeed);
  const noiseLevel = useAppStore((state) => state.noiseLevel);
  const setNoiseLevel = useAppStore((state) => state.setNoiseLevel);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const setReducedMotion = useAppStore((state) => state.setReducedMotion);
  const selectedTopicId = useAppStore((state) => state.selectedTopicId);
  const setSelectedTopic = useAppStore((state) => state.setSelectedTopic);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const t = useTranslations();
  const { isRTL } = useI18n();

  const difficultyOptions: Difficulty[] = ['Easy', 'Standard', 'Hard'];
  const speedOptions: SpeedSetting[] = ['Slow', 'Normal', 'Fast'];
  const languageOptions: { value: Language; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'he', label: 'עברית' },
  ];
  const topics = useMemo(() => listTopics(language), [language]);

  return (
    <div className="settings-panel" dir={isRTL ? 'rtl' : 'ltr'}>
      <h2>{t.settings}</h2>
      <div className="settings-panel__group">
        <label htmlFor="language">{t.language}</label>
        <select
          id="language"
          value={language}
          onChange={(event) => setLanguage(event.target.value as Language)}
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="settings-panel__group">
        <label htmlFor="topic">{t.topicPreference}</label>
        <select
          id="topic"
          value={selectedTopicId ?? ''}
          onChange={(event) => setSelectedTopic(event.target.value || null)}
        >
          <option value="">{t.randomRecommended}</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>
        <p className="settings-panel__hint">{t.quickStartHint}</p>
      </div>
      <div className="settings-panel__group">
        <label htmlFor="difficulty">{t.difficulty}</label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value as Difficulty)}
        >
          {difficultyOptions.map((option) => (
            <option key={option} value={option}>
              {option === 'Easy' ? t.easy : option === 'Standard' ? t.standard : t.hard}
            </option>
          ))}
        </select>
      </div>
      <div className="settings-panel__group">
        <label htmlFor="speed">{t.dropSpeed}</label>
        <select
          id="speed"
          value={speed}
          onChange={(event) => setSpeed(event.target.value as SpeedSetting)}
        >
          {speedOptions.map((option) => (
            <option key={option} value={option}>
              {option === 'Slow' ? t.slow : option === 'Normal' ? t.normal : t.fast}
            </option>
          ))}
        </select>
      </div>
      <div className="settings-panel__group">
        <label htmlFor="noise">{t.noiseLetters}</label>
        <input
          id="noise"
          type="range"
          min={0}
          max={0.5}
          step={0.05}
          value={noiseLevel}
          onChange={(event) => setNoiseLevel(Number(event.target.value))}
        />
        <span className="settings-panel__value">{Math.round(noiseLevel * 100)}%</span>
      </div>
      <div className="settings-panel__group settings-panel__checkbox">
        <label htmlFor="reduced-motion">
          <input
            id="reduced-motion"
            type="checkbox"
            checked={reducedMotion}
            onChange={(event) => setReducedMotion(event.target.checked)}
          />
          {t.reducedMotion}
        </label>
      </div>
    </div>
  );
}
