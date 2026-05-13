import { describe, expect, it } from 'vitest';
import {
  calendarBreakdown,
  formatBreakdownLabel,
  formatBreakdownShort,
  formatGregorianDate,
  formatGregorianHyphen,
  formatGregorianSlash,
  formatJapaneseEraDate,
  formatJapaneseEraYear,
  formatTotalMonths,
  formatWeekdayJa,
  isFutureBirth,
  nextBirthday,
  totalDays,
  weeksAndDays,
  zodiacOf,
} from './age.ts';

const D = (s: string) => new Date(`${s}T00:00:00`);

describe('zodiacOf', () => {
  it('代表年で十二支が一致する', () => {
    // 西暦 4 年が子年(甲子)起点
    expect(zodiacOf(2020)).toBe('子');
    expect(zodiacOf(2021)).toBe('丑');
    expect(zodiacOf(2022)).toBe('寅');
    expect(zodiacOf(2023)).toBe('卯');
    expect(zodiacOf(2024)).toBe('辰');
    expect(zodiacOf(2025)).toBe('巳');
    expect(zodiacOf(2026)).toBe('午');
    expect(zodiacOf(2027)).toBe('未');
    expect(zodiacOf(2028)).toBe('申');
    expect(zodiacOf(2029)).toBe('酉');
    expect(zodiacOf(2030)).toBe('戌');
    expect(zodiacOf(2031)).toBe('亥');
  });

  it('負の年でも安全に動く', () => {
    expect(zodiacOf(0)).toBe('申'); // (0-4) mod 12 = -4 mod 12 = 8
    expect(zodiacOf(-1)).toBe('未');
  });
});

describe('isFutureBirth', () => {
  it('未来は true、当日と過去は false', () => {
    expect(isFutureBirth(D('2026-05-14'), D('2026-05-13'))).toBe(true);
    expect(isFutureBirth(D('2026-05-13'), D('2026-05-13'))).toBe(false);
    expect(isFutureBirth(D('2026-05-12'), D('2026-05-13'))).toBe(false);
  });
});

describe('totalDays', () => {
  it('同日は 0', () => {
    expect(totalDays(D('2024-05-12'), D('2024-05-12'))).toBe(0);
  });

  it('翌日は 1', () => {
    expect(totalDays(D('2024-05-12'), D('2024-05-13'))).toBe(1);
  });

  it('うるう年 2 月跨ぎを正しく数える', () => {
    expect(totalDays(D('2024-02-28'), D('2024-03-01'))).toBe(2); // 2/28 → 2/29 → 3/1
    expect(totalDays(D('2025-02-28'), D('2025-03-01'))).toBe(1); // 2/28 → 3/1 (平年)
  });

  it('1 年経過日数', () => {
    expect(totalDays(D('2023-05-12'), D('2024-05-12'))).toBe(366); // うるう年挟む
    expect(totalDays(D('2025-05-12'), D('2026-05-12'))).toBe(365);
  });
});

describe('weeksAndDays', () => {
  it('同日は 0 週 0 日', () => {
    expect(weeksAndDays(D('2024-05-12'), D('2024-05-12'))).toEqual({ weeks: 0, days: 0 });
  });

  it('7 日きっかりは 1 週 0 日', () => {
    expect(weeksAndDays(D('2024-05-12'), D('2024-05-19'))).toEqual({ weeks: 1, days: 0 });
  });

  it('15 日経過は 2 週 1 日', () => {
    expect(weeksAndDays(D('2024-05-12'), D('2024-05-27'))).toEqual({ weeks: 2, days: 1 });
  });
});

describe('calendarBreakdown', () => {
  it('同日は 0 歳 0 か月 0 日', () => {
    expect(calendarBreakdown(D('2024-05-12'), D('2024-05-12'))).toEqual({
      years: 0,
      months: 0,
      days: 0,
    });
  });

  it('1 か月後は 0 歳 1 か月 0 日', () => {
    expect(calendarBreakdown(D('2024-05-12'), D('2024-06-12'))).toEqual({
      years: 0,
      months: 1,
      days: 0,
    });
  });

  it('1 か月前日は 0 歳 0 か月 N 日', () => {
    // 5/12 → 6/11 = 30 日
    expect(calendarBreakdown(D('2024-05-12'), D('2024-06-11'))).toEqual({
      years: 0,
      months: 0,
      days: 30,
    });
  });

  it('1 年ちょうどで 1 歳 0 か月 0 日', () => {
    expect(calendarBreakdown(D('2023-05-12'), D('2024-05-12'))).toEqual({
      years: 1,
      months: 0,
      days: 0,
    });
  });

  it('1 年経過直前で 0 歳 11 か月 N 日', () => {
    expect(calendarBreakdown(D('2023-05-12'), D('2024-05-11'))).toEqual({
      years: 0,
      months: 11,
      days: 29, // 2024-04 = 30 日、5/11 - 5/12 = -1 → -1+30 = 29
    });
  });

  it('うるう年 2/29 出生の翌平年 2/28 は 1 歳 0 か月 0 日(月末クランプ)', () => {
    expect(calendarBreakdown(D('2024-02-29'), D('2025-02-28'))).toEqual({
      years: 0,
      months: 11,
      days: 30, // 翌平年の 2/28 はまだ「1 歳直前」扱い
    });
    // 翌日 3/1 で 1 歳 0 か月 0 日になる
    expect(calendarBreakdown(D('2024-02-29'), D('2025-03-01'))).toEqual({
      years: 1,
      months: 0,
      days: 0,
    });
  });

  it('うるう年 2/29 出生の翌うるう年 2/29 は 4 歳 0 か月 0 日', () => {
    expect(calendarBreakdown(D('2024-02-29'), D('2028-02-29'))).toEqual({
      years: 4,
      months: 0,
      days: 0,
    });
  });

  it('月末出生(1/31)→ 2/28 は 0 歳 0 か月 28 日', () => {
    expect(calendarBreakdown(D('2025-01-31'), D('2025-02-28'))).toEqual({
      years: 0,
      months: 0,
      days: 28,
    });
  });
});

describe('formatBreakdownLabel', () => {
  it('0歳0か月は「D日」のみ(新生児期 / 直前)', () => {
    expect(formatBreakdownLabel({ years: 0, months: 0, days: 15 })).toBe('15日');
    expect(formatBreakdownLabel({ years: 0, months: 0, days: 0 })).toBe('0日');
  });

  it('0歳・1か月以上は「Mか月とD日」、0日のときは「Mか月」', () => {
    expect(formatBreakdownLabel({ years: 0, months: 3, days: 12 })).toBe('3か月と12日');
    expect(formatBreakdownLabel({ years: 0, months: 11, days: 0 })).toBe('11か月');
  });

  it('1 歳以降は 0 のものを省略、残った単位は「と」で繋ぐ', () => {
    expect(formatBreakdownLabel({ years: 1, months: 0, days: 12 })).toBe('1歳と12日');   // 0 月省略
    expect(formatBreakdownLabel({ years: 3, months: 0, days: 1 })).toBe('3歳と1日');     // 0 月省略
    expect(formatBreakdownLabel({ years: 1, months: 3, days: 0 })).toBe('1歳と3か月');   // 0 日省略
    expect(formatBreakdownLabel({ years: 1, months: 0, days: 0 })).toBe('1歳');            // 月日とも 0
    expect(formatBreakdownLabel({ years: 5, months: 11, days: 30 })).toBe('5歳と11か月と30日'); // フル
  });
});

describe('formatBreakdownShort', () => {
  it('0 歳は「Mか月」のみ', () => {
    expect(formatBreakdownShort({ years: 0, months: 3, days: 12 })).toBe('3か月');
    expect(formatBreakdownShort({ years: 0, months: 0, days: 15 })).toBe('0か月');
  });
  it('1 歳以降は「N歳Mか月」', () => {
    expect(formatBreakdownShort({ years: 1, months: 3, days: 12 })).toBe('1歳3か月');
    expect(formatBreakdownShort({ years: 5, months: 0, days: 0 })).toBe('5歳0か月');
  });
});

describe('formatTotalMonths', () => {
  it('歳を月に換算', () => {
    expect(formatTotalMonths({ years: 1, months: 3, days: 12 })).toBe('15か月');
    expect(formatTotalMonths({ years: 0, months: 3, days: 12 })).toBe('3か月');
    expect(formatTotalMonths({ years: 5, months: 0, days: 0 })).toBe('60か月');
  });
});

describe('formatGregorianSlash / formatGregorianHyphen', () => {
  it('スラッシュ区切り(ゼロ埋めなし)', () => {
    expect(formatGregorianSlash(D('2023-05-12'))).toBe('2023/5/12');
    expect(formatGregorianSlash(D('2024-12-01'))).toBe('2024/12/1');
  });
  it('ハイフン区切り(ゼロ埋め、ISO 8601)', () => {
    expect(formatGregorianHyphen(D('2023-05-12'))).toBe('2023-05-12');
    expect(formatGregorianHyphen(D('2024-12-01'))).toBe('2024-12-01');
  });
});

describe('formatGregorianDate', () => {
  it('YYYY年M月D日 形式', () => {
    expect(formatGregorianDate(D('2023-05-12'))).toBe('2023年5月12日');
    expect(formatGregorianDate(D('2024-02-29'))).toBe('2024年2月29日');
    expect(formatGregorianDate(D('1990-01-01'))).toBe('1990年1月1日');
  });
});

describe('formatJapaneseEraDate', () => {
  it('令和(2019-05-01 以降)', () => {
    expect(formatJapaneseEraDate(D('2019-05-01'))).toBe('令和元年5月1日');
    expect(formatJapaneseEraDate(D('2023-05-12'))).toBe('令和5年5月12日');
    expect(formatJapaneseEraDate(D('2026-05-13'))).toBe('令和8年5月13日');
  });

  it('平成(1989-01-08 〜 2019-04-30)', () => {
    expect(formatJapaneseEraDate(D('1989-01-08'))).toBe('平成元年1月8日');
    expect(formatJapaneseEraDate(D('2019-04-30'))).toBe('平成31年4月30日');
    expect(formatJapaneseEraDate(D('2000-12-31'))).toBe('平成12年12月31日');
  });

  it('昭和(1926-12-25 〜 1989-01-07)', () => {
    expect(formatJapaneseEraDate(D('1989-01-07'))).toBe('昭和64年1月7日');
    expect(formatJapaneseEraDate(D('1926-12-25'))).toBe('昭和元年12月25日');
    expect(formatJapaneseEraDate(D('1970-08-15'))).toBe('昭和45年8月15日');
  });

  it('大正・明治', () => {
    expect(formatJapaneseEraDate(D('1912-07-30'))).toBe('大正元年7月30日');
    expect(formatJapaneseEraDate(D('1926-12-24'))).toBe('大正15年12月24日');
    expect(formatJapaneseEraDate(D('1868-09-08'))).toBe('明治元年9月8日');
  });

  it('大化(645)より前は西暦にフォールバック', () => {
    expect(formatJapaneseEraDate(new Date(600, 0, 1))).toBe('600年1月1日');
  });
});

describe('formatWeekdayJa', () => {
  it('曜日(日本語頭文字)を返す', () => {
    expect(formatWeekdayJa(D('2023-05-12'))).toBe('金');
    expect(formatWeekdayJa(D('2024-02-29'))).toBe('木');
    expect(formatWeekdayJa(D('2026-05-13'))).toBe('水');
    expect(formatWeekdayJa(D('2000-01-01'))).toBe('土');
  });
});

describe('formatJapaneseEraYear', () => {
  it('和暦の年部分のみ', () => {
    expect(formatJapaneseEraYear(D('2023-05-12'))).toBe('令和5年');
    expect(formatJapaneseEraYear(D('2019-05-01'))).toBe('令和元年');
    expect(formatJapaneseEraYear(D('1989-01-08'))).toBe('平成元年');
    expect(formatJapaneseEraYear(D('1989-01-07'))).toBe('昭和64年');
  });

  it('大化(645)より前は空文字', () => {
    expect(formatJapaneseEraYear(new Date(600, 0, 1))).toBe('');
  });
});

describe('nextBirthday', () => {
  it('誕生日当日は totalDays/months/days すべて 0', () => {
    expect(nextBirthday(D('2023-05-12'), D('2024-05-12'))).toEqual({
      totalDays: 0,
      months: 0,
      days: 0,
    });
  });

  it('誕生日 1 日前は totalDays=1, 0 か月 1 日', () => {
    expect(nextBirthday(D('2023-05-12'), D('2024-05-11'))).toEqual({
      totalDays: 1,
      months: 0,
      days: 1,
    });
  });

  it('1 か月ちょうど前は totalDays=30, 1 か月 0 日', () => {
    // birth 2023-05-12, today 2024-04-12 → next 2024-05-12 = 30 日
    expect(nextBirthday(D('2023-05-12'), D('2024-04-12'))).toEqual({
      totalDays: 30,
      months: 1,
      days: 0,
    });
  });

  it('1 か月 1 日前は totalDays=31, 1 か月 1 日', () => {
    expect(nextBirthday(D('2023-05-12'), D('2024-04-11'))).toEqual({
      totalDays: 31,
      months: 1,
      days: 1,
    });
  });

  it('1 か月を切る境界(29 日前)は totalDays=29, 0 か月 29 日', () => {
    expect(nextBirthday(D('2023-05-12'), D('2024-04-13'))).toEqual({
      totalDays: 29,
      months: 0,
      days: 29,
    });
  });

  it('数か月先(11 か月 29 日)は totalDays=364', () => {
    // birth 2023-05-12, today 2026-05-13 → next 2027-05-12 = 364 日
    expect(nextBirthday(D('2023-05-12'), D('2026-05-13'))).toEqual({
      totalDays: 364,
      months: 11,
      days: 29,
    });
  });

  it('うるう年 2/29 生まれの平年は 2/28 が誕生日扱い(クランプ)', () => {
    expect(nextBirthday(D('2024-02-29'), D('2025-02-28'))).toEqual({
      totalDays: 0,
      months: 0,
      days: 0,
    });
    expect(nextBirthday(D('2024-02-29'), D('2025-02-27'))).toEqual({
      totalDays: 1,
      months: 0,
      days: 1,
    });
  });
});
