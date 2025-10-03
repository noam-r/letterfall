# Accessibility Guide

## Overview

LetterFall is designed to be fully accessible to users with disabilities, following WCAG 2.1 AA guidelines. This document outlines the accessibility features implemented and provides guidelines for maintaining accessibility standards.

## Accessibility Features

### Screen Reader Support

#### ARIA Implementation
```typescript
// Comprehensive ARIA labels for game elements
<button
  aria-label="Select word: test - 2 of 4 letters collected, 50% complete"
  aria-pressed={isActive}
  aria-describedby="word-test-progress"
>
  <span aria-hidden="true">test</span>
</button>

// Live regions for dynamic content
<div aria-live="polite" role="status">
  {gameStatus}
</div>

<div aria-live="assertive" role="alert">
  {urgentMessages}
</div>
```

#### Screen Reader Announcements
- **Game State Changes**: Automatic announcements for round start/end
- **Word Progress**: Progress updates when letters are collected
- **Score Updates**: Credit and completion announcements
- **Error States**: Clear error messages and recovery instructions

### Keyboard Navigation

#### Full Keyboard Support
```typescript
// Comprehensive keyboard handling
const useGameKeyboardControls = (
  onPause?: () => void,
  onResume?: () => void,
  onSelectWord?: (direction: 'next' | 'previous') => void
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (onPause) onPause();
          if (onResume) onResume();
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          event.preventDefault();
          if (onSelectWord) {
            onSelectWord(event.code === 'ArrowUp' ? 'previous' : 'next');
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onPause, onResume, onSelectWord]);
};
```

#### Keyboard Shortcuts
- **Space**: Pause/Resume game
- **Arrow Keys**: Navigate between words
- **Enter**: Select word or activate button
- **Tab**: Navigate between interactive elements
- **Escape**: Close modals or return to previous screen

### Visual Accessibility

#### High Contrast Support
```css
@media (prefers-contrast: high) {
  .game-hud,
  .word-list,
  .construction-bar {
    border: 1px solid currentColor;
  }
  
  .word-list__item--active {
    outline: 2px solid currentColor;
  }
  
  .word-list__letter--matched {
    background-color: currentColor;
    color: var(--color-surface);
  }
}
```

#### Focus Indicators
```css
button:focus-visible,
[role="button"]:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.word-list__item:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
  z-index: 1;
  position: relative;
}
```

### Reduced Motion Support

#### System Preference Detection
```typescript
class ReducedMotionManager {
  private detectSystemPreference(): void {
    if (window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.setEnabled(prefersReducedMotion.matches);

      prefersReducedMotion.addEventListener('change', (e) => {
        this.setEnabled(e.matches);
      });
    }
  }
}
```

#### Alternative Visual Feedback
```css
.reduced-motion .feedback-static {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: bold;
  z-index: 10000;
  /* No animations - static feedback only */
}
```

### Audio Accessibility

#### Audio Cues
```typescript
class AccessibilityManager {
  provideAudioCues(event: GameEvent): void {
    if (!this.settings.audioDescriptions) return;

    switch (event.type) {
      case 'letter_collected':
        audioBus.playCollect();
        if (this.settings.screenReaderEnabled) {
          this.announce(`Letter ${event.data?.letter} collected`);
        }
        break;
      case 'word_completed':
        audioBus.playSummary();
        if (this.settings.screenReaderEnabled) {
          this.announce(`Word completed: ${event.data?.word}`);
        }
        break;
    }
  }
}
```

#### Audio Alternatives
- **Visual Indicators**: Visual feedback for all audio cues
- **Haptic Feedback**: Vibration support on mobile devices
- **Text Announcements**: Screen reader announcements for audio events

### Mobile Accessibility

#### Touch Target Sizing
```css
.mobile button,
.mobile [role="button"],
.mobile input,
.mobile select {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem 1rem;
}

@media (max-width: 480px) {
  .mobile button,
  .mobile [role="button"] {
    min-height: 48px;
    font-size: 1rem;
  }
}
```

#### Gesture Support
```typescript
// Touch gesture recognition with accessibility considerations
const useTouchGestures = (elementRef, options) => {
  useEffect(() => {
    const touchManager = new TouchManager(elementRef.current, {
      doubleTapThreshold: 300,
      longPressThreshold: 500,
      tapThreshold: 10, // Generous tap tolerance
    });
    
    touchManager.setListeners({
      onTap: options.onTap,
      onLongPress: options.onLongPress, // Alternative to right-click
    });
    
    return () => touchManager.destroy();
  }, []);
};
```

## Accessibility Testing

### Automated Testing
```typescript
// Accessibility tests using axe-core
import { axe, toHaveNoViolations } from 'jest-axe';

describe('Accessibility Tests', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<GameView />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should have proper ARIA labels', () => {
    render(<WordList />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });
});
```

### Manual Testing Checklist
- [ ] Screen reader navigation (NVDA, JAWS, VoiceOver)
- [ ] Keyboard-only navigation
- [ ] High contrast mode testing
- [ ] Reduced motion preference testing
- [ ] Mobile accessibility testing
- [ ] Color contrast verification

### Testing Tools
- **axe-core**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation
- **Lighthouse**: Accessibility audit
- **Screen Readers**: NVDA, JAWS, VoiceOver testing

## Implementation Guidelines

### ARIA Best Practices

#### Semantic HTML First
```typescript
// Use semantic HTML elements when possible
<main className="game-view">
  <header role="banner">
    <nav aria-label="Game controls">
      <button>Settings</button>
    </nav>
  </header>
  
  <section aria-labelledby="word-list-heading">
    <h2 id="word-list-heading">Available Words</h2>
    <ul role="list">
      {words.map(word => (
        <li key={word.id} role="listitem">
          <button aria-describedby={`progress-${word.id}`}>
            {word.text}
          </button>
        </li>
      ))}
    </ul>
  </section>
</main>
```

#### Live Regions
```typescript
// Use appropriate live region types
<div aria-live="polite" role="status">
  {/* Non-urgent status updates */}
</div>

<div aria-live="assertive" role="alert">
  {/* Urgent messages that need immediate attention */}
</div>

<div aria-live="off">
  {/* Content that shouldn't be announced */}
</div>
```

### Keyboard Navigation

#### Focus Management
```typescript
const useFocusManagement = () => {
  const updateFocusableElements = useCallback(() => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])'
    ].join(', ');
    
    const elements = Array.from(document.querySelectorAll(focusableSelectors));
    // Update focus order and management
  }, []);
  
  useEffect(() => {
    updateFocusableElements();
  });
};
```

#### Skip Links
```typescript
// Provide skip links for keyboard users
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
<a href="#word-list" className="skip-link">
  Skip to word list
</a>

<main id="main-content">
  {/* Main game content */}
</main>
```

### Screen Reader Support

#### Descriptive Labels
```typescript
// Provide comprehensive descriptions
<button
  aria-label={`${word} - ${progress} of ${total} letters collected, ${percentage}% complete${isActive ? ', currently selected' : ''}`}
  aria-pressed={isActive}
>
  {word}
</button>
```

#### Status Updates
```typescript
// Announce important state changes
const announceGameState = (state: GameState) => {
  let announcement = '';
  
  switch (state.roundPhase) {
    case 'playing':
      announcement = `Game in progress. ${state.credits} credits remaining.`;
      break;
    case 'won':
      announcement = `Congratulations! You completed all words with ${state.credits} credits remaining.`;
      break;
  }
  
  // Use live region to announce
  setAnnouncement(announcement);
};
```

## Accessibility Settings

### User Preferences
```typescript
interface AccessibilitySettings {
  screenReaderEnabled: boolean;
  keyboardNavigation: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  audioDescriptions: boolean;
}

// Sync with system preferences
const detectSystemPreferences = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
  
  return {
    reducedMotion: prefersReducedMotion.matches,
    highContrast: prefersHighContrast.matches,
  };
};
```

### Settings UI
```typescript
// Accessible settings interface
<fieldset>
  <legend>Accessibility Preferences</legend>
  
  <label>
    <input
      type="checkbox"
      checked={settings.reducedMotion}
      onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
    />
    Reduce motion and animations
  </label>
  
  <label>
    <input
      type="checkbox"
      checked={settings.audioDescriptions}
      onChange={(e) => updateSetting('audioDescriptions', e.target.checked)}
    />
    Enable audio descriptions
  </label>
</fieldset>
```

## Common Accessibility Patterns

### Modal Dialogs
```typescript
const AccessibleModal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Trap focus within modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements?.length) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
    >
      <div className="modal-content">
        <h2 id="modal-title">{title}</h2>
        {children}
        <button onClick={onClose} aria-label="Close dialog">
          ×
        </button>
      </div>
    </div>
  );
};
```

### Progress Indicators
```typescript
const AccessibleProgress = ({ value, max, label }) => (
  <div>
    <label id="progress-label">{label}</label>
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-labelledby="progress-label"
      aria-valuetext={`${value} of ${max} complete`}
    >
      <div style={{ width: `${(value / max) * 100}%` }} />
    </div>
  </div>
);
```

### Form Validation
```typescript
const AccessibleInput = ({ label, error, ...props }) => {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  
  return (
    <div>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <div id={errorId} role="alert" className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};
```

## Troubleshooting Accessibility Issues

### Common Issues

#### Screen Reader Problems
1. **Missing Labels**
   - Ensure all interactive elements have accessible names
   - Use aria-label or aria-labelledby for complex elements
   - Provide context for form inputs

2. **Incorrect ARIA Usage**
   - Validate ARIA attributes with accessibility tools
   - Test with actual screen readers
   - Follow ARIA authoring practices

#### Keyboard Navigation Issues
1. **Focus Management**
   - Ensure all interactive elements are focusable
   - Implement proper focus order
   - Handle focus trapping in modals

2. **Missing Keyboard Shortcuts**
   - Provide keyboard alternatives for mouse actions
   - Document keyboard shortcuts
   - Test with keyboard-only navigation

#### Visual Accessibility Problems
1. **Color Contrast**
   - Use tools to verify contrast ratios
   - Provide alternative indicators beyond color
   - Test in high contrast mode

2. **Focus Indicators**
   - Ensure focus indicators are visible
   - Don't remove default focus styles without replacement
   - Test focus visibility in different themes

### Testing Strategies

#### Automated Testing
- Run axe-core tests in CI/CD pipeline
- Use Lighthouse accessibility audits
- Implement accessibility regression tests

#### Manual Testing
- Test with keyboard-only navigation
- Use screen readers for comprehensive testing
- Verify with users who have disabilities

#### User Testing
- Include users with disabilities in testing
- Gather feedback on accessibility features
- Iterate based on real user experiences

## Accessibility Compliance

### WCAG 2.1 AA Compliance
- **Perceivable**: Information must be presentable in ways users can perceive
- **Operable**: Interface components must be operable by all users
- **Understandable**: Information and UI operation must be understandable
- **Robust**: Content must be robust enough for various assistive technologies

### Legal Requirements
- **ADA Compliance**: Americans with Disabilities Act requirements
- **Section 508**: Federal accessibility standards
- **EN 301 549**: European accessibility standard

### Documentation Requirements
- Accessibility statement
- User guide for accessibility features
- Known limitations and workarounds
- Contact information for accessibility support