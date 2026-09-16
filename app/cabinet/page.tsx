import type { Metadata } from 'next';
import { AmoFrame } from '../amo-frame';
import { KeyCard, SubscriptionCard } from './panel';
import { CONTACTS, mailLink } from '@/lib/pricing';
import { LICENSE_DEMO, formatDate } from '@/lib/license-demo';

export const metadata: Metadata = {
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  title: { absolute: 'Кабинет KLASTER' },
  description:
    'Аккаунты amoCRM, подписка, ключ лицензии, счета и команда. Входа пока нет: страница открыта как витрина, данные на ней вымышленные.',
  // Кабинет без авторизации в поиске делать нечего.
  robots: { index: false, follow: false },
};

/**
 * Кабинет: аккаунты amoCRM, подписка, ключ, документы, команда, уведомления.
 * Пока это витрина: входа нет, данные вымышленные. Ни одного реального клиента
 * здесь не показано — поддомены и номера аккаунтов выдуманы намеренно.
 * Авторизация и живые данные — этап 5, вместе с платёжным провайдером.
 */

function DemoPill({ text = 'демо-данные' }: { text?: string }) {
  return <span className="pill pill--demo">{text}</span>;
}

const ACCOUNTS = [
  {
    subdomain: 'demo.amocrm.ru',
    tariff: 'Расширенный · 15 оплаченных пользователей',
    sync: 'готово · около 70 000 сделок · проверено 12 минут назад',
    state: 'ok' as const,
  },
  {
    subdomain: 'demo-second.amocrm.ru',
    tariff: 'Профессиональный · 8 оплаченных пользователей',
    sync: 'доступ отозван администратором — данные на месте, обновление остановлено',
    state: 'stale' as const,
  },
];

const TEAM = [
  { who: 'Вы', role: 'Владелец', can: 'Тарифы, оплата, ключи, аккаунты' },
  { who: 'Бухгалтерия', role: 'Бухгалтер', can: 'Только счета, акты и реквизиты' },
  { who: 'Системный администратор', role: 'Администратор', can: 'Ключ и подключение аккаунтов, без денег' },
];

const NOTIFY = [
  { text: 'Пробный период заканчивается через три дня', on: true },
  { text: 'Платёж не прошёл', on: true },
  { text: 'Синхронизация сломалась или доступ отозван', on: true },
  { text: 'Еженедельный дайджест по воронке — понедельник, утро', on: false },
];

export default function Cabinet() {
  return (
    <AmoFrame
      title="Личный кабинет"
      titleAsH1
      caption="Кабинет KLASTER"
      sideItems={[
        { label: 'Аккаунты amoCRM', href: '#аккаунты', state: 'active' },
        { label: 'Подписка', href: '#подписка' },
        { label: 'Ключ лицензии', href: '#ключ' },
        { label: 'Счета и документы', href: '#счета' },
        { label: 'Команда', href: '#команда' },
        { label: 'Уведомления', href: '#уведомления' },
        { label: 'Поддержка', href: '#поддержка' },
        { label: '← Лендинг', href: '/' },
      ]}
      note={
        <>
          Это витрина личного кабинета. <strong>Компания, аккаунты и ключ здесь выдуманы</strong> — ни одного
          настоящего клиента на этой странице нет.
        </>
      }
      topRight={<DemoPill text="кабинет в разработке · всё вымышлено" />}
    >
      <div className="content">
        <section className="card notice">
          <h2 className="card__title">Входа сюда пока нет</h2>
          <p className="card__p">
            Настоящий кабинет открывается по ссылке из письма и показывает только ваши аккаунты. Этот — витрина:
            открыт всем и показывает выдуманную компанию с выдуманным ключом. Реальных клиентов здесь нет ни
            одного, и до появления входа не будет.
          </p>
        </section>

        <section className="card" id="аккаунты" aria-label="Аккаунты amoCRM">
          <div className="card__head">
            <h2 className="card__title">Аккаунты amoCRM</h2>
            <DemoPill />
          </div>
          <div className="acc-list">
            {ACCOUNTS.map((a) => (
              <div key={a.subdomain} className="acc">
                <div className="acc__main">
                  <p className="acc__name">{a.subdomain}</p>
                  <p className="acc__meta">Тариф amoCRM: {a.tariff}</p>
                  <p className={`acc__sync${a.state === 'stale' ? ' acc__sync--warn' : ''}`}>
                    Синхронизация: {a.sync}
                  </p>
                </div>
                <div className="acc__actions">
                  {a.state === 'stale' ? (
                    <button type="button" className="btn btn--sm" disabled title="Появится вместе с авторизацией">
                      Переподключить
                    </button>
                  ) : (
                    <button type="button" className="btn btn--ghost btn--sm" disabled title="Появится вместе с авторизацией">
                      Обновить сейчас
                    </button>
                  )}
                  <button type="button" className="btn btn--ghost btn--sm" disabled title="Появится вместе с авторизацией">
                    Отвязать
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="contact-row">
            <button type="button" className="btn btn--ghost" disabled title="Появится вместе с авторизацией">
              Подключить ещё аккаунт
            </button>
          </div>
          <p className="card__p card__p--tight">
            Аккаунтов может быть сколько угодно: по юрлицам, по проектам, по клиентам, если вы интегратор.
            Подписка считается по каждому отдельно, счёт приходит один.
          </p>
        </section>

        <SubscriptionCard />
        <KeyCard />

        <section className="card" id="счета" aria-label="Счета и документы">
          <div className="card__head">
            <h2 className="card__title">Счета и документы</h2>
            <DemoPill />
          </div>
          <div className="cmp-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Период</th>
                  <th scope="col">Что оплачено</th>
                  <th scope="col">Сумма</th>
                  <th scope="col">Статус</th>
                  <th scope="col">Документы</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="num">
                    {formatDate(LICENSE_DEMO.trialStart, 'ru')} — {formatDate(LICENSE_DEMO.trialEnd, 'ru')}
                  </td>
                  <td>Про · пробный период</td>
                  <td>бесплатно</td>
                  <td>
                    <span className="pill pill--ok">активен</span>
                  </td>
                  <td className="doc-cell">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="card__p card__p--tight">
            Счёт, акт и счёт-фактура будут появляться здесь после каждой оплаты — скачиваются в PDF, отдельно
            просить не нужно. Оплата картой и по счёту включится вместе с платёжным провайдером.
          </p>

          <h3 className="card__h" style={{ marginTop: 20 }}>Реквизиты плательщика</h3>
          <p className="card__p">
            Заполняются один раз и подставляются во все документы. Бухгалтерии не придётся ничего у вас
            выпрашивать.
          </p>
          <div className="req-grid">
            {['Название организации', 'ИНН', 'КПП', 'Юридический адрес', 'Подписант', 'Почта для документов'].map(
              (label) => (
                <label className="field" key={label}>
                  <span className="field__label">{label}</span>
                  <input className="field__input" disabled placeholder="—" aria-label={label} />
                </label>
              ),
            )}
          </div>
          <div className="contact-row">
            <button type="button" className="btn btn--ghost" disabled title="Появится вместе с авторизацией">
              Сохранить реквизиты
            </button>
            <button type="button" className="btn btn--ghost" disabled title="Появится вместе с платёжным провайдером">
              Выставить счёт
            </button>
          </div>
        </section>

        <section className="card" id="команда" aria-label="Команда">
          <div className="card__head">
            <h2 className="card__title">Команда</h2>
            <DemoPill />
          </div>
          <p className="card__p">
            Платит финансовый директор, ставит виджет системный администратор, смотрит отчёты РОП. Это разные
            люди, и пересылать друг другу ключ лицензии в мессенджере им не нужно.
          </p>
          <div className="cmp-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Кто</th>
                  <th scope="col">Роль</th>
                  <th scope="col">Что может</th>
                </tr>
              </thead>
              <tbody>
                {TEAM.map((t) => (
                  <tr key={t.role}>
                    <td>{t.who}</td>
                    <td>{t.role}</td>
                    <td>{t.can}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="contact-row">
            <button type="button" className="btn btn--ghost" disabled title="Появится вместе с авторизацией">
              Пригласить по почте
            </button>
          </div>
        </section>

        <section className="card" id="уведомления" aria-label="Уведомления">
          <div className="card__head">
            <h2 className="card__title">Уведомления</h2>
            <DemoPill />
          </div>
          <p className="card__p">
            Молча ломаться — плохая привычка сервисов. Если синхронизация встала или платёж не прошёл, вы
            узнаете об этом от нас, а не по пустым отчётам.
          </p>
          <ul className="notify">
            {NOTIFY.map((n) => (
              <li key={n.text}>
                <label className="check check--row">
                  <input type="checkbox" defaultChecked={n.on} disabled />
                  <span>{n.text}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="contact-row">
            <button type="button" className="btn btn--ghost" disabled title="Появится вместе с авторизацией">
              Привязать Telegram
            </button>
          </div>
        </section>

        <section className="card" id="поддержка" aria-label="Поддержка">
          <h2 className="card__title">Поддержка</h2>
          <p className="card__p">
            Пишите на почту: из вкладки «Лицензия» в виджете аккаунт, план и версия подставятся в письмо сами —
            диктовать ничего не придётся. Отвечаем в рабочее время, в раннем доступе — лично, без тикетов и
            номеров обращений.
          </p>
          {/* Каналы списком: которого нет в CONTACTS — того нет и на витрине,
              кнопка в никуда хуже отсутствующей. Впишут адрес — вернётся сама,
              править эту страницу не придётся. Первый уцелевший канал — основной,
              иначе блок остаётся без главного действия. */}
          <div className="contact-row">
            {[
              { href: CONTACTS.telegram, label: 'Написать в Telegram', out: true },
              { href: CONTACTS.whatsapp, label: 'WhatsApp', out: true },
              { href: mailLink('Аналитика KLASTER — вопрос из кабинета'), label: CONTACTS.email, out: false },
            ]
              .filter((c): c is { href: string; label: string; out: boolean } => c.href !== null)
              .map((c, i) => (
                <a
                  key={c.label}
                  className={i === 0 ? 'btn' : 'btn btn--ghost'}
                  href={c.href}
                  target={c.out ? '_blank' : undefined}
                  rel={c.out ? 'noopener noreferrer' : undefined}
                >
                  {c.label}
                </a>
              ))}
          </div>
        </section>
      </div>
    </AmoFrame>
  );
}
