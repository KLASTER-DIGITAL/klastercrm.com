/**
 * Проверка писем о сроке лицензии: какое событие назревает и что в письме.
 *
 *   pnpm check:notices
 *
 * Ни базы, ни почты, ни сервера: вся логика в `lib/license-notices.ts` чистая,
 * поэтому её прогоняют на вымышленных датах. Иначе проверить предупреждение «за
 * семь суток» можно было бы только в конце декабря — один раз, вживую, на
 * клиенте.
 *
 * Запускается через tsx (он уже в зависимостях сайта): проверялка импортирует
 * тот же код, который работает на проде, а не его пересказ.
 */

import { dueNotice, formatDate, type NoticeKind } from '../../lib/license-notices';
import { clientNotice, ownerNotice, graceDaysFor, type NoticeContext } from '../../lib/license-notice-mail';
import { GRACE_DAYS } from '../../lib/pricing';

let failed = 0;
let passed = 0;

function ok(condition: boolean, title: string, detail = ''): void {
  if (condition) {
    passed += 1;
    console.info(`  ✓ ${title}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${title}${detail === '' ? '' : ` — ${detail}`}`);
  }
}

function eq<T>(actual: T, expected: T, title: string): void {
  ok(actual === expected, title, `получено ${JSON.stringify(actual)}, ждали ${JSON.stringify(expected)}`);
}

const DAY = 86_400_000;
/** Срок: 31.12.2026, 23:59:59 по Тбилиси (+04) — как у Like House. */
const UNTIL = new Date('2026-12-31T19:59:59.000Z');
/** Проход идёт в 06:00 UTC — так стоит крон. */
const at = (iso: string): Date => new Date(`${iso}T06:00:00.000Z`);
const none = new Set<NoticeKind>();

console.info('\n— что назревает в каждый день —');
{
  eq(dueNotice({ now: at('2026-12-20'), until: UNTIL, graceDays: 3, done: none }).send, null, 'за 11 суток — ничего');
  eq(dueNotice({ now: at('2026-12-24'), until: UNTIL, graceDays: 3, done: none }).send, 'd7', 'за 7 суток — d7');
  eq(dueNotice({ now: at('2026-12-28'), until: UNTIL, graceDays: 3, done: new Set<NoticeKind>(['d7']) }).send, 'd3', 'за 3 суток — d3');
  eq(
    dueNotice({ now: at('2026-12-30'), until: UNTIL, graceDays: 3, done: new Set<NoticeKind>(['d7', 'd3']) }).send,
    'd1',
    'за сутки — d1',
  );
  eq(
    dueNotice({ now: at('2026-12-31'), until: UNTIL, graceDays: 3, done: new Set<NoticeKind>(['d7', 'd3']) }).send,
    'd1',
    'последний день (срок ещё не вышел) — всё ещё d1',
  );
  eq(
    dueNotice({ now: at('2027-01-01'), until: UNTIL, graceDays: 3, done: new Set<NoticeKind>(['d7', 'd3', 'd1']) }).send,
    'expired',
    'на следующий день — expired',
  );
  eq(
    dueNotice({
      now: at('2027-01-04'),
      until: UNTIL,
      graceDays: 3,
      done: new Set<NoticeKind>(['d7', 'd3', 'd1', 'expired']),
    }).send,
    'stopped',
    'после отсрочки — stopped',
  );
}

console.info('\n— одно письмо на событие —');
{
  const done = new Set<NoticeKind>(['d7']);
  eq(dueNotice({ now: at('2026-12-24'), until: UNTIL, graceDays: 3, done }).send, null, 'повторный прогон в тот же день молчит');
  eq(dueNotice({ now: at('2026-12-26'), until: UNTIL, graceDays: 3, done }).send, null, 'и на следующий день тоже');
}

console.info('\n— пропущенный проход не присылает вчерашнее —');
{
  /* Крон не сработал с 24 по 29 декабря: d7 так и не ушёл. Правильное поведение —
     отправить d3 (самое срочное из назревших), а d7 закрыть без письма. */
  const decision = dueNotice({ now: at('2026-12-29'), until: UNTIL, graceDays: 3, done: none });
  eq(decision.send, 'd3', 'после пропуска уходит самое срочное');
  eq(decision.skip.join(','), 'd7', 'запоздавшее d7 закрыто без письма');

  const late = dueNotice({ now: at('2027-01-10'), until: UNTIL, graceDays: 3, done: none });
  eq(late.send, 'stopped', 'если молчали всё время — уходит только «остановлен»');
  eq(late.skip.join(','), 'd7,d3,d1,expired', 'остальные четыре закрыты без письма');
}

console.info('\n— продление начинает новую серию —');
{
  /* Отметки лежат на СТАРОМ сроке, у нового срока свой набор (в базе это
     period_end в первичном ключе). Логика обязана снова предупредить. */
  const extended = new Date('2027-06-30T19:59:59.000Z');
  eq(
    dueNotice({ now: at('2027-06-24'), until: extended, graceDays: 3, done: none }).send,
    'd7',
    'после продления предупреждение приходит снова',
  );
}

console.info('\n— пробный период: отсрочки нет —');
{
  eq(graceDaysFor('trialing'), 0, 'у пробного периода отсрочка 0 суток');
  eq(graceDaysFor('active'), GRACE_DAYS, 'у оплаченной лицензии отсрочка из pricing.ts');
  const trialEnd = new Date('2026-11-20T19:59:59.000Z');
  eq(
    dueNotice({ now: at('2026-11-21'), until: trialEnd, graceDays: 0, done: new Set<NoticeKind>(['d7', 'd3', 'd1', 'expired']) })
      .send,
    'stopped',
    'после пробного периода сразу «остановлен», без отсрочки',
  );
}

console.info('\n— дата в письме —');
{
  eq(formatDate(UNTIL, 'ru', 'Asia/Tbilisi'), '31 декабря 2026', 'по-русски, в таймзоне клиента');
  eq(formatDate(UNTIL, 'ru', 'UTC'), '31 декабря 2026', 'в UTC тот же день');
  eq(formatDate(UNTIL, 'en', 'UTC'), 'December 31, 2026', 'по-английски');
  eq(formatDate(new Date('2026-01-01T19:59:59.000Z'), 'ru', 'UTC'), '1 января 2026', 'январь и единица без «1-ое»');
}

/* ── тексты писем ─────────────────────────────────────────────────────────── */

const ctx: NoticeContext = {
  product: 'klaster_distribution',
  until: UNTIL,
  graceUntil: new Date(UNTIL.getTime() + GRACE_DAYS * DAY),
  daysLeft: 7,
  timeZone: 'Asia/Tbilisi',
  accountId: 28_524_184,
  accountTitle: 'likehousege.amocrm.ru',
  orgName: 'Like House',
  plan: 'half_year',
  status: 'active',
};

/** Фразы, которые владелец запретил в клиентских текстах (решение 03.11.2026). */
const BANNED = [
  'не гарантируем',
  'мы не проверяли',
  'не отвечает за',
  'честные цены',
  'мы не платим',
  'мы заботимся',
  'решение',
  'платформа',
  'экосистема',
  'ключевой',
  'комплексный',
];

console.info('\n— письмо клиенту —');
{
  const d7 = clientNotice('d7', ctx, 'ru');
  ok(d7.subject.includes('31 декабря'), 'в теме названа дата', d7.subject);
  ok(d7.subject.includes('Распределение KLASTER'), 'в теме назван продукт', d7.subject);
  ok(d7.text.startsWith('Здравствуйте!'), 'начинается приветствием', d7.text.slice(0, 20));
  ok(d7.text.includes('Осталось 7 дней'), 'дни с правильным словом', d7.text);
  ok(d7.text.includes('С уважением'), 'подпись на месте');
  ok(d7.text.includes('Хорошего дня'), 'пожелание на месте');
  for (const phrase of BANNED) {
    ok(!d7.text.toLowerCase().includes(phrase), `нет запрещённой фразы «${phrase}»`);
  }
  ok(d7.html.includes('Продлить подписку'), 'кнопка называет действие');
  ok(d7.html.includes('klastercrm.com/cabinet'), 'кнопка ведёт в кабинет');

  const d1 = clientNotice('d1', ctx, 'ru');
  ok(d1.text.includes('заканчивается завтра'), 'за сутки — «завтра», а не «осталось 1 день»', d1.text);

  const expired = clientNotice('expired', { ...ctx, daysLeft: -1 }, 'ru');
  ok(expired.text.includes('работает ещё 3 дня, до 3 января 2027'), 'называет, сколько ещё работает и до какого числа', expired.text);

  const stopped = clientNotice('stopped', { ...ctx, daysLeft: -4 }, 'ru');
  ok(stopped.text.includes('остаются на том, кто их создал'), 'говорит, что именно не работает', stopped.text);
  ok(stopped.text.includes('Настройки и журнал на месте'), 'успокаивает про настройки', stopped.text);
  /* Письмо об остановке пишется в настоящем времени: виджет уже стоит, и
     «перестанут расходиться» в нём было бы неправдой. */
  ok(!stopped.text.includes('перестанут'), 'без будущего времени — виджет уже остановлен', stopped.text);
  for (const phrase of BANNED) {
    ok(!stopped.text.toLowerCase().includes(phrase), `в письме об остановке нет «${phrase}»`);
  }

  /* Последствие называется словами продукта: одинаковый текст для всех трёх
     виджетов означал бы «подписка кончилась» и ничего больше. */
  const bell = clientNotice('stopped', { ...ctx, product: 'klaster_amobell' }, 'ru');
  ok(bell.text.includes('Поздравления с продажами'), 'у колокола своё последствие', bell.text);
  const analytics = clientNotice('stopped', { ...ctx, product: 'klaster_analytics' }, 'ru');
  ok(analytics.text.includes('Отчёты закрыты'), 'у аналитики своё последствие', analytics.text);

  /* «Вы» с большой буквы — правило владельца для писем клиентам (05.11.2026).
     Проверяем на всех письмах сразу: строчное «вы» в обращении не должно
     проскочить ни в одном. */
  ok(analytics.text.includes('Вы увидите'), 'обращение на «Вы» с большой буквы', analytics.text);
  for (const [kind, product] of [
    ['d7', 'klaster_distribution'],
    ['expired', 'klaster_analytics'],
    ['stopped', 'klaster_amobell'],
  ] as const) {
    const letter = clientNotice(kind, { ...ctx, product }, 'ru');
    ok(
      !/\b(вы|вас|вам|ваш|ваши|вашего)\b/u.test(letter.text),
      `в письме ${kind}/${product} нет строчного обращения`,
      letter.text,
    );
  }

  /* Пробный период — не подписка: человек за него не платил, и род у слова
     другой. «Пробный период закончилась» мы однажды уже написали. */
  const trial = clientNotice('expired', { ...ctx, status: 'trialing', graceUntil: UNTIL, daysLeft: -1 }, 'ru');
  ok(trial.text.includes('Пробный период «Распределение KLASTER» закончился'), 'пробный период назван своим словом', trial.text);
  ok(!trial.text.includes('Подписка'), 'в письме о пробном периоде нет слова «подписка»', trial.text);
  const trialSoon = clientNotice('d3', { ...ctx, status: 'trialing', daysLeft: 3 }, 'ru');
  ok(trialSoon.subject.includes('Пробный период'), 'и в теме тоже', trialSoon.subject);

  /* Подпись — две строки, без тире между ними: «С уважением, — команда» читается
     как опечатка. */
  ok(d7.text.includes('С уважением,\nкоманда KLASTER'), 'подпись в две строки, без лишнего тире');

  /* Темы писем за семь и за трое суток обязаны различаться, иначе почтовик
     склеит их в одну ветку и второе прочтут как копию первого. */
  const d3 = clientNotice('d3', { ...ctx, daysLeft: 3 }, 'ru');
  ok(d7.subject !== d3.subject, 'темы за 7 и за 3 суток разные', `${d7.subject} / ${d3.subject}`);
  ok(d3.subject.includes('через 3 дня'), 'в теме за трое суток назван срок', d3.subject);

  const en = clientNotice('d7', ctx, 'en');
  ok(en.text.startsWith('Hello!'), 'английское письмо тоже собирается', en.text.slice(0, 20));
}

console.info('\n— служебное письмо владельцу —');
{
  const letter = ownerNotice('d7', ctx, ['likehouse@klastercrm.com']);
  ok(letter.subject.includes('likehousege.amocrm.ru'), 'в теме видно, о каком аккаунте речь', letter.subject);
  ok(letter.subject.includes('осталось 7 суток'), 'в теме видно, что за событие', letter.subject);
  ok(letter.text.includes('28524184'), 'в тексте номер аккаунта');
  ok(letter.text.includes('Like House'), 'в тексте плательщик');
  ok(letter.text.includes('Клиенту письмо отправлено: likehouse@klastercrm.com'), 'видно, что клиент предупреждён');

  const silent = ownerNotice('d7', ctx, []);
  ok(silent.text.includes('НЕ отправлено'), 'видно, когда клиенту писать было некому', silent.text);

  /* Название аккаунта приходит из базы: перевод строки в нём не должен попасть
     в тему письма. */
  const dirty = ownerNotice('d7', { ...ctx, accountTitle: 'likehouse\r\nBcc: someone@evil.test', orgName: 'Like\nHouse' }, []);
  ok(!dirty.subject.includes('\n') && !dirty.subject.includes('\r'), 'тема письма в одну строку', JSON.stringify(dirty.subject));
  ok(dirty.subject.includes('likehouse Bcc: someone@evil.test'), 'перевод строки заменён пробелом, текст не потерян', dirty.subject);
  ok(dirty.text.includes('Плательщик: Like House'), 'и в плательщике тоже', dirty.text);

  const forgotten = ownerNotice('no_license', { ...ctx, status: 'Проверок за сутки: 72' }, []);
  ok(forgotten.subject.includes('без лицензии'), 'забытая лицензия видна в теме', forgotten.subject);
  ok(forgotten.text.includes('scripts/db.mjs grant'), 'письмо подсказывает команду выдачи ключа');
  ok(forgotten.text.includes('--account 28524184'), 'и подставляет в неё аккаунт');
  /* Продукт в журнале проверок ключа не записан, и называть его наугад нельзя:
     по такому письму пошли бы искать не тот виджет. */
  ok(!forgotten.subject.includes('Распределение'), 'продукт в теме не выдуман', forgotten.subject);
  ok(forgotten.text.includes('--product <продукт>'), 'в команде продукт оставлен на подстановку');
  ok(forgotten.text.includes('license_checks_web'), 'сказано, где посмотреть, какой это виджет');
}

console.info(`\nпроверок: ${String(passed + failed)}, не прошло: ${String(failed)}`);

/* `--print` печатает письма целиком. Проверки стерегут отдельные слова, но
   прочитать письмо глазами перед отправкой клиенту они не заменяют. */
if (process.argv.includes('--print')) {
  const line = '─'.repeat(72);
  for (const [kind, days] of [['d7', 7], ['d3', 3], ['d1', 1], ['expired', -1], ['stopped', -4]] as const) {
    const letter = clientNotice(kind, { ...ctx, daysLeft: days }, 'ru');
    console.info(`\n${'═'.repeat(72)}\nКЛИЕНТУ · ${kind}\nТема: ${letter.subject}\n${line}\n${letter.text}`);
  }
  const owner = ownerNotice('d7', ctx, ['likehouse@klastercrm.com']);
  console.info(`\n${'═'.repeat(72)}\nВЛАДЕЛЬЦУ · d7\nТема: ${owner.subject}\n${line}\n${owner.text}`);
  const forgotten = ownerNotice('no_license', { ...ctx, status: 'проверок за сутки: 72' }, []);
  console.info(`\n${'═'.repeat(72)}\nВЛАДЕЛЬЦУ · забытая лицензия\nТема: ${forgotten.subject}\n${line}\n${forgotten.text}`);
}

if (failed > 0) process.exit(1);
console.info('Всё в порядке.\n');
