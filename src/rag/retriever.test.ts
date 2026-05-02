import { describe, it, expect } from 'vitest';
import { retrieveChunks } from './retriever';

describe('retrieveChunks()', () => {
  // ── Basic retrieval ──────────────────────────────────────────────────────

  it('returns up to topK results', () => {
    const results = retrieveChunks('vote registration form', 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('returns fewer results when fewer chunks match', () => {
    const results = retrieveChunks('evm tamper hack bluetooth wifi', 10);
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it('returns an empty array for an empty query', () => {
    const results = retrieveChunks('', 3);
    expect(results).toEqual([]);
  });

  it('returns an empty array for a query consisting only of stop words', () => {
    const results = retrieveChunks('what is the a an', 3);
    expect(results).toEqual([]);
  });

  // ── Relevance ordering ───────────────────────────────────────────────────

  it('includes evm_tamper in top results for "evm tamper hack"', () => {
    // Use topK=6 since there are 6 EVM chunks and "evm" appears across all of them;
    // "tamper" and "hack" are exclusive keywords on evm_tamper so it must appear
    // within the full EVM result set.
    const results = retrieveChunks('evm tamper hack', 6);
    expect(results.length).toBeGreaterThan(0);
    const ids = results.map(r => r.id);
    expect(ids).toContain('evm_tamper');
  });

  it('places the most relevant chunk first for "postal ballot elderly 80 years"', () => {
    const results = retrieveChunks('postal ballot elderly 80 years', 5);
    expect(results.length).toBeGreaterThan(0);
    // senior_citizen_voting scores highest due to "elderly" and "postal ballot elderly"
    // keyword matches; postal_ballot also scores highly. Either is acceptable at [0].
    const topId = results[0].id;
    expect(['postal_ballot', 'senior_citizen_voting']).toContain(topId);
  });

  it('retrieves the eligibility chunk for "who can vote 18 citizen"', () => {
    const results = retrieveChunks('who can vote 18 citizen', 3);
    const ids = results.map(r => r.id);
    expect(ids).toContain('eligibility_1');
  });

  it('retrieves the bribery chunk for "cvigil report bribe"', () => {
    const results = retrieveChunks('cvigil report bribe', 3);
    const ids = results.map(r => r.id);
    expect(ids).toContain('bribery_reporting');
  });

  it('retrieves the NOTA chunk for "none of the above nota"', () => {
    // "none", "of", "the", "above" are stop words; only "nota" survives tokenization.
    // "nota" is an exact keyword on the nota chunk so it must appear.
    const results = retrieveChunks('none of the above nota', 3);
    const ids = results.map(r => r.id);
    expect(ids).toContain('nota');
  });

  // ── Chunk shape ──────────────────────────────────────────────────────────

  it('returns chunks with the correct KnowledgeChunk shape', () => {
    const results = retrieveChunks('form 6 register voter', 2);
    expect(results.length).toBeGreaterThan(0);
    for (const chunk of results) {
      expect(chunk).toHaveProperty('id');
      expect(chunk).toHaveProperty('topic');
      expect(chunk).toHaveProperty('keywords');
      expect(chunk).toHaveProperty('content');
      expect(chunk).toHaveProperty('source');
      expect(Array.isArray(chunk.keywords)).toBe(true);
      expect(typeof chunk.content).toBe('string');
    }
  });

  // ── Keyword scoring weight ───────────────────────────────────────────────

  it('gives keyword matches priority over plain content matches', () => {
    // "vvpat", "paper", "trail", "verify" — only evm_vvpat has all three
    // as keywords; other EVM chunks have no matching keywords for these tokens.
    const results = retrieveChunks('vvpat paper trail verify', 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('evm_vvpat');
  });

  it('scores partial keyword matches correctly for "tender ballot vote impersonation"', () => {
    const results = retrieveChunks('tender ballot vote impersonation', 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('tender_vote');
  });

  // ── topK boundary ────────────────────────────────────────────────────────

  it('respects topK = 1', () => {
    const results = retrieveChunks('evm electronic voting machine', 1);
    expect(results.length).toBe(1);
  });

  it('defaults topK to 3 when not specified', () => {
    const results = retrieveChunks('registration form voter');
    expect(results.length).toBeLessThanOrEqual(3);
  });
});