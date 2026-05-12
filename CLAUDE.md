# 命の時計 (life-clock) — プロジェクト管理文書

> あの子の生後を、ぱっと見る。書類記入特化 PWA。

仕様の正は本ドキュメント + 実装コード。Phase 1〜6 + リファインまで全完了済み。

## ドキュメント構成

| ファイル | 内容 |
| --- | --- |
| [`docs/concept.md`](./docs/concept.md) | コンセプト・差別化軸・ターゲット・UX 原則 |
| [`docs/spec.md`](./docs/spec.md) | カード仕様・表示/コピー対応・データモデル・タグ |
| [`docs/dev-rules.md`](./docs/dev-rules.md) | 技術スタック・ファイル構成・編集ルール・テスト境界・Phase 履歴 |
| [`README.md`](./README.md) | ユーザ向け説明 + 開発セットアップ |

> 設計の判断記録(壁打ちプラン)は repo 外の Claude Code 管理下にあり、commit には含まれません。

## 最重要ルール(必ず守る)

これだけは目に入る場所に。詳細は `docs/dev-rules.md` 参照。

### 環境

- **Vite 6 固定**(Vite 8 は WSL2 で reify ハング)
- **`npm install` が固まったら `--prefer-offline --no-audit --no-fund`** で再試行
- **dev では Service Worker を登録しない**(localhost SW 横取り回避)
- **Claude 側から `vite restart` / `pkill vite` は絶対にしない**(WSL2 forwarding 破壊)

### セキュリティ

- 出生日・氏名は **localStorage のみ**。URL/コミットメッセージに含めない
- スクリーンショットはダミー日付で

### ワークフロー

- **コミット前 3 点セット(skip 不可)**: `npm run typecheck` / `npm test` / `npm run build`
- **ファイル削除**: `rm` 不可、`mv ~/.trash/` で trash へ
- **git push**: Claude は commit までで止める。push はユーザが手動

### 設計

- 新規ロジックは原則 `src/age.ts` か `src/store.ts` の **純関数** として追加し、vitest で必ずテストを書く
- Canvas / Three.js / WebGL は不採用(HTML + CSS のみ)
