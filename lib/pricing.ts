/**
 * Тарифы и валюты.
 *
 * БАЗОВАЯ ЦЕНА — В ДОЛЛАРАХ. Клиенты у нас не только в РФ: на живом аккаунте
 * Like House валюта GEL, а заявки приходят из 36 стран. Рублёвая база означала
 * бы, что цена для грузинского или казахстанского клиента скачет вместе с
 * курсом рубля, к которому его бизнес отношения не имеет. Остальные валюты
 * пересчитываются от доллара по справочным курсам и округляются до
 * «человеческого» шага; счёт выставляется по курсу на день оплаты (RATE_NOTE).
 *
 * ПОКАЗЫВАЕМ В ВАЛЮТЕ АККАУНТА amoCRM (`GET /api/v4/account` → currency, у нас
 * это `LiveAccount.currency`). Валюты, которой у нас нет в списке, показываем
 * в долларах — это честнее, чем пересчитывать по выдуманному курсу.
 *
 * Годовая цена = 12 месяцев минус 35%.
 */

export type Currency = 'RUB' | 'KZT' | 'GEL' | 'USD' | 'EUR';
export type PlanCode = 'start' | 'pro' | 'developer';
export type Lang = 'ru' | 'en';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  /** Как показывать в суммах, если символ неоднозначен. По умолчанию — символ. */
  shown?: string;
  localeTag: string;
}

export const CURRENCIES: readonly CurrencyInfo[] = [
  { code: 'RUB', symbol: '₽', localeTag: 'ru-RU' },
  { code: 'KZT', symbol: '₸', localeTag: 'kk-KZ' },
  /* Символ лари ₾ во многих шрифтах рисуется так, что читается как ₽ —
     клиент на пилоте так и спросил «почему рубли». Показываем код валюты. */
  { code: 'GEL', symbol: '₾', shown: 'GEL', localeTag: 'ka-GE' },
  { code: 'USD', symbol: '$', localeTag: 'en-US' },
  { code: 'EUR', symbol: '€', localeTag: 'de-DE' },
] as const;

/** Дата, на которую взяты справочные курсы. */
export const RATE_DATE = '26.08.2026';

/** Сколько единиц валюты в одном долларе. Ориентиры, округлённые намеренно. */
export const PER_USD: Record<Currency, number> = {
  USD: 1,
  EUR: 0.9,
  RUB: 90,
  KZT: 500,
  GEL: 2.7,
};

/** Шаг округления цены месяца и года — чтобы в карточке не было «22,11». */
const STEP_MONTH: Record<Currency, number> = { USD: 1, EUR: 1, RUB: 100, KZT: 500, GEL: 5 };
const STEP_YEAR: Record<Currency, number> = { USD: 10, EUR: 10, RUB: 1000, KZT: 5000, GEL: 10 };

/** Базовая цена месяца за аккаунт, $. */
const BASE_USD: Record<PlanCode, number> = { start: 19, pro: 39, developer: 89 };

/** Скидка при оплате за год. */
export const YEAR_DISCOUNT = 0.35;

const roundTo = (value: number, step: number): number => Math.round(value / step) * step;

function convert(usd: number, cur: Currency, step: Record<Currency, number>): number {
  if (cur === 'USD') return roundTo(usd, step.USD);
  return roundTo(usd * PER_USD[cur], step[cur]);
}

function priceRow(usd: number, step: Record<Currency, number>): Record<Currency, number> {
  return {
    USD: convert(usd, 'USD', step),
    EUR: convert(usd, 'EUR', step),
    RUB: convert(usd, 'RUB', step),
    KZT: convert(usd, 'KZT', step),
    GEL: convert(usd, 'GEL', step),
  };
}

export interface Plan {
  code: PlanCode;
  /** Месяц, за аккаунт. */
  price: Record<Currency, number>;
  /** Год целиком, со скидкой YEAR_DISCOUNT. */
  priceYear: Record<Currency, number>;
}

export const PLANS: readonly Plan[] = (['start', 'pro', 'developer'] as const).map((code) => ({
  code,
  price: priceRow(BASE_USD[code], STEP_MONTH),
  priceYear: priceRow(BASE_USD[code] * 12 * (1 - YEAR_DISCOUNT), STEP_YEAR),
}));

/**
 * Валюта показа для аккаунта. Берём валюту аккаунта amoCRM; неизвестную —
 * показываем в долларах, а не подставляем рубли по умолчанию.
 */
export function displayCurrency(accountCurrency: string | null | undefined): Currency {
  const raw = (accountCurrency ?? '').trim();
  if (raw.length === 0) return 'USD';

  const code = raw.toUpperCase();
  if (isCurrency(code)) return code;

  /* amoCRM в REST отдаёт код («GEL»), а демо-выгрузка хранит символ («₾»).
     Понимаем оба, иначе на демо-данных цена молча уезжала бы в доллары. */
  const bySymbol = CURRENCIES.find((c) => c.symbol === raw);
  return bySymbol ? bySymbol.code : 'USD';
}

export function planByCode(code: PlanCode): Plan {
  const plan = PLANS.find((p) => p.code === code);
  if (!plan) throw new Error(`Неизвестный тариф: ${code}`);
  return plan;
}

export function currencyInfo(cur: Currency): CurrencyInfo {
  const info = CURRENCIES.find((c) => c.code === cur);
  if (!info) throw new Error(`Неизвестная валюта: ${cur}`);
  return info;
}

export function isCurrency(value: string): value is Currency {
  return CURRENCIES.some((c) => c.code === value);
}

/**
 * Цена строкой. По-русски символ всегда после числа, по-английски доллар и
 * евро — перед. Пробел неразрывный, чтобы «1 990 ₽» не переносилось.
 */
export function formatPrice(amount: number, cur: Currency, lang: Lang): string {
  const info = currencyInfo(cur);
  const locale = lang === 'ru' ? 'ru-RU' : info.localeTag;
  const num = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount).replace(/ /g, ' ');
  const sign = info.shown ?? info.symbol;
  const prefix = lang === 'en' && (cur === 'USD' || cur === 'EUR');
  return prefix ? `${sign}${num}` : `${num} ${sign}`;
}

/** Курс справочный — счёт по курсу дня оплаты. Показывается рядом с ценами. */
export const RATE_NOTE = {
  ru: `Цена задана в долларах. Курсы справочные, на ${RATE_DATE}: счёт выставляем по курсу на день оплаты.`,
  en: `Prices are set in US dollars. Exchange rates are indicative as of ${RATE_DATE}; the invoice uses the rate on the payment day.`,
} as const;

/** Длина пробного периода, дней. Один источник для лендинга и кабинета. */
export const TRIAL_DAYS = 14;

/** Сколько отчёты работают после окончания оплаты (CLAUDE.md раздел 8). */
export const GRACE_DAYS = 3;

/** Крипта — руками через поддержку, автоматической оплаты нет. */
export const CRYPTO = {
  networks: { ru: 'USDT (TRC-20 и ERC-20), BTC', en: 'USDT (TRC-20 and ERC-20), BTC' },
} as const;

/**
 * Каналы связи. Один список на лендинг, кабинет и виджет, чтобы не разъезжались.
 *
 * НЕЗАПОЛНЕННЫЙ КАНАЛ — ЭТО `null`, А НЕ ПРАВДОПОДОБНЫЙ АДРЕС. Здесь стояли
 * `t.me/klasterdigital` и `wa.me/995000000000` с пометкой «заменить», и кнопки
 * с ними рисовались на витрине и во вкладке «Лицензия» у пилотного клиента как
 * рабочие. Кнопка поддержки, ведущая в никуда, хуже отсутствующей кнопки: она
 * тратит время человека ровно в тот момент, когда у него что-то сломалось.
 *
 * Ставим сюда настоящий адрес — кнопка появляется везде сама. До тех пор
 * помощники возвращают `null`, и компилятор не даёт забыть ни одного места,
 * где канал нужно спрятать.
 */
export const CONTACTS = {
  /* Telegram и WhatsApp — на одном номере поддержки. В Telegram ссылка по
     номеру (`t.me/+<номер>`) открывает переписку так же, как по имени
     пользователя; появится username — сюда же, кнопки не изменятся. */
  telegram: 'https://t.me/+995579151731' as string | null,
  whatsapp: 'https://wa.me/995579151731' as string | null,
  email: 'hello@klastercrm.com',
} as const;

/** Ссылка в Telegram с готовым текстом. `null` — канала пока нет. */
export function telegramLink(text: string): string | null {
  return CONTACTS.telegram === null
    ? null
    : `${CONTACTS.telegram}?text=${encodeURIComponent(text)}`;
}

/** Ссылка в WhatsApp с готовым текстом. `null` — канала пока нет. */
export function whatsappLink(text: string): string | null {
  return CONTACTS.whatsapp === null
    ? null
    : `${CONTACTS.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function mailLink(subject: string, body = ''): string {
  const qs = body
    ? `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : `subject=${encodeURIComponent(subject)}`;
  return `mailto:${CONTACTS.email}?${qs}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * KLASTER AMOBELL — колокол продаж. Решения владельца 01.10.2026 и 02.10.2026.
 *
 * Два плана за аккаунт amoCRM в месяц: «Базовый» $25 и «Про» $50. Периоды —
 * 1, 6 и 12 месяцев. Скидки за срок (02.10.2026):
 *   «Базовый» — полгода −10% ($135), год −20% ($240);
 *   «Про»     — полгода −20% ($240), год −50% ($300).
 * До 02.10.2026 скидки «Базового» стояли нулём, и год «Базового» стоил столько
 * же, сколько год «Про». Менять — только здесь: страница тарифов, лендинг,
 * витрина и счёт читают эти числа.
 *
 * ОКРУГЛЕНИЕ. Не как годовая цена аналитики (сумма периода, округлённая шагом
 * STEP_YEAR), а от уже округлённой цены месяца в этой валюте: месяц × число
 * месяцев × (1 − скидка), шаг STEP_MONTH. Иначе срок мог бы выйти дороже
 * тех же месяцев по отдельности: без скидки полгода «Базового» в рублях стоили
 * бы 14 000 ₽ при 2 300 ₽ за месяц. В долларах оба способа дают ровно цены
 * владельца.
 *
 * Пробный период — общий TRIAL_DAYS; колокол считает триал планом «Про»
 * (ответ лицензии отдаёт полный список возможностей, app/api/v1/license).
 * ═══════════════════════════════════════════════════════════════════════════ */

export type AmobellPlan = 'base' | 'pro';
export type AmobellMonths = 1 | 6 | 12;

export const AMOBELL_PLANS: readonly AmobellPlan[] = ['base', 'pro'] as const;
export const AMOBELL_PERIODS: readonly AmobellMonths[] = [1, 6, 12] as const;

/** Цена месяца за аккаунт, $. */
const AMOBELL_USD: Record<AmobellPlan, number> = { base: 25, pro: 50 };

/** Скидки «Про» за полгода и год. */
export const AMOBELL_PRO_DISCOUNT_6 = 0.2;
export const AMOBELL_PRO_DISCOUNT_12 = 0.5;

/** Скидки «Базового» за полгода и год (решение владельца 02.10.2026). */
export const AMOBELL_BASE_DISCOUNT_6 = 0.1;
export const AMOBELL_BASE_DISCOUNT_12 = 0.2;

const AMOBELL_DISCOUNT: Record<AmobellPlan, Record<AmobellMonths, number>> = {
  base: { 1: 0, 6: AMOBELL_BASE_DISCOUNT_6, 12: AMOBELL_BASE_DISCOUNT_12 },
  pro: { 1: 0, 6: AMOBELL_PRO_DISCOUNT_6, 12: AMOBELL_PRO_DISCOUNT_12 },
};

export const isAmobellPlan = (v: unknown): v is AmobellPlan => v === 'base' || v === 'pro';
export const isAmobellMonths = (v: unknown): v is AmobellMonths => v === 1 || v === 6 || v === 12;

/** Скидка периода долей: 0,2 — это −20%. */
export function amobellDiscount(plan: AmobellPlan, months: AmobellMonths): number {
  return AMOBELL_DISCOUNT[plan][months];
}

/** Цена месяца в валюте, округлённая шагом STEP_MONTH. */
function amobellMonth(plan: AmobellPlan, cur: Currency): number {
  return convert(AMOBELL_USD[plan], cur, STEP_MONTH);
}

/** Сумма за весь период в валюте: столько стоит счёт. */
export function amobellPrice(plan: AmobellPlan, months: AmobellMonths, cur: Currency): number {
  return roundTo(amobellMonth(plan, cur) * months * (1 - amobellDiscount(plan, months)), STEP_MONTH[cur]);
}

/** Сколько выходит в месяц внутри периода — для подписи «≈ $40 в месяц». */
export function amobellPerMonth(plan: AmobellPlan, months: AmobellMonths, cur: Currency): number {
  return amobellPrice(plan, months, cur) / months;
}

/**
 * Что открывает план колокола. Один список на ответ лицензии (поле `features`)
 * и на страницу тарифов: разойтись витрине с тем, что колокол включит, негде.
 *
 * «Про» — это всё из «Базового» плюс своё. Ключи — контракт с колоколом:
 * переименование ключа = выключенная возможность у клиента, который за неё
 * заплатил. Только добавлять.
 */
export const AMOBELL_BASE_FEATURES = [
  'celebrate', // поздравление во вкладках amoCRM
  'tv', // ТВ-экран, один
  'leaders', // лидеры на экране
  'goal', // цель на экране
  'feed', // лента поздравлений
  'screensaver', // заставка
  'qr', // QR: пульт или своя ссылка
  'card_field', // поле сделки на карточке
  'telegram', // поздравление в группу Telegram
] as const;

export const AMOBELL_PRO_ONLY_FEATURES = [
  'screens', // до 10 ТВ-экранов со своими виджетами и воронками
  'contests', // конкурсы
  'plans', // план/факт по менеджеру
  'kpi', // звонки и встречи
  'summaries', // итоги дня, недели, месяца и герой недели
  'achievements', // достижения
  'realtime', // мгновенная доставка
  'whitelabel', // ТВ без логотипа KLASTER
  'tv_offline_alerts', // предупреждение, что ТВ-экран пропал
  'funnel', // «Живая воронка» на ТВ (колокол п. 61)
  'ticker', // бегущая строка событий сделок (п. 61)
  'pulse', // «Пульс дня»: новые заявки по часам (п. 61)
  'records', // «Рекорд!»: рекорды команды и менеджеров (п. 62)
] as const;

export type AmobellFeature = (typeof AMOBELL_BASE_FEATURES)[number] | (typeof AMOBELL_PRO_ONLY_FEATURES)[number];

export const AMOBELL_FEATURES: Record<AmobellPlan, readonly AmobellFeature[]> = {
  base: AMOBELL_BASE_FEATURES,
  pro: [...AMOBELL_BASE_FEATURES, ...AMOBELL_PRO_ONLY_FEATURES],
};

/** Сколько ТВ-экранов открывает план. Одно число на страницу и на колокол. */
export const AMOBELL_SCREENS: Record<AmobellPlan, number> = { base: 1, pro: 10 };
