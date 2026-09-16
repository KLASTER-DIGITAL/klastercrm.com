import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { COMPANY, PILOT, WIDGET } from '@/lib/company';
import { plural, withPlural } from '@/lib/plural';
import { CONTACTS, mailLink, telegramLink, whatsappLink } from '@/lib/pricing';

/**
 * На этот адрес ссылается widget/manifest.json — его открывает и клиент из
 * виджета, и модератор amoCRM. Поэтому страница сделана раньше остальных и
 * держится одного правила: ни одного канала, который не отвечает, и ни одной
 * обещанной скорости ответа, которую мы не выдерживаем.
 *
 * Каналы берутся из lib/pricing и фильтруются по наличию адреса: у Telegram и
 * WhatsApp его пока нет, помощники возвращают null, и карточки этих каналов не
 * рисуются вовсе. Впишут адрес в CONTACTS — карточки вернутся сами, править
 * здесь ничего не нужно.
 */

export const metadata: Metadata = {
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  title: { absolute: 'Поддержка KLASTER' },
  description:
    'Каналы связи, что приложить к обращению и когда мы отвечаем. Что делать, если виджет открылся пустым или доступ к amoCRM отозван.',
};

const ru = new Intl.NumberFormat('ru-RU');

/** Шаблон обращения. Один текст на все три канала — иначе они разъезжаются. */
const TEMPLATE = [
  `Здравствуйте! Вопрос по виджету «Аналитика KLASTER», версия ${WIDGET.version}.`,
  '',
  'Поддомен amoCRM: ',
  'Вкладка виджета: ',
  'Период и фильтры: ',
  'Что ожидали увидеть: ',
  'Что увидели вместо этого: ',
].join('\n');

const SUBJECT = `Поддержка KLASTER · виджет ${WIDGET.version}`;

interface Channel {
  name: string;
  href: string;
  who: string;
  hint: string;
}

/* Канал без адреса — это кнопка в никуда, а она тратит время человека ровно
   тогда, когда у него что-то сломалось. Поэтому список фильтруется по href, а
   не обрастает условиями в разметке: адрес появится в lib/pricing — карточка
   встанет на место сама. */
const MAYBE_CHANNELS: { name: string; href: string | null; who: string | null; hint: string }[] = [
  {
    name: 'Telegram',
    href: telegramLink(TEMPLATE),
    who: CONTACTS.telegram?.replace('https://', '') ?? null,
    hint: 'Быстрее всего. Скриншот вставляется прямо в диалог.',
  },
  {
    name: 'WhatsApp',
    href: whatsappLink(TEMPLATE),
    who: CONTACTS.whatsapp?.replace('https://', '') ?? null,
    hint: 'Если Telegram у вас не в ходу. Отвечаем в тот же диалог.',
  },
  {
    name: 'Почта',
    href: mailLink(SUBJECT, TEMPLATE),
    who: CONTACTS.email,
    hint: 'Сюда же — вопросы по счетам, ключу лицензии и закрывающим.',
  },
];

const CHANNELS: Channel[] = MAYBE_CHANNELS.filter(
  (c): c is Channel => c.href !== null && c.who !== null,
);

/* Колонок ровно столько, сколько каналов: одинокая карточка в сетке на три
   уезжает в треть ширины и читается как обрубок. */
const CHANNELS_GRID = `site-grid${CHANNELS.length > 1 ? ` site-grid--${CHANNELS.length}` : ''}`;

/* Текст над карточками тоже считает каналы. «Куда бы вы ни написали» над одной
   карточкой обещает выбор, которого на экране нет, — а обещание, которое видно
   опровергнутым в ту же секунду, стоит дороже неудачной формулировки. */
const CHANNELS_INTRO =
  CHANNELS.length > 1
    ? 'Куда бы вы ни написали, обращение попадает к одним и тем же людям. Ссылки открывают готовый шаблон — его достаточно дозаполнить.'
    : 'Обращение читает инженер, который писал этот расчёт. Ссылка открывает готовый шаблон — его достаточно дозаполнить.';

/** Что приложить. Список короткий намеренно: длинный никто не заполняет. */
const ATTACH: { title: string; text: string }[] = [
  {
    title: 'Поддомен вашей amoCRM',
    text: 'Первая часть адреса до .amocrm.ru. По нему мы находим аккаунт — искать по названию компании мы не можем, названий у нас в базе нет.',
  },
  {
    title: 'Вкладка виджета',
    text: 'Воронка, Менеджеры, Качество данных, Путь заявки — на какой именно вкладке видно проблему.',
  },
  {
    title: 'Период и фильтры',
    text: 'Даты, воронка, менеджер, разрез по полю. Без них цифра не воспроизводится, и разбор превращается в переписку на день.',
  },
  {
    title: 'Что вы ожидали увидеть',
    text: 'И что увидели вместо этого. Расхождение с конкретным числом разбирается за один заход, «всё считает неправильно» — не разбирается вовсе.',
  },
  {
    title: 'Скриншот, если он есть',
    text: 'Экран виджета целиком, вместе со строкой фильтров. Персональные данные закрывать не нужно — на наших экранах их нет.',
  },
];

export default function SupportPage() {
  return (
    <SiteShell active="/support">
      <h1 className="site-h1">Поддержка</h1>
      <p className="site-lead">
        Пишите напрямую тем, кто пишет код. Промежуточной линии, тикет-системы и робота-приёмщика у
        нас нет — команда маленькая, и обращение читает инженер.
      </p>

      <div className="site-status">
        <Mark kind="live">виджет {WIDGET.version}</Mark>
        <span>
          Отвечаем в рабочие часы по будням. Ночью и в выходные ответа может не быть — обещать
          круглосуточную линию нам нечем.
        </span>
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

      <h2 className="site-h2">Что приложить к обращению</h2>
      <p className="site-p">
        Мы не храним ни имён, ни телефонов, ни текстов — а значит, не можем найти вашу сделку по
        фамилии клиента и не видим, что у вас на экране. Разбор идёт по этим пяти пунктам.
      </p>
      <div className="site-grid site-grid--2">
        {ATTACH.map((a) => (
          <div className="site-card" key={a.title}>
            <h3 className="site-h3">{a.title}</h3>
            <p className="site-p">{a.text}</p>
          </div>
        ))}
      </div>

      <h2 className="site-h2">Когда мы отвечаем</h2>
      <p className="site-p">
        Честно: заявленного времени реакции в часах у нас нет, и выдумывать его мы не будем. Пишем в
        ответ в рабочие часы по будням, обычно в тот же рабочий день. Если вопрос требует разбора
        данных вашего аккаунта, сначала приходит подтверждение, что обращение взяли, потом разбор.
      </p>
      <p className="site-p">
        Приоритетная поддержка входит в тариф «Девелопер». На остальных тарифах очередь общая: мы не
        держим отдельную линию, которая молчит быстрее.
      </p>

      <h2 className="site-h2">Виджет открылся пустым</h2>
      <p className="site-p">
        Три причины по убыванию частоты. Первые две решаются без нас, третья — одним письмом.
      </p>
      <div className="site-grid site-grid--3">
        <div className="site-card">
          <h3 className="site-h3">Закэшировался старый код</h3>
          <p className="site-p">
            amoCRM кэширует файлы виджета. Обновите страницу с очисткой кэша: Cmd+Shift+R на macOS,
            Ctrl+F5 на Windows. Это лечит большинство пустых экранов.
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">Первая загрузка ещё идёт</h3>
          <p className="site-p">
            Сразу после подключения истории в базе ещё нет. На аккаунте с{' '}
            {PILOT.historyYears}-летней историей полная загрузка заняла{' '}
            {withPlural(PILOT.firstLoadMinutes, 'минуту', 'минуты', 'минут')} — это замер, а не
            расчёт. Дальше данные обновляются каждые{' '}
            {withPlural(PILOT.syncEveryMinutes, 'минуту', 'минуты', 'минут')}.
          </p>
          <Source>
            {PILOT.who} · {ru.format(PILOT.leads)} сделок, {ru.format(PILOT.transitions)}{' '}
            {plural(PILOT.transitions, 'переход', 'перехода', 'переходов')} ·
            замер {PILOT.measuredAt} · {PILOT.source}
          </Source>
        </div>
        <div className="site-card">
          <h3 className="site-h3">Доступ отозван</h3>
          <p className="site-p">
            Администратор мог отозвать доступ в разделе «Выданные доступы», или он слетел при смене
            секретного ключа интеграции. Лечится повторным подключением по OAuth — виджет попросит
            об этом сам. История при этом не теряется.
          </p>
        </div>
      </div>
      <p className="site-p" style={{ marginTop: 20 }}>
        <Link href="/widgets/analytics/install">Как подключить и переподключить виджет</Link> — там
        же список прав, которые мы запрашиваем, и что делать администратору.
      </p>

      <h2 className="site-h2">Ключ и оплата</h2>
      <p className="site-p">
        Ключ лицензии привязан к аккаунту amoCRM, а не к пользователю: введённый в другом аккаунте он
        не сработает. Автоматической оплаты картой пока нет — ключ выдаём вручную, счёт выставляем на
        юрлицо. Что происходит после окончания оплаты и почему история при этом не пропадает —{' '}
        <Link href="/widgets/analytics/pricing">на странице тарифов</Link>.
      </p>
      <p className="site-p">
        Вопросы по счёту, закрывающим и продлению — на{' '}
        <a href={mailLink(`Счёт и лицензия · ${COMPANY.name}`)}>{CONTACTS.email}</a>.
      </p>

      <h2 className="site-h2">Прежде чем писать</h2>
      <p className="site-p">
        Часть вопросов уже разобрана письменно, и в тексте ответ подробнее, чем получится в диалоге.
      </p>
      <div className="site-grid site-grid--3">
        <div className="site-card">
          <h3 className="site-h3">Документация</h3>
          <p className="site-p">
            Быстрый старт, разметка этапов, метрики и формулы, качество данных.
          </p>
          <p style={{ marginTop: 14 }}>
            <Link className="btn btn--sm btn--ghost" href="/widgets/analytics/docs">
              Открыть
            </Link>
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">Частые вопросы</h3>
          <p className="site-p">
            Что мы видим в вашей CRM, можем ли что-то испортить, увидит ли менеджер чужие сделки.
          </p>
          <p style={{ marginTop: 14 }}>
            <Link className="btn btn--sm btn--ghost" href="/widgets/analytics#вопросы">
              Открыть
            </Link>
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">Как мы считаем</h3>
          <p className="site-p">
            Если цифра в отчёте не сходится с ожиданием, ответ чаще всего здесь: медиана вместо
            среднего, порог по числу сделок, отказ строить разрез на пустом поле.
          </p>
          <p style={{ marginTop: 14 }}>
            <Link className="btn btn--sm btn--ghost" href="/method">
              Открыть
            </Link>
          </p>
        </div>
      </div>

      <h2 className="site-h2">Нашли ошибку в цифрах</h2>
      <p className="site-p">
        Это самое ценное обращение, и оно идёт вне очереди. Пришлите поддомен, вкладку, период и
        число, которое считаете неверным, — мы поднимем расчёт по вашим данным и ответим, ошибка это
        или разница в определении метрики. Если ошибка наша, скажем прямо и напишем, что починили.
      </p>
      <p className="site-p">
        Разбор ошибки в собственной эвристике мы уже публиковали: она объявила парковкой этап, откуда
        сделки уходят в деньги. <Link href="/method/parking">Как это вышло и что мы сделали</Link>.
      </p>
    </SiteShell>
  );
}
