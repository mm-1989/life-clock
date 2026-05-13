import { addChild, addEvent, CARD_LABELS, type CardKind, type Child, exportJSON, getCardOrder, isCardKind, isCardVisible, isValidBirthDate, isValidStoreShape, type LifeEvent, moveCard, moveEvent, removeChild, removeEvent, replaceStore, setActiveChild, setCardVisible, updateChild } from './store.ts';
import { readTag, renderTagSelect } from './onboarding.ts';
import { ABOUT_HERO, EMPTY_LEAF } from './illustrations.ts';

// 設定モーダルと削除確認モーダル。HTMLDialogElement(<dialog>)を使い、
// 開閉とフォーカストラップはブラウザ任せ(モダン Safari/Chrome は対応済み)。
export type SettingsCallbacks = {
  onSave: () => void;
  onDelete: () => void; // 削除完了 → オンボーディングへ
};

export function openSettings(child: Child, callbacks: SettingsCallbacks): void {
  removeExisting();

  const dialog = document.createElement('dialog');
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <form method="dialog" class="dialog-form">
      <h2 class="dialog-title">設定</h2>
      <label class="field">
        <span class="field-label">お名前</span>
        <input type="text" id="set-name" required maxlength="20" autocomplete="off" />
      </label>
      <label class="field">
        <span class="field-label">出生日</span>
        <input type="date" id="set-birth" required />
      </label>
      <label class="field">
        <span class="field-label">タグ(任意)</span>
        ${renderTagSelect('set-tag', child.tag)}
      </label>
      <div class="dialog-actions">
        <div class="dialog-actions-right">
          <button type="button" class="btn btn-secondary" id="set-cancel">キャンセル</button>
          <button type="submit" class="btn btn-primary" id="set-save">保存</button>
        </div>
      </div>
      <hr class="dialog-divider" />
      <button type="button" class="btn btn-secondary btn-block" id="set-add-child">＋ 別の子を追加</button>
      <button type="button" class="btn btn-secondary btn-block" id="set-advanced">⚙ 詳しい設定</button>
      <hr class="dialog-divider" />
      <button type="button" class="btn btn-danger btn-block" id="set-delete">この子をクリア</button>
    </form>
  `;
  document.body.appendChild(dialog);

  const nameInput = dialog.querySelector<HTMLInputElement>('#set-name')!;
  const birthInput = dialog.querySelector<HTMLInputElement>('#set-birth')!;
  const tagInput = dialog.querySelector<HTMLSelectElement>('#set-tag')!;
  nameInput.value = child.name;
  birthInput.value = child.birthDate;

  const form = dialog.querySelector<HTMLFormElement>('form')!;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const birth = birthInput.value;
    const tag = readTag(tagInput);
    if (!name) { nameInput.focus(); return; }
    if (!isValidBirthDate(birth)) { birthInput.focus(); return; }
    updateChild(child.id, { name, birthDate: birth, tag });
    closeAndRemove(dialog);
    callbacks.onSave();
  });

  dialog.querySelector<HTMLButtonElement>('#set-cancel')!.addEventListener('click', () => {
    closeAndRemove(dialog);
  });

  dialog.querySelector<HTMLButtonElement>('#set-delete')!.addEventListener('click', () => {
    openDeleteConfirm(child, () => {
      closeAndRemove(dialog);
      callbacks.onDelete();
    });
  });

  dialog.querySelector<HTMLButtonElement>('#set-add-child')!.addEventListener('click', () => {
    openAddChild(() => {
      closeAndRemove(dialog);
      callbacks.onSave();
    });
  });

  // イベントの追加・削除はその場で永続化(キャンセル不可、軽量メモのため意図的)。
  // 「⚙ 詳しい設定」 → 別 dialog でイベント・カード並び・バックアップ・About を提供
  // メイン設定 dialog はそのまま開いたまま重ねて表示(戻るとそのまま元に戻れる)
  dialog.querySelector<HTMLButtonElement>('#set-advanced')!.addEventListener('click', () => {
    openAdvancedSettings(child, callbacks);
  });

  // 背景タップで閉じる(<dialog> の ::backdrop クリック)
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeAndRemove(dialog);
  });

  // 開いた瞬間に名前 input へ自動 focus されないよう、dialog 自身を focusable にして奪う
  dialog.tabIndex = -1;
  dialog.showModal();
  dialog.focus();
}

function downloadBackup(): void {
  const json = exportJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `life-clock-backup-${today}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importBackup(file: File, onReplaced: () => void): void {
  const reader = new FileReader();
  reader.onload = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(String(reader.result));
    } catch {
      openAlert('読み込めませんでした', 'JSON として読めないファイルです。');
      return;
    }
    if (!isValidStoreShape(parsed)) {
      openAlert('読み込めませんでした', 'ファイルの形式がこのアプリのバックアップではありません。');
      return;
    }
    const childCount = parsed.children.length;
    openConfirm(
      'バックアップで上書きしますか？',
      `現在の情報をクリアして、${childCount}人ぶんの情報に置き換えます。元には戻せません。`,
      'はい、上書きする',
      () => {
        replaceStore(parsed);
        onReplaced();
      },
    );
  };
  reader.readAsText(file);
}

function openConfirm(title: string, message: string, confirmLabel: string, onConfirm: () => void): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog dialog-confirm';
  dialog.innerHTML = `
    <form method="dialog" class="dialog-form">
      <h2 class="dialog-title">${escapeHtml(title)}</h2>
      <p class="dialog-message">${escapeHtml(message)}</p>
      <div class="dialog-actions">
        <div class="dialog-actions-right">
          <button type="button" class="btn btn-secondary" id="cm-no">キャンセル</button>
          <button type="button" class="btn btn-danger" id="cm-yes">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    </form>
  `;
  document.body.appendChild(dialog);
  dialog.querySelector<HTMLButtonElement>('#cm-no')!.addEventListener('click', () => closeAndRemove(dialog));
  dialog.querySelector<HTMLButtonElement>('#cm-yes')!.addEventListener('click', () => {
    closeAndRemove(dialog);
    onConfirm();
  });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeAndRemove(dialog); });
  dialog.showModal();
}

function openAbout(): void {
  // build-id meta(vite.config.ts で注入)からビルド識別子を拾う
  const buildIdEl = document.querySelector<HTMLMetaElement>('meta[name="build-id"]');
  const buildId = buildIdEl?.content ?? 'dev';
  const shortBuild = buildId.startsWith('local-') ? buildId : buildId.slice(0, 7);

  const dialog = document.createElement('dialog');
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <form method="dialog" class="dialog-form about-form">
      <div class="about-hero">
        <div class="about-illustration" aria-hidden="true">${ABOUT_HERO}</div>
        <div class="about-title-block">
          <h2 class="dialog-title">命の時計</h2>
          <p class="about-tagline">あの子の生後を、ぱっと見るアプリ</p>
        </div>
      </div>

      <ul class="about-list">
        <li>
          <span class="about-item-label">バージョン</span>
          <span class="about-item-value">${escapeHtml(shortBuild)}</span>
        </li>
        <li>
          <span class="about-item-label">データ保存</span>
          <span class="about-item-value">この端末のブラウザのみ</span>
        </li>
      </ul>

      <p class="about-note">
        入力したお名前・出生日・イベントなどの情報は、外部に送信されません。
        端末の localStorage にだけ保存され、設定からバックアップして他の端末に持ち運べます。
      </p>

      <div class="dialog-actions">
        <div class="dialog-actions-right">
          <button type="button" class="btn btn-primary" id="ab-close">閉じる</button>
        </div>
      </div>
    </form>
  `;
  document.body.appendChild(dialog);

  dialog.querySelector<HTMLButtonElement>('#ab-close')!.addEventListener('click', () => closeAndRemove(dialog));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeAndRemove(dialog); });
  dialog.showModal();
}

function openAlert(title: string, message: string): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog dialog-confirm';
  dialog.innerHTML = `
    <form method="dialog" class="dialog-form">
      <h2 class="dialog-title">${escapeHtml(title)}</h2>
      <p class="dialog-message">${escapeHtml(message)}</p>
      <div class="dialog-actions">
        <div class="dialog-actions-right">
          <button type="button" class="btn btn-primary" id="al-ok">OK</button>
        </div>
      </div>
    </form>
  `;
  document.body.appendChild(dialog);
  dialog.querySelector<HTMLButtonElement>('#al-ok')!.addEventListener('click', () => closeAndRemove(dialog));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeAndRemove(dialog); });
  dialog.showModal();
}

function renderOrderList(): string {
  const order = getCardOrder();
  return order
    .map((kind, i) => {
      const upDisabled = i === 0 ? 'disabled' : '';
      const downDisabled = i === order.length - 1 ? 'disabled' : '';
      const visible = isCardVisible(kind);
      const checked = visible ? 'checked' : '';
      const hiddenClass = visible ? '' : ' is-hidden';
      return `
        <li class="order-row${hiddenClass}">
          <label class="order-toggle">
            <input type="checkbox" data-order-visible="${kind}" ${checked} />
            <span class="order-label">${escapeHtml(CARD_LABELS[kind])}</span>
          </label>
          <div class="order-actions">
            <button type="button" class="icon-button-sm" data-order-up="${kind}" aria-label="上へ" ${upDisabled}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
            </button>
            <button type="button" class="icon-button-sm" data-order-down="${kind}" aria-label="下へ" ${downDisabled}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>
        </li>
      `;
    })
    .join('');
}

function bindOrderButtons(
  scope: HTMLElement,
  refresh: () => void,
  callbacks: SettingsCallbacks,
): void {
  scope.querySelectorAll<HTMLButtonElement>('[data-order-up]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.orderUp;
      if (!isCardKind(k)) return;
      moveCard(k as CardKind, -1);
      refresh();
      callbacks.onSave();
    });
  });
  scope.querySelectorAll<HTMLButtonElement>('[data-order-down]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.orderDown;
      if (!isCardKind(k)) return;
      moveCard(k as CardKind, 1);
      refresh();
      callbacks.onSave();
    });
  });
  scope.querySelectorAll<HTMLInputElement>('[data-order-visible]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const k = cb.dataset.orderVisible;
      if (!isCardKind(k)) return;
      setCardVisible(k as CardKind, cb.checked);
      refresh();
      callbacks.onSave();
    });
  });
}

function renderEventList(events: LifeEvent[]): string {
  if (events.length === 0) {
    return `<li class="event-empty">
      <div class="event-empty-illust" aria-hidden="true">${EMPTY_LEAF}</div>
      <p class="event-empty-text">「最後に会った日」など、覚えておきたい日を登録できます。</p>
    </li>`;
  }
  return events
    .map(
      (e, i) => {
        const upDisabled = i === 0 ? 'disabled' : '';
        const downDisabled = i === events.length - 1 ? 'disabled' : '';
        return `
          <li class="event-row">
            <div class="event-meta">
              <span class="event-label">${escapeHtml(e.label)}</span>
              <span class="event-date">${escapeHtml(e.date)}</span>
            </div>
            <div class="event-actions">
              <button type="button" class="icon-button-sm" data-event-up="${escapeHtml(e.id)}" aria-label="上へ" ${upDisabled}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
              </button>
              <button type="button" class="icon-button-sm" data-event-down="${escapeHtml(e.id)}" aria-label="下へ" ${downDisabled}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              <button type="button" class="icon-button-sm" data-event-id="${escapeHtml(e.id)}" aria-label="削除">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                </svg>
              </button>
            </div>
          </li>
        `;
      },
    )
    .join('');
}

function bindEventDelete(
  scope: HTMLElement,
  child: Child,
  refresh: () => void,
  callbacks: SettingsCallbacks,
): void {
  scope.querySelectorAll<HTMLButtonElement>('[data-event-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.eventId;
      if (!id) return;
      removeEvent(child.id, id);
      refresh();
      callbacks.onSave();
    });
  });
  scope.querySelectorAll<HTMLButtonElement>('[data-event-up]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.eventUp;
      if (!id) return;
      moveEvent(child.id, id, -1);
      refresh();
      callbacks.onSave();
    });
  });
  scope.querySelectorAll<HTMLButtonElement>('[data-event-down]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.eventDown;
      if (!id) return;
      moveEvent(child.id, id, 1);
      refresh();
      callbacks.onSave();
    });
  });
}

function openAddEvent(childId: string, onAdded: () => void): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <form method="dialog" class="dialog-form">
      <h2 class="dialog-title">イベントを追加</h2>
      <p class="dialog-message">「最後に会った日」「初めて歩いた日」など、覚えておきたい日を登録できます。</p>
      <label class="field">
        <span class="field-label">名前</span>
        <input type="text" id="ev-label" required maxlength="20" autocomplete="off" placeholder="例: 最後に会った日" />
      </label>
      <label class="field">
        <span class="field-label">日付</span>
        <input type="date" id="ev-date" required />
      </label>
      <div class="dialog-actions">
        <div class="dialog-actions-right">
          <button type="button" class="btn btn-secondary" id="ev-cancel">キャンセル</button>
          <button type="submit" class="btn btn-primary" id="ev-save">追加</button>
        </div>
      </div>
    </form>
  `;
  document.body.appendChild(dialog);

  const labelInput = dialog.querySelector<HTMLInputElement>('#ev-label')!;
  const dateInput = dialog.querySelector<HTMLInputElement>('#ev-date')!;
  setTimeout(() => labelInput.focus(), 0);

  dialog.querySelector<HTMLFormElement>('form')!.addEventListener('submit', (e) => {
    e.preventDefault();
    const label = labelInput.value.trim();
    const date = dateInput.value;
    if (!label) { labelInput.focus(); return; }
    if (!isValidBirthDate(date)) { dateInput.focus(); return; }
    addEvent(childId, label, date);
    closeAndRemove(dialog);
    onAdded();
  });

  dialog.querySelector<HTMLButtonElement>('#ev-cancel')!.addEventListener('click', () => {
    closeAndRemove(dialog);
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeAndRemove(dialog);
  });

  dialog.showModal();
}

// 詳しい設定(別 dialog): カード並び・表示/非表示 + バックアップ + このアプリについて。
// メイン設定 dialog の上に重ねて開く(背景タップ or 「閉じる」で詳しい設定だけ閉じる)。
function openAdvancedSettings(child: Child, callbacks: SettingsCallbacks): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <form method="dialog" class="dialog-form">
      <h2 class="dialog-title">詳しい設定</h2>

      <div class="event-section">
        <div class="event-section-head">
          <span class="field-label">イベント</span>
          <button type="button" class="btn btn-secondary btn-mini" id="adv-add-event">＋ 追加</button>
        </div>
        <ul class="event-list" id="adv-event-list">
          ${renderEventList(child.events)}
        </ul>
      </div>

      <hr class="dialog-divider" />

      <div class="order-section">
        <span class="field-label">カードの並び・表示</span>
        <ul class="order-list" id="adv-order-list">
          ${renderOrderList()}
        </ul>
      </div>

      <hr class="dialog-divider" />

      <div class="event-section">
        <span class="field-label">データのバックアップ</span>
        <div class="dialog-actions">
          <button type="button" class="btn btn-secondary btn-mini" id="adv-export">バックアップを出す</button>
          <button type="button" class="btn btn-secondary btn-mini" id="adv-import">バックアップから戻す</button>
        </div>
        <input type="file" id="adv-import-file" accept="application/json,.json" hidden />
      </div>

      <hr class="dialog-divider" />

      <button type="button" class="btn-link" id="adv-about">このアプリについて</button>

      <div class="dialog-actions">
        <div class="dialog-actions-right">
          <button type="button" class="btn btn-primary" id="adv-close">閉じる</button>
        </div>
      </div>
    </form>
  `;
  document.body.appendChild(dialog);

  // イベント(追加・削除・並び替え)
  const refreshEvents = (): void => {
    const ul = dialog.querySelector<HTMLUListElement>('#adv-event-list');
    if (ul) ul.innerHTML = renderEventList(child.events);
    bindEventDelete(dialog, child, refreshEvents, callbacks);
  };
  bindEventDelete(dialog, child, refreshEvents, callbacks);
  dialog.querySelector<HTMLButtonElement>('#adv-add-event')!.addEventListener('click', () => {
    openAddEvent(child.id, () => {
      refreshEvents();
      callbacks.onSave();
    });
  });

  // 並び替え + 表示制御(メイン画面を即時再描画 = callbacks.onSave)
  const refreshOrder = (): void => {
    const ul = dialog.querySelector<HTMLUListElement>('#adv-order-list');
    if (ul) ul.innerHTML = renderOrderList();
    bindOrderButtons(dialog, refreshOrder, callbacks);
  };
  bindOrderButtons(dialog, refreshOrder, callbacks);

  // バックアップ/復元
  dialog.querySelector<HTMLButtonElement>('#adv-export')!.addEventListener('click', () => {
    downloadBackup();
  });
  const fileInput = dialog.querySelector<HTMLInputElement>('#adv-import-file')!;
  dialog.querySelector<HTMLButtonElement>('#adv-import')!.addEventListener('click', () => {
    fileInput.click();
  });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    importBackup(file, () => {
      // バックアップ復元時はメイン設定 dialog も含めすべて閉じる(子データが入れ替わるため)
      closeAndRemove(dialog);
      removeExisting();
      callbacks.onSave();
    });
    fileInput.value = '';
  });

  dialog.querySelector<HTMLButtonElement>('#adv-about')!.addEventListener('click', () => {
    openAbout();
  });

  dialog.querySelector<HTMLButtonElement>('#adv-close')!.addEventListener('click', () => {
    closeAndRemove(dialog);
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeAndRemove(dialog);
  });

  // 自動 focus 抑止(設定系 dialog なので入力フォーカスは不要)
  dialog.tabIndex = -1;
  dialog.showModal();
  dialog.focus();
}

function openAddChild(onAdded: () => void): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <form method="dialog" class="dialog-form">
      <h2 class="dialog-title">別の子を追加</h2>
      <label class="field">
        <span class="field-label">お名前</span>
        <input type="text" id="add-name" required maxlength="20" autocomplete="off" />
      </label>
      <label class="field">
        <span class="field-label">出生日</span>
        <input type="date" id="add-birth" required />
      </label>
      <label class="field">
        <span class="field-label">タグ(任意)</span>
        ${renderTagSelect('add-tag', undefined)}
      </label>
      <div class="dialog-actions">
        <div class="dialog-actions-right">
          <button type="button" class="btn btn-secondary" id="add-cancel">キャンセル</button>
          <button type="submit" class="btn btn-primary" id="add-save">追加</button>
        </div>
      </div>
    </form>
  `;
  document.body.appendChild(dialog);

  const nameInput = dialog.querySelector<HTMLInputElement>('#add-name')!;
  const birthInput = dialog.querySelector<HTMLInputElement>('#add-birth')!;
  const tagInput = dialog.querySelector<HTMLSelectElement>('#add-tag')!;
  setTimeout(() => nameInput.focus(), 0);

  dialog.querySelector<HTMLFormElement>('form')!.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const birth = birthInput.value;
    const tag = readTag(tagInput);
    if (!name) { nameInput.focus(); return; }
    if (!isValidBirthDate(birth)) { birthInput.focus(); return; }
    const created = addChild(name, birth, tag);
    setActiveChild(created.id); // 追加した子をすぐアクティブに
    closeAndRemove(dialog);
    onAdded();
  });

  dialog.querySelector<HTMLButtonElement>('#add-cancel')!.addEventListener('click', () => {
    closeAndRemove(dialog);
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeAndRemove(dialog);
  });

  dialog.showModal();
}

function openDeleteConfirm(child: Child, onConfirm: () => void): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog dialog-confirm';
  dialog.innerHTML = `
    <form method="dialog" class="dialog-form">
      <h2 class="dialog-title">クリアしますか？</h2>
      <p class="dialog-message">「${escapeHtml(child.name)}」の情報をクリアします。元には戻せません。</p>
      <div class="dialog-actions">
        <div class="dialog-actions-right">
          <button type="button" class="btn btn-secondary" id="cf-no">キャンセル</button>
          <button type="button" class="btn btn-danger" id="cf-yes">クリアする</button>
        </div>
      </div>
    </form>
  `;
  document.body.appendChild(dialog);

  dialog.querySelector<HTMLButtonElement>('#cf-no')!.addEventListener('click', () => {
    closeAndRemove(dialog);
  });
  dialog.querySelector<HTMLButtonElement>('#cf-yes')!.addEventListener('click', () => {
    removeChild(child.id);
    closeAndRemove(dialog);
    onConfirm();
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeAndRemove(dialog);
  });

  dialog.showModal();
}

function closeAndRemove(dialog: HTMLDialogElement): void {
  dialog.close();
  dialog.remove();
}

function removeExisting(): void {
  document.querySelectorAll('dialog.dialog').forEach((d) => {
    if (d instanceof HTMLDialogElement) {
      d.close();
      d.remove();
    }
  });
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
