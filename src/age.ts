// 暦計算の純関数群。すべての関数はステートを持たず、引数の Date のみから出力を決める。
// テスト境界: うるう年 (2/29)、月跨ぎ、月命日が無い月のクランプ、誕生日当日、元号境界(令和/平成/昭和)。

export type Breakdown = { years: number; months: number; days: number };

// 元号データ。改元日(その日が新元号の元年初日)をグレゴリオ暦遡及換算で保持。
// 大化(645)〜令和まで網羅。並び順は不問(japaneseEraOf が「d 以下の最大 start」を線形検索)。
// 注: 古代〜中世の改元日は AI/Wikipedia 経由のためまれに数日のズレあり。
//     書類記入で扱う近現代(明治以降)は手動確認済み。
//     南北朝期は両朝が併存するため、ロジック上 start が新しい方が選ばれる。
const ERAS: { name: string; start: Date }[] = [
  // 飛鳥・奈良
  { name: '大化', start: new Date(645, 6, 29) },
  { name: '白雉', start: new Date(650, 2, 22) },
  { name: '朱鳥', start: new Date(686, 7, 14) },
  { name: '大宝', start: new Date(701, 4, 3) },
  { name: '慶雲', start: new Date(704, 5, 16) },
  { name: '和銅', start: new Date(708, 1, 7) },
  { name: '霊亀', start: new Date(715, 9, 3) },
  { name: '養老', start: new Date(717, 11, 24) },
  { name: '神亀', start: new Date(724, 2, 3) },
  { name: '天平', start: new Date(729, 8, 2) },
  { name: '天平感宝', start: new Date(749, 4, 4) },
  { name: '天平勝宝', start: new Date(749, 7, 19) },
  { name: '天平宝字', start: new Date(757, 8, 6) },
  { name: '天平神護', start: new Date(765, 1, 1) },
  { name: '神護景雲', start: new Date(767, 8, 13) },
  { name: '宝亀', start: new Date(770, 9, 23) },
  { name: '天応', start: new Date(781, 0, 30) },
  { name: '延暦', start: new Date(782, 8, 30) },
  // 平安
  { name: '大同', start: new Date(806, 5, 8) },
  { name: '弘仁', start: new Date(810, 9, 20) },
  { name: '天長', start: new Date(824, 1, 8) },
  { name: '承和', start: new Date(834, 1, 14) },
  { name: '嘉祥', start: new Date(848, 6, 16) },
  { name: '仁寿', start: new Date(851, 5, 1) },
  { name: '斉衡', start: new Date(854, 11, 23) },
  { name: '天安', start: new Date(857, 2, 20) },
  { name: '貞観', start: new Date(859, 4, 20) },
  { name: '元慶', start: new Date(877, 5, 1) },
  { name: '仁和', start: new Date(885, 2, 11) },
  { name: '寛平', start: new Date(889, 4, 30) },
  { name: '昌泰', start: new Date(898, 4, 20) },
  { name: '延喜', start: new Date(901, 7, 31) },
  { name: '延長', start: new Date(923, 4, 29) },
  { name: '承平', start: new Date(931, 4, 16) },
  { name: '天慶', start: new Date(938, 5, 22) },
  { name: '天暦', start: new Date(947, 4, 15) },
  { name: '天徳', start: new Date(957, 10, 21) },
  { name: '応和', start: new Date(961, 2, 5) },
  { name: '康保', start: new Date(964, 7, 19) },
  { name: '安和', start: new Date(968, 8, 8) },
  { name: '天禄', start: new Date(970, 4, 3) },
  { name: '天延', start: new Date(974, 0, 16) },
  { name: '貞元', start: new Date(976, 7, 11) },
  { name: '天元', start: new Date(978, 11, 31) },
  { name: '永観', start: new Date(983, 4, 29) },
  { name: '寛和', start: new Date(985, 4, 19) },
  { name: '永延', start: new Date(987, 4, 5) },
  { name: '永祚', start: new Date(989, 8, 10) },
  { name: '正暦', start: new Date(990, 10, 26) },
  { name: '長徳', start: new Date(995, 2, 25) },
  { name: '長保', start: new Date(999, 1, 1) },
  { name: '寛弘', start: new Date(1004, 7, 8) },
  { name: '長和', start: new Date(1013, 1, 8) },
  { name: '寛仁', start: new Date(1017, 4, 21) },
  { name: '治安', start: new Date(1021, 2, 17) },
  { name: '万寿', start: new Date(1024, 7, 19) },
  { name: '長元', start: new Date(1028, 7, 18) },
  { name: '長暦', start: new Date(1037, 4, 9) },
  { name: '長久', start: new Date(1040, 11, 16) },
  { name: '寛徳', start: new Date(1044, 11, 16) },
  { name: '永承', start: new Date(1046, 4, 22) },
  { name: '天喜', start: new Date(1053, 1, 2) },
  { name: '康平', start: new Date(1058, 8, 19) },
  { name: '治暦', start: new Date(1065, 8, 4) },
  { name: '延久', start: new Date(1069, 4, 6) },
  { name: '承保', start: new Date(1074, 8, 16) },
  { name: '承暦', start: new Date(1077, 11, 5) },
  { name: '永保', start: new Date(1081, 2, 22) },
  { name: '応徳', start: new Date(1084, 2, 15) },
  { name: '寛治', start: new Date(1087, 4, 11) },
  { name: '嘉保', start: new Date(1094, 0, 23) },
  { name: '永長', start: new Date(1096, 0, 3) },
  { name: '承徳', start: new Date(1097, 11, 27) },
  { name: '康和', start: new Date(1099, 8, 15) },
  { name: '長治', start: new Date(1104, 2, 8) },
  { name: '嘉承', start: new Date(1106, 4, 13) },
  { name: '天仁', start: new Date(1108, 8, 9) },
  { name: '天永', start: new Date(1110, 6, 31) },
  { name: '永久', start: new Date(1113, 7, 25) },
  { name: '元永', start: new Date(1118, 3, 25) },
  { name: '保安', start: new Date(1120, 4, 9) },
  { name: '天治', start: new Date(1124, 4, 18) },
  { name: '大治', start: new Date(1126, 1, 15) },
  { name: '天承', start: new Date(1131, 1, 28) },
  { name: '長承', start: new Date(1132, 8, 21) },
  { name: '保延', start: new Date(1135, 5, 10) },
  { name: '永治', start: new Date(1141, 7, 13) },
  { name: '康治', start: new Date(1142, 4, 25) },
  { name: '天養', start: new Date(1144, 2, 28) },
  { name: '久安', start: new Date(1145, 7, 12) },
  { name: '仁平', start: new Date(1151, 1, 14) },
  { name: '久寿', start: new Date(1154, 11, 4) },
  { name: '保元', start: new Date(1156, 4, 18) },
  { name: '平治', start: new Date(1159, 4, 9) },
  { name: '永暦', start: new Date(1160, 1, 18) },
  { name: '応保', start: new Date(1161, 8, 24) },
  { name: '長寛', start: new Date(1163, 4, 4) },
  { name: '永万', start: new Date(1165, 6, 14) },
  { name: '仁安', start: new Date(1166, 8, 23) },
  { name: '嘉応', start: new Date(1169, 4, 6) },
  { name: '承安', start: new Date(1171, 4, 27) },
  { name: '安元', start: new Date(1175, 7, 16) },
  { name: '治承', start: new Date(1177, 7, 29) },
  { name: '養和', start: new Date(1181, 7, 25) },
  { name: '寿永', start: new Date(1182, 5, 29) },
  { name: '元暦', start: new Date(1184, 4, 27) },
  // 鎌倉
  { name: '文治', start: new Date(1185, 8, 9) },
  { name: '建久', start: new Date(1190, 4, 16) },
  { name: '正治', start: new Date(1199, 4, 23) },
  { name: '建仁', start: new Date(1201, 2, 19) },
  { name: '元久', start: new Date(1204, 2, 23) },
  { name: '建永', start: new Date(1206, 5, 5) },
  { name: '承元', start: new Date(1207, 10, 16) },
  { name: '建暦', start: new Date(1211, 3, 23) },
  { name: '建保', start: new Date(1214, 0, 18) },
  { name: '承久', start: new Date(1219, 4, 27) },
  { name: '貞応', start: new Date(1222, 4, 25) },
  { name: '元仁', start: new Date(1224, 11, 31) },
  { name: '嘉禄', start: new Date(1225, 4, 28) },
  { name: '安貞', start: new Date(1228, 0, 18) },
  { name: '寛喜', start: new Date(1229, 2, 31) },
  { name: '貞永', start: new Date(1232, 3, 23) },
  { name: '天福', start: new Date(1233, 4, 25) },
  { name: '文暦', start: new Date(1234, 10, 27) },
  { name: '嘉禎', start: new Date(1235, 10, 1) },
  { name: '暦仁', start: new Date(1238, 11, 30) },
  { name: '延応', start: new Date(1239, 2, 13) },
  { name: '仁治', start: new Date(1240, 7, 5) },
  { name: '寛元', start: new Date(1243, 2, 18) },
  { name: '宝治', start: new Date(1247, 3, 5) },
  { name: '建長', start: new Date(1249, 4, 2) },
  { name: '康元', start: new Date(1256, 9, 24) },
  { name: '正嘉', start: new Date(1257, 2, 31) },
  { name: '正元', start: new Date(1259, 3, 20) },
  { name: '文応', start: new Date(1260, 4, 24) },
  { name: '弘長', start: new Date(1261, 2, 22) },
  { name: '文永', start: new Date(1264, 2, 27) },
  { name: '建治', start: new Date(1275, 4, 22) },
  { name: '弘安', start: new Date(1278, 2, 23) },
  { name: '正応', start: new Date(1288, 4, 29) },
  { name: '永仁', start: new Date(1293, 8, 6) },
  { name: '正安', start: new Date(1299, 4, 25) },
  { name: '乾元', start: new Date(1302, 11, 10) },
  { name: '嘉元', start: new Date(1303, 8, 16) },
  { name: '徳治', start: new Date(1307, 0, 18) },
  { name: '延慶', start: new Date(1308, 10, 22) },
  { name: '応長', start: new Date(1311, 4, 17) },
  { name: '正和', start: new Date(1312, 3, 27) },
  { name: '文保', start: new Date(1317, 2, 16) },
  { name: '元応', start: new Date(1319, 4, 18) },
  { name: '元亨', start: new Date(1321, 2, 22) },
  { name: '正中', start: new Date(1324, 11, 25) },
  { name: '嘉暦', start: new Date(1326, 4, 28) },
  { name: '元徳', start: new Date(1329, 8, 22) },
  { name: '元弘', start: new Date(1331, 8, 11) },
  // 南北朝(start が新しい方が選ばれる: 北朝優先となる年もあれば南朝優先となる年もある)
  { name: '正慶', start: new Date(1332, 4, 23) },
  { name: '建武', start: new Date(1334, 2, 5) },
  { name: '延元', start: new Date(1336, 3, 11) },
  { name: '暦応', start: new Date(1338, 9, 11) },
  { name: '興国', start: new Date(1340, 4, 25) },
  { name: '康永', start: new Date(1342, 5, 1) },
  { name: '貞和', start: new Date(1345, 10, 15) },
  { name: '正平', start: new Date(1347, 0, 20) },
  { name: '観応', start: new Date(1350, 3, 4) },
  { name: '文和', start: new Date(1352, 10, 4) },
  { name: '延文', start: new Date(1356, 3, 29) },
  { name: '康安', start: new Date(1361, 4, 4) },
  { name: '貞治', start: new Date(1362, 9, 11) },
  { name: '応安', start: new Date(1368, 2, 7) },
  { name: '建徳', start: new Date(1370, 7, 16) },
  { name: '文中', start: new Date(1372, 4, 1) },
  { name: '天授', start: new Date(1375, 5, 26) },
  { name: '永和', start: new Date(1375, 2, 29) },
  { name: '康暦', start: new Date(1379, 3, 9) },
  { name: '永徳', start: new Date(1381, 2, 20) },
  { name: '弘和', start: new Date(1381, 2, 6) },
  { name: '元中', start: new Date(1384, 4, 18) },
  { name: '至徳', start: new Date(1387, 9, 5) },
  { name: '嘉慶', start: new Date(1389, 2, 7) },
  { name: '康応', start: new Date(1390, 3, 12) },
  { name: '明徳', start: new Date(1394, 7, 2) },
  // 室町
  { name: '応永', start: new Date(1428, 5, 10) },
  { name: '正長', start: new Date(1429, 9, 3) },
  { name: '永享', start: new Date(1441, 2, 10) },
  { name: '嘉吉', start: new Date(1444, 1, 23) },
  { name: '文安', start: new Date(1449, 7, 16) },
  { name: '宝徳', start: new Date(1452, 7, 10) },
  { name: '享徳', start: new Date(1455, 8, 6) },
  { name: '康正', start: new Date(1457, 9, 16) },
  { name: '長禄', start: new Date(1461, 1, 1) },
  { name: '寛正', start: new Date(1466, 2, 14) },
  { name: '文正', start: new Date(1467, 3, 9) },
  { name: '応仁', start: new Date(1469, 5, 8) },
  { name: '文明', start: new Date(1487, 7, 9) },
  { name: '長享', start: new Date(1489, 8, 16) },
  { name: '延徳', start: new Date(1492, 7, 12) },
  // 戦国
  { name: '明応', start: new Date(1501, 2, 18) },
  { name: '文亀', start: new Date(1504, 2, 16) },
  { name: '永正', start: new Date(1521, 8, 23) },
  { name: '大永', start: new Date(1528, 8, 3) },
  { name: '享禄', start: new Date(1532, 7, 29) },
  { name: '天文', start: new Date(1555, 10, 7) },
  { name: '弘治', start: new Date(1558, 2, 18) },
  { name: '永禄', start: new Date(1570, 4, 27) },
  { name: '元亀', start: new Date(1573, 7, 25) },
  { name: '天正', start: new Date(1592, 11, 8) },
  { name: '文禄', start: new Date(1596, 11, 16) },
  { name: '慶長', start: new Date(1615, 8, 5) },
  // 江戸
  { name: '元和', start: new Date(1624, 3, 17) },
  { name: '寛永', start: new Date(1645, 0, 13) },
  { name: '正保', start: new Date(1648, 3, 7) },
  { name: '慶安', start: new Date(1652, 9, 20) },
  { name: '承応', start: new Date(1655, 4, 18) },
  { name: '明暦', start: new Date(1658, 7, 21) },
  { name: '万治', start: new Date(1661, 4, 23) },
  { name: '寛文', start: new Date(1673, 9, 30) },
  { name: '延宝', start: new Date(1681, 10, 9) },
  { name: '天和', start: new Date(1684, 3, 5) },
  { name: '貞享', start: new Date(1688, 9, 23) },
  { name: '元禄', start: new Date(1704, 3, 16) },
  { name: '宝永', start: new Date(1711, 5, 11) },
  { name: '正徳', start: new Date(1716, 7, 9) },
  { name: '享保', start: new Date(1736, 5, 7) },
  { name: '元文', start: new Date(1741, 3, 12) },
  { name: '寛保', start: new Date(1744, 3, 3) },
  { name: '延享', start: new Date(1748, 7, 5) },
  { name: '寛延', start: new Date(1751, 11, 14) },
  { name: '宝暦', start: new Date(1764, 5, 30) },
  { name: '明和', start: new Date(1772, 11, 10) },
  { name: '安永', start: new Date(1781, 3, 25) },
  { name: '天明', start: new Date(1789, 1, 19) },
  { name: '寛政', start: new Date(1801, 2, 19) },
  { name: '享和', start: new Date(1804, 2, 22) },
  { name: '文化', start: new Date(1818, 4, 26) },
  { name: '文政', start: new Date(1831, 0, 23) },
  { name: '天保', start: new Date(1845, 0, 9) },
  { name: '弘化', start: new Date(1848, 3, 1) },
  { name: '嘉永', start: new Date(1855, 0, 15) },
  { name: '安政', start: new Date(1860, 3, 8) },
  { name: '万延', start: new Date(1861, 2, 29) },
  { name: '文久', start: new Date(1864, 2, 27) },
  { name: '元治', start: new Date(1864, 2, 27) }, // 1864-03-27
  { name: '慶応', start: new Date(1865, 4, 1) },  // 1865-05-01
  // 近現代(改元日 確定済み)
  { name: '明治', start: new Date(1868, 8, 8) },
  { name: '大正', start: new Date(1912, 6, 30) },
  { name: '昭和', start: new Date(1926, 11, 25) },
  { name: '平成', start: new Date(1989, 0, 8) },
  { name: '令和', start: new Date(2019, 4, 1) },
];

const ZODIAC = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export type Zodiac = (typeof ZODIAC)[number];

// 西暦 4 年が子年(甲子)。負の年も安全に扱うため二重 mod する。
export function zodiacOf(year: number): Zodiac {
  const idx = ((year - 4) % 12 + 12) % 12;
  return ZODIAC[idx]!;
}

// 日付の 00:00 を取り出す。タイムゾーンは local。出生日は時刻なしで保存するため
// 出生 Date 側も `new Date(YYYY-MM-DDT00:00:00)` で生成する想定。
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// 出生日が未来か(=まだ生まれていない子。妊娠中・予定日入力など)。
// true のとき、メイン/生まれた日カードのラベルが「生まれるまで」に切り替わる。
export function isFutureBirth(birth: Date, now: Date): boolean {
  return startOfDay(birth).getTime() > startOfDay(now).getTime();
}

// 起算日からの整数日数。同日 = 0、翌日 = 1。
// DST のある地域だと ms 割算で誤差が出るが日本は DST なしのため安全。
export function totalDays(birth: Date, now: Date): number {
  const ms = startOfDay(now).getTime() - startOfDay(birth).getTime();
  return Math.round(ms / 86_400_000);
}

// 整数週 + 端数日。7 日きっかりは「1週と0日」となる。
export function weeksAndDays(birth: Date, now: Date): { weeks: number; days: number } {
  const td = Math.max(0, totalDays(birth, now));
  return { weeks: Math.floor(td / 7), days: td % 7 };
}

// 西暦表記(YYYY年M月D日)。書類記入の主流表記。
export function formatGregorianDate(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// 指定日の元号と元号年を返す。大化(645)より前は null(西暦表記にフォールバック)。
// ERAS の並び順に依存せず、d 以下の start で最大のものを線形検索する。
export function japaneseEraOf(d: Date): { era: string; year: number } | null {
  const t = d.getTime();
  let best: { name: string; start: Date } | null = null;
  for (const era of ERAS) {
    const s = era.start.getTime();
    if (s <= t && (!best || s > best.start.getTime())) {
      best = era;
    }
  }
  if (!best) return null;
  return { era: best.name, year: d.getFullYear() - best.start.getFullYear() + 1 };
}

// 曜日(日本語の頭文字)。JavaScript Date は遡及グレゴリオ暦のため
// 1582 年以前は当時実際に使われていた暦・曜日と一致しない場合がある(計算上の値)。
const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'] as const;
export function formatWeekdayJa(d: Date): string {
  return WEEKDAYS_JA[d.getDay()] ?? '';
}

// 和暦の年部分のみ(令和5年)。元年は「元」と表記。明治より前は空文字。
export function formatJapaneseEraYear(d: Date): string {
  const ey = japaneseEraOf(d);
  if (!ey) return '';
  const yearStr = ey.year === 1 ? '元' : String(ey.year);
  return `${ey.era}${yearStr}年`;
}

// 和暦表記(令和N年M月D日)。元年は「元年」と表記。明治より前は西暦にフォールバック。
export function formatJapaneseEraDate(d: Date): string {
  const ey = japaneseEraOf(d);
  if (!ey) return formatGregorianDate(d);
  const yearStr = ey.year === 1 ? '元' : String(ey.year);
  return `${ey.era}${yearStr}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// メインカード(生まれてから / 生まれるまで)用フォーマッタ。過去・未来共通。
//   0歳0か月: 「D日」のみ
//   0歳・1か月以上 & 0日省略: 「Mか月」
//   0歳・1か月以上: 「Mか月とD日」
//   1歳以降 & 月日両方0: 「N歳」(歳の誕生日当日)
//   1歳以降 & 0日: 「N歳Mか月」(中途の 0 月は残す、月命日)
//   1歳以降: 「N歳Mか月とD日」
export function formatBreakdownLabel(cal: Breakdown): string {
  if (cal.years === 0 && cal.months === 0) return `${cal.days}日`;
  if (cal.years === 0) {
    if (cal.days === 0) return `${cal.months}か月`;
    return `${cal.months}か月と${cal.days}日`;
  }
  if (cal.months === 0 && cal.days === 0) return `${cal.years}歳`;
  if (cal.days === 0) return `${cal.years}歳${cal.months}か月`;
  return `${cal.years}歳${cal.months}か月と${cal.days}日`;
}

// 短縮版「歳と月のみ」(日省略)。0歳は「Mか月」のみ。
// 例: { 0, 3, 12 } → 「3か月」、{ 1, 3, 12 } → 「1歳3か月」
export function formatBreakdownShort(cal: Breakdown): string {
  if (cal.years === 0) return `${cal.months}か月`;
  return `${cal.years}歳${cal.months}か月`;
}

// 累計月数(歳を月に換算合算)。例: { 1, 3, 12 } → 「15か月」、{ 0, 3, 12 } → 「3か月」
export function formatTotalMonths(cal: Breakdown): string {
  return `${cal.years * 12 + cal.months}か月`;
}

// 西暦のスラッシュ区切り。例: 2023年5月12日 → 「2023/5/12」
export function formatGregorianSlash(d: Date): string {
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

// 西暦のハイフン区切り(ISO 8601 の date 部分、ゼロ埋め)。例: 「2023-05-12」
export function formatGregorianHyphen(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dd}`;
}

// 暦に基づく年/月/日表現。月跨ぎは「現在月の前月の日数を借りる」流派。
// 2/29 出生 → 翌年 2/28 で「1 歳 0 か月 0 日」、3/1 で「1 歳 0 か月 1 日」となる。
export function calendarBreakdown(birth: Date, now: Date): Breakdown {
  const b = startOfDay(birth);
  const n = startOfDay(now);

  let years = n.getFullYear() - b.getFullYear();
  let months = n.getMonth() - b.getMonth();
  let days = n.getDate() - b.getDate();

  if (days < 0) {
    months -= 1;
    // 現在月の 0 日 = 前月末日
    const prevMonthLastDay = new Date(n.getFullYear(), n.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

// 指定年における出生月日。月命日が無い場合は月末にクランプする(2/29 出生 → 平年は 2/28)。
function birthdayInYear(birth: Date, year: number): Date {
  const m = birth.getMonth();
  const d = birth.getDate();
  const candidate = new Date(year, m, d);
  if (candidate.getMonth() !== m) {
    // オーバーフロー(例: 2025/2/29 → 2025/3/1)。月末にクランプ。
    return new Date(year, m + 1, 0);
  }
  return candidate;
}

// 次の誕生日までの「整数日数」と「暦上の月日」をセットで返す。誕生日当日 = すべて 0。
// 表示は「あと N 日 (M か月 D 日)」、1 か月未満なら括弧を省略「あと N 日」、当日は「今日」を想定。
export function nextBirthday(birth: Date, now: Date): {
  totalDays: number;
  months: number;
  days: number;
} {
  const n = startOfDay(now);
  const thisYear = birthdayInYear(birth, n.getFullYear());
  const target = thisYear.getTime() >= n.getTime()
    ? thisYear
    : birthdayInYear(birth, n.getFullYear() + 1);
  const cal = calendarBreakdown(n, target);
  // calendarBreakdown は years も返すが、ターゲットは最大 1 年以内なので months に正規化する。
  return {
    totalDays: totalDays(n, target),
    months: cal.years * 12 + cal.months,
    days: cal.days,
  };
}
