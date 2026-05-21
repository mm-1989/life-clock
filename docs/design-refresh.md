# 命の時計 — デザインリフレッシュ & リソース生成プロンプト集

> Codex(壁打ち)経由で確定した方向性と、画像生成 AI(gpt-image-1 等)へ渡す
> **リソース生成プロンプト**をまとめたもの。画像生成は user が Codex に依頼して実施する。
> Claude はプロンプト + 仕様まで担当(透過 PNG のネイティブ生成は不安定なため背景色込みで設計)。

採用方向: **A.「小児科の清潔感 × 家庭のぬくもり」**(2026-05-21 確定)
コンセプト・機能は一切変えない。変えるのは見た目(色・タイポ・余白・階層・装飾・アイコン・イラスト)のみ。

**§3 のプロンプトは英語・自己完結**: 各ブロックに共通スタイル(画風/配色/禁止事項)を織り込み済み。
**1 ブロックをそのまま Codex に貼れば 1 枚生成できる**(§1 を別途付け足す必要はない)。

---

## 0. 採用方向 A の設計トークン(CSS 反映用の正)

> ※ 下表は今後の CSS ブラッシュアップで `styles.css` の `:root` に反映する想定。
> 画像生成プロンプトの配色もこれに従う。

| 役割 | 現行 | 方向 A | メモ |
| --- | --- | --- | --- |
| 背景 bg | `#fbf3ee` | `#FBF4EF` | ほぼ据え置き |
| カード白 card | `#ffffff` | `#FFFDFC` | わずかに暖色寄り |
| メイン文字 | `#1a1410` | `#1F1715` | ほぼ据え置き |
| サブ文字 | `#8a7870` | `#8C7A73` | ほぼ据え置き |
| accent(coral) | `#ec8478` | `#E98277` | 据え置き、ただし**使用面積を減らす** |
| accent-strong | `#c45f4e` | `#C85E50` | 線画・強調 |
| accent-soft | `#fde5dc` | `#FDE5DC` | 据え置き |
| **sage(新・差し色)** | — | `#A9B8A1` / soft `#EEF3EA` | **補助情報・成功状態・ペット限定**。coral と競合させない |
| taupe(補助線) | — | `#9A8178` | イラストの第二線色 |
| peach(補助面) | — | `#F7CFC7` | グラデの淡い面 |

**タイポ階層**
- 見出し: Zen Maru Gothic(維持)
- 本文/ラベル: M PLUS Rounded 1c(維持)
- 巨大数字 Mochiy Pop One: **ヒーローカードの主数字だけに縮小**。サブカードの数字(`2023` `156` `1,097` `364` 等)は丸ゴシックの太字 or `Zen Maru Gothic 700/900` に寄せて落ち着かせる。

**カード階層**
- ヒーロー: 淡い coral tint 面 `linear-gradient(135deg,#FFFDFC,#FFF7F3)` + 境界 `1.5px solid #F2C6BE` + 角丸 28px
- サブ: 白のまま、影を浅く `0 8px 24px rgba(74,48,40,.08)` + 細境界 `1px solid rgba(120,92,82,.08)` + 角丸 22px
- 入力フィールド: 角丸 18px

**装飾**: 背景ドットは密度を下げ疎らに。ノイズを減らす。

> ↑ これらの CSS 反映は別タスク(本ドキュメントは「画像リソースのプロンプト」が主目的)。

---

## 1. 共通スタイル(参考 — §3 の各プロンプトに織り込み済み)

§3 の英語プロンプトには、以下が既に各ブロックに含まれている。手で付け足す必要はないが、
微調整したいときの「正」としてここに残す。

- **画風**: soft flat vector illustration / warm picture-book style / subtle paper-grain texture / very gentle gradients。3D・写実・光沢は不可。
- **線**: thin even strokes, rounded caps & joins。主線 coral-strong `#C85E50`、補助線 taupe `#9A8178`。
- **彩度**: 低〜中。coral は主役部分にだけ。広い面は cream/white。
- **配色(厳守)**: cream `#FBF4EF` / card-white `#FFFDFC` / coral `#E98277` / coral-strong `#C85E50` / coral-soft `#FDE5DC` / sage `#A9B8A1` / sage-soft `#EEF3EA` / peach `#F7CFC7` / taupe `#9A8178`。
- **共通モチーフ**: round clock ring + small heart at center + minimal hands。丸くやわらかい形、疎らな装飾。
- **人物**: 顔なし(または点目のみ)、年齢/性別/家族構成を限定しない抽象シルエット。
- **禁止**: text / letters / numbers / logos / watermark(CJK 化け対策で**画像内テキスト全面禁止**)、写真・3D・強い影・ごちゃつき・原色・画風混在。

---

## 2. gpt-image-1 に渡すときの注意(user → Codex)

- **言語は英語**(画風追従を優先)。日本語の意図は本ドキュメントの説明文側で補足。
- **出力サイズは 3 種のみ**: `1024x1024` / `1536x1024`(横) / `1024x1536`(縦)。最終必要サイズは生成後にトリミング/リサイズ。各プロンプト冒頭にどのサイズで生成するか明記。
- **画像内テキストは禁止**(日本語が化ける)。OG のキャッチコピー等は後で SVG/コードで重ねる。
- **透過は当てにしない**: 各プロンプトで背景色を明示済み。透過 PNG が確実に出せるツールなら背景透過にしてもよいが、基本は背景色込みで生成。
- **1 ブロック = 1 枚**。同じ画風で揃えるため連続生成を推奨。
- 生成後の配置先(`public/` ファイル名)と後処理コマンドは各プロンプト末尾に記載。

---

## 3. アセット別 生成プロンプト(英語・自己完結)

### A. アプリアイコン(PWA / favicon / maskable)

- 用途: ホーム画面・manifest・タブ。`any` / `maskable` 兼用。
- 生成サイズ: **1024x1024** → 512 / 192 / apple-touch 180 にリサイズ。
- 背景: 不透過・フルブリード。主要モチーフは中央 80%、外周 10% は背景のみ(円マスク対策)。

```text
A square 1:1 app icon, full-bleed background, generate at 1024x1024.
Style: soft flat vector illustration in a warm picture-book style, with subtle paper-grain
texture and very gentle gradients; thin even strokes with rounded caps and joins; low-to-mid
saturation; calm and clean.
Background: a tasteful gradient filling the entire square from cream #FBF4EF to soft peach
#F7CFC7. In the exact center, a single round clock: a white #FFFDFC disc, a thick rounded ring
in a coral gradient from #E98277 to #C85E50, four small coral dots at the 12, 3, 6 and 9
positions, and a small soft coral heart at the very center in place of clock hands; hands
minimal or absent. Keep every key element within the central 80% of the square, leaving a 10%
empty margin of pure background on all four sides so the icon survives a circular mask.
Palette only: #FBF4EF, #FFFDFC, #E98277, #C85E50, #FDE5DC, #F7CFC7. At most a faint soft
contact shadow. No text, letters, numbers, logos or watermark. No photorealism, no 3D, no
glossy highlights, no harsh shadows, no busy background, no vivid primary colors.
```

- 配置先: `public/icon-1024.png`(→ `icon-512.png` / `icon-192.png` / `apple-touch-icon-180.png`)。
- `public/favicon.svg` はタブ用ベクターとして**残す**。raster は maskable/ストア用補完。
- 後処理例: `magick icon-1024.png -resize 512x512 icon-512.png`

---

### B. OG 画像(SNS / 共有プレビュー)

- 用途: URL 共有サムネ。最終 **1200x630**。
- 生成サイズ: **1536x1024(横)** → 1200x630 に中央クロップ。
- 文言は**焼かない**。右側を広い余白にし、`命の時計 / あの子の生後を、ぱっと見る。` は後で SVG/コード合成。

```text
A wide landscape background illustration, about 3:2, generate at 1536x1024.
Style: soft flat vector illustration in a warm picture-book style, subtle paper-grain texture,
very gentle gradients, thin even strokes with rounded caps, low-to-mid saturation, calm.
Full-bleed cream #FBF4EF background with a very faint coral radial glow coming from the
top-left. Place a brand motif in the LEFT THIRD of the image: a round clock made of a white
#FFFDFC disc, a rounded coral ring (#E98277 to #C85E50), four small coral dots at the 12/3/6/9
positions, and a small soft coral heart at its center. Around it, scatter a few sparse,
low-saturation small dots, tiny hearts and gentle thin arcs in coral and sage #A9B8A1. Leave
the RIGHT TWO-THIRDS as calm empty background with no decoration at all (space reserved for
text added later). Palette only: #FBF4EF, #FFFDFC, #E98277, #C85E50, #FDE5DC, #A9B8A1, #F7CFC7,
#9A8178. No text, letters, numbers, logos or watermark. No photorealism, no 3D, no harsh
shadows, no busy background, no vivid primary colors.
```

- 配置先: `public/og.png`(文言は既存 `og.svg` の text 層をオーバーレイ、または PNG にコード合成)。
- 後処理例(中央クロップ): `magick og_src.png -gravity center -crop 1200x630+0+0 +repage og.png`

---

### C. オンボーディング ヒーローイラスト

- 用途: 初回オンボーディング上部(現 `HERO_PARENT_CHILD` の置換)。
- 生成サイズ: **1024x1024**(横長が欲しければ 1536x1024)。
- 背景: **カード白 `#FFFDFC`**。

```text
A square illustration on a card-white #FFFDFC background, generate at 1024x1024.
Style: soft flat vector illustration in a warm picture-book style, subtle paper-grain texture,
very gentle gradients, slightly thicker thin strokes with rounded caps and joins, low-to-mid
saturation, tender and calm.
Depict one adult and one small child as soft, rounded, faceless abstract silhouettes (no facial
features, or only tiny dot eyes; do not imply a specific gender, age or family structure). They
gently lean together or hold hands, conveying a warm feeling of watching over the child. Nearby
add the brand motif — a round clock ring with a small heart at its center — and a few sparse
small dots. Main strokes in deep coral #C85E50, secondary strokes in taupe #9A8178; light fills
of soft coral #FDE5DC and soft sage #EEF3EA only. Generous calm whitespace, reassuring mood.
Palette only: #FFFDFC, #C85E50, #E98277, #FDE5DC, #A9B8A1, #EEF3EA, #9A8178. No text, letters,
numbers, logos or watermark. No photorealism, no 3D, no harsh shadows, no busy background.
```

- 配置先: `public/onboarding-hero.png`(`src/onboarding.ts` から `<img>` 参照、または `illustrations.ts` を画像読込へ差替)。

---

### D. 空状態イラスト(対象未登録 / イベント 0 件)

- 用途: 「あの子」未登録・イベント空(現 `EMPTY_LEAF` の置換)。
- 生成サイズ: **1024x1024**。
- 背景: **白カード `#FFFDFC`**。

```text
A small minimal illustration on a card-white #FFFDFC background, generate at 1024x1024.
Style: soft flat vector illustration in a warm picture-book style, subtle paper-grain texture,
thin strokes with rounded caps, low saturation, quiet and hopeful.
In the center, a single gentle motif meaning "nothing here yet": a tiny sprouting two-leaf
seedling, OR an empty soft round clock ring. Add one or two small sparkles nearby. Lead with
sage #A9B8A1 as the main color and use coral #E98277 only as a faint accent (keep it calm and
not coral-heavy). Secondary lines in taupe #9A8178. Lots of generous whitespace around the
motif. Palette only: #FFFDFC, #A9B8A1, #EEF3EA, #E98277, #9A8178. No text, letters, numbers,
logos or watermark. No photorealism, no 3D, no harsh shadows, no busy background.
```

- 配置先: `public/empty-state.png`。

---

### E. 誕生日アクセント(誕生日当日のヒーロー演出)

- 用途: 誕生日当日にヒーローカード内/背後へ重ねる装飾。
- 生成サイズ: **1536x1024(横)**。カード幅に合わせ一部領域を使用。
- 背景: **ヒーロー tint と同系**(`#FFF7F3`)。

```text
A wide landscape, gentle and understated birthday decoration, generate at 1536x1024.
Style: soft flat vector illustration in a warm picture-book style, subtle paper-grain texture,
thin strokes with rounded caps, low-to-mid saturation, celebratory but calm and refined.
Background: a soft coral tint #FFF7F3 filling the canvas. Instead of heavy confetti, use a
minimal elegant set of elements scattered toward the edges: a few thin arcs, a few small stars,
one small cake or a single candle, and a few sparse small dots. Balance coral #E98277, sage
#A9B8A1 and peach #F7CFC7 at low saturation. Keep the central area sparse and nearly empty
(numbers will be overlaid there). Palette only: #FFF7F3, #E98277, #A9B8A1, #F7CFC7, #FDE5DC.
No text, letters, numbers, logos or watermark. No photorealism, no 3D, no harsh shadows.
```

- 配置先: `public/birthday-accent.png`(`is-birthday` 時に背景レイヤとして表示)。

---

### F. タグアイコン 5 種(絵文字置換)

- 用途: タグ pill バッジ(現 🏠🌳🤝🐾🏷️ の置換)。家族 / 親戚 / 友達 / ペット / その他。
- 生成サイズ: **1536x1024(横)** に 5 個を横並びシート(画風サンプル/下絵として)。
- 背景: 中立の cream `#FBF4EF`。

```text
An icon set of exactly 5 icons in a single image, arranged in one evenly spaced horizontal row
on a cream #FBF4EF background, generate at 1536x1024.
Style: soft flat vector icons in a warm picture-book style, all sharing the EXACT same thin
stroke with rounded caps and joins, the same stroke width, the same size and the same padding.
Stroke color deep coral #C85E50, with only a hint of light fill. From left to right:
(1) family = a small house with a triangular roof, (2) relatives = a single tree, (3) friends =
two facing hands forming a handshake, (4) pet = a paw print, (5) other = a bookmark / tag shape.
Simple, highly legible, gentle and consistent. Center each icon in its own equal square cell.
Palette only: #FBF4EF, #C85E50, #FDE5DC, #EEF3EA. No text, letters, numbers, logos or
watermark. No photorealism, no 3D, no harsh shadows, no over-detailed shapes.
```

- 配置先: `public/tags/family.svg` ほか(理想は SVG 化)。
- **実装上の注意(重要)**: タグアイコンは pill 内 11px と極小で、かつ 5 色に色変え(`currentColor` 追従)したい。raster を 11px に縮小すると潰れ、色変えも効かない。**本来は手描き SVG 単色グリフが最適**。
  - 現実解 1: 上記で大きく綺麗に生成 → そのライン画をトレースして単色 SVG パス化(色は CSS で tag ごとに変える)。
  - 現実解 2: 画像生成を使わず、共通モチーフに合わせた SVG アイコンを Claude が直接手書き。
  - → どちらにするか user 判断。生成物は「画風サンプル/下絵」としても有用。

---

### G. 背景パターン(季節装飾の刷新、ライト/ダーク)

- 用途: `body` 背景の subtle 装飾(現 `data-season` ドット SVG の置換/補完)。
- 生成サイズ: **1024x1536(縦)**。低コントラストなのでタイル継ぎ目は目立ちにくい。
- 背景: ライト = cream `#FBF4EF`、ダーク = 暖色ダーク `#181311`。**2 バリアント生成**。

```text
[LIGHT] A tall portrait, extremely subtle decorative background pattern, generate at 1024x1536.
Style: soft flat vector, warm picture-book feel, used only as a faint texture. Base color cream
#FBF4EF. Across the whole canvas, scatter very faint small motifs sparsely and randomly (around
8-12% opacity): tiny dots, tiny clock tick marks, tiny hearts, tiny leaves, in low-saturation
coral and sage #A9B8A1. Low density, irregular placement (not a rigid grid), calm. The pattern
must never reduce the legibility of content placed on top. Add a faint paper-fiber grain.
Palette only: #FBF4EF, #E98277, #A9B8A1. No text, no large shapes, no strong contrast, no
photorealism, no 3D.
```

```text
[DARK] A tall portrait, extremely subtle decorative background pattern, generate at 1024x1536.
Same style, same motifs and same sparse random layout as the LIGHT version, but with a warm
dark base #181311. Motifs even more subtle, in faint warm coral and sage, not glowing. Calm
texture that never harms legibility of content on top. Faint grain. Palette only: #181311,
#E98277 (faint), #A9B8A1 (faint). No text, no large shapes, no strong contrast, no 3D.
```

- 配置先: `public/bg-pattern-light.png` / `public/bg-pattern-dark.png`(`styles.css` の `body` に薄く重ねる)。
- **注意**: 既存の季節別ドット(spring/summer/autumn/winter)を残すなら、本パターンは「季節非依存ベース層」とするか、季節 ×(light/dark)で 8 枚作るか要判断。まずは light/dark の 2 枚で土台を確認するのを推奨。

---

## 4. user 確認ポイント / 次の一手

**この資料で user が判断すること**
1. 生成 1 巡目を見て **狙いの画風が出ているか**(絵本調フラットベクター + 紙質感 + 丸線)。出なければ §1 の英語表現を微調整。
2. **タグアイコン**(F): raster 生成して SVG トレースか、最初から Claude が SVG を手書きか。
3. **背景パターン**(G): 季節非依存ベース 2 枚で始めるか、季節 ×light/dark で 8 枚作るか。
4. OG(B)の**テキストは画像に焼かず**、後でコード合成する前提でよいか。

**生成後にこちら(Claude)でできること**
- 生成 PNG を受け取って `public/` 配置 + `manifest.webmanifest` / `index.html` / `illustrations.ts` の参照差し替え。
- 方向 A の **CSS トークン反映**(セージ差し色・カード階層化・Mochiy Pop One のヒーロー限定・ドット減・角丸階層)。← イラスト無しでも先行可能。
- 反映後は CI(deploy + capture)を待って screenshots を取り込み、6 シナリオを Read で目視確認(劣化チェック)。

> 画像生成そのものは user が Codex 経由で実施。Claude は本プロンプト + 仕様までを担当。
