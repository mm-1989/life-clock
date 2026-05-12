# 仕様(カード / データモデル / タグ)

## 1. カード一覧と表示・コピー対応

### 標準カード(順序・表示/非表示は設定で変更可)

| カード | 過去モード表示 | 未来モード表示 | デフォルトコピー |
| --- | --- | --- | --- |
| **生まれてから / 生まれるまで**(メイン固定) | `1歳3か月と12日` | `5か月と12日` | 同左 |
| 生まれた日 / 生まれる予定日 | `2023年(令和5年)5月12日(金)` | 同左 | `2023年5月12日(金)` |
| 週でいうと | `65週と2日` | `あと24週と5日` | 同左 |
| 日でいうと | `412日`(1,000以上はカンマ) | `あと173日` | 同左 |
| 次の誕生日まで | `あと173日 (5か月23日)` | 非表示 | `あと173日(5か月23日)` |
| 干支 | `干支 巳`(円形 badge) | 同左 | `巳` |

### 表示ルール

- 0歳0か月のときは **「D 日」のみ**(過去・未来統一、新生児期は日齢が自然)
- 1 歳以降は中途の 0 を残す(`1歳0か月と12日`)
- 出生当日(td=0)は「次の誕生日」非表示
- 1,000 以上の数値はカンマ区切り(`1,234日`)
- 未来モード時の「日でいうと」「週でいうと」は値に「あと」を付与

### 任意イベントカード(子ごと、events ブロック位置で挿入)

- 過去: `{label}から  N日`(例:「最後に会った日から 12日」)
- 当日: `{label}は  今日`
- 未来: `{label}まで  あと N日`

### 長押しコピー形式(各カードごと)

| カード | 形式選択肢 |
| --- | --- |
| 生まれた日 | 西暦 / 和暦 / `/区切り` / ハイフン / 曜日付き |
| 生まれてから | 歳・月・日 / 歳・月のみ / 月単位 |
| 週でいうと | 週と日 / 日のみ |
| 干支 | 一文字 / ◯年 |

## 2. データモデル(localStorage キー: `lifeClock.v1`)

```ts
type Child = {
  id: string;             // crypto.randomUUID() v4
  name: string;
  birthDate: string;      // YYYY-MM-DD(時刻なし)
  tag?: ChildTag;         // 'family' | 'relative' | 'friend' | 'pet' | 'other'
  events: LifeEvent[];    // 任意、追加順 + 設定で並び替え可
};

type LifeEvent = { id: string; label: string; date: string };

type CardKind = 'birth' | 'weeks' | 'totalDays' | 'nextBirthday' | 'zodiac' | 'events';

type Store = {
  children: Child[];
  activeChildId: string | null;
  cardVisibility: Partial<Record<CardKind, boolean>>; // false のときだけ key 持つ(JSON 軽量化)
  cardOrder: CardKind[];                              // 「生まれてから」以外の表示順
};
```

### スキーマ運用

- スキーマ変更時は `lifeClock.v2` キーに切替 + optional migration
- 旧データの欠損(tag / cardOrder / cardVisibility / events 等)は loadStore で安全補完
- **出生日・氏名は URL に載せない**(公開リポジトリ前提)
- **JSON バックアップ/復元** で全体エクスポート(`life-clock-backup-YYYY-MM-DD.json`)、別端末への移行や夫婦間共有に対応

## 3. タグ(プリセット 5 種 + なし)

| key | 表示 | 色(ライト) |
| --- | --- | --- |
| `family` | 🏠 家族 | coral `#fde5dc / #c45f4e` |
| `relative` | 🌳 親戚 | peach `#fce0d0 / #b85f3e` |
| `friend` | 🤝 友達 | mint `#d8ede4 / #4f8a76` |
| `pet` | 🐾 ペット | sand `#f1e4cc / #8a6a3a` |
| `other` | 🏷️ その他 | gray `#e8e2da / #6e6259` |
| (未設定) | — | バッジ非表示 |

ヘッダーの名前上 + 子切替タブの両方に色付き pill バッジが表示される。ダークモードも色違いで対応。
