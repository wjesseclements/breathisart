import { describe, expect, it } from 'vitest';
import { formatClock, formatSummary } from './sessionFormat';

describe('formatClock', () => {
  it('formats minutes and zero-padded seconds', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(59)).toBe('0:59');
    expect(formatClock(60)).toBe('1:00');
    expect(formatClock(75)).toBe('1:15');
    expect(formatClock(600)).toBe('10:00');
  });
});

describe('formatSummary', () => {
  it('uses seconds under a minute, rounded minutes above', () => {
    expect(formatSummary(45, 3)).toBe('45 sec · 3 cycles');
    expect(formatSummary(360, 32)).toBe('6 min · 32 cycles');
    expect(formatSummary(90, 5)).toBe('2 min · 5 cycles');
  });

  it('singularizes one cycle', () => {
    expect(formatSummary(60, 1)).toBe('1 min · 1 cycle');
  });
});
