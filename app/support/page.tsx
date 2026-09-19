import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { COMPANY, PILOT, WIDGET } from '@/lib/company';
import { CONTACTS, mailLink, telegramLink, whatsappLink } from '@/lib/pricing';
import { count, fmt, tr, word, type Bi, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * На этот адрес ссылается widget/manifest.json — его открывает и клиент из
 * виджета, и модератор amoCRM. Поэтому страница держится одного правила:
 * ни одного канала, который не отвечает, и ни одной обещанной скорости
 * ответа, которую мы не выдерживаем.
 *
 * Каналы берутся из lib/pricing и фильтруются по наличию адреса: помощники
 * возвращают null, и карточки без адреса не рисуются. Впишут адрес в CONTACTS —
 * карточки вернутся сами.
 *
 * Тон — docs/07-тон-текстов.md: обещание глаголом, шаги с «Результат:»,
 * кнопка «Написать» повторяется по странице.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Поддержка KLASTER',
    description:
      'Пишите в Telegram, WhatsApp или на почту — отвечает инженер, который писал расчёт. Что приложить к обращению, что делать с пустым экраном виджета и с отозванным доступом.',
  },
  en: {
    title: 'KLASTER support',
    description:
      'Write on Telegram, WhatsApp or by email — the engineer who wrote the calculation answers. What to attach, what to do if the widget opens empty or amoCRM access has been revoked.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

const MINUTES: Bi<readonly string[]> = { ru: ['минуту', 'минуты', 'минут'], en: ['minute', 'minutes'] };
const TRANSITIONS: Bi<readonly string[]> = { ru: ['переход', 'перехода', 'переходов'], en: ['transition', 'transitions'] };

/** Шаблон обращения. Один текст на все каналы — иначе они разъезжаются. */
const TEMPLATE: Bi = {
  ru: [
    `Здравствуйте! Вопрос по виджету «Аналитика KLASTER», версия ${WIDGET.version}.`,
    '',
    'Поддомен amoCRM: ',
    'Вкладка виджета: ',
    'Период и фильтры: ',
    'Что ожидали увидеть: ',
    'Что увидели вместо этого: ',
  ].join('\n'),
  en: [
    `Hello! A question about the KLASTER Analytics widget, version ${WIDGET.version}.`,
    '',
    'amoCRM subdomain: ',
    'Widget tab: ',
    'Period and filters: ',
    'What I expected to see: ',
    'What I saw instead: ',
  ].join('\n'),
};

const SUBJECT: Bi = {
  ru: `Поддержка KLASTER · виджет ${WIDGET.version}`,
  en: `KLASTER support · widget ${WIDGET.version}`,
};

const BILLING_SUBJECT: Bi = {
  ru: `Счёт и лицензия · ${COMPANY.name}`,
  en: `Invoice and licence · ${COMPANY.name}`,
};

interface Channel {
  name: string;
  href: string;
  who: string;
  hint: string;
}

const CHANNEL_TEXT = {
  mail: { ru: 'Почта', en: 'Email' },
  telegramHint: {
    ru: 'Быстрее всего. Скриншот вставляется прямо в диалог.',
    en: 'Fastest. A screenshot goes straight into the chat.',
  },
  whatsappHint: {
    ru: 'Тот же номер, если Telegram у вас не в ходу. Отвечаем в тот же диалог.',
    en: 'The same number if you do not use Telegram. We reply in the same chat.',
  },
  mailHint: {
    ru: 'Сюда же — счета, ключ лицензии и закрывающие.',
    en: 'Also for invoices, licence keys and closing documents.',
  },
};

/* Канал без адреса — это кнопка в никуда, а она тратит время человека ровно
   тогда, когда у него что-то сломалось. Поэтому список фильтруется по href, а
   не обрастает условиями в разметке. Ссылки зависят от языка шаблона, поэтому
   список собирается под язык. */
function channels(lang: Lang): Channel[] {
  const t = tr(lang);
  const template = t(TEMPLATE);
  const maybe: { name: string; href: string | null; who: string | null; hint: string }[] = [
    {
      name: 'Telegram',
      href: telegramLink(template),
      who: CONTACTS.telegram?.replace('https://', '') ?? null,
      hint: t(CHANNEL_TEXT.telegramHint),
    },
    {
      name: 'WhatsApp',
      href: whatsappLink(template),
      who: CONTACTS.whatsapp?.replace('https://', '') ?? null,
      hint: t(CHANNEL_TEXT.whatsappHint),
    },
    {
      name: t(CHANNEL_TEXT.mail),
      href: mailLink(t(SUBJECT), template),
      who: CONTACTS.email,
      hint: t(CHANNEL_TEXT.mailHint),
    },
  ];
  return maybe.filter((c): c is Channel => c.href !== null && c.who !== null);
}

/**
 * Поля, которые ссылка вписывает в письмо сама. Список обязан совпадать с
 * TEMPLATE: разъедется — человек начнёт искать в письме поле, которого там нет.
 */
const PREFILLED: readonly Bi[] = [
  { ru: 'Тема письма с версией виджета', en: 'Subject line with the widget version' },
  { ru: 'Поддомен amoCRM', en: 'amoCRM subdomain' },
  { ru: 'Вкладка виджета', en: 'Widget tab' },
  { ru: 'Период и фильтры', en: 'Period and filters' },
  { ru: 'Что ожидали и что увидели', en: 'What you expected and what you saw' },
];

/** Что приложить. Список короткий намеренно: длинный никто не заполняет. */
const ATTACH: readonly { title: Bi; text: Bi }[] = [
  {
    title: { ru: 'Поддомен вашей amoCRM', en: 'Your amoCRM subdomain' },
    text: {
      ru: 'Первая часть адреса до .amocrm.ru. По нему мы находим аккаунт: искать по названию компании не можем — названий у нас в базе нет.',
      en: 'The first part of the address before .amocrm.ru. It is how we find the account: we cannot search by company name because we do not store names.',
    },
  },
  {
    title: { ru: 'Вкладка виджета', en: 'Widget tab' },
    text: {
      ru: 'Воронка, Менеджеры, Качество данных, Путь заявки — где именно видна проблема.',
      en: 'Funnel, Managers, Data quality, Lead path — where exactly the problem shows.',
    },
  },
  {
    title: { ru: 'Период и фильтры', en: 'Period and filters' },
    text: {
      ru: 'Даты, воронка, менеджер, разрез по полю. Без них цифра не воспроизводится, и разбор растягивается на день переписки.',
      en: 'Dates, pipeline, manager, field breakdown. Without them the number cannot be reproduced and the review turns into a day of back-and-forth.',
    },
  },
  {
    title: { ru: 'Что вы ожидали увидеть', en: 'What you expected to see' },
    text: {
      ru: 'И что увидели вместо этого. Расхождение с конкретным числом разбирается за один заход, «всё считает неправильно» — не разбирается вовсе.',
      en: 'And what you saw instead. A mismatch with a specific number is resolved in one pass; “everything is calculated wrong” cannot be resolved at all.',
    },
  },
  {
    title: { ru: 'Скриншот, если он есть', en: 'A screenshot, if you have one' },
    text: {
      ru: 'Экран виджета целиком, вместе со строкой фильтров. Персональные данные закрывать не нужно — на наших экранах их нет.',
      en: 'The whole widget screen, including the filter bar. No need to mask personal data — our screens do not show any.',
    },
  },
];

const T = {
  h1: {
    ru: 'Ответим по будням и разберём цифру по вашим данным',
    en: 'We reply on weekdays and check the number against your own data',
  },
  lead: {
    ru: 'Первой линии, тикет-системы и робота-приёмщика нет: обращение читает инженер, который писал этот расчёт. Ссылки ниже открывают готовое письмо — версия виджета и поля для разбора уже внутри.',
    en: 'No first line, no ticket system, no intake bot: your request is read by the engineer who wrote the calculation. The links below open a ready-made message — the widget version and the fields we need are already in it.',
  },
  write: { ru: 'Написать', en: 'Write' },
  widget: { ru: 'виджет', en: 'widget' },
  hours: {
    ru: 'Рабочие часы, будни. Ночью и в выходные ответа может не быть.',
    en: 'Business hours, weekdays. There may be no reply at night or at weekends.',
  },
  whereH2: { ru: 'Куда писать', en: 'Where to write' },
  introMany: {
    ru: 'Куда бы вы ни написали, обращение попадает к одним и тем же людям. В мессенджере быстрее: туда влезает скриншот.',
    en: 'Whichever channel you choose, the request reaches the same people. A messenger is faster: a screenshot fits there.',
  },
  introOne: {
    ru: 'Ссылка открывает готовый шаблон — его достаточно дозаполнить.',
    en: 'The link opens a ready-made template — just fill in the blanks.',
  },
  attachH2: { ru: 'Что приложить к обращению', en: 'What to attach to a request' },
  attachP: {
    ru: 'Мы не храним ни имён, ни телефонов, ни текстов: найти вашу сделку по фамилии клиента не можем и вашего экрана не видим. Письмо открывается с темой, версией виджета и пустыми полями под этот список — остаётся вписать значения и приложить скриншот.',
    en: 'We store no names, phone numbers or text: we cannot find your deal by a client’s surname and cannot see your screen. The message opens with the subject, the widget version and empty fields for this list — you fill in the values and attach a screenshot.',
  },
  prefilledH3: { ru: 'Что уже в письме', en: 'What the message already contains' },
  whenH2: { ru: 'Когда мы отвечаем', en: 'When we reply' },
  whenP1: {
    ru: 'Времени реакции в часах не обещаем. Отвечаем в рабочие часы по будням, обычно в тот же рабочий день. Если нужен разбор данных вашего аккаунта, сначала приходит подтверждение, что обращение взяли, потом разбор.',
    en: 'We do not promise a response time in hours. We reply during business hours on weekdays, usually the same business day. If the question needs a review of your account data, you first get a confirmation that the request is taken, then the review.',
  },
  whenP2: {
    ru: 'Приоритетная поддержка входит в тариф «Девелопер». На остальных тарифах очередь общая: отдельной линии, которая молчит быстрее, мы не держим.',
    en: 'Priority support is included in the Developer plan. Other plans share one queue: we do not run a separate line that stays silent faster.',
  },
  emptyH2: { ru: 'Виджет открылся пустым', en: 'The widget opened empty' },
  emptyP: {
    ru: 'Три причины. Первые две вы закрываете без нас, третья — одним письмом.',
    en: 'Three causes. You close the first two without us; the third takes one message.',
  },
  resultLabel: { ru: 'Результат:', en: 'Result:' },
  cacheH3: { ru: 'Закэшировался старый код', en: 'Old code is cached' },
  cacheP: {
    ru: 'amoCRM кэширует файлы виджета. Обновите страницу с очисткой кэша: Cmd+Shift+R на macOS, Ctrl+F5 на Windows.',
    en: 'amoCRM caches widget files. Reload the page bypassing the cache: Cmd+Shift+R on macOS, Ctrl+F5 on Windows.',
  },
  cacheR: {
    ru: 'экран собирается заново на свежих файлах виджета',
    en: 'the screen is rebuilt from the current widget files',
  },
  loadingH3: { ru: 'Первая загрузка ещё идёт', en: 'The first load is still running' },
  loadingP: {
    ru: (years: number, first: string, every: string) =>
      `Сразу после подключения истории в базе ещё нет. На аккаунте с ${years}-летней историей полная загрузка заняла ${first} — это замер, а не расчёт. Дальше данные обновляются каждые ${every}.`,
    en: (years: number, first: string, every: string) =>
      `Right after connection there is no history in the database yet. On an account with ${years} years of history the full load took ${first} — a measurement, not an estimate. After that the data refreshes every ${every}.`,
  },
  loadingR: {
    ru: 'история поднимается целиком, и дальше отчёты идут по свежим данным',
    en: 'the whole history is loaded, and from then on reports run on fresh data',
  },
  loadingSource: {
    ru: (who: string, deals: string, trans: string) => `${who} · ${deals} сделок, ${trans} · замер ${PILOT.measuredAt} · ${PILOT.source}`,
    en: (who: string, deals: string, trans: string) => `${who} · ${deals} deals, ${trans} · measured ${PILOT.measuredAt} · ${PILOT.source}`,
  },
  revokedH3: { ru: 'Доступ отозван', en: 'Access has been revoked' },
  revokedP: {
    ru: 'Администратор мог отозвать доступ в разделе «Выданные доступы», или он слетел при смене секретного ключа интеграции. Лечится повторным подключением по OAuth — виджет попросит об этом сам.',
    en: 'An administrator may have revoked access under “Granted access”, or it was lost when the integration secret was rotated. The fix is to reconnect via OAuth — the widget will ask for it.',
  },
  revokedR: {
    ru: 'доступ восстановлен, накопленная история не теряется',
    en: 'access is restored and the accumulated history is not lost',
  },
  installLink: { ru: 'Как подключить и переподключить виджет', en: 'How to connect and reconnect the widget' },
  installP: {
    ru: ' — там же список прав, которые мы запрашиваем, и что делать администратору.',
    en: ' — with the list of permissions we request and what the administrator needs to do.',
  },
  keyH2: { ru: 'Ключ и оплата', en: 'Key and payment' },
  keyP1: {
    ru: 'Ключ лицензии привязан к аккаунту amoCRM, а не к пользователю: в другом аккаунте он не сработает. Автоматической оплаты картой пока нет — ключ выдаём вручную, счёт выставляем на юрлицо. Что происходит после окончания оплаты и почему история не пропадает —',
    en: 'The licence key is tied to the amoCRM account, not to a user: it will not work in another account. There is no automatic card payment yet — we issue the key manually and invoice your company. What happens when the paid period ends and why history is not lost —',
  },
  keyLink: { ru: 'на странице тарифов', en: 'on the pricing page' },
  keyP2: {
    ru: 'Вопросы по счёту, закрывающим и продлению — на',
    en: 'Questions about invoices, closing documents and renewals — at',
  },
  pricing: { ru: 'Тарифы и лимиты', en: 'Plans and limits' },
  contacts: { ru: 'Контакты и порядок счёта', en: 'Contacts and invoicing' },
  beforeH2: { ru: 'Прежде чем писать', en: 'Before you write' },
  beforeP: {
    ru: 'Часть вопросов уже разобрана письменно, и в тексте ответ подробнее, чем получится в диалоге.',
    en: 'Some questions are already answered in writing, and the written answer is more detailed than a chat can be.',
  },
  docsH3: { ru: 'Документация', en: 'Documentation' },
  docsP: {
    ru: 'Быстрый старт, разметка этапов, метрики и формулы, качество данных.',
    en: 'Quick start, stage markup, metrics and formulas, data quality.',
  },
  faqH3: { ru: 'Частые вопросы', en: 'FAQ' },
  faqP: {
    ru: 'Что мы видим в вашей CRM, можем ли что-то испортить, увидит ли менеджер чужие сделки.',
    en: 'What we see in your CRM, whether we can break anything, whether a manager can see other people’s deals.',
  },
  methodH3: { ru: 'Как мы считаем', en: 'How we count' },
  methodP: {
    ru: 'Если цифра не сходится с ожиданием, ответ чаще всего здесь: медиана вместо среднего, порог по числу сделок, отказ строить разрез на пустом поле.',
    en: 'If a number does not match your expectation, the answer is usually here: median instead of mean, a threshold on deal count, refusing to build a breakdown on an empty field.',
  },
  open: { ru: 'Открыть', en: 'Open' },
  bugH2: { ru: 'Нашли ошибку в цифрах — напишите первым делом', en: 'Found an error in the numbers — write to us first thing' },
  bugP1: {
    ru: 'Это самое ценное обращение. Пришлите поддомен, вкладку, период и число, которое считаете неверным: поднимем расчёт по вашим данным и ответим, ошибка это или разница в определении метрики. Если ошибка наша — скажем прямо и напишем, что починили.',
    en: 'This is the most valuable request. Send the subdomain, tab, period and the number you believe is wrong: we rerun the calculation on your data and tell you whether it is an error or a difference in metric definition. If the error is ours, we say so and report what we fixed.',
  },
  bugP2: {
    ru: 'Разбор ошибки в собственной эвристике мы уже публиковали: она объявила парковкой этап, откуда сделки уходят в деньги.',
    en: 'We have already published a review of an error in our own heuristic: it marked a stage that closes deals into revenue as a parking stage.',
  },
  bugLink: { ru: 'Как это вышло и что мы сделали', en: 'How it happened and what we did' },
};

export default async function SupportPage() {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);
  const list = channels(lang);

  /* Колонок ровно столько, сколько каналов: одинокая карточка в сетке на три
     уезжает в треть ширины и читается как обрубок. Текст над карточками тоже
     считает каналы: «куда бы вы ни написали» над одной обещает выбор, которого
     на экране нет. */
  const many = list.length > 1;
  const grid = `site-grid${many ? ` site-grid--${list.length}` : ''}`;
  const first = list[0];

  const transitions = `${n.format(PILOT.transitions)} ${word(lang, PILOT.transitions, TRANSITIONS)}`;

  return (
    <SiteShell active="/support">
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">{t(T.lead)}</p>

      {first && (
        <div className="site-actions">
          <a className="btn" href={first.href}>
            {t(T.write)}
          </a>
          <Link className="btn btn--ghost" href="/widgets/analytics/docs">
            {t(T.docsH3)}
          </Link>
        </div>
      )}

      <div className="site-status">
        <Mark kind="live">
          {t(T.widget)} {WIDGET.version}
        </Mark>
        <span>{t(T.hours)}</span>
      </div>

      <h2 className="site-h2">{t(T.whereH2)}</h2>
      <p className="site-p">{t(many ? T.introMany : T.introOne)}</p>
      <div className={grid}>
        {list.map((c) => (
          <div className="site-card" key={c.name}>
            <h3 className="site-h3">{c.name}</h3>
            <p className="site-p">{c.hint}</p>
            <p style={{ marginTop: 14 }}>
              <a className="btn btn--sm" href={c.href}>
                {t(T.write)}
              </a>
            </p>
            <Source>{c.who}</Source>
          </div>
        ))}
      </div>

      <h2 className="site-h2">{t(T.attachH2)}</h2>
      <p className="site-p">{t(T.attachP)}</p>
      {/* Список полей и шаблон письма обязаны совпадать: расходятся — человек
          ищет в письме поле, которого там нет. */}
      <div className="site-card" style={{ marginTop: 20 }}>
        <h3 className="site-h3">{t(T.prefilledH3)}</h3>
        <ul className="ticks ticks--yes" style={{ marginTop: 12 }}>
          {PREFILLED.map((p) => (
            <li key={p.ru}>{t(p)}</li>
          ))}
        </ul>
      </div>
      <div className="site-grid site-grid--2">
        {ATTACH.map((a) => (
          <div className="site-card" key={a.title.ru}>
            <h3 className="site-h3">{t(a.title)}</h3>
            <p className="site-p">{t(a.text)}</p>
          </div>
        ))}
      </div>

      <h2 className="site-h2">{t(T.whenH2)}</h2>
      <p className="site-p">{t(T.whenP1)}</p>
      <p className="site-p">{t(T.whenP2)}</p>

      <h2 className="site-h2">{t(T.emptyH2)}</h2>
      <p className="site-p">{t(T.emptyP)}</p>
      <div className="site-rules">
        <section className="site-card site-rule">
          <div className="site-rule__n num">1</div>
          <div className="site-rule__body">
            <h3 className="site-h3">{t(T.cacheH3)}</h3>
            <p className="site-p">{t(T.cacheP)}</p>
            <p className="site-rule__where">
              <b>{t(T.resultLabel)}</b> {t(T.cacheR)}
            </p>
          </div>
        </section>
        <section className="site-card site-rule">
          <div className="site-rule__n num">2</div>
          <div className="site-rule__body">
            <h3 className="site-h3">{t(T.loadingH3)}</h3>
            <p className="site-p">
              {t(T.loadingP)(
                PILOT.historyYears,
                count(lang, PILOT.firstLoadMinutes, MINUTES),
                count(lang, PILOT.syncEveryMinutes, MINUTES),
              )}
            </p>
            <Source>{t(T.loadingSource)(t(PILOT.who), n.format(PILOT.leads), transitions)}</Source>
            <p className="site-rule__where">
              <b>{t(T.resultLabel)}</b> {t(T.loadingR)}
            </p>
          </div>
        </section>
        <section className="site-card site-rule">
          <div className="site-rule__n num">3</div>
          <div className="site-rule__body">
            <h3 className="site-h3">{t(T.revokedH3)}</h3>
            <p className="site-p">{t(T.revokedP)}</p>
            <p className="site-rule__where">
              <b>{t(T.resultLabel)}</b> {t(T.revokedR)}
            </p>
          </div>
        </section>
      </div>
      <p className="site-p" style={{ marginTop: 20 }}>
        <Link href="/widgets/analytics/install">{t(T.installLink)}</Link>
        {t(T.installP)}
      </p>
      {first && (
        <div className="site-actions">
          <a className="btn" href={first.href}>
            {t(T.write)}
          </a>
        </div>
      )}

      <h2 className="site-h2">{t(T.keyH2)}</h2>
      <p className="site-p">
        {t(T.keyP1)} <Link href="/widgets/analytics/pricing">{t(T.keyLink)}</Link>.
      </p>
      <p className="site-p">
        {t(T.keyP2)} <a href={mailLink(t(BILLING_SUBJECT))}>{CONTACTS.email}</a>.
      </p>
      <div className="site-actions">
        <Link className="btn btn--ghost" href="/widgets/analytics/pricing">
          {t(T.pricing)}
        </Link>
        <Link className="btn btn--ghost" href="/company/contacts">
          {t(T.contacts)}
        </Link>
      </div>

      <h2 className="site-h2">{t(T.beforeH2)}</h2>
      <p className="site-p">{t(T.beforeP)}</p>
      <div className="site-grid site-grid--3">
        <div className="site-card">
          <h3 className="site-h3">{t(T.docsH3)}</h3>
          <p className="site-p">{t(T.docsP)}</p>
          <p style={{ marginTop: 14 }}>
            <Link className="btn btn--sm btn--ghost" href="/widgets/analytics/docs">
              {t(T.open)}
            </Link>
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">{t(T.faqH3)}</h3>
          <p className="site-p">{t(T.faqP)}</p>
          <p style={{ marginTop: 14 }}>
            <Link className="btn btn--sm btn--ghost" href="/widgets/analytics#вопросы">
              {t(T.open)}
            </Link>
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">{t(T.methodH3)}</h3>
          <p className="site-p">{t(T.methodP)}</p>
          <p style={{ marginTop: 14 }}>
            <Link className="btn btn--sm btn--ghost" href="/method">
              {t(T.open)}
            </Link>
          </p>
        </div>
      </div>

      <h2 className="site-h2">{t(T.bugH2)}</h2>
      <div className="site-card">
        <p className="site-p">{t(T.bugP1)}</p>
        <p className="site-p">
          {t(T.bugP2)} <Link href="/method/parking">{t(T.bugLink)}</Link>.
        </p>
        {first && (
          <div className="site-actions">
            <a className="btn" href={first.href}>
              {t(T.write)}
            </a>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
