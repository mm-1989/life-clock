// 命の時計 — Service Worker
// Stale-While-Revalidate(SWR): cache を即返却 + 並行 fetch でバックグラウンド更新。
// オフラインでも以前のキャッシュで起動可能、ネット復活時に自動で最新版へ。
//
// VERSION を build ごとに上げると旧キャッシュを破棄して全クライアントを更新する。
// time-stack の sw.js を参考に、scope/precache を /life-clock/ に変更。

const VERSION = 'life-clock-v1';
const SCOPE = '/life-clock/';

// 起動に必要な shell をインストール時に precache。
// dist/assets/ 配下のハッシュ付き chunk は fetch ハンドラが SWR で個別キャッシュする。
const PRECACHE = [
  SCOPE,
  `${SCOPE}index.html`,
  `${SCOPE}manifest.webmanifest`,
  `${SCOPE}favicon.svg`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 同一 origin かつ scope 配下のみ取り扱う(他サイトには干渉しない)
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(SCOPE)) return;

  // ナビゲーションリクエスト(?birth=... 等のクエリ違い URL も含む)は index.html へフォールバック
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(`${SCOPE}index.html`)),
    );
    return;
  }

  // SWR: cache 即返却 + 並行 fetch で更新
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
