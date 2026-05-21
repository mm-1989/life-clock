// 命の時計 — Playwright スクショ撮影
// 使い方:
//   ローカル: SITE_URL=http://localhost:5173/life-clock/ node scripts/capture.mjs
//   CI:       SITE_URL=https://<user>.github.io/life-clock/ node scripts/capture.mjs
//
// 出力: ./screenshots/{name}.png(複数シナリオ + デバイス)
//
// 各シナリオは localStorage を seed してアプリ状態を再現する。
// 名前・出生日はすべてダミー(花子/太郎/ゆき + 公開して問題ない汎用日付)。

import { chromium, devices } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'screenshots');
const URL = process.env.SITE_URL ?? 'http://localhost:5173/life-clock/';

// localStorage 用のサンプルデータ
const STORE_BASIC_ORDER = ['birth', 'weeks', 'totalDays', 'nextBirthday', 'zodiac', 'events'];

const seedSingleChild = {
  children: [{ id: 'demo-1', name: 'はなこ', birthDate: '2023-05-12', tag: 'family', events: [] }],
  activeChildId: 'demo-1',
  cardVisibility: {},
  cardOrder: STORE_BASIC_ORDER,
};

const seedMultipleChildren = {
  children: [
    { id: 'd1', name: 'はなこ', birthDate: '2023-05-12', tag: 'family', events: [] },
    { id: 'd2', name: 'たろう', birthDate: '2020-08-15', tag: 'family', events: [] },
    { id: 'd3', name: 'ゆき',   birthDate: '2018-03-21', tag: 'pet',    events: [] },
  ],
  activeChildId: 'd1',
  cardVisibility: {},
  cardOrder: STORE_BASIC_ORDER,
};

// 1 年前の今日を出生日にしたデータ(誕生日演出スクショ用)
function buildBirthdaySeed() {
  const today = new Date();
  const birth = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  const yyyy = birth.getFullYear();
  const mm = String(birth.getMonth() + 1).padStart(2, '0');
  const dd = String(birth.getDate()).padStart(2, '0');
  return {
    children: [{ id: 'b', name: 'はなこ', birthDate: `${yyyy}-${mm}-${dd}`, tag: 'family', events: [] }],
    activeChildId: 'b',
    cardVisibility: {},
    cardOrder: STORE_BASIC_ORDER,
  };
}

// 未来日付(妊娠中の予定日)用
function buildFutureSeed() {
  const today = new Date();
  const future = new Date(today.getFullYear(), today.getMonth() + 5, today.getDate());
  const yyyy = future.getFullYear();
  const mm = String(future.getMonth() + 1).padStart(2, '0');
  const dd = String(future.getDate()).padStart(2, '0');
  return {
    children: [{ id: 'f', name: 'まめ', birthDate: `${yyyy}-${mm}-${dd}`, tag: 'family', events: [] }],
    activeChildId: 'f',
    cardVisibility: {},
    cardOrder: STORE_BASIC_ORDER,
  };
}

const SCENARIOS = [
  { name: '01-onboarding',         seed: null,               afterLoad: null },
  { name: '02-main-single',        seed: seedSingleChild,    afterLoad: null },
  { name: '03-main-multiple',      seed: seedMultipleChildren, afterLoad: null },
  { name: '04-settings-modal',     seed: seedSingleChild,    afterLoad: openSettings },
  { name: '05-advanced-settings',  seed: seedSingleChild,    afterLoad: openAdvanced },
  { name: '06-about',              seed: seedSingleChild,    afterLoad: openAbout },
  { name: '07-birthday',           seed: buildBirthdaySeed(),  afterLoad: null },
  { name: '08-future',             seed: buildFutureSeed(),    afterLoad: null },
];

async function openSettings(page) {
  await page.click('#open-settings');
  await page.waitForSelector('dialog.dialog', { state: 'visible' });
  await page.waitForTimeout(500);
}
async function openAdvanced(page) {
  await openSettings(page);
  await page.click('#set-advanced');
  await page.waitForTimeout(500);
}
async function openAbout(page) {
  await openSettings(page);
  await page.click('#set-advanced');
  await page.waitForTimeout(300);
  await page.click('#adv-about');
  await page.waitForTimeout(500);
}

async function run() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  // ローカルでは PW_CHROME でブラウザ実体を指定可(npm 版が要求する build と
  // DL 済み build がズレても動かすため)。CI では未設定 → 通常解決。
  const browser = await chromium.launch(
    process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {},
  );
  const startedAt = Date.now();
  let ok = 0;
  let failed = 0;

  for (const scheme of ['light', 'dark']) {
    for (const sc of SCENARIOS) {
      const ctx = await browser.newContext({
        ...devices['iPhone 14'],
        colorScheme: scheme,
      });
      const page = await ctx.newPage();
      try {
        if (sc.seed) {
          const json = JSON.stringify(sc.seed);
          await ctx.addInitScript({
            content: `localStorage.setItem('lifeClock.v1', ${JSON.stringify(json)});`,
          });
        }
        // ?capture=1 で confetti などの動的演出を抑止(スクショの視認性確保)
        const visitUrl = URL + (URL.includes('?') ? '&' : '?') + 'capture=1';
        await page.goto(visitUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1200); // confetti / アニメ完了を含めて少し待つ
        if (sc.afterLoad) await sc.afterLoad(page);
        const filename = `${sc.name}-${scheme}.png`;
        await page.screenshot({ path: resolve(OUT_DIR, filename), fullPage: true });
        console.log(`✓ ${filename}`);
        ok++;
      } catch (err) {
        console.error(`✗ ${sc.name}-${scheme}: ${err.message}`);
        failed++;
      } finally {
        await ctx.close();
      }
    }
  }

  await browser.close();
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s — ${ok} captured, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
