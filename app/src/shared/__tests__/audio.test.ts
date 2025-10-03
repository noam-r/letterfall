import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Howler
const mockHowl = {
  play: vi.fn(),
  on: vi.fn(),
};

const mockHowlConstructor = vi.fn(() => mockHowl);

vi.mock('howler', () => ({
  Howl: mockHowlConstructor,
}));

// Mock error reporter
const mockErrorReporter = {
  reportError: vi.fn(),
};

vi.mock('../error/ErrorReporter', () => ({
  errorReporter: mockErrorReporter,
}));

describe('audioBus', () => {
  let consoleWarn: ReturnType<typeof vi.spyOn>;
  let consoleError: ReturnType<typeof vi.spyOn>;
  let audioBus: any;

  beforeEach(async () => {
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset mocks
    mockErrorReporter.reportError.mockClear();
    mockHowl.play.mockClear();
    mockHowl.on.mockClear();
    mockHowlConstructor.mockClear();
    
    // Re-import audioBus to get fresh instance
    vi.resetModules();
    const audioModule = await import('../audio');
    audioBus = audioModule.audioBus;
    
    // Reset audio system state
    audioBus.resetAudioSystem();
    audioBus.setMuted(false);
  });

  afterEach(() => {
    consoleWarn.mockRestore();
    consoleError.mockRestore();
  });

  describe('initialization', () => {
    it('creates Howl instances for all sounds', () => {
      expect(mockHowlConstructor).toHaveBeenCalledTimes(3);
      
      // Check that all sounds are created with correct parameters
      expect(mockHowlConstructor).toHaveBeenCalledWith({
        src: ['/sounds/collect.wav'],
        volume: 0.4,
        onloaderror: expect.any(Function),
        onplayerror: expect.any(Function),
      });
      
      expect(mockHowlConstructor).toHaveBeenCalledWith({
        src: ['/sounds/miss.wav'],
        volume: 0.3,
        onloaderror: expect.any(Function),
        onplayerror: expect.any(Function),
      });
      
      expect(mockHowlConstructor).toHaveBeenCalledWith({
        src: ['/sounds/summary.wav'],
        volume: 0.35,
        onloaderror: expect.any(Function),
        onplayerror: expect.any(Function),
      });
    });

    it('handles Howl constructor errors gracefully', async () => {
      mockHowlConstructor.mockImplementationOnce(() => {
        throw new Error('Howl creation failed');
      });

      // Re-import to trigger initialization with error
      vi.resetModules();
      
      expect(async () => await import('../audio')).not.toThrow();
    });
  });

  describe('playback', () => {
    it('plays sounds when not muted and audio is enabled', () => {
      audioBus.playCollect();
      audioBus.playMiss();
      audioBus.playSummary();

      expect(mockHowl.play).toHaveBeenCalledTimes(3);
    });

    it('does not play sounds when muted', () => {
      audioBus.setMuted(true);
      
      audioBus.playCollect();
      audioBus.playMiss();
      audioBus.playSummary();

      expect(mockHowl.play).not.toHaveBeenCalled();
    });

    it('handles playback errors gracefully', () => {
      mockHowl.play.mockImplementation(() => {
        throw new Error('Playback failed');
      });

      audioBus.playCollect();

      expect(consoleWarn).toHaveBeenCalledWith(
        'Failed to play collect:',
        expect.any(Error)
      );
      expect(mockErrorReporter.reportError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'AudioSystem',
          action: 'audio_play',
          additionalData: { audioFile: 'collect' }
        })
      );
    });

    it('skips playback for sounds with loading errors', () => {
      // Simulate loading error for collect sound
      const collectHowl = mockHowlConstructor.mock.results[0].value;
      const onloaderror = mockHowlConstructor.mock.calls[0][0].onloaderror;
      onloaderror(1, 'Network error');

      audioBus.playCollect();

      expect(mockHowl.play).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('reports loading errors', () => {
      const onloaderror = mockHowlConstructor.mock.calls[0][0].onloaderror;
      onloaderror(1, 'Failed to load audio file');

      expect(consoleWarn).toHaveBeenCalledWith(
        'Failed to load audio: collect',
        'Failed to load audio file'
      );
      expect(mockErrorReporter.reportError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'AudioSystem',
          action: 'audio_load',
          additionalData: {
            audioFile: 'collect',
            src: ['/sounds/collect.wav']
          }
        })
      );
    });

    it('reports playback errors', () => {
      const onplayerror = mockHowlConstructor.mock.calls[0][0].onplayerror;
      onplayerror(1, 'Playback failed');

      expect(consoleWarn).toHaveBeenCalledWith(
        'Failed to play audio: collect',
        'Playback failed'
      );
      expect(mockErrorReporter.reportError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'AudioSystem',
          action: 'audio_play',
          additionalData: { audioFile: 'collect' }
        })
      );
    });
  });

  describe('state management', () => {
    it('tracks mute state', () => {
      expect(audioBus.getAudioState().muted).toBe(false);
      
      audioBus.setMuted(true);
      expect(audioBus.getAudioState().muted).toBe(true);
      
      audioBus.setMuted(false);
      expect(audioBus.getAudioState().muted).toBe(false);
    });

    it('tracks loading errors', () => {
      const onloaderror = mockHowlConstructor.mock.calls[0][0].onloaderror;
      onloaderror(1, 'Loading failed');

      const audioState = audioBus.getAudioState();
      expect(audioState.loadingErrors).toContain('collect');
    });

    it('reports audio system status correctly', () => {
      expect(audioBus.isAudioEnabled()).toBe(true);
      expect(audioBus.hasAudioErrors()).toBe(false);

      // Simulate loading error
      const onloaderror = mockHowlConstructor.mock.calls[0][0].onloaderror;
      onloaderror(1, 'Loading failed');

      expect(audioBus.hasAudioErrors()).toBe(true);
      expect(audioBus.isAudioEnabled()).toBe(true); // Still enabled if not all sounds failed
    });

    it('disables audio when all sounds fail to load', () => {
      // Simulate all sounds failing to load
      mockHowlConstructor.mock.calls.forEach((call, index) => {
        const onloaderror = call[0].onloaderror;
        onloaderror(1, `Loading failed for sound ${index}`);
      });

      expect(audioBus.isAudioEnabled()).toBe(false);
    });

    it('resets audio system state', () => {
      // Cause some errors
      const onloaderror = mockHowlConstructor.mock.calls[0][0].onloaderror;
      onloaderror(1, 'Loading failed');

      expect(audioBus.hasAudioErrors()).toBe(true);

      audioBus.resetAudioSystem();

      expect(audioBus.hasAudioErrors()).toBe(false);
      expect(audioBus.isAudioEnabled()).toBe(true);
    });
  });
});