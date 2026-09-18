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
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Контакты и реквизиты KLASTER',
    description:
      'Куда писать, кто отвечает, юрлицо, реквизиты для счёта, порядок закрывающих документов.',
  },
  en: {
    title: 'KLASTER contacts and company details',
    description:
      'Where to write, who answers, legal entity, invoicing details and how closing documents are issued.',
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
    ru: 'Быстрее всего. Скриншот вставляется прямо в диалог, поэтому вопрос «почему тут такая цифра» разбирается в одном экране.',
    en: 'Fastest. A screenshot goes straight into the chat, so “why is this number here” gets resolved on one screen.',
  },
  whatsappHint: {
    ru: 'Если Telegram у вас не в ходу. Отвечаем в тот же диалог, переписку никуда не переносим.',
    en: 'If you do not use Telegram. We reply in the same chat and never move the conversation elsewhere.',
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
const BILLING_STEPS: readonly { title: Bi; body: Bi }[] = [
  {
    title: { ru: 'Письмо с реквизитами плательщика', en: 'An email with the payer’s details' },
    body: {
      ru: 'Название юрлица или ИП, налоговый номер, адрес, поддомен amoCRM, тариф и период. Ссылка ниже открывает письмо с этими полями — дозаполните и отправьте.',
      en: 'Legal entity or sole trader name, tax ID, address, amoCRM subdomain, plan and period. The link below opens an email with these fields — fill them in and send.',
    },
  },
  {
    title: { ru: 'Счёт в ответ', en: 'An invoice in reply' },
    /* Плашка из company.ts уже говорит «счёт на юрлицо»; своя фраза — только
       если плашки нет. */
    body: {
      ru: `${NO_CARD_PAYMENT ? NO_CARD_PAYMENT.why.ru : 'Выставляем на юрлицо.'} Криптой платят тоже вручную через поддержку: ${CRYPTO.networks.ru}. Автоматического списания и подписки на карту нет ни в одном тарифе.`,
      en: `${NO_CARD_PAYMENT ? NO_CARD_PAYMENT.why.en : 'Issued to your company.'} Crypto is also paid manually via support: ${CRYPTO.networks.en}. No plan has automatic charges or card subscriptions.`,
    },
  },
  {
    title: { ru: 'Оплата и ключ лицензии', en: 'Payment and licence key' },
    body: {
      ru: 'Ключ привязан к аккаунту amoCRM, а не к пользователю: в другом аккаунте он не сработает. Оплаченный период отсчитывается с выдачи ключа, а не с даты счёта.',
      en: 'The key is tied to the amoCRM account, not to a user: it will not work in another account. The paid period starts when the key is issued, not on the invoice date.',
    },
  },
  {
    title: { ru: 'Акт после оплаты', en: 'A certificate after payment' },
    body: {
      ru: 'Акт выпускаем по факту оплаты за период. Пока юрлицо в регистрации, подписанный комплект приходит после неё — включая периоды, оплаченные до регистрации.',
      en: 'The certificate of completion is issued once the period is paid. While the legal entity is being registered, the signed set arrives after registration — including periods paid before it.',
    },
  },
];

const T = {
  h1: { ru: 'Контакты и реквизиты', en: 'Contacts and company details' },
  leadMany: {
    ru: 'Куда бы вы ни написали, попадёте к тем же людям, которые пишут код.',
    en: 'Whichever channel you choose, you reach the same people who write the code.',
  },
  leadOne: {
    ru: 'Напишете — попадёте к тем же людям, которые пишут код.',
    en: 'Write to us and you reach the same people who write the code.',
  },
  leadVoice: {
    ru: 'Голосом не отвечаем: номер поддержки заведён под мессенджеры, колл-центра у нас нет, а поддомен, период и не сошедшееся число диктовать дольше, чем написать.',
    en: 'We do not take calls: the support number is for messengers, there is no call centre, and a subdomain, a period and a mismatched number take longer to dictate than to type.',
  },
  widget: { ru: 'виджет', en: 'widget' },
  hours: {
    ru: 'Отвечаем в рабочие часы по будням, обычно в тот же рабочий день.',
    en: 'We reply during business hours on weekdays, usually the same business day.',
  },
  legalPending: { ru: 'юрлицо в регистрации', en: 'legal entity being registered' },
  invoiceOnRequest: { ru: 'Счёт выставляем по запросу письмом.', en: 'Invoices are issued on request by email.' },
  whereH2: { ru: 'Куда писать', en: 'Where to write' },
  introMany: {
    ru: 'Ссылки открывают готовый текст — его достаточно дозаполнить. По счетам, ключу и закрывающим пишите на почту: переписка остаётся у обеих сторон и её можно приложить к бухгалтерии.',
    en: 'The links open a ready-made message — just fill in the blanks. For invoices, keys and closing documents use email: the thread stays with both sides and can be filed with accounting.',
  },
  introOne: {
    ru: 'Ссылка открывает готовый текст — его достаточно дозаполнить. Счета, ключ и закрывающие идут туда же: переписка остаётся у обеих сторон и её можно приложить к бухгалтерии.',
    en: 'The link opens a ready-made message — just fill in the blanks. Invoices, keys and closing documents go the same way: the thread stays with both sides and can be filed with accounting.',
  },
  write: { ru: 'Написать', en: 'Write' },
  whoH2: { ru: 'Кто отвечает', en: 'Who answers' },
  whoP1: {
    ru: 'Мы сами: обращение читает инженер, который писал этот расчёт. Пересказ через оператора добавил бы рабочий день и потерял детали, по которым цифра воспроизводится. Часы работы, сроки ответа и что приложить к обращению — на',
    en: 'We do: your request is read by the engineer who wrote the calculation. Relaying it through an operator would add a business day and lose the details needed to reproduce the number. Working hours, response times and what to attach are on the',
  },
  whoLink: { ru: 'странице поддержки', en: 'support page' },
  detailsH2: { ru: 'Реквизиты', en: 'Company details' },
  noDetails1: {
    ru: 'Юрлицо в регистрации. Налогового номера, юридического адреса и банковских реквизитов на сайте нет, потому что их пока нет вовсе. Счёт выставляем по запросу письмом и присылаем реквизиты в нём же.',
    en: 'The legal entity is being registered. There is no tax ID, registered address or bank details on the site because they do not exist yet. Invoices are issued on request by email, with the details included.',
  },
  noDetails2: {
    ru: 'Закрывающие документы выпускаем после регистрации, включая периоды, оплаченные до неё. Реквизиты появятся здесь отдельной таблицей, когда будут утверждены, — не файлом по запросу.',
    en: 'Closing documents are issued after registration, including periods paid before it. The details will appear here as a table once approved — not as a file on request.',
  },
  offerP: {
    ru: 'Условия работы до появления договора держит',
    en: 'Until a contract exists, the terms are set by the',
  },
  offerLink: { ru: 'публичная оферта', en: 'public offer' },
  offerP2: {
    ru: ': предмет, тарифы, порядок оплаты и возврата, судьба данных после отключения. Отдельный договор подписываем после регистрации, если он нужен вашей бухгалтерии.',
    en: ': subject, plans, payment and refund terms, what happens to data after disconnection. A separate contract is signed after registration if your accounting needs one.',
  },
  requestInvoice: { ru: 'Запросить счёт', en: 'Request an invoice' },
  pricing: { ru: 'Тарифы и лимиты', en: 'Plans and limits' },
  billingH2: { ru: 'Порядок счёта и закрывающих', en: 'Invoicing and closing documents' },
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

  return (
    <SiteShell>
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">
        {t(many ? T.leadMany : T.leadOne)} {t(T.leadVoice)}
      </p>

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

      <h2 className="site-h2">{t(T.detailsH2)}</h2>
      <div className="site-card">
        {!COMPANY.legalReady && (
          <>
            {/* Условие, а не заглушка: когда реквизиты утвердят, флаг в
                company.ts переключится, и на месте этого абзаца встанет
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
            </div>
          </section>
        ))}
      </div>
      <Source>{t(RATE_NOTE)}</Source>

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
