/**
 * test/setup.ts — Global Vitest Setup
 *
 * Runs once before every test file.
 * Responsibilities:
 *  1. Extend Vitest's `expect` with jest-dom matchers (toBeInTheDocument, etc.)
 *  2. Stub browser APIs that JSDOM doesn't implement (matchMedia, ResizeObserver,
 *     MediaRecorder, fetch, Audio, import.meta.env)
 *  3. Clear all mocks between tests to prevent state bleed
 */

import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

// ─── Browser-Only Mocks ───────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  // Mock: window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock: ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock: MediaRecorder
  global.MediaRecorder = vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    ondataavailable: null,
    onstop: null,
    stream: { getTracks: () => [{ stop: vi.fn() }] },
  })) as unknown as typeof MediaRecorder;

  Object.defineProperty(global.navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      }),
    },
  });

  // Mock: Audio
  global.Audio = vi.fn().mockImplementation(() => ({
    play: vi.fn().mockResolvedValue(undefined),
  })) as unknown as typeof Audio;

  // Mock: scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
}

// ─── Cross-Environment Mocks (Node & Browser) ──────────────────────────────────
// Mock: fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({}),
  text: async () => '',
  blob: async () => new Blob(),
});

// Mock: URL.createObjectURL / revokeObjectURL
if (global.URL && global.URL.createObjectURL) {
  global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
}

// ─── Mock: import.meta.env ────────────────────────────────────────────────────
// Vitest injects import.meta.env from vite.config.ts but some fields need defaults.
// Components guard on import.meta.env.DEV — make sure it's consistently false in tests.
vi.stubEnv('DEV', 'false');
vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-maps-key');

// ─── Cleanup ─────────────────────────────────────────────────────────────────
// Reset all mock state between tests so tests are fully isolated.
afterEach(() => {
  vi.clearAllMocks();
});
