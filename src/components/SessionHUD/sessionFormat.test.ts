import { describe, expect, it } from 'vitest';
import { formatClock, formatRemaining, formatSummary } from './sessionFormat';

describe('formatClock', () => {
  it('formats minutes and zero-padded seconds', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(59)).toBe('0:59');
    expect(formatClock(60)).toBe('1:00');
    expect(formatClock(75)).toBe('1:15');
    expect(formatClock(600)).toBe('10:00');
  });
});

describe('formatRemaining', () => {
  it('reads as time left, and never goes negative', () => {
    expect(formatRemaining(222)).toBe('3:42 left');
    expect(formatRemaining(0)).toBe('0:00 left');
    expect(formatRemaining(-5)).toBe('0:00 left');
  });
});

describe('formatSummary', () => {
  it('uses seconds under a minute', () => {
    expect(formatSummary(45)).toBe('45 sec');
    expect(formatSummary(59.9)).toBe('59 sec');
  });

  it('floors rather than rounding — 90s is never "2 min"', () => {
    expect(formatSummary(90)).toBe('1 min 30');
    expect(formatSummary(119)).toBe('1 min 59');
    expect(formatSummary(360)).toBe('6 min');
  });

  it('drops the seconds when they are zero', () => {
    expect(formatSummary(60)).toBe('1 min');
    expect(formatSummary(600)).toBe('10 min');
  });
});
