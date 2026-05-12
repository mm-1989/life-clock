// オリジナル SVG イラスト群。
// 子育てアプリ風の柔らかい線画 + currentColor で accent カラーに追従。
// すべてインラインで埋め込むため fetch 不要。

// オンボーディングのヒーロー: 親と子のシルエット + ハート
export const HERO_PARENT_CHILD = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <!-- 親の頭 -->
  <circle cx="70" cy="42" r="18" />
  <!-- 親の体 -->
  <path d="M48 130 Q48 80 70 80 Q92 80 92 130" />
  <!-- 子の頭(小さい) -->
  <circle cx="120" cy="62" r="12" />
  <!-- 子の体 -->
  <path d="M105 130 Q105 90 120 90 Q135 90 135 130" />
  <!-- 親と子をつなぐ手 -->
  <path d="M88 110 Q98 105 108 110" />
  <!-- ハート(右上) -->
  <path d="M158 38 C 154 34, 144 30, 144 22 C 144 16, 150 14, 154 18 C 156 20, 158 22, 158 22 C 158 22, 160 20, 162 18 C 166 14, 172 16, 172 22 C 172 30, 162 34, 158 38 Z" fill="currentColor" stroke="none" opacity="0.85"/>
  <!-- 小さなドット装飾 -->
  <circle cx="30" cy="30" r="2" fill="currentColor" stroke="none" opacity="0.4"/>
  <circle cx="180" cy="100" r="2.5" fill="currentColor" stroke="none" opacity="0.4"/>
  <circle cx="20" cy="100" r="2" fill="currentColor" stroke="none" opacity="0.3"/>
</svg>
`;

// 空状態のイラスト(イベント 0 件のとき): 小さな葉と星
export const EMPTY_LEAF = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <!-- 葉っぱ -->
  <path d="M40 20 Q24 30 24 50 Q24 60 40 60 Q56 60 56 50 Q56 30 40 20 Z" />
  <path d="M40 22 L40 60" opacity="0.5"/>
  <!-- きらめき -->
  <path d="M62 20 L62 26 M59 23 L65 23" opacity="0.6"/>
  <path d="M18 62 L18 66 M16 64 L20 64" opacity="0.5"/>
</svg>
`;

// About モーダル用: 時計+ハートの大判版(favicon の拡大改良版)
export const ABOUT_HERO = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="abh-ring" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="currentColor" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="currentColor"/>
    </linearGradient>
  </defs>
  <circle cx="80" cy="80" r="62" fill="white" stroke="url(#abh-ring)" stroke-width="9" stroke-linecap="round"/>
  <g fill="currentColor" opacity="0.55">
    <circle cx="80" cy="32" r="3.5"/>
    <circle cx="80" cy="128" r="3.5"/>
    <circle cx="32" cy="80" r="3.5"/>
    <circle cx="128" cy="80" r="3.5"/>
  </g>
  <!-- ハート(中央) -->
  <path d="M80 102 C 75 99, 58 88, 58 75 C 58 67, 65 62, 71 62 C 75 62, 78 65, 80 68 C 82 65, 85 62, 89 62 C 95 62, 102 67, 102 75 C 102 88, 85 99, 80 102 Z"
        fill="currentColor"/>
</svg>
`;

// 干支のシンボル文字を装飾的に見せる ring(将来用、現状未使用)
export const ZODIAC_RING = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
  <circle cx="30" cy="30" r="26" stroke-dasharray="2 4" opacity="0.5"/>
</svg>
`;
