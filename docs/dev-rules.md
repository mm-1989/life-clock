# 開発ルール / ファイル構成 / テスト境界 / Phase 履歴

## 1. 技術スタック

| 項目 | 選定 | 根拠 |
| --- | --- | --- |
| ビルド | **Vite 6 固定** | Vite 8 は WSL2 で `npm install` reify が固まる(rolldown ネイティブ) |
| 言語 | TypeScript strict 全有効 | テスト容易性、リファクタ耐性 |
| UI | **HTML + CSS のみ** | Canvas / Three.js / WebGL は不採用 |
| スタイル | CSS Custom Properties + デザイントークン体系 + `clamp()` | viewport 単位は iOS Safari の URL バーで崩れる |
| カラー | coral/salmon パステル系 | ダーク自動切替対応 |
| フォント | `Hiragino Maru Gothic ProN` 優先(丸ゴシック) | 柔らかい印象 |
| 永続化 | localStorage(`lifeClock.v1`) | 家族数件規模なら IndexedDB 不要 |
| テスト | vitest(純関数中心) | age.ts のうるう年・月跨ぎ・元号境界・曜日 を必ずテスト |
| PWA | manifest.webmanifest + sw.js (SWR + ナビフォールバック) | オフライン起動、更新トースト対応 |
| 配信 | GitHub Pages Public, base `/life-clock/` | `.github/workflows/deploy.yml` で自動 deploy |

## 2. ファイル責務マップ

```
src/
├── main.ts          # bootstrap, render ループ(60秒/visibility), カード描画, タグ/タブ/スワイプ
├── age.ts           # 暦計算純関数(下記参照)
├── store.ts         # localStorage CRUD + Child/Event/Tag/CardOrder/Visibility 全管理
├── onboarding.ts    # 初回入力フォーム + renderTagSelect/readTag(共有 helper)
├── settings.ts      # 設定モーダル + 子追加/編集/クリア + イベント CRUD +
│                   #   並び替え・表示/非表示 + JSON バックアップ/復元 + About モーダル
├── gestures.ts      # attachLongPress + attachHorizontalSwipe(pointer events)
├── styles.css       # デザイントークン + 全コンポーネント
└── *.test.ts        # vitest
public/
├── manifest.webmanifest # PWA マニフェスト
├── sw.js                # Service Worker(precache + SWR + ナビフォールバック)
├── favicon.svg          # 時計+ハート(coral グラデ、maskable)
└── og.svg               # 1200x630 OG カード
.github/workflows/
└── deploy.yml           # main push で GitHub Pages 自動 deploy
```

### `src/age.ts` の純関数

`calendarBreakdown` / `weeksAndDays` / `totalDays` / `nextBirthday` / `zodiacOf` / `formatBreakdownLabel` / `formatBreakdownShort` / `formatTotalMonths` / `formatGregorianDate` / `formatGregorianSlash` / `formatGregorianHyphen` / `formatJapaneseEraDate` / `formatJapaneseEraYear` / `japaneseEraOf` / `formatWeekdayJa` / `isFutureBirth`

新規ロジックは原則 `age.ts` か `store.ts` の **純関数** として追加し、vitest で必ずテストを書く。

## 3. 編集者向け原則(必読)

### 3.1 環境固有の落とし穴(memory 由来)

- **Vite 6 固定**。Vite 8 へのアップグレード禁止
- **`npm install` がハングしたら `--prefer-offline --no-audit --no-fund`** で再試行(初回ダウンロードで詰まることがある)
- **dev では Service Worker を登録しない**(localhost に SW が居座ると別プロジェクトを stale で塗りつぶす)
- **Claude 側から `vite restart` / `pkill vite` は絶対にしない**(WSL2 forwarding が壊れて `wsl --shutdown` 必要)

### 3.2 セキュリティ

- 出生日・氏名は **localStorage のみ**。URL クエリ・ハッシュ・コミットメッセージに含めない
- README/OG 画像にも家族の実日付は載せない
- スクリーンショット撮影時はダミー日付(例: 1990-01-01)で

### 3.3 開発ワークフロー

- **コミット前 3 点セット(skip 不可)**: `npm run typecheck` / `npm test` / `npm run build`
- **ファイル削除**: `rm` 不可。`mv ./path ~/.trash/` で trash へ
- **git push**: Claude は commit までで止める。push はユーザが手動(`~/.claude/CLAUDE.md` 参照)
- **GitHub Actions** が `typecheck/test/build` を CI でも強制する

### 3.4 time-stack との関係

| 流用先 | 流用元 (time-stack) | 内容 |
| --- | --- | --- |
| `src/age.ts` の calendarBreakdown 設計 | `src/time.ts` | 暦正確な年齢計算の流派 |
| `public/sw.js` | `public/sw.js` | precache + SWR + ナビフォールバック |
| `vite.config.ts` | `vite.config.ts` | base 設定 + build-id meta 注入(About モーダルで参照) |
| `index.html` の iOS PWA メタ | `index.html` | viewport-fit=cover、apple-mobile-web-app-* |

**Canvas / Three.js は流用しない**(目的が違う)。

## 4. テスト境界(age.ts、46 ケース通過)

- **基本暦**: 同日 / 1 か月後 / 1 年後 / うるう年 2/29 出生 → 翌年 2/28 / 月末出生 1/31 のクランプ
- **週**: 7 日きっかり → `1週と0日`、15 日 → `2週と1日`
- **次の誕生日**: 当日 0、翌日 = 364 or 365、うるう年クランプ
- **干支**: 2020→子、2024→辰、2025→巳、2026→午、負の年も安全動作
- **元号**: 令和元年(2019-05-01)、平成31年(2019-04-30)、昭和64年(1989-01-07)、大正・明治、大化以前のフォールバック
- **曜日**: 2023-05-12 → 金、2024-02-29 → 木
- **未来モード**: `isFutureBirth` 境界(同日は false)
- **フォーマッタ**: 0歳0か月→「D日」/0歳M月→「Mか月とD日」/1歳以降→「N歳Mか月とD日」、短縮(歳・月)、月単位、スラッシュ/ハイフン

## 5. Phase 進捗(全完了)

- ✅ Phase 1: 動く最小(URL `?birth=` でダッシュボード + タップコピー)
- ✅ Phase 2: localStorage + オンボーディング + 設定モーダル + クリア 2 段階確認
- ✅ Phase 3: 複数子対応(子追加 + ヘッダー切替タブ)
- ✅ Phase 4: 任意イベント + 「あれから/まで N日」+ 設定からイベント CRUD
- ✅ Phase 5: コピー形式選択(長押し)+ JSON バックアップ/復元
- ✅ Phase 6: PWA + GitHub Pages 自動 deploy

### Phase 後の追加・リファイン

- ✅ タグ機能(family/relative/friend/pet/other)+ ヘッダー pill バッジ + **タグ色分け**
- ✅ カード並び替え(↑↓ ボタン)+ **表示/非表示チェックボックス**
- ✅ イベント並び替え(各行の ↑↓)+ events ブロック位置の制御
- ✅ 元号(大化〜令和、約 230 元号、線形最大検索)+ 「西暦(和暦) 月日 (曜)」表示
- ✅ 未来日付モード(「生まれるまで」「生まれる予定日」「あと N日」「次の誕生日」非表示)
- ✅ タブ中央寄せ + **画面水平スワイプで子切替**
- ✅ 商用デザインリファイン(coral/salmon、デザイントークン体系、ダーク再調整、ファビコン+ハート)
- ✅ 完成度ブラッシュアップ:**誕生日当日の祝福バッジ** / **タップハイライト** / **About モーダル** / **更新トースト** / **タグ色分け**
- ✅ 「あの子の生後を、ぱっと見る」タグライン化(ペット・友達の子も内包)

## 6. 今後の拡張候補(未着手)

- マイルストーンバッジ(100/1,000/10,000日)
- アクセントカラー切替(coral/peach/lavender/mint)
- 共有機能(画像出力で LINE 等にシェア)
- 通知(Push API で誕生日前日リマインド)
- アクセシビリティ強化(ARIA、フォントサイズ切替)
- 多言語(i18n、初期は ja のみ)
