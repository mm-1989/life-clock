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

// 干支のシンボル文字を装飾的に見せる ring(将来用、現状未使用)
export const ZODIAC_RING = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
  <circle cx="30" cy="30" r="26" stroke-dasharray="2 4" opacity="0.5"/>
</svg>
`;
