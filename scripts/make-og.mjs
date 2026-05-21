// 命の時計 — OG 画像合成
// 生成 AI が作った背景アート(assets-src/og-art.png, 右側に余白)に、
// 日本語のタイトル/タグライン/チップを Playwright(=ブラウザ)で焼き込み、
// SNS が確実に解釈できる PNG (1200x630) を public/og.png として出力する。
//
// 使い方: node scripts/make-og.mjs
// 文言を変えたい場合はこのファイルの TEXT 部分を編集して再実行。

import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ART = resolve(ROOT, 'assets-src', 'og-art.png');
const OUT = resolve(ROOT, 'public', 'og.png');

const W = 1200;
const H = 630;

const artB64 = (await readFile(ART)).toString('base64');
const artDataUrl = `data:image/png;base64,${artB64}`;

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@500;600;700&family=Zen+Maru+Gothic:wght@500;700&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; }
  .stage {
    position: relative;
    width: ${W}px; height: ${H}px;
    background: #FBF4EF url("${artDataUrl}") left center / cover no-repeat;
    overflow: hidden;
    font-family: "M PLUS Rounded 1c", system-ui, sans-serif;
  }
  /* 右側のテキストの可読性を上げる、ごく淡いクリームのグラデ(左透明→右クリーム) */
  .scrim {
    position: absolute; inset: 0;
    background: linear-gradient(90deg, rgba(251,244,239,0) 38%, rgba(251,244,239,0.55) 60%, rgba(251,244,239,0.85) 100%);
  }
  .text {
    position: absolute;
    left: 46%; right: 64px; top: 50%;
    transform: translateY(-50%);
    display: flex; flex-direction: column; gap: 18px;
  }
  .kicker {
    font-size: 24px; font-weight: 600; letter-spacing: 0.42em;
    color: #B89A90;
  }
  .title {
    font-family: "Zen Maru Gothic", sans-serif;
    font-weight: 700; font-size: 104px; line-height: 1.0;
    color: #1F1715; letter-spacing: 0.02em;
  }
  .tagline {
    font-size: 32px; font-weight: 500; color: #8C7A73; line-height: 1.4;
  }
  .chips { display: flex; gap: 16px; margin-top: 10px; }
  .chip {
    display: inline-flex; align-items: center;
    background: #FDE5DC; color: #C85E50;
    font-size: 23px; font-weight: 600;
    padding: 12px 26px; border-radius: 999px;
  }
</style>
</head>
<body>
  <div class="stage">
    <div class="scrim"></div>
    <div class="text">
      <div class="kicker">LIFE CLOCK</div>
      <div class="title">命の時計</div>
      <div class="tagline">あの子の生後を、ぱっと見る。</div>
      <div class="chips">
        <span class="chip">タップでコピー</span>
        <span class="chip">和暦・干支も</span>
      </div>
    </div>
  </div>
</body>
</html>`;

// ローカルにある Playwright ブラウザ実体を使う(npm 版が要求する build と
// ダウンロード済み build がズレても動くよう executablePath を明示)。
// CI など別環境では PW_CHROME 環境変数で上書き可。未指定なら通常の解決に任せる。
const CHROME = process.env.PW_CHROME
  ?? '/home/mm_admin/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome';
const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
// Web フォントの読み込み完了を待つ(日本語が fallback で焼けないように)
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
const el = await page.$('.stage');
await el.screenshot({ path: OUT, type: 'png' });
await browser.close();
console.log(`OG written: ${OUT} (${W}x${H})`);
