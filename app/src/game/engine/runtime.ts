import { Container, Text, TextStyle } from 'pixi.js';

import type {
  Difficulty,
  RoundPhase,
  SpeedSetting,
  WordProgress,
} from '@app/store';
import type { Language } from '@shared/i18n';
import type { GameContext } from './Game';

type CollectCallback = (letter: string) => {
  matched: boolean;
  completedWord: boolean;
  roundWon: boolean;
};

type RuntimeCallbacks = {
  onLetterCollected: CollectCallback;
  onLetterMissed: () => void;
  onFairnessNudge: () => void;
};

type RuntimeState = {
  roundPhase: RoundPhase;
  words: WordProgress[];
  activeWord: string | null;
  difficulty: Difficulty;
  speed: SpeedSetting;
  noiseLevel: number;
  language: Language;
};

type LetterEntity = {
  id: number;
  char: string;
  display: Text;
  velocity: number;
  age: number;
};

const SPAWN_INTERVAL_BASE: Record<Difficulty, number> = {
  Easy: 1_100,
  Standard: 850,
  Hard: 650,
};

const SPEED_BASE: Record<SpeedSetting, number> = {
  Slow: 110,
  Normal: 160,
  Fast: 210,
};

const SPEED_DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  Easy: 0.9,
  Standard: 1,
  Hard: 1.15,
};

const MAX_LETTERS_BASE: Record<SpeedSetting, number> = {
  Slow: 12,
  Normal: 18,
  Fast: 24,
};

const TARGET_ACTIVE: Record<Difficulty, number> = {
  Easy: 5,
  Standard: 6,
  Hard: 7,
};

const FAIRNESS_CHECK_INTERVAL = 2_500;
const FAIRNESS_DROUGHT_MS = 6_000;
const FAIRNESS_NUDGE_DECAY = 0.9;
const MIN_BURST = 3;
const MAX_BURST = 4;

const LETTER_STYLE = new TextStyle({
  fontFamily:
    'IBM Plex Mono, Fira Mono, ui-monospace, SFMono-Regular, Menlo, monospace, Rubik, "Assistant", "Open Sans Hebrew", "Segoe UI", sans-serif',
  fontSize: 48,
  fontWeight: '600',
  fill: 0xffffff,
});

const NOISE_ALPHABETS: Record<Language, string> = {
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  he: 'אבגדהוזחטיכלמנסעפצקרשתםןףךץ',
};

export class GameRuntime {
  private readonly app: GameContext['app'];
  private readonly callbacks: RuntimeCallbacks;
  private readonly letterLayer: Container;
  private letters: LetterEntity[] = [];
  private spawnTimer = 0;
  private spawnInterval = 900;
  private dropSpeed = 240;
  private maxLetters = 12;
  private state: RuntimeState;
  private running = false;
  private nextLetterId = 0;
  private neededLetterTimer = 0;
  private fairnessTimer = 0;
  private fairnessBoost = 1;

  constructor(ctx: GameContext, callbacks: RuntimeCallbacks) {
    this.app = ctx.app;
    this.callbacks = callbacks;
    this.letterLayer = new Container();
    this.letterLayer.sortableChildren = false;
    this.app.stage.addChild(this.letterLayer);

    this.state = {
      roundPhase: 'idle',
      words: [],
      activeWord: null,
      difficulty: 'Standard',
      speed: 'Normal',
      noiseLevel: 0.2,
      language: 'en',
    };

    this.app.ticker.add(this.tick);
  }

  updateState(next: RuntimeState, prev?: RuntimeState) {
    this.state = next;
    this.updateTuning();

    const startedPlaying = next.roundPhase === 'playing' && prev?.roundPhase !== 'playing';
    const stoppedPlaying = prev?.roundPhase === 'playing' && next.roundPhase !== 'playing';

    if (startedPlaying) {
      this.restartLoop();
    }

    if (stoppedPlaying && next.roundPhase !== 'playing') {
      this.haltLoop();
    }

    if (next.roundPhase !== 'playing' && next.roundPhase !== 'idle') {
      this.clearLetters();
    }

    // Reset fairness timers when switching active word
    if (next.activeWord !== prev?.activeWord) {
      this.neededLetterTimer = 0;
      this.fairnessTimer = 0;
      this.fairnessBoost = 1;
    }
  }

  destroy() {
    this.haltLoop();
    this.clearLetters();
    this.app.ticker.remove(this.tick);
    this.letterLayer.destroy({ children: true });
  }

  private restartLoop() {
    this.clearLetters();
    this.spawnTimer = 0;
    this.running = true;
    this.neededLetterTimer = 0;
    this.fairnessTimer = 0;
    this.fairnessBoost = 1;
  }

  private haltLoop() {
    this.running = false;
  }

  private tick = () => {
    if (!this.running || this.state.roundPhase !== 'playing') {
      return;
    }

    const deltaMS = this.app.ticker.deltaMS;
    const deltaSeconds = deltaMS / 1000;

    this.spawnTimer += deltaMS;
    this.neededLetterTimer += deltaMS;
    this.fairnessTimer += deltaMS;

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      const availableSlots = Math.max(0, this.maxLetters - this.letters.length);
      const targetActive = TARGET_ACTIVE[this.state.difficulty];
      const deficit = targetActive - this.letters.length;
      if (availableSlots > 0 && deficit > 0) {
        const baseBurst =
          deficit >= MIN_BURST
            ? MIN_BURST + Math.floor(Math.random() * (MAX_BURST - MIN_BURST + 1))
            : deficit;
        const burstSize = Math.min(
          availableSlots,
          Math.min(MAX_BURST, Math.max(deficit, baseBurst))
        );
        this.spawnBurst(burstSize);
      }
    }

    const height = this.app.renderer.height;
    for (let index = this.letters.length - 1; index >= 0; index -= 1) {
      const entity = this.letters[index];
      entity.age += deltaMS;
      entity.display.y += entity.velocity * deltaSeconds;
      if (entity.display.y >= height + 60) {
        this.removeLetter(index);
        this.callbacks.onLetterMissed();
      }
    }

    if (this.fairnessTimer >= FAIRNESS_CHECK_INTERVAL) {
      this.fairnessTimer = 0;
      this.evaluateFairness();
    }
  };

  private spawnBurst(count: number) {
    for (let index = 0; index < count; index += 1) {
      this.spawnLetter();
    }
  }

  private spawnLetter() {
    if (this.letters.length >= this.maxLetters) {
      return;
    }

    const glyph = this.pickGlyph();
    const text = new Text({
      text: this.formatGlyph(glyph),
      style: LETTER_STYLE,
    });
    text.anchor.set(0.5);
    text.alpha = 0.95;
    text.eventMode = 'static';
    text.cursor = 'pointer';

    const { width } = this.app.renderer;
    const margin = 32;
    text.x = margin + Math.random() * Math.max(1, width - margin * 2);
    text.y = -margin;

    const speedJitter = 0.8 + Math.random() * 0.6;
    const entity: LetterEntity = {
      id: this.nextLetterId++,
      char: glyph,
      display: text,
      velocity: this.dropSpeed * speedJitter,
      age: 0,
    };

    text.on('pointerdown', () => {
      const outcome = this.callbacks.onLetterCollected(entity.char);
      if (outcome.matched) {
        const removalIndex = this.letters.findIndex((item) => item.id === entity.id);
        if (removalIndex >= 0) {
          this.removeLetter(removalIndex);
        }
        this.neededLetterTimer = 0;
        this.fairnessBoost = 1;
      } else {
        text.scale.set(0.85);
        setTimeout(() => {
          text.scale.set(1);
        }, 120);
      }
    });

    this.letterLayer.addChild(text);
    this.letters.push(entity);
  }

  private removeLetter(index: number) {
    const [entity] = this.letters.splice(index, 1);
    if (entity) {
      entity.display.removeAllListeners();
      entity.display.destroy();
    }
  }

  private clearLetters() {
    for (const entity of this.letters) {
      entity.display.removeAllListeners();
      entity.display.destroy();
    }
    this.letters = [];
  }

  private pickGlyph() {
    const requiredLetters = this.collectNeededLetters();
    const fairnessWeighted = this.applyFairnessWeight(requiredLetters);
    const useNoise = fairnessWeighted.length === 0 || Math.random() < this.state.noiseLevel;
    if (!useNoise) {
      return fairnessWeighted[Math.floor(Math.random() * fairnessWeighted.length)] ?? 'a';
    }
    const alphabet = NOISE_ALPHABETS[this.state.language] ?? NOISE_ALPHABETS.en;
    const index = Math.floor(Math.random() * alphabet.length);
    return alphabet[index] ?? alphabet[0] ?? 'A';
  }

  private applyFairnessWeight(letters: string[]) {
    if (letters.length === 0) {
      return letters;
    }
    // Boost required letters if drought detected
    if (this.neededLetterTimer >= FAIRNESS_DROUGHT_MS) {
      const boosted: string[] = [];
      letters.forEach((letter) => {
        boosted.push(letter);
        boosted.push(letter);
        boosted.push(letter);
      });
      return boosted;
    }
    if (this.fairnessBoost > 1) {
      const weighted: string[] = [];
      letters.forEach((letter) => {
        weighted.push(letter);
        if (Math.random() < this.fairnessBoost - 1) {
          weighted.push(letter);
        }
      });
      return weighted;
    }
    return letters;
  }

  private collectNeededLetters() {
    const letters: string[] = [];

    if (this.state.activeWord) {
      const activeEntry = this.state.words.find(
        (entry) => entry.word === this.state.activeWord && !entry.found
      );
      if (activeEntry) {
        const next = activeEntry.word[activeEntry.progress.length];
        if (next) {
          letters.push(next);
          letters.push(next); // extra weight for the active word
        }
      }
    }

    for (const entry of this.state.words) {
      if (entry.found) {
        continue;
      }
      const next = entry.word[entry.progress.length];
      if (next) {
        letters.push(next);
      }
    }
    return letters;
  }

  private updateTuning() {
    const spawnBase = SPAWN_INTERVAL_BASE[this.state.difficulty];
    const speedScale = this.state.speed === 'Slow' ? 1.25 : this.state.speed === 'Fast' ? 0.75 : 1;
    this.spawnInterval = spawnBase * speedScale;

    const baseSpeed = SPEED_BASE[this.state.speed];
    const difficultyScale = SPEED_DIFFICULTY_MULTIPLIER[this.state.difficulty];
    this.dropSpeed = baseSpeed * difficultyScale;

    const baseMax = MAX_LETTERS_BASE[this.state.speed];
    this.maxLetters = Math.max(6, Math.round(baseMax * difficultyScale));
  }

  private evaluateFairness() {
    if (!this.state.activeWord) {
      return;
    }
    const activeEntry = this.state.words.find(
      (entry) => entry.word === this.state.activeWord && !entry.found
    );
    if (!activeEntry) {
      this.fairnessBoost = 1;
      return;
    }

    const needed = activeEntry.word[activeEntry.progress.length]?.toUpperCase();
    if (!needed) {
      return;
    }

    const hasNeededOnScreen = this.letters.some(
      (entity) => entity.char.toUpperCase() === needed
    );

    if (hasNeededOnScreen) {
      this.neededLetterTimer = 0;
      this.fairnessBoost = Math.max(1, this.fairnessBoost * FAIRNESS_NUDGE_DECAY);
      return;
    }

    if (this.neededLetterTimer >= FAIRNESS_DROUGHT_MS) {
      this.fairnessBoost = Math.min(3, this.fairnessBoost + 0.5);
      this.callbacks.onFairnessNudge();
    }
  }

  private formatGlyph(letter: string) {
    return this.state.language === 'en' ? letter.toUpperCase() : letter;
  }
}
