import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { COMPANY, NOT_READY, WIDGET } from '@/lib/company';
import { CONTACTS, CRYPTO, RATE_NOTE, mailLink, telegramLink, whatsappLink } from '@/lib/pricing';
import { tr, type Bi, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * Страница контактов и реквизитов. Отвечает на два вопроса, которые задают
 * перед покупкой: «кто там на том конце» и «на кого выставите счёт».
 *
 * Ссылки на каналы собираются теми же хелперами, что и на /support
 * (telegramLink, whatsappLink, mailLink из lib/pricing) — иначе адрес поддержки
 * разъедется между двумя страницами. Канал без адреса из списка выпадает:
 * помощники возвращают null, и карточки не рисуются. Впишут адрес в CONTACTS —
 * карточки вернутся сами.
 *
 * Реквизитов у нас пока нет, и на странице с названием «Реквизиты» это худшее
 * место для выдумки: блок существует и говорит об этом прямо, а его содержимое
 * держит флаг COMPANY.legalReady, а не текст в разметке.
 *
 * Тон — docs/07-тон-текстов.md: обещание глаголом, шаги с «Результат:»,
 * возражение отдельным блоком, кнопка повторяется.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Контакты KLASTER: куда писать и как получить счёт',
    description:
      'Telegram, WhatsApp и почта — отвечаем по будням, обычно в тот же рабочий день. Порядок счёта, ключа и закрывающих документов, реквизиты по запросу.',
  },
  en: {
    title: 'KLASTER contacts: where to write and how to get an invoice',
    description:
      'Telegram, WhatsApp and email — we reply on weekdays, usually the same business day. How invoices, licence keys and closing documents work; company details on request.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

/** Общий вопрос: шаблон короткий намеренно, длинный никто не дозаполняет. */
const TEMPLATE: Bi = {
  ru: [`Здравствуйте! Пишу с сайта ${COMPANY.domain}.`, '', 'Компания: ', 'Поддомен amoCRM: ', 'Вопрос: '].join('\n'),
  en: [`Hello! Writing from ${COMPANY.domain}.`, '', 'Company: ', 'amoCRM subdomain: ', 'Question: '].join('\n'),
};

const SUBJECT: Bi = {
  ru: `Вопрос в ${COMPANY.name} · виджет ${WIDGET.version}`,
  en: `Question for ${COMPANY.name} · widget ${WIDGET.version}`,
};

/** Запрос счёта: те же поля, что мы всё равно спросим в ответном письме. */
const INVOICE_TEMPLATE: Bi = {
  ru: [
    'Здравствуйте! Прошу выставить счёт на виджет «Аналитика KLASTER».',
    '',
    'Плательщик, название юрлица или ИП: ',
    'Налоговый номер: ',
    'Юридический адрес: ',
    'Поддомен amoCRM: ',
    'Тариф и период оплаты: ',
  ].join('\n'),
  en: [
    'Hello! Please issue an invoice for the KLASTER Analytics widget.',
    '',
    'Payer, legal entity or sole trader name: ',
    'Tax ID: ',
    'Registered address: ',
    'amoCRM subdomain: ',
    'Plan and billing period: ',
  ].join('\n'),
};

const INVOICE_SUBJECT: Bi = {
  ru: `Счёт на оплату · ${COMPANY.name}`,
  en: `Invoice request · ${COMPANY.name}`,
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
    ru: 'Быстрее всего. Скриншот вставляется прямо в диалог, и вопрос «почему тут такая цифра» разбирается в одном экране.',
    en: 'Fastest. A screenshot goes straight into the chat, so “why is this number here” gets resolved on one screen.',
  },
  whatsappHint: {
    ru: 'Тот же номер, если Telegram у вас не в ходу. Отвечаем в тот же диалог, переписку никуда не переносим.',
    en: 'The same number if you do not use Telegram. We reply in the same chat and never move the conversation elsewhere.',
  },
  mailHint: {
    ru: 'Счёт, ключ лицензии, закрывающие и договор — сюда: письмо остаётся у обеих сторон.',
    en: 'Invoices, licence keys, closing documents and contracts go here: an email stays with both sides.',
  },
};

/* Фильтруем список, а не расставляем условия по разметке: канал, у которого
   нет адреса, не должен доехать до кнопки — «Написать» в никуда хуже, чем
   отсутствие кнопки. Появится адрес в lib/pricing — карточка вернётся сама.
   Ссылки зависят от языка шаблона, поэтому список собирается под язык. */
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

/* Плашку про биллинг не пересказываем: она живёт в company.ts и одинаково
   звучит на тарифах, в кабинете и здесь. */
const NO_CARD_PAYMENT = NOT_READY.find((n) => n.what.ru.includes('оплаты картой'));

/** Порядок счёта и закрывающих — как он есть сегодня, без обещаний вперёд. */
const BILLING_STEPS: readonly { title: Bi; body: Bi; result: Bi }[] = [
  {
    title: { ru: 'Письмо с реквизитами плательщика', en: 'An email with the payer’s details' },
    body: {
      ru: 'Название юрлица или ИП, налоговый номер, адрес, поддомен amoCRM, тариф и период. Кнопка ниже открывает письмо с этими полями — дозаполните и отправьте.',
      en: 'Legal entity or sole trader name, tax ID, address, amoCRM subdomain, plan and period. The button below opens an email with these fields — fill them in and send.',
    },
    result: {
      ru: 'мы не уточняем данные вторым письмом и не теряем на этом день',
      en: 'we do not chase the details in a second email and do not lose a day on it',
    },
  },
  {
    title: { ru: 'Счёт в ответ', en: 'An invoice in reply' },
    /* Плашка из company.ts уже говорит «счёт на юрлицо»; своя фраза — только
       если плашки нет. */
    body: {
      ru: `${NO_CARD_PAYMENT ? NO_CARD_PAYMENT.why.ru : 'Выставляем на юрлицо.'} Криптой платят тоже вручную через поддержку: ${CRYPTO.networks.ru}.`,
      en: `${NO_CARD_PAYMENT ? NO_CARD_PAYMENT.why.en : 'Issued to your company.'} Crypto is also paid manually via support: ${CRYPTO.networks.en}.`,
    },
    result: {
      ru: 'счёт на юрлицо; автосписания и подписки на карту нет ни в одном тарифе',
      en: 'an invoice to your company; no plan has automatic charges or card subscriptions',
    },
  },
  {
    title: { ru: 'Оплата и ключ лицензии', en: 'Payment and licence key' },
    body: {
      ru: 'Ключ привязан к аккаунту amoCRM, а не к пользователю: в другом аккаунте он не сработает.',
      en: 'The key is tied to the amoCRM account, not to a user: it will not work in another account.',
    },
    result: {
      ru: 'оплаченный период идёт с выдачи ключа, а не с даты счёта',
      en: 'the paid period starts when the key is issued, not on the invoice date',
    },
  },
  {
    title: { ru: 'Акт после оплаты', en: 'A certificate after payment' },
    body: {
      ru: 'Акт выпускаем по факту оплаты за период. Пока юрлицо в регистрации, подписанный комплект приходит после неё.',
      en: 'The certificate of completion is issued once the period is paid. While the legal entity is being registered, the signed set arrives after registration.',
    },
    result: {
      ru: 'закрывающие для вашей бухгалтерии, включая периоды, оплаченные до регистрации',
      en: 'closing documents for your accounting, including periods paid before registration',
    },
  },
];

const T = {
  h1: {
    ru: 'Ответим по будням, обычно в тот же рабочий день',
    en: 'We reply on weekdays, usually the same business day',
  },
  leadMany: {
    ru: 'Мессенджер или почта — выбирайте, где удобнее.',
    en: 'A messenger or email — whichever suits you.',
  },
  leadOne: {
    ru: 'Напишите — ответим в том же канале.',
    en: 'Write to us — we reply in the same channel.',
  },
  leadVoice: {
    ru: 'Ссылки открывают готовое письмо: тема и поля уже вписаны, остаётся дописать вопрос. Голосом не отвечаем — телефонной линии у нас нет.',
    en: 'The links open a ready-made message: the subject and the fields are already there, you just add the question. We take no calls — we have no phone line.',
  },
  write: { ru: 'Написать', en: 'Write' },
  requestInvoice: { ru: 'Запросить счёт', en: 'Request an invoice' },
  widget: { ru: 'виджет', en: 'widget' },
  hours: {
    ru: 'Рабочие часы, будни. Ночью и в выходные ответа может не быть.',
    en: 'Business hours, weekdays. There may be no reply at night or at weekends.',
  },
  legalPending: { ru: 'юрлицо в регистрации', en: 'legal entity being registered' },
  invoiceOnRequest: { ru: 'Счёт выставляем по запросу письмом.', en: 'Invoices are issued on request by email.' },
  whereH2: { ru: 'Куда писать', en: 'Where to write' },
  introMany: {
    ru: 'Вопросы по расчётам и поломкам быстрее решаются в мессенджере: туда влезает скриншот. Счета, ключ и закрывающие — почтой.',
    en: 'Questions about calculations and breakages are faster in a messenger: a screenshot fits there. Invoices, keys and closing documents go by email.',
  },
  introOne: {
    ru: 'Ссылка открывает готовый текст — его достаточно дозаполнить. Счета, ключ и закрывающие идут туда же.',
    en: 'The link opens a ready-made message — just fill in the blanks. Invoices, keys and closing documents go the same way.',
  },
  whoH2: { ru: 'Кто отвечает', en: 'Who answers' },
  whoP1: {
    ru: 'Обращение читает инженер, который писал этот расчёт. Пересказ через оператора добавил бы рабочий день и потерял детали, по которым цифра воспроизводится. Часы работы, сроки ответа и что приложить —',
    en: 'Your request is read by the engineer who wrote the calculation. Relaying it through an operator would add a business day and lose the details needed to reproduce the number. Working hours, response times and what to attach are on the',
  },
  whoLink: { ru: 'на странице поддержки', en: 'support page' },
  /* Заголовок ходит за флагом: утвердят реквизиты — блок перестанет объясняться
     и станет просто «Реквизиты». */
  detailsH2: { ru: 'Реквизитов на сайте нет', en: 'No company details on the site' },
  detailsH2Ready: { ru: 'Реквизиты', en: 'Company details' },
  noDetails1: {
    ru: 'Юрлицо в регистрации. Налогового номера, юридического адреса и банковских реквизитов здесь нет, потому что их пока нет вовсе. Придумывать их до регистрации мы не будем.',
    en: 'The legal entity is being registered. There is no tax ID, registered address or bank details here because they do not exist yet. We are not going to invent them before registration.',
  },
  noDetails2: {
    ru: 'Счёт выставляем по запросу письмом и присылаем реквизиты в нём же. На сайте они появятся таблицей, когда будут утверждены, — не файлом по запросу.',
    en: 'We issue an invoice by email on request and include the details in it. On the site they will appear as a table once approved — not as a file on request.',
  },
  offerP: {
    ru: 'Пока договора нет, условия работы держит',
    en: 'Until a contract exists, the terms are set by the',
  },
  offerLink: { ru: 'публичная оферта', en: 'public offer' },
  offerP2: {
    ru: ': предмет, тарифы, порядок оплаты и возврата, судьба данных после отключения. Отдельный договор подписываем после регистрации, если он нужен вашей бухгалтерии.',
    en: ': subject, plans, payment and refund terms, what happens to data after disconnection. A separate contract is signed after registration if your accounting needs one.',
  },
  pricing: { ru: 'Тарифы и лимиты', en: 'Plans and limits' },
  billingH2: { ru: 'Как проходит счёт и закрывающие', en: 'How invoicing and closing documents work' },
  resultLabel: { ru: 'Результат:', en: 'Result:' },
  nearbyH2: { ru: 'Рядом', en: 'Nearby' },
  supportH3: { ru: 'Поддержка', en: 'Support' },
  supportP: {
    ru: 'Что приложить к обращению, что делать с пустым экраном виджета и с отозванным доступом.',
    en: 'What to attach to a request, what to do with an empty widget screen or revoked access.',
  },
  offerH3: { ru: 'Публичная оферта', en: 'Public offer' },
  offerCardP: {
    ru: 'Предмет, порядок оплаты и возврата, grace-период, что происходит с данными после отключения.',
    en: 'Subject, payment and refund terms, grace period, what happens to data after disconnection.',
  },
  companyH3: { ru: 'О компании', en: 'About the company' },
  companyP: {
    ru: 'Кто делает продукт, чем подтверждается «работает» и чего у нас пока нет.',
    en: 'Who builds the product, what backs up “it works” and what we do not have yet.',
  },
  open: { ru: 'Открыть', en: 'Open' },
};

export default async function ContactsPage() {
  const lang = await getLang();
  const t = tr(lang);
  const list = channels(lang);

  /* Колонок ровно столько, сколько каналов: одинокая карточка в сетке на три
     уезжает в треть ширины и читается как обрубок. Текст вокруг карточек тоже
     считает каналы: «куда бы вы ни написали» над одной карточкой обещает
     выбор, которого на экране нет. */
  const many = list.length > 1;
  const grid = `site-grid${many ? ` site-grid--${list.length}` : ''}`;
  const first = list[0];

  return (
    <SiteShell>
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">
        {t(many ? T.leadMany : T.leadOne)} {t(T.leadVoice)}
      </p>

      <div className="site-actions">
        {first && (
          <a className="btn" href={first.href}>
            {t(T.write)}
          </a>
        )}
        <a className="btn btn--ghost" href={mailLink(t(INVOICE_SUBJECT), t(INVOICE_TEMPLATE))}>
          {t(T.requestInvoice)}
        </a>
      </div>

      <div className="site-status">
        <Mark kind="live">
          {t(T.widget)} {WIDGET.version}
        </Mark>
        <span>{t(T.hours)}</span>
        {!COMPANY.legalReady && (
          <>
            <Mark kind="building">{t(T.legalPending)}</Mark>
            <span>{t(T.invoiceOnRequest)}</span>
          </>
        )}
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

      <h2 className="site-h2">{t(T.whoH2)}</h2>
      <p className="site-p">
        {t(T.whoP1)} <Link href="/support">{t(T.whoLink)}</Link>.
      </p>

      <h2 className="site-h2">{t(COMPANY.legalReady ? T.detailsH2Ready : T.detailsH2)}</h2>
      <div className="site-card">
        {!COMPANY.legalReady && (
          <>
            {/* Условие, а не заглушка: когда реквизиты утвердят, флаг в
                company.ts переключится, и на месте этих абзацев встанет
                таблица. Придумывать ИНН и адрес до регистрации нельзя. */}
            <p className="site-p">{t(T.noDetails1)}</p>
            <p className="site-p">{t(T.noDetails2)}</p>
          </>
        )}
        <p className="site-p">
          {t(T.offerP)} <Link href="/legal/offer">{t(T.offerLink)}</Link>
          {t(T.offerP2)}
        </p>
        <div className="site-actions">
          <a className="btn" href={mailLink(t(INVOICE_SUBJECT), t(INVOICE_TEMPLATE))}>
            {t(T.requestInvoice)}
          </a>
          <Link className="btn btn--ghost" href="/widgets/analytics/pricing">
            {t(T.pricing)}
          </Link>
        </div>
      </div>

      <h2 className="site-h2">{t(T.billingH2)}</h2>
      <div className="site-rules">
        {BILLING_STEPS.map((step, i) => (
          <section className="site-card site-rule" key={step.title.ru}>
            <div className="site-rule__n num">{i + 1}</div>
            <div className="site-rule__body">
              <h3 className="site-h3">{t(step.title)}</h3>
              <p className="site-p">{t(step.body)}</p>
              <p className="site-rule__where">
                <b>{t(T.resultLabel)}</b> {t(step.result)}
              </p>
            </div>
          </section>
        ))}
      </div>
      <Source>{t(RATE_NOTE)}</Source>
      <div className="site-actions">
        <a className="btn" href={mailLink(t(INVOICE_SUBJECT), t(INVOICE_TEMPLATE))}>
          {t(T.requestInvoice)}
        </a>
        {first && (
          <a className="btn btn--ghost" href={first.href}>
            {t(T.write)}
          </a>
        )}
      </div>

      <h2 className="site-h2">{t(T.nearbyH2)}</h2>
      <div className="site-grid site-grid--3">
        <div className="site-card">
          <h3 className="site-h3">{t(T.supportH3)}</h3>
          <p className="site-p">{t(T.supportP)}</p>
          <p style={{ marginTop: 14 }}>
            <Link className="btn btn--sm btn--ghost" href="/support">
              {t(T.open)}
            </Link>
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">{t(T.offerH3)}</h3>
          <p className="site-p">{t(T.offerCardP)}</p>
          <p style={{ marginTop: 14 }}>
            <Link className="btn btn--sm btn--ghost" href="/legal/offer">
              {t(T.open)}
            </Link>
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">{t(T.companyH3)}</h3>
          <p className="site-p">{t(T.companyP)}</p>
          <p style={{ marginTop: 14 }}>
            <Link className="btn btn--sm btn--ghost" href="/company">
              {t(T.open)}
            </Link>
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
