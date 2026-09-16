import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { COMPANY, NOT_READY, WIDGET } from '@/lib/company';
import { CONTACTS, CRYPTO, RATE_NOTE, mailLink, telegramLink, whatsappLink } from '@/lib/pricing';

/**
 * Страница контактов и реквизитов. Отвечает на два вопроса, которые задают
 * перед покупкой: «кто там на том конце» и «на кого выставите счёт».
 *
 * Ссылки на каналы собираются теми же хелперами, что и на /support
 * (telegramLink, whatsappLink, mailLink из lib/pricing) — иначе адрес поддержки
 * разъедется между двумя страницами. Канал без адреса из списка выпадает:
 * у Telegram и WhatsApp его пока нет, помощники возвращают null, и карточки
 * не рисуются. Впишут адрес в CONTACTS — карточки вернутся сами.
 *
 * Реквизитов у нас пока нет, и на странице с названием «Реквизиты» это худшее
 * место для выдумки: блок существует и говорит об этом прямо, а его содержимое
 * держит флаг COMPANY.legalReady, а не текст в разметке.
 */

export const metadata: Metadata = {
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  title: { absolute: 'Контакты и реквизиты KLASTER' },
  description:
    'Куда писать, кто отвечает, юрлицо, реквизиты для счёта, порядок закрывающих документов.',
};

/** Общий вопрос: шаблон короткий намеренно, длинный никто не дозаполняет. */
const TEMPLATE = [
  `Здравствуйте! Пишу с сайта ${COMPANY.domain}.`,
  '',
  'Компания: ',
  'Поддомен amoCRM: ',
  'Вопрос: ',
].join('\n');

const SUBJECT = `Вопрос в ${COMPANY.name} · виджет ${WIDGET.version}`;

/** Запрос счёта: те же поля, что мы всё равно спросим в ответном письме. */
const INVOICE_TEMPLATE = [
  'Здравствуйте! Прошу выставить счёт на виджет «Аналитика KLASTER».',
  '',
  'Плательщик, название юрлица или ИП: ',
  'Налоговый номер: ',
  'Юридический адрес: ',
  'Поддомен amoCRM: ',
  'Тариф и период оплаты: ',
].join('\n');

const INVOICE_SUBJECT = `Счёт на оплату · ${COMPANY.name}`;

interface Channel {
  name: string;
  href: string;
  who: string;
  hint: string;
}

/* Фильтруем список, а не расставляем условия по разметке: канал, у которого
   нет адреса, не должен доехать до кнопки — «Написать» в никуда хуже, чем
   отсутствие кнопки. Появится адрес в lib/pricing — карточка вернётся сама. */
const MAYBE_CHANNELS: { name: string; href: string | null; who: string | null; hint: string }[] = [
  {
    name: 'Telegram',
    href: telegramLink(TEMPLATE),
    who: CONTACTS.telegram?.replace('https://', '') ?? null,
    hint: 'Быстрее всего. Скриншот вставляется прямо в диалог, поэтому вопрос «почему тут такая цифра» разбирается в одном экране.',
  },
  {
    name: 'WhatsApp',
    href: whatsappLink(TEMPLATE),
    who: CONTACTS.whatsapp?.replace('https://', '') ?? null,
    hint: 'Если Telegram у вас не в ходу. Отвечаем в тот же диалог, переписку никуда не переносим.',
  },
  {
    name: 'Почта',
    href: mailLink(SUBJECT, TEMPLATE),
    who: CONTACTS.email,
    hint: 'Счёт, ключ лицензии, закрывающие и договор — сюда: письмо остаётся у обеих сторон.',
  },
];

const CHANNELS: Channel[] = MAYBE_CHANNELS.filter(
  (c): c is Channel => c.href !== null && c.who !== null,
);

/* Колонок ровно столько, сколько каналов: одинокая карточка в сетке на три
   уезжает в треть ширины и читается как обрубок. */
const CHANNELS_GRID = `site-grid${CHANNELS.length > 1 ? ` site-grid--${CHANNELS.length}` : ''}`;

/* Текст вокруг карточек считает каналы вместе с сеткой: «куда бы вы ни
   написали» над одной карточкой обещает выбор, которого на экране нет. */
const MANY_CHANNELS = CHANNELS.length > 1;

const LEAD_WHERE = MANY_CHANNELS
  ? 'Куда бы вы ни написали, попадёте к тем же людям, которые пишут код.'
  : 'Напишете — попадёте к тем же людям, которые пишут код.';

const CHANNELS_INTRO = MANY_CHANNELS
  ? 'Ссылки открывают готовый текст — его достаточно дозаполнить. По счетам, ключу и закрывающим пишите на почту: там переписка остаётся у обеих сторон и её можно приложить к бухгалтерии.'
  : 'Ссылка открывает готовый текст — его достаточно дозаполнить. Счета, ключ и закрывающие идут туда же: переписка остаётся у обеих сторон и её можно приложить к бухгалтерии.';

/* Плашку про биллинг не пересказываем: она живёт в company.ts и одинаково
   звучит на тарифах, в кабинете и здесь. */
const NO_CARD_PAYMENT = NOT_READY.find((n) => n.what.includes('оплаты картой'));

/** Порядок счёта и закрывающих — как он есть сегодня, без обещаний вперёд. */
const BILLING_STEPS: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Письмо с реквизитами плательщика',
    body: (
      <>
        Название юрлица или ИП, налоговый номер, адрес, поддомен amoCRM, тариф и период. Ссылка ниже
        открывает письмо с этими полями — дозаполните и отправьте.
      </>
    ),
  },
  {
    title: 'Счёт в ответ',
    body: (
      <>
        Выставляем на юрлицо. {NO_CARD_PAYMENT ? NO_CARD_PAYMENT.why : null} Криптой платят тоже
        вручную через поддержку: {CRYPTO.networks}. Автоматического списания и подписки на карту нет
        ни в одном тарифе.
      </>
    ),
  },
  {
    title: 'Оплата и ключ лицензии',
    body: (
      <>
        Ключ привязан к аккаунту amoCRM, а не к пользователю: введённый в другом аккаунте он не
        сработает. Отсчёт оплаченного периода начинается с выдачи ключа, а не с даты счёта.
      </>
    ),
  },
  {
    title: 'Акт после оплаты',
    body: (
      <>
        Акт выпускаем по факту оплаты за период. Пока юрлицо в регистрации, подписанный комплект
        приходит после неё — включая периоды, оплаченные до регистрации.
      </>
    ),
  },
];

export default function ContactsPage() {
  return (
    <SiteShell>
      <h1 className="site-h1">Контакты и реквизиты</h1>
      <p className="site-lead">
        {LEAD_WHERE} Голосом не отвечаем: номер поддержки заведён под мессенджеры, колл-центра у
        нас нет, а поддомен, период и не сошедшееся число диктовать дольше, чем написать.
      </p>

      <div className="site-status">
        <Mark kind="live">виджет {WIDGET.version}</Mark>
        <span>Отвечаем в рабочие часы по будням, обычно в тот же рабочий день.</span>
        {!COMPANY.legalReady && (
          <>
            <Mark kind="building">юрлицо в регистрации</Mark>
            <span>Счёт выставляем по запросу письмом.</span>
          </>
        )}
      </div>

      <h2 className="site-h2">Куда писать</h2>
      <p className="site-p">{CHANNELS_INTRO}</p>
      <div className={CHANNELS_GRID}>
        {CHANNELS.map((c) => (
          <div className="site-card" key={c.name}>
            <h3 className="site-h3">{c.name}</h3>
            <p className="site-p">{c.hint}</p>
            <p style={{ marginTop: 14 }}>
              <a className="btn btn--sm" href={c.href}>
                Написать
              </a>
            </p>
            <Source>{c.who}</Source>
          </div>
        ))}
      </div>

      <h2 className="site-h2">Кто отвечает</h2>
      <p className="site-p">
        Мы сами: обращение читает инженер, который писал этот расчёт. Пересказ вопроса через
        оператора добавил бы рабочий день и потерял ровно те детали, по которым цифра
        воспроизводится. Часы работы, чего ждать по срокам ответа и что приложить к обращению —
        на <Link href="/support">странице поддержки</Link>.
      </p>

      <h2 className="site-h2">Реквизиты</h2>
      <div className="site-card">
        {!COMPANY.legalReady && (
          <>
            {/* Условие, а не заглушка: когда реквизиты утвердят, флаг в
                company.ts переключится, и на месте этого абзаца встанет
                таблица. Придумывать ИНН и адрес до регистрации нельзя. */}
            <p className="site-p">
              Юрлицо в регистрации. Налогового номера, юридического адреса и банковских реквизитов
              на сайте нет, потому что их пока нет вовсе, а страница «Реквизиты» — худшее место для
              выдумки. Счёт выставляем по запросу письмом и присылаем реквизиты в нём же.
            </p>
            <p className="site-p">
              Закрывающие документы выпускаем после регистрации, включая периоды, оплаченные до неё.
              Здесь же они появятся строками, когда будут утверждены, — отдельной таблицей, а не
              файлом по запросу.
            </p>
          </>
        )}
        <p className="site-p">
          Условия работы до появления договора держит{' '}
          <Link href="/legal/offer">публичная оферта</Link>: предмет, тарифы, порядок оплаты и
          возврата, судьба данных после отключения. Отдельный договор подписываем после регистрации,
          если он нужен вашей бухгалтерии.
        </p>
        <div className="site-actions">
          <a className="btn" href={mailLink(INVOICE_SUBJECT, INVOICE_TEMPLATE)}>
            Запросить счёт
          </a>
          <Link className="btn btn--ghost" href="/widgets/analytics/pricing">
            Тарифы и лимиты
          </Link>
        </div>
      </div>

      <h2 className="site-h2">Порядок счёта и закрывающих</h2>
      <div className="site-rules">
        {BILLING_STEPS.map((step, i) => (
          <section className="site-card site-rule" key={step.title}>
            <div className="site-rule__n num">{i + 1}</div>
            <div className="site-rule__body">
              <h3 className="site-h3">{step.title}</h3>
              <p className="site-p">{step.body}</p>
            </div>
          </section>
        ))}
      </div>
      <Source>{RATE_NOTE}</Source>

      <h2 className="site-h2">Рядом</h2>
      <div className="site-grid site-grid--3">
        <div className="site-card">
          <h3 className="site-h3">Поддержка</h3>
          <p className="site-p">
            Что приложить к обращению, что делать с пустым экраном виджета и с отозванным доступом.
          </p>
          <p style={{ marginTop: 14 }}>
            <Link className="btn btn--sm btn--ghost" href="/support">
              Открыть
            </Link>
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">Публичная оферта</h3>
          <p className="site-p">
            Предмет, порядок оплаты и возврата, grace-период, что происходит с данными после
            отключения.
          </p>
          <p style={{ marginTop: 14 }}>
            <Link className="btn btn--sm btn--ghost" href="/legal/offer">
              Открыть
            </Link>
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">О компании</h3>
          <p className="site-p">
            Кто делает продукт, чем подтверждается «работает» и чего у нас пока нет.
          </p>
          <p style={{ marginTop: 14 }}>
            <Link className="btn btn--sm btn--ghost" href="/company">
              Открыть
            </Link>
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
