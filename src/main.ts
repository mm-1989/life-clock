import './styles.css';
import {
  calendarBreakdown,
  formatBreakdownLabel,
  formatBreakdownShort,
  formatGregorianDate,
  formatGregorianHyphen,
  formatGregorianSlash,
  formatJapaneseEraDate,
  formatJapaneseEraYear,
  formatTotalMonths,
  formatWeekdayJa,
  isFutureBirth,
  nextBirthday,
  totalDays,
  weeksAndDays,
  zodiacOf,
} from './age.ts';
import { type CardKind, getActiveChild, getCardOrder, getStore, isCardVisible, setActiveChild, TAG_PRESETS, type Child } from './store.ts';
import { renderOnboarding } from './onboarding.ts';
import { openSettings } from './settings.ts';
import { attachHorizontalSwipe, attachLongPress } from './gestures.ts';
import { applySeasonTheme } from './seasons.ts';
import { haptic, launchConfetti, playChime, playPop } from './effects.ts';

const root = document.getElementById('app');
if (!root) throw new Error('#app not found');

let renderTimer: number | null = null;
let lastRenderedChildId: string | null = null;
let swipeAttached = false; // 画面水平スワイプは render ごとに re-attach せず 1 回だけ

function bootstrap(): void {
  const child = getActiveChild();
  if (!child) {
    stopTicking();
    renderOnboarding(root!, bootstrap);
    return;
  }
  renderMain(child);
  startTicking(child);
}

function startTicking(child: Child): void {
  stopTicking();
  // 1 分間隔で再描画。秒精度は不要。
  renderTimer = window.setInterval(() => renderMain(getActiveChild() ?? child), 60_000);
}

function stopTicking(): void {
  if (renderTimer !== null) {
    window.clearInterval(renderTimer);
    renderTimer = null;
  }
}

// タブ復帰時に即更新(就寝→翌朝のケース)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  const child = getActiveChild();
  if (child) renderMain(child);
});

// 1,000 以上の数値はカンマ 3 桁区切りで表示・コピーする(書類転記時の可読性)。
// 1,000 未満は自然と区切りが出ないので一律適用で安全。
const fmt = (n: number): string => n.toLocaleString('en-US');

function renderMain(child: Child): void {
  const birth = new Date(`${child.birthDate}T00:00:00`);
  if (isNaN(birth.getTime())) {
    root!.innerHTML = `<div class="hint">出生日が壊れています。設定から修正してください。</div>`;
    return;
  }
  // 初回または子切替時のみ stagger アニメを走らせる(60秒タイマー再描画では走らない)
  const shouldStagger = lastRenderedChildId !== child.id;
  lastRenderedChildId = child.id;
  const now = new Date();
  // 未来モード: 出生日が今日より先なら、メインの暦差は「今日 → 出生日」、
  // 週/累計日も同方向で計算(意味は「あと N」になる)。
  const future = isFutureBirth(birth, now);
  const baseDate = future ? now : birth;
  const targetDate = future ? birth : now;

  const cal = calendarBreakdown(baseDate, targetDate);
  const wd = weeksAndDays(baseDate, targetDate);
  const td = totalDays(baseDate, targetDate);
  const nb = nextBirthday(birth, now);
  const zo = zodiacOf(birth.getFullYear());

  // 未来モードでラベルを切替。当日(future=false)は「生まれた日」表記に戻る。
  const mainLabel = future ? '生まれるまで' : '生まれてから';
  const birthLabel = future ? '生まれる予定日' : '生まれた日';

  // 過去・未来共通の省略ロジック(formatBreakdownLabel と同期):
  // 0 のものは省略 → 視覚ノイズ排除
  const calCopy = formatBreakdownLabel(cal);
  let calValueHtml: string;
  if (cal.years === 0 && cal.months === 0) {
    calValueHtml = `${cal.days}<small>日</small>`;
  } else if (cal.years === 0) {
    calValueHtml = cal.days === 0
      ? `${cal.months}<small>か月</small>`
      : `${cal.months}<small>か月と</small> ${cal.days}<small>日</small>`;
  } else if (cal.months === 0 && cal.days === 0) {
    calValueHtml = `${cal.years}<small>歳</small>`;
  } else if (cal.months === 0) {
    calValueHtml = `${cal.years}<small>歳と</small> ${cal.days}<small>日</small>`;
  } else if (cal.days === 0) {
    calValueHtml = `${cal.years}<small>歳</small> ${cal.months}<small>か月</small>`;
  } else {
    calValueHtml = `${cal.years}<small>歳</small> ${cal.months}<small>か月と</small> ${cal.days}<small>日</small>`;
  }

  // 未来モードは「あと N週と D日」「あと N日」を付与(意味の明確化)
  const wdCopy = future ? `あと${fmt(wd.weeks)}週と${wd.days}日` : `${fmt(wd.weeks)}週と${wd.days}日`;
  const wdValueHtml = future
    ? `あと ${fmt(wd.weeks)}<small>週と</small> ${wd.days}<small>日</small>`
    : `${fmt(wd.weeks)}<small>週と</small> ${wd.days}<small>日</small>`;

  const tdCopy = future ? `あと${fmt(td)}日` : `${fmt(td)}日`;
  const tdValueHtml = future ? `あと ${fmt(td)}<small>日</small>` : `${fmt(td)}<small>日</small>`;

  // 「生まれた日」: 西暦の年に和暦の年を括弧で添え、末尾に曜日を付ける。
  // 例: 2023年(令和5年)5月12日(金) / 明治より前は和暦なし → 2023年5月12日(金)
  // 注: 1582 年以前の曜日は遡及グレゴリオ暦の計算値で、当時の暦とは一致しないことがある。
  const eraYear = formatJapaneseEraYear(birth);
  const weekday = formatWeekdayJa(birth);
  const birthCopy = `${formatGregorianDate(birth)}(${weekday})`;
  const birthValueHtml = eraYear
    ? `${birth.getFullYear()}<small>年</small> <span class="paren">(${eraYear})</span> ${birth.getMonth() + 1}<small>月</small> ${birth.getDate()}<small>日</small> <span class="paren">(${weekday})</span>`
    : `${birth.getFullYear()}<small>年</small> ${birth.getMonth() + 1}<small>月</small> ${birth.getDate()}<small>日</small> <span class="paren">(${weekday})</span>`;

  let nbValueHtml: string;
  let nbCopy: string;
  if (nb.totalDays === 0) {
    nbValueHtml = '今日';
    nbCopy = '今日';
  } else if (nb.months === 0) {
    nbValueHtml = `あと ${fmt(nb.totalDays)}<small>日</small>`;
    nbCopy = `あと${fmt(nb.totalDays)}日`;
  } else {
    const breakdownText =
      nb.days === 0 ? `${nb.months}か月` : `${nb.months}か月${nb.days}日`;
    nbValueHtml = `あと ${fmt(nb.totalDays)}<small>日</small> <span class="paren">(${breakdownText})</span>`;
    nbCopy = `あと${fmt(nb.totalDays)}日(${breakdownText})`;
  }

  const allChildren = getStore().children;
  const headerNameHtml =
    allChildren.length <= 1
      ? `<div class="child-block">${tagBadgeHtml(child)}<span class="child-name">${escapeHtml(child.name)}</span></div>`
      : `<div class="child-tabs" role="tablist">${allChildren
          .map(
            (c) => `
              <button type="button"
                class="child-tab${c.id === child.id ? ' active' : ''}"
                data-child-id="${escapeAttr(c.id)}"
                role="tab"
                aria-selected="${c.id === child.id}">${tagBadgeHtml(c)}<span class="child-tab-name">${escapeHtml(c.name)}</span></button>
            `,
          )
          .join('')}</div>`;

  root!.innerHTML = `
    <header class="header">
      <div class="header-left">
        <span class="brand">命の時計</span>
        ${headerNameHtml}
      </div>
      <button type="button" class="icon-button" id="open-settings" aria-label="設定">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
    </header>

    <section class="card card-main${(!future && cal.years > 0 && nb.totalDays === 0) ? ' is-birthday' : ''}" data-card="calendar" data-copy="${escapeAttr(calCopy)}">
      ${(!future && cal.years > 0 && nb.totalDays === 0)
        ? `<div class="birthday-badge">🎂 今日は誕生日!</div>`
        : ''}
      <div class="label-line">${escapeHtml(mainLabel)}</div>
      <div class="big">${calValueHtml}</div>
    </section>

    ${renderOrderedCards({
      birth: `
        <section class="card" data-card="birth" data-copy="${escapeAttr(birthCopy)}">
          <div class="kv">
            <span class="label">${escapeHtml(birthLabel)}</span>
            <span class="value">${birthValueHtml}</span>
          </div>
        </section>`,
      weeks: `
        <section class="card" data-card="weeks" data-copy="${escapeAttr(wdCopy)}">
          <div class="kv">
            <span class="label">週でいうと</span>
            <span class="value">${wdValueHtml}</span>
          </div>
        </section>`,
      totalDays: `
        <section class="card" data-copy="${escapeAttr(tdCopy)}">
          <div class="kv">
            <span class="label">日でいうと</span>
            <span class="value">${tdValueHtml}</span>
          </div>
        </section>`,
      // 未来 (まだ生まれていない) と 出生当日 (td === 0) は「次の誕生日」を非表示。
      // 当日に「今日」と出すと「0歳の誕生日?」と紛らわしいため。
      // 1歳/2歳... の誕生日は td > 0 なので通常通り「今日」表示が有効。
      nextBirthday: (future || td === 0)
        ? ''
        : `
        <section class="card" data-copy="${escapeAttr(nbCopy)}">
          <div class="kv">
            <span class="label">次の誕生日まで</span>
            <span class="value">${nbValueHtml}</span>
          </div>
        </section>`,
      zodiac: `
        <section class="card" data-card="zodiac" data-copy="${escapeAttr(zo)}">
          <div class="kv">
            <span class="label">干支</span>
            <span class="value zodiac">${zo}</span>
          </div>
        </section>`,
      events: renderEventCards(child, now),
    })}
  `;

  // 各カードの「短押し=デフォルトコピー」「長押し=形式選択モーダル」を attach。
  // formats が 1 つだけ(または無し)のカードは長押しでも単純コピーのみ。
  const cardFormats: Record<string, { label: string; formats: { name: string; value: string }[] }> = {
    birth: {
      label: '生まれた日',
      formats: [
        { name: '西暦', value: formatGregorianDate(birth) },
        { name: '和暦', value: formatJapaneseEraDate(birth) },
        { name: '/区切り', value: formatGregorianSlash(birth) },
        { name: 'ハイフン', value: formatGregorianHyphen(birth) },
        { name: '曜日付き', value: birthCopy },
      ],
    },
    calendar: {
      label: '生まれてから',
      formats: [
        { name: '歳・月・日', value: formatBreakdownLabel(cal) },
        { name: '歳・月のみ', value: formatBreakdownShort(cal) },
        { name: '月単位', value: formatTotalMonths(cal) },
      ],
    },
    weeks: {
      label: '週でいうと',
      formats: [
        { name: '週と日', value: wdCopy },
        { name: '日のみ', value: tdCopy },
      ],
    },
    zodiac: {
      label: '干支',
      formats: [
        { name: '一文字', value: zo },
        { name: '◯年', value: `${zo}年` },
      ],
    },
  };

  attachCardHandlers(cardFormats);

  document.getElementById('open-settings')?.addEventListener('click', () => {
    const current = getActiveChild();
    if (!current) return;
    openSettings(current, {
      onSave: () => bootstrap(),
      onDelete: () => bootstrap(),
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.child-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.childId;
      if (!id || id === child.id) return;
      setActiveChild(id);
      withViewTransition(bootstrap);
    });
  });

  // アクティブタブを常に中央へスクロール(5 人以上で見失わない)
  const activeTab = root!.querySelector<HTMLElement>('.child-tab.active');
  if (activeTab) {
    activeTab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }

  // 画面全体の水平スワイプで前後の子に切替。
  // 重要: renderMain は子切替や 60 秒タイマーで何度も呼ばれるため、handler は 1 回だけ attach。
  // 多重 attach すると 1 回のスワイプで複数回 switchChildBy が発火 → 状態が壊れる。
  // 子の人数判定は callback 内で動的に行う(後から子を追加しても自動で有効化)。
  if (!swipeAttached) {
    swipeAttached = true;
    attachHorizontalSwipe(root!, {
      onSwipeLeft: () => {
        if (getStore().children.length < 2) return;
        switchChildBy(1);
      },
      onSwipeRight: () => {
        if (getStore().children.length < 2) return;
        switchChildBy(-1);
      },
    });
  }

  // 誕生日当日(1歳以上の毎年): confetti + chime を 1 回だけ発火
  // 同じ子 + 同じ日 では 2 回目以降の render では発火しない(60秒 setInterval が走っても抑止)
  // ?capture=1 が付いている場合(Playwright スクショ撮影時)は抑止 → スクショの視認性確保
  if (!future && cal.years > 0 && nb.totalDays === 0 && !isCaptureMode()) {
    triggerBirthdayCelebration(child.id);
  }

  // stagger 進入: クラスを 1 フレーム遅らせて付与(再 attach の reflow を確実に走らせる)
  if (shouldStagger) {
    root!.classList.remove('cards-stagger');
    void root!.offsetWidth;
    root!.classList.add('cards-stagger');
    window.setTimeout(() => root!.classList.remove('cards-stagger'), 900);
  }
}

const celebratedToday = new Set<string>(); // `${childId}|${YYYY-MM-DD}` の組
function triggerBirthdayCelebration(childId: string): void {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${childId}|${today}`;
  if (celebratedToday.has(key)) return;
  celebratedToday.add(key);
  launchConfetti(40);
  playChime();
}

// スクショ撮影モード(URL ?capture=1):動的演出(confetti / 音 / アニメ)を控えて静的見栄え確保
function isCaptureMode(): boolean {
  return new URLSearchParams(location.search).get('capture') === '1';
}

function switchChildBy(delta: 1 | -1): void {
  const store = getStore();
  if (store.children.length < 2) return;
  const idx = store.children.findIndex((c) => c.id === store.activeChildId);
  if (idx < 0) return;
  const len = store.children.length;
  const nextIdx = ((idx + delta) % len + len) % len;
  const next = store.children[nextIdx];
  if (!next) return;
  setActiveChild(next.id);
  withViewTransition(bootstrap);
}

// View Transitions API で再描画をクロスフェード化(対応外なら通常実行)。
// Chrome/Edge/Safari 18+ で動作、Firefox は素通りでも違和感なし。
function withViewTransition(fn: () => void): void {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(fn);
  } else {
    fn();
  }
}

// data-card 属性付きのカードは「短押し=デフォルトコピー / 長押し=形式選択」、
// その他のカード(イベント・誕生日CD・累計日)は短押しのみ。
// コピー成功時に対象 element を一瞬ハイライト(.copied 700ms)。
function attachCardHandlers(
  formatsMap: Record<string, { label: string; formats: { name: string; value: string }[] }>,
): void {
  document.querySelectorAll<HTMLElement>('[data-copy]').forEach((el) => {
    const defaultCopy = el.dataset.copy ?? '';
    const cardKey = el.dataset.card;
    if (cardKey && formatsMap[cardKey] && formatsMap[cardKey].formats.length > 1) {
      const cfg = formatsMap[cardKey];
      attachLongPress(el, {
        onShort: () => copyToClipboard(defaultCopy, el),
        onLong: () => openFormatPicker(cfg.label, cfg.formats),
      });
    } else {
      el.addEventListener('click', () => copyToClipboard(defaultCopy, el));
    }
  });
}

function openFormatPicker(label: string, formats: { name: string; value: string }[]): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <form method="dialog" class="dialog-form">
      <h2 class="dialog-title">${escapeHtml(label)} のコピー形式</h2>
      <ul class="format-list">
        ${formats
          .map(
            (f, i) => `
              <li>
                <button type="button" class="format-row" data-index="${i}">
                  <span class="format-name">${escapeHtml(f.name)}</span>
                  <span class="format-value">${escapeHtml(f.value)}</span>
                </button>
              </li>
            `,
          )
          .join('')}
      </ul>
      <div class="dialog-actions">
        <div class="dialog-actions-right">
          <button type="button" class="btn btn-secondary" id="fp-close">キャンセル</button>
        </div>
      </div>
    </form>
  `;
  document.body.appendChild(dialog);

  dialog.querySelectorAll<HTMLButtonElement>('.format-row').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      const value = formats[i]?.value ?? '';
      copyToClipboard(value);
      dialog.close();
      dialog.remove();
    });
  });

  dialog.querySelector<HTMLButtonElement>('#fp-close')!.addEventListener('click', () => {
    dialog.close();
    dialog.remove();
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.close();
      dialog.remove();
    }
  });

  dialog.showModal();
}

async function copyToClipboard(text: string, sourceEl?: HTMLElement): Promise<void> {
  const flash = (): void => {
    if (!sourceEl) return;
    sourceEl.classList.remove('copied'); // 連続コピー時にアニメリスタート
    void sourceEl.offsetWidth; // reflow を強制してアニメ再起動
    sourceEl.classList.add('copied');
    window.setTimeout(() => sourceEl.classList.remove('copied'), 700);
  };
  const fb = (): void => { haptic(8); playPop(); };
  try {
    await navigator.clipboard.writeText(text);
    flash();
    fb();
    showToast(`コピーしました: ${text}`);
  } catch {
    // navigator.clipboard が使えない環境(古い iOS Safari、HTTP)は textarea フォールバック
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      flash();
      fb();
      showToast(`コピーしました: ${text}`);
    } finally {
      document.body.removeChild(ta);
    }
  }
}

let toastTimer: number | null = null;
function showToast(text: string): void {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.classList.remove('is-action');
  toast.textContent = text;
  toast.hidden = false;
  if (toastTimer !== null) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
    toastTimer = null;
  }, 1500);
}

// 「生まれてから」固定カードの下に、cardOrder の順番で並べる。
// 非表示(isCardVisible=false)のカード、および htmls に空文字で渡されたカード(未来モード時の
// nextBirthday など)は描画スキップ。
function renderOrderedCards(htmls: Record<CardKind, string>): string {
  return getCardOrder()
    .filter((k) => isCardVisible(k))
    .map((k) => htmls[k] ?? '')
    .filter((html) => html.trim() !== '')
    .join('');
}

// 任意イベントカード群を描画。日付が過去 → 「{label}から N日」、未来 → 「{label}まで あと N日」、当日 → 「今日」。
function renderEventCards(child: Child, now: Date): string {
  if (!child.events.length) return '';
  return child.events
    .map((e) => {
      const eventDate = new Date(`${e.date}T00:00:00`);
      if (isNaN(eventDate.getTime())) return '';
      const days = totalDays(eventDate, now); // 過去なら正、未来なら負

      let labelText: string;
      let valueHtml: string;
      let copyText: string;
      if (days === 0) {
        labelText = `${e.label}は`;
        valueHtml = '今日';
        copyText = '今日';
      } else if (days > 0) {
        labelText = `${e.label}から`;
        valueHtml = `${fmt(days)}<small>日</small>`;
        copyText = `${fmt(days)}日`;
      } else {
        const ahead = -days;
        labelText = `${e.label}まで`;
        valueHtml = `あと ${fmt(ahead)}<small>日</small>`;
        copyText = `あと${fmt(ahead)}日`;
      }

      return `
        <section class="card" data-copy="${escapeAttr(copyText)}">
          <div class="kv">
            <span class="label">${escapeHtml(labelText)}</span>
            <span class="value">${valueHtml}</span>
          </div>
        </section>
      `;
    })
    .join('');
}

// 名前の上に出すタグバッジ。タグ未設定なら空文字を返して非表示にする。
// tag-{kind} クラスで色分け(family / relative / friend / pet / other)。
function tagBadgeHtml(c: Child): string {
  if (!c.tag) return '';
  const preset = TAG_PRESETS[c.tag];
  return `<span class="child-tag tag-${escapeAttr(c.tag)}"><span class="child-tag-icon">${preset.icon}</span>${escapeHtml(preset.label)}</span>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return ch;
    }
  });
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

applySeasonTheme();
bootstrap();

// Service Worker 登録(PWA 化)。
// dev サーバ(localhost / 127.0.0.1)では登録しない: localhost SW が他プロジェクトを
// 横取りする問題(memory: feedback_localhost_sw_hijack)を構造的に回避するため。
if (
  'serviceWorker' in navigator &&
  location.hostname !== 'localhost' &&
  location.hostname !== '127.0.0.1'
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        // 新版 SW を検出したら、インストール完了時に更新トーストを出す
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateToast(newWorker);
            }
          });
        });
      })
      .catch((err) => console.warn('SW register failed', err));

    // controllerchange = 新 SW が active になった瞬間 → リロードして新版を反映
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
  });
}

function showUpdateToast(newWorker: ServiceWorker): void {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.classList.add('is-action');
  toast.innerHTML = `
    <span>新しい版があります</span>
    <button type="button" class="toast-action" id="toast-update">読み込む</button>
  `;
  toast.hidden = false;
  document.getElementById('toast-update')?.addEventListener('click', () => {
    newWorker.postMessage('SKIP_WAITING');
  });
}
