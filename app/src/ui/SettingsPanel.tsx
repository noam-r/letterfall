import { BUILT_IN_TOPICS } from '@data/topics';
import { useAppStore } from '@app/store';
import type { Difficulty, SpeedSetting } from '@app/store';

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

  const difficultyOptions: Difficulty[] = ['Easy', 'Standard', 'Hard'];
  const speedOptions: SpeedSetting[] = ['Slow', 'Normal', 'Fast'];

  return (
    <div className="settings-panel">
      <h2>Settings</h2>
      <div className="settings-panel__group">
        <label htmlFor="topic">Topic preference</label>
        <select
          id="topic"
          value={selectedTopicId ?? ''}
          onChange={(event) => setSelectedTopic(event.target.value || null)}
        >
          <option value="">Random (recommended)</option>
          {BUILT_IN_TOPICS.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>
        <p className="settings-panel__hint">Quick Start uses this topic when set. Leave on Random for surprise rounds.</p>
      </div>
      <div className="settings-panel__group">
        <label htmlFor="difficulty">Difficulty</label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value as Difficulty)}
        >
          {difficultyOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="settings-panel__group">
        <label htmlFor="speed">Drop speed</label>
        <select
          id="speed"
          value={speed}
          onChange={(event) => setSpeed(event.target.value as SpeedSetting)}
        >
          {speedOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="settings-panel__group">
        <label htmlFor="noise">Noise letters</label>
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
          Reduced motion
        </label>
      </div>
    </div>
  );
}
