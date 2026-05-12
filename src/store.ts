// localStorage を単一の正本とする永続化レイヤ。
// キー `lifeClock.v1` に Store JSON を保存。スキーマ変更時は v2 に切り替えて optional migration。
//
// Phase 2 では子 1 人運用が中心だが、children を配列で保持しておけば Phase 3 で兄弟切替を
// 追加するときに構造変更が不要になる。

const STORAGE_KEY = 'lifeClock.v1';

// メインカード「生まれてから」(=calendar) は固定で最上段。
// それ以降は cardOrder の順で並び、'events' はイベントカード群が挿入される位置を表す。
export type CardKind = 'birth' | 'weeks' | 'totalDays' | 'nextBirthday' | 'zodiac' | 'events';

export const DEFAULT_CARD_ORDER: CardKind[] = [
  'birth',
  'weeks',
  'totalDays',
  'nextBirthday',
  'zodiac',
  'events',
];

export const CARD_LABELS: Record<CardKind, string> = {
  birth: '生まれた日',
  weeks: '週でいうと',
  totalDays: '日でいうと',
  nextBirthday: '次の誕生日まで',
  zodiac: '干支',
  events: 'イベント',
};

export function isCardKind(s: unknown): s is CardKind {
  return (
    s === 'birth' ||
    s === 'weeks' ||
    s === 'totalDays' ||
    s === 'nextBirthday' ||
    s === 'zodiac' ||
    s === 'events'
  );
}

// 旧データや壊れた cardOrder を補完して整合する(全 CardKind が 1 回ずつ並ぶ配列にする)。
function normalizeCardOrder(input: unknown): CardKind[] {
  const seen = new Set<CardKind>();
  const result: CardKind[] = [];
  if (Array.isArray(input)) {
    for (const v of input) {
      if (isCardKind(v) && !seen.has(v)) {
        seen.add(v);
        result.push(v);
      }
    }
  }
  // 欠落分はデフォルト順で末尾に追加
  for (const k of DEFAULT_CARD_ORDER) {
    if (!seen.has(k)) result.push(k);
  }
  return result;
}

export type LifeEvent = {
  id: string;
  label: string;
  date: string; // YYYY-MM-DD
};

// タグ: 各子に 1 つだけ付けられる関係性ラベル。未設定(undefined)も許容。
// プリセット 4 種で固定(自由入力は将来検討)。プリセットを増やすときは TAG_PRESETS と
// ChildTag の両方を更新する。
export type ChildTag = 'family' | 'relative' | 'friend' | 'pet' | 'other';

export const TAG_PRESETS: Record<ChildTag, { label: string; icon: string }> = {
  family:   { label: '家族',   icon: '🏠' },
  relative: { label: '親戚',   icon: '🌳' },
  friend:   { label: '友達',   icon: '🤝' },
  pet:      { label: 'ペット', icon: '🐾' },
  other:    { label: 'その他', icon: '🏷️' },
};

export const TAG_ORDER: ChildTag[] = ['family', 'relative', 'friend', 'pet', 'other'];

export function isChildTag(s: unknown): s is ChildTag {
  return typeof s === 'string' && s in TAG_PRESETS;
}

export type Child = {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  tag?: ChildTag;
  events: LifeEvent[];
};

export type Store = {
  children: Child[];
  activeChildId: string | null;
  cardVisibility: Partial<Record<CardKind, boolean>>;
  cardOrder: CardKind[]; // 「生まれた日」以降の表示順(永続化、バックアップにも含まれる)
};

export function defaultStore(): Store {
  return {
    children: [],
    activeChildId: null,
    cardVisibility: {},
    cardOrder: [...DEFAULT_CARD_ORDER],
  };
}

export function isValidBirthDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00`);
  return !isNaN(d.getTime());
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // crypto.randomUUID が無い古い環境向けの簡易フォールバック。
  // Phase 2 の家族数件規模では十分な一意性。
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

let memoryStore: Store = loadStore();

function loadStore(): Store {
  if (typeof localStorage === 'undefined') return defaultStore();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultStore();
  try {
    const parsed = JSON.parse(raw) as Partial<Store>;
    const rawChildren = Array.isArray(parsed.children) ? parsed.children : [];
    const children: Child[] = rawChildren.map((c) => {
      const obj = c as Partial<Child> & Record<string, unknown>;
      return {
        id: String(obj.id ?? ''),
        name: String(obj.name ?? ''),
        birthDate: String(obj.birthDate ?? ''),
        tag: isChildTag(obj.tag) ? obj.tag : undefined,
        events: Array.isArray(obj.events) ? (obj.events as LifeEvent[]) : [],
      };
    });
    return {
      children,
      activeChildId: typeof parsed.activeChildId === 'string' ? parsed.activeChildId : null,
      cardVisibility:
        parsed.cardVisibility && typeof parsed.cardVisibility === 'object'
          ? parsed.cardVisibility
          : {},
      cardOrder: normalizeCardOrder(parsed.cardOrder),
    };
  } catch {
    return defaultStore();
  }
}

function persist(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
}

export function getStore(): Readonly<Store> {
  return memoryStore;
}

export function getActiveChild(): Child | null {
  if (!memoryStore.activeChildId) return null;
  return memoryStore.children.find((c) => c.id === memoryStore.activeChildId) ?? null;
}

export function addChild(name: string, birthDate: string, tag?: ChildTag): Child {
  const child: Child = {
    id: uuid(),
    name: name.trim(),
    birthDate,
    tag,
    events: [],
  };
  memoryStore.children.push(child);
  if (!memoryStore.activeChildId) {
    memoryStore.activeChildId = child.id;
  }
  persist();
  return child;
}

export function updateChild(
  id: string,
  patch: Partial<Pick<Child, 'name' | 'birthDate' | 'tag'>>,
): void {
  const child = memoryStore.children.find((c) => c.id === id);
  if (!child) return;
  if (patch.name !== undefined) child.name = patch.name.trim();
  if (patch.birthDate !== undefined) child.birthDate = patch.birthDate;
  if ('tag' in patch) child.tag = patch.tag; // undefined を渡すと「タグなし」に戻せる
  persist();
}

export function removeChild(id: string): void {
  memoryStore.children = memoryStore.children.filter((c) => c.id !== id);
  if (memoryStore.activeChildId === id) {
    memoryStore.activeChildId = memoryStore.children[0]?.id ?? null;
  }
  persist();
}

export function setActiveChild(id: string): void {
  if (!memoryStore.children.some((c) => c.id === id)) return;
  memoryStore.activeChildId = id;
  persist();
}

// 任意イベント CRUD。子に紐づく軽量メモ(「最後に会った日」など)。
// 過去・未来どちらの日付も許容(過去なら「あれから」、未来なら「あと」を main 側で出し分け)。

export function addEvent(childId: string, label: string, date: string): LifeEvent | null {
  const child = memoryStore.children.find((c) => c.id === childId);
  if (!child) return null;
  const event: LifeEvent = {
    id: uuid(),
    label: label.trim(),
    date,
  };
  child.events.push(event);
  persist();
  return event;
}

export function updateEvent(
  childId: string,
  eventId: string,
  patch: Partial<Pick<LifeEvent, 'label' | 'date'>>,
): void {
  const child = memoryStore.children.find((c) => c.id === childId);
  if (!child) return;
  const event = child.events.find((e) => e.id === eventId);
  if (!event) return;
  if (patch.label !== undefined) event.label = patch.label.trim();
  if (patch.date !== undefined) event.date = patch.date;
  persist();
}

export function removeEvent(childId: string, eventId: string): void {
  const child = memoryStore.children.find((c) => c.id === childId);
  if (!child) return;
  child.events = child.events.filter((e) => e.id !== eventId);
  persist();
}

export function moveEvent(childId: string, eventId: string, direction: -1 | 1): void {
  const child = memoryStore.children.find((c) => c.id === childId);
  if (!child) return;
  const idx = child.events.findIndex((e) => e.id === eventId);
  if (idx < 0) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= child.events.length) return;
  const arr = [...child.events];
  const tmp = arr[idx]!;
  arr[idx] = arr[newIdx]!;
  arr[newIdx] = tmp;
  child.events = arr;
  persist();
}

// JSON バックアップ/復元用。インポート時の最低限の構造チェック。
export function isValidStoreShape(json: unknown): json is Store {
  if (!json || typeof json !== 'object') return false;
  const obj = json as Record<string, unknown>;
  if (!Array.isArray(obj.children)) return false;
  for (const c of obj.children) {
    if (!c || typeof c !== 'object') return false;
    const cc = c as Record<string, unknown>;
    if (typeof cc.id !== 'string' || !cc.id) return false;
    if (typeof cc.name !== 'string') return false;
    if (typeof cc.birthDate !== 'string' || !isValidBirthDate(cc.birthDate)) return false;
    if (cc.events !== undefined && !Array.isArray(cc.events)) return false;
  }
  return true;
}

// バックアップ JSON で memoryStore を完全置換 + 永続化。
// loadStore と同様に欠損フィールドを補完して安全な形に整える。
export function replaceStore(incoming: Store): void {
  memoryStore = {
    children: incoming.children.map((c) => ({
      id: c.id,
      name: c.name,
      birthDate: c.birthDate,
      tag: isChildTag(c.tag) ? c.tag : undefined,
      events: Array.isArray(c.events) ? c.events : [],
    })),
    activeChildId: incoming.activeChildId ?? incoming.children[0]?.id ?? null,
    cardVisibility:
      incoming.cardVisibility && typeof incoming.cardVisibility === 'object'
        ? incoming.cardVisibility
        : {},
    cardOrder: normalizeCardOrder(incoming.cardOrder),
  };
  persist();
}

export function getCardOrder(): CardKind[] {
  return memoryStore.cardOrder;
}

// 表示/非表示。undefined はデフォルト=表示。false のときだけ非表示。
// JSON 軽量化のため、表示に戻すときは key を delete する。
export function isCardVisible(kind: CardKind): boolean {
  return memoryStore.cardVisibility[kind] !== false;
}

export function setCardVisible(kind: CardKind, visible: boolean): void {
  if (visible) {
    delete memoryStore.cardVisibility[kind];
  } else {
    memoryStore.cardVisibility[kind] = false;
  }
  persist();
}

// 1 つだけ上(-1)/下(+1)に動かす。先頭で -1 / 末尾で +1 は無視。
export function moveCard(kind: CardKind, direction: -1 | 1): void {
  const idx = memoryStore.cardOrder.indexOf(kind);
  if (idx < 0) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= memoryStore.cardOrder.length) return;
  const arr = [...memoryStore.cardOrder];
  const tmp = arr[idx]!;
  arr[idx] = arr[newIdx]!;
  arr[newIdx] = tmp;
  memoryStore.cardOrder = arr;
  persist();
}

export function exportJSON(): string {
  return JSON.stringify(memoryStore, null, 2);
}
