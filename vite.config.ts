import { defineConfig } from 'vite';

// GitHub Pages のサブパス配信 (https://<user>.github.io/life-clock/) に合わせ base を固定。
// リポジトリ名を変更した場合はここも合わせて更新する。
export default defineConfig({
  base: '/life-clock/',
  build: {
    sourcemap: false,
  },
  plugins: [
    {
      // ビルド時に <head> へ build-id meta を注入する。CI=GITHUB_SHA、ローカル=local-<timestamp>。
      name: 'inject-build-id',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          const sha = process.env.GITHUB_SHA ?? `local-${Date.now()}`;
          return html.replace(
            '</head>',
            `  <meta name="build-id" content="${sha}">\n  </head>`,
          );
        },
      },
    },
  ],
});
