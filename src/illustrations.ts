// アプリ内イラスト。デザインリフレッシュで、手描きインライン SVG から
// 生成イラスト(やわらかいフラットベクター、public/ 配下)へ差し替え。
// 透過に頼らない設計のため、表示側は角丸パネルとして枠付けする(styles.css 参照)。
// BASE_URL は vite.config.ts の base(/life-clock/)。dev/本番どちらも正しく解決される。

const BASE = import.meta.env.BASE_URL;

// オンボーディングのヒーロー: 親子 + 時計+ハートのモチーフ
export const HERO_PARENT_CHILD = `<img class="ill-img" src="${BASE}onboarding-hero.webp" alt="" width="512" height="512" decoding="async" />`;

// 空状態(イベント 0 件): 双葉ときらめき
export const EMPTY_LEAF = `<img class="ill-img" src="${BASE}empty-state.webp" alt="" width="256" height="256" decoding="async" />`;

// About モーダル: アプリアイコン(時計+ハート)をそのまま流用しブランド統一
export const ABOUT_HERO = `<img class="ill-img" src="${BASE}icon-192.png" alt="" width="192" height="192" decoding="async" />`;

// タグバッジ用アイコン(絵文字置換)。currentColor で pill の色(tag-{kind})に追従し、
// 5 色それぞれに馴染む。細い丸線で統一(paw のみ塗り)。<select> には使えないので
// バッジ専用(select はラベルのみ)。
export const TAG_ICONS: Record<string, string> = {
  // 家族: 家
  family: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11l8-6 8 6"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/></svg>`,
  // 親戚: 木
  relative: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="5.2"/><path d="M12 13.2V20"/></svg>`,
  // 友達: 二人
  friend: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 4 18.5V20"/><circle cx="9.5" cy="8" r="3"/><path d="M20 20v-1.5a3.5 3.5 0 0 0-2.7-3.4"/><path d="M15 5.2a3 3 0 0 1 0 5.6"/></svg>`,
  // ペット: 肉球(塗り)
  pet: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><circle cx="6.5" cy="11" r="2"/><circle cx="10" cy="7" r="2"/><circle cx="14" cy="7" r="2"/><circle cx="17.5" cy="11" r="2"/><path d="M12 12c-2.8 0-5 2-5 4.3 0 1.7 1.5 2.7 3.4 2.7.7 0 1.1-.2 1.6-.2s.9.2 1.6.2c1.9 0 3.4-1 3.4-2.7 0-2.3-2.2-4.3-5-4.3Z"/></svg>`,
  // その他: タグ
  other: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.6V5.5a1.5 1.5 0 0 1 1.5-1.5h7.1a1.5 1.5 0 0 1 1.06.44l6.4 6.4a1.5 1.5 0 0 1 0 2.12l-7.1 7.1a1.5 1.5 0 0 1-2.12 0l-6.4-6.4A1.5 1.5 0 0 1 4 12.6Z"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/></svg>`,
};

// 干支のシンボル文字を装飾的に見せる ring(将来用、現状未使用)
export const ZODIAC_RING = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
  <circle cx="30" cy="30" r="26" stroke-dasharray="2 4" opacity="0.5"/>
</svg>
`;
