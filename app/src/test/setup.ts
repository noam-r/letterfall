import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
  return setTimeout(cb, 16);
});

global.cancelAnimationFrame = vi.fn().mockImplementation((id) => {
  clearTimeout(id);
});

// Mock performance.now
Object.defineProperty(global.performance, 'now', {
  writable: true,
  value: vi.fn(() => Date.now()),
});

// Mock navigator properties
Object.defineProperty(navigator, 'deviceMemory', {
  writable: true,
  value: 4,
});

Object.defineProperty(navigator, 'hardwareConcurrency', {
  writable: true,
  value: 4,
});

Object.defineProperty(navigator, 'maxTouchPoints', {
  writable: true,
  value: 0,
});

// Mock screen orientation
Object.defineProperty(screen, 'orientation', {
  writable: true,
  value: {
    lock: vi.fn().mockResolvedValue(undefined),
    unlock: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock CSS.supports
Object.defineProperty(CSS, 'supports', {
  writable: true,
  value: vi.fn().mockReturnValue(true),
});

// Mock document.fonts
Object.defineProperty(document, 'fonts', {
  writable: true,
  value: {
    add: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    load: vi.fn().mockResolvedValue([]),
  },
});

// Mock FontFace
global.FontFace = vi.fn().mockImplementation(() => ({
  load: vi.fn().mockResolvedValue({}),
}));

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  // Suppress specific warnings that are expected in tests
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Warning: ReactDOM.render is no longer supported') ||
     message.includes('Warning: React.createFactory() is deprecated') ||
     message.includes('Service Worker'))
  ) {
    return;
  }
  originalWarn(...args);
};