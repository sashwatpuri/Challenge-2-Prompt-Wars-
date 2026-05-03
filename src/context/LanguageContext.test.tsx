/**
 * LanguageContext.test.tsx — i18n Context Unit Tests
 *
 * Tests the LanguageProvider and useLanguage hook:
 *  1. Default language is English
 *  2. t() returns the correct string for a known key
 *  3. t() falls back to the raw key when no translation exists
 *  4. setLanguage() switches translations correctly
 *  5. useLanguage() throws when used outside a LanguageProvider
 *
 * Uses @testing-library/react renderHook to test the hook in isolation.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from './LanguageContext';
import type { ReactNode } from 'react';

// ─── Helper: wrap a hook with LanguageProvider ────────────────────────────────

const wrapper = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useLanguage()', () => {
  it('defaults to English', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe('en');
  });

  it('t() returns the English string for a known key', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.t('appName')).toBe('VoteWise');
  });

  it('t() returns the raw key when no translation exists for it', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const unknownKey = 'some.completely.unknown.key';
    expect(result.current.t(unknownKey)).toBe(unknownKey);
  });

  it('switches to Hindi and t() returns the Hindi string', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage('hi');
    });

    expect(result.current.language).toBe('hi');
    // The Hindi appName is 'वोटवाइज़'
    expect(result.current.t('appName')).toBe('वोटवाइज़');
  });

  it('switches to Tamil and t() returns a Tamil string', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage('ta');
    });

    expect(result.current.language).toBe('ta');
    expect(result.current.t('stepPrefix')).toBe('படி');
  });

  it('switches to Marathi and t() returns a Marathi string', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage('mr');
    });

    expect(result.current.language).toBe('mr');
    expect(result.current.t('proceedEvm')).toBe('EVM सिम्युलेटरवर जा');
  });

  it('throws when used outside a LanguageProvider', () => {
    // renderHook without wrapper = no LanguageProvider in tree
    expect(() => renderHook(() => useLanguage())).toThrow(
      'useLanguage must be used within a LanguageProvider'
    );
  });
});
