/**
 * LanguageToggle.test.tsx — Language Switcher Component Tests
 *
 * Tests that the LanguageToggle select element:
 *  1. Renders with the default English option selected
 *  2. Renders all four language options
 *  3. Calls setLanguage when the user changes selection
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageToggle from './LanguageToggle';
import { LanguageProvider } from '../context/LanguageContext';

// ─── Helper ──────────────────────────────────────────────────────────────────

const renderWithLanguage = () =>
  render(
    <LanguageProvider>
      <LanguageToggle />
    </LanguageProvider>
  );

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LanguageToggle', () => {
  it('renders a select element', () => {
    renderWithLanguage();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('starts with English selected', () => {
    renderWithLanguage();
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('en');
  });

  it('renders all four language options', () => {
    renderWithLanguage();
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Hindi/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Tamil/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Marathi/ })).toBeInTheDocument();
  });

  it('changes the selected language when the user picks Hindi', async () => {
    const user = userEvent.setup();
    renderWithLanguage();

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    await user.selectOptions(select, 'hi');
    expect(select.value).toBe('hi');
  });

  it('changes the selected language when the user picks Tamil', async () => {
    const user = userEvent.setup();
    renderWithLanguage();

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    await user.selectOptions(select, 'ta');
    expect(select.value).toBe('ta');
  });
});
