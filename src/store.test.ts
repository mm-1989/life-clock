import { describe, expect, it } from 'vitest';
import { defaultStore, isValidBirthDate } from './store.ts';

describe('defaultStore', () => {
  it('空の Store を返す(cardOrder はデフォルト順)', () => {
    expect(defaultStore()).toEqual({
      children: [],
      activeChildId: null,
      cardVisibility: {},
      cardOrder: ['birth', 'weeks', 'totalDays', 'nextBirthday', 'zodiac', 'events'],
    });
  });
});

describe('isValidBirthDate', () => {
  it('YYYY-MM-DD 形式を許容', () => {
    expect(isValidBirthDate('2024-02-29')).toBe(true);
    expect(isValidBirthDate('1990-01-01')).toBe(true);
    expect(isValidBirthDate('2026-12-31')).toBe(true);
  });

  it('形式が違うものを拒否', () => {
    expect(isValidBirthDate('2024/02/29')).toBe(false);
    expect(isValidBirthDate('2024-2-29')).toBe(false);
    expect(isValidBirthDate('2024-02-29T00:00')).toBe(false);
    expect(isValidBirthDate('')).toBe(false);
    expect(isValidBirthDate('hello')).toBe(false);
  });

  it('範囲外の月や記号は拒否', () => {
    // 13 月は new Date() が NaN を返す。2/30 のような日のオーバーフローは
    // 実装依存(V8 は 3/2 にロールオーバー)で、書類記入用途では <input type=date> から
    // 渡される値を信頼するため形式チェックのみを境界にする。
    expect(isValidBirthDate('2025-13-01')).toBe(false);
    expect(isValidBirthDate('abcd-ef-gh')).toBe(false);
  });
});
