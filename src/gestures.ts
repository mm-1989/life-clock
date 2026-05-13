// pointer events ベースの長押し検出。タップとの誤発火を防ぐため:
//  - threshold ms 経過で長押し成立、それまでに up/leave/cancel/移動 8px 超えなら短押し扱い
//  - 長押し成立した up は短押しとして発火させない
//  - 右クリック(button !== 0)は無視
//  - contextmenu は抑制(iOS 長押しのコールアウト/Android 長押しメニュー回避)
export function attachLongPress(
  el: HTMLElement,
  options: {
    onShort: () => void;
    onLong: () => void;
    threshold?: number; // ms, default 600
  },
): void {
  const threshold = options.threshold ?? 600;
  let timer: number | null = null;
  let longPressed = false;
  let startX = 0;
  let startY = 0;

  const cancel = (): void => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  // 長押し中の視覚 fb 用に CSS Custom Property `--lp-duration` を渡す。
  // styles.css 側で .long-pressing クラス + ::after に conic-gradient ring を回す。
  el.style.setProperty('--lp-duration', `${threshold}ms`);

  const startVisual = (): void => el.classList.add('long-pressing');
  const stopVisual = (): void => el.classList.remove('long-pressing');

  el.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    longPressed = false;
    startX = e.clientX;
    startY = e.clientY;
    startVisual();
    timer = window.setTimeout(() => {
      longPressed = true;
      timer = null;
      stopVisual();
      options.onLong();
    }, threshold);
  });

  el.addEventListener('pointermove', (e: PointerEvent) => {
    if (timer === null) return;
    if (Math.abs(e.clientX - startX) > 8 || Math.abs(e.clientY - startY) > 8) {
      cancel();
      stopVisual();
    }
  });

  el.addEventListener('pointerup', () => {
    const wasTimerActive = timer !== null;
    cancel();
    stopVisual();
    if (!longPressed && wasTimerActive) options.onShort();
  });

  el.addEventListener('pointercancel', () => { cancel(); stopVisual(); });
  el.addEventListener('pointerleave', () => { cancel(); stopVisual(); });

  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

// 水平スワイプ検出。垂直方向が水平より大きい(縦スクロール意図)場合は無視する。
// 子切替などの大局的なナビゲーション用。
//
// 取りこぼし対策:
//  - setPointerCapture で pointer を el に固定 → 指が要素外に出ても pointerup が必ず発火
//  - el は touch-action: pan-y を期待(縦スクロールは許可、水平はこちらで処理)
export function attachHorizontalSwipe(
  el: HTMLElement,
  options: {
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    threshold?: number; // px, default 60
  },
): void {
  const threshold = options.threshold ?? 60;
  let startX = 0;
  let startY = 0;
  let activePointerId: number | null = null;

  el.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    activePointerId = e.pointerId;
    try {
      // pointer を el に固定 → 指が要素外に行っても pointerup を必ず受け取れる
      el.setPointerCapture(e.pointerId);
    } catch {
      /* setPointerCapture 未対応環境はそのまま続行 */
    }
  });

  el.addEventListener('pointerup', (e: PointerEvent) => {
    if (activePointerId !== e.pointerId) return;
    activePointerId = null;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) < threshold) return;
    if (Math.abs(dy) > Math.abs(dx)) return; // 縦スワイプ意図は無視
    if (dx > 0) options.onSwipeRight();
    else options.onSwipeLeft();
  });

  el.addEventListener('pointercancel', (e: PointerEvent) => {
    if (activePointerId === e.pointerId) activePointerId = null;
  });
}
