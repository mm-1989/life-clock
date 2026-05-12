// 視覚・触覚・聴覚エフェクト群。すべて軽量・依存なし。
// confetti / haptic / sound 各 ON-OFF はストアの ui 設定で制御(後続 PR)。

// ===== Confetti =====
// 30-50 個の片を画面上から落として 3 秒で消す。誕生日演出専用。
// Reduced motion 環境では発火しない(prefers-reduced-motion respect)。

const CONFETTI_COLORS = [
  '#ec8478', '#f5b3a6', '#f0a06a', '#84b8a4', '#c9a87c', '#b85f3e',
];

export function launchConfetti(count = 36, durationMs = 2800): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const left = Math.random() * 100;
    const delay = Math.random() * 600;
    const duration = 1800 + Math.random() * 1400;
    const drift = (Math.random() - 0.5) * 120; // px
    const rotate = Math.random() * 720 - 360; // deg
    const size = 6 + Math.random() * 6;
    piece.style.cssText = `
      left: ${left}%;
      background: ${color};
      width: ${size}px;
      height: ${size * 0.6}px;
      animation-duration: ${duration}ms;
      animation-delay: ${delay}ms;
      --drift: ${drift}px;
      --rotate: ${rotate}deg;
    `;
    layer.appendChild(piece);
  }

  window.setTimeout(() => layer.remove(), durationMs + 700);
}

// ===== Haptic =====
// 短い振動。iOS Safari は `navigator.vibrate` 非対応のため自動 no-op。
export function haptic(durationMs = 8): void {
  if (typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate(durationMs);
  }
}

// ===== Sound =====
// WebAudio API で軽い「ぽん」を合成(外部音源不要、~50 行で完結)。
let audioCtx: AudioContext | null = null;
function ensureAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

export function playPop(): void {
  const ctx = ensureAudio();
  if (!ctx) return;
  // 短い「ぽん」: 三角波 + 急速な音量減衰 + ピッチダウン
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.20);
}

export function playChime(): void {
  const ctx = ensureAudio();
  if (!ctx) return;
  // 「ちりん」: 高い純音 + 長めの余韻
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(1320, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.10, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.7);
}
