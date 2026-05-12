// 月から季節を判定。日本式(3-5月=春、6-8月=夏、9-11月=秋、12-2月=冬)。
// data-season 属性を <html> に付けて、styles.css 側で背景パターンを切り替える。

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export function currentSeason(now: Date = new Date()): Season {
  const m = now.getMonth() + 1; // 1..12
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

export function applySeasonTheme(now: Date = new Date()): void {
  document.documentElement.dataset.season = currentSeason(now);
}
