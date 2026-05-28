import { describe, it, expect } from 'vitest';
import {
  pickAnalyzerSlot,
  ASK_WHICH_SLOT,
  deriveHandoffFileName,
} from '@/utils/handoff-landing-analyzer';

// The Analyzer has two comparison slots ('us1', 'us2'). A landing hand-off fills
// one. This pure helper decides which, given the currently-occupied slots.
// See docs/adr/0009-cross-module-rate-deck-handoff.md.

const SLOTS = ['us1', 'us2'] as const;

describe('pickAnalyzerSlot', () => {
  it('returns the first slot when both are empty', () => {
    expect(pickAnalyzerSlot(SLOTS, new Set())).toBe('us1');
  });

  it('returns the empty slot when the first is full', () => {
    expect(pickAnalyzerSlot(SLOTS, new Set(['us1']))).toBe('us2');
  });

  it('returns the empty slot when the second is full', () => {
    expect(pickAnalyzerSlot(SLOTS, new Set(['us2']))).toBe('us1');
  });

  it('returns the ASK sentinel when both slots are full', () => {
    expect(pickAnalyzerSlot(SLOTS, new Set(['us1', 'us2']))).toBe(ASK_WHICH_SLOT);
  });
});

describe('deriveHandoffFileName', () => {
  it('slugifies a label into a safe .csv filename', () => {
    expect(deriveHandoffFileName('LCR2 · Position', [])).toBe('lcr2-position.csv');
  });

  it('falls back to "handoff.csv" when the label has no usable characters', () => {
    expect(deriveHandoffFileName('···', [])).toBe('handoff.csv');
  });

  it('disambiguates against an already-taken filename', () => {
    expect(deriveHandoffFileName('LCR2 · Position', ['lcr2-position.csv'])).toBe(
      'lcr2-position-2.csv'
    );
  });
});
