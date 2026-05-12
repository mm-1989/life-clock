import { addChild, type ChildTag, isChildTag, isValidBirthDate, TAG_ORDER, TAG_PRESETS } from './store.ts';
import { HERO_PARENT_CHILD } from './illustrations.ts';

// 初回起動時(子が 0 人)に表示するフォーム。送信成功で onSubmit を呼んでメイン描画へ。
export function renderOnboarding(root: HTMLElement, onSubmit: () => void): void {
  root.innerHTML = `
    <section class="onboarding">
      <div class="onboarding-hero" aria-hidden="true">${HERO_PARENT_CHILD}</div>
      <h1 class="onboarding-title">はじめまして</h1>
      <p class="onboarding-lead">お子さんのお名前と出生日を教えてください。</p>
      <form id="ob-form" class="form-stack">
        <label class="field">
          <span class="field-label">お名前</span>
          <input type="text" id="ob-name" required maxlength="20" autocomplete="off" />
        </label>
        <label class="field">
          <span class="field-label">出生日</span>
          <input type="date" id="ob-birth" required />
        </label>
        <label class="field">
          <span class="field-label">タグ(任意)</span>
          ${renderTagSelect('ob-tag', undefined)}
        </label>
        <button type="submit" class="btn btn-primary btn-block">はじめる</button>
      </form>
      <p class="onboarding-note">入力した情報はこの端末のブラウザだけに保存されます。</p>
    </section>
  `;

  const form = root.querySelector<HTMLFormElement>('#ob-form');
  const nameInput = root.querySelector<HTMLInputElement>('#ob-name');
  const birthInput = root.querySelector<HTMLInputElement>('#ob-birth');
  const tagInput = root.querySelector<HTMLSelectElement>('#ob-tag');
  if (!form || !nameInput || !birthInput || !tagInput) return;

  // 設定系と統一: 開いた瞬間に input へ自動 focus しない(誤入力・キーボード起動防止)
  // ユーザがタップで明示的に focus する流れに統一

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const birth = birthInput.value;
    const tag = readTag(tagInput);
    if (!name) { nameInput.focus(); return; }
    if (!isValidBirthDate(birth)) { birthInput.focus(); return; }
    addChild(name, birth, tag);
    onSubmit();
  });
}

// タグ選択 select の HTML を生成。3 箇所(onboarding/設定/子追加)で再利用。
export function renderTagSelect(id: string, current: ChildTag | undefined): string {
  const options = ['<option value="">なし</option>']
    .concat(
      TAG_ORDER.map(
        (t) =>
          `<option value="${t}"${t === current ? ' selected' : ''}>${TAG_PRESETS[t].icon} ${TAG_PRESETS[t].label}</option>`,
      ),
    )
    .join('');
  return `<select id="${id}" class="select">${options}</select>`;
}

export function readTag(el: HTMLSelectElement): ChildTag | undefined {
  const v = el.value;
  return isChildTag(v) ? v : undefined;
}
