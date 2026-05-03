/** @vitest-environment node */
/**
 * electionData.test.ts — Constants Validation
 *
 * Verifies that the election data constants used across the app
 * have the correct shape and expected values. These are the
 * single source of truth for timeline phases, candidates, and states.
 *
 * No mocks needed — pure data assertions.
 */

import { describe, it, expect } from 'vitest';
import {
  TIMELINE_PHASES,
  CURRENT_TIMELINE_PHASE,
  DUMMY_CANDIDATES,
  INDIAN_STATES,
} from './electionData';

// ─── TIMELINE_PHASES ──────────────────────────────────────────────────────────

describe('TIMELINE_PHASES', () => {
  it('contains exactly 5 phases', () => {
    expect(TIMELINE_PHASES).toHaveLength(5);
  });

  it('each phase has id, title, and description fields', () => {
    for (const phase of TIMELINE_PHASES) {
      expect(phase).toHaveProperty('id');
      expect(phase).toHaveProperty('title');
      expect(phase).toHaveProperty('description');
      expect(typeof phase.id).toBe('string');
      expect(typeof phase.title).toBe('string');
      expect(typeof phase.description).toBe('string');
    }
  });

  it('phase IDs are unique', () => {
    const ids = TIMELINE_PHASES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes the required phases in order', () => {
    const ids = TIMELINE_PHASES.map(p => p.id);
    expect(ids).toEqual(['registration', 'nomination', 'campaign', 'voting', 'results']);
  });
});

// ─── CURRENT_TIMELINE_PHASE ───────────────────────────────────────────────────

describe('CURRENT_TIMELINE_PHASE', () => {
  it('is a string', () => {
    expect(typeof CURRENT_TIMELINE_PHASE).toBe('string');
  });

  it('refers to a valid phase in TIMELINE_PHASES', () => {
    const validIds = TIMELINE_PHASES.map(p => p.id);
    expect(validIds).toContain(CURRENT_TIMELINE_PHASE);
  });
});

// ─── DUMMY_CANDIDATES ─────────────────────────────────────────────────────────

describe('DUMMY_CANDIDATES', () => {
  it('has at least 3 candidates plus NOTA', () => {
    expect(DUMMY_CANDIDATES.length).toBeGreaterThanOrEqual(4);
  });

  it('each candidate has id, name, party, and symbol', () => {
    for (const c of DUMMY_CANDIDATES) {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('party');
      expect(c).toHaveProperty('symbol');
    }
  });

  it('candidate IDs are unique strings', () => {
    const ids = DUMMY_CANDIDATES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('NOTA is the last candidate', () => {
    const last = DUMMY_CANDIDATES[DUMMY_CANDIDATES.length - 1];
    expect(last.party).toBe('None of the Above');
  });
});

// ─── INDIAN_STATES ────────────────────────────────────────────────────────────

describe('INDIAN_STATES', () => {
  it('contains 28 states and 8 union territories (36 total)', () => {
    expect(INDIAN_STATES).toHaveLength(36);
  });

  it('contains key states', () => {
    expect(INDIAN_STATES).toContain('Maharashtra');
    expect(INDIAN_STATES).toContain('Tamil Nadu');
    expect(INDIAN_STATES).toContain('Delhi');
    expect(INDIAN_STATES).toContain('Karnataka');
  });

  it('all entries are non-empty strings', () => {
    for (const state of INDIAN_STATES) {
      expect(typeof state).toBe('string');
      expect(state.trim().length).toBeGreaterThan(0);
    }
  });

  it('has no duplicates', () => {
    expect(new Set(INDIAN_STATES).size).toBe(INDIAN_STATES.length);
  });
});
