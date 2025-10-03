import { Howl } from 'howler';
import { errorReporter } from './error/ErrorReporter';

interface AudioState {
  muted: boolean;
  audioEnabled: boolean;
  loadingErrors: Set<string>;
}

const audioState: AudioState = {
  muted: false,
  audioEnabled: true,
  loadingErrors: new Set(),
};

function createSafeHowl(src: string[], volume: number, name: string): Howl | null {
  try {
    const howl = new Howl({
      src,
      volume,
      onloaderror: (_id, error) => {
        console.warn(`Failed to load audio: ${name}`, error);
        audioState.loadingErrors.add(name);
        
        errorReporter.reportError(
          new Error(`Audio loading failed: ${name} - ${error}`),
          {
            component: 'AudioSystem',
            action: 'audio_load',
            additionalData: { audioFile: name, src }
          }
        );
      },
      onplayerror: (_id, error) => {
        console.warn(`Failed to play audio: ${name}`, error);
        
        errorReporter.reportError(
          new Error(`Audio playback failed: ${name} - ${error}`),
          {
            component: 'AudioSystem',
            action: 'audio_play',
            additionalData: { audioFile: name }
          }
        );
      }
    });

    return howl;
  } catch (error) {
    console.error(`Failed to create Howl instance for ${name}:`, error);
    audioState.loadingErrors.add(name);
    audioState.audioEnabled = false;
    
    errorReporter.reportError(error as Error, {
      component: 'AudioSystem',
      action: 'audio_init',
      additionalData: { audioFile: name }
    });
    
    return null;
  }
}

const sounds = {
  collect: createSafeHowl(['/sounds/collect.wav'], 0.4, 'collect'),
  miss: createSafeHowl(['/sounds/miss.wav'], 0.3, 'miss'),
  summary: createSafeHowl(['/sounds/summary.wav'], 0.35, 'summary'),
};

function safePlay(sound: Howl | null, name: string): void {
  if (!audioState.audioEnabled || audioState.muted || !sound) {
    return;
  }

  if (audioState.loadingErrors.has(name)) {
    // Audio failed to load, skip playback
    return;
  }

  try {
    sound.play();
  } catch (error) {
    console.warn(`Failed to play ${name}:`, error);
    audioState.loadingErrors.add(name);
    
    errorReporter.reportError(error as Error, {
      component: 'AudioSystem',
      action: 'audio_play',
      additionalData: { audioFile: name }
    });
  }
}

export const audioBus = {
  playCollect() {
    safePlay(sounds.collect, 'collect');
  },
  playMiss() {
    safePlay(sounds.miss, 'miss');
  },
  playSummary() {
    safePlay(sounds.summary, 'summary');
  },
  setMuted(state: boolean) {
    audioState.muted = state;
  },
  getAudioState() {
    return {
      ...audioState,
      loadingErrors: Array.from(audioState.loadingErrors),
    };
  },
  isAudioEnabled() {
    return audioState.audioEnabled && audioState.loadingErrors.size < Object.keys(sounds).length;
  },
  hasAudioErrors() {
    return audioState.loadingErrors.size > 0;
  },
  resetAudioSystem() {
    audioState.loadingErrors.clear();
    audioState.audioEnabled = true;
  }
};
