import { Mark } from '@/app/site/ui';
import { Icon } from '@/app/site/icons';
import { readSession } from '@/lib/auth';
import { isProviderConfigured } from '@/lib/auth-provider';
import { tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { CONTACTS, mailLink } from '@/lib/pricing';
import { LICENSE_DEMO, formatDate } from '@/lib/license-demo';
import { Overview } from './overview';
import { KeyCard, SubscriptionCard } from './panel';
import { CabinetShell } from './shell';
import { Soon } from './soon';
import c from './cabinet.module.css';

/**
 * Кабинет: обзор, аккаунты amoCRM, подписка, ключ, документы, команда,
 * уведомления, поддержка. Живых данных, оплаты и выдачи ключа пока нет
 * (docs/05 §11): и /cabinet, и /cabinet/demo показывают вымышленную компанию,
 * помеченную как демо. Живая версия отличается шапкой: почта и выход.
 *
 * Тексты — парами { ru, en }: меняешь русский — правь английский рядом.
 */

const ACCOUNTS: { subdomain: string; tariff: Bi; sync: Bi; state: 'ok' | 'stale' }[] = [
  {
    subdomain: 'demo.amocrm.ru',
    tariff: { ru: 'Расширенный · 15 оплаченных пользователей', en: 'Advanced · 15 paid users' },
    sync: { ru: 'готово · около 70 000 сделок · проверено 12 минут назад', en: 'done · about 70,000 deals · checked 12 minutes ago' },
    state: 'ok',
  },
  {
    subdomain: 'demo-second.amocrm.ru',
    tariff: { ru: 'Профессиональный · 8 оплаченных пользователей', en: 'Professional · 8 paid users' },
    sync: {
      ru: 'доступ отозван администратором — данные на месте, обновление остановлено',
      en: 'access revoked by an administrator — data is intact, updates stopped',
    },
    state: 'stale',
  },
];

const TEAM: { who: Bi; role: Bi; can: Bi }[] = [
  { who: { ru: 'Вы', en: 'You' }, role: { ru: 'Владелец', en: 'Owner' }, can: { ru: 'Тарифы, оплата, ключи, аккаунты', en: 'Plans, payments, keys, accounts' } },
  { who: { ru: 'Бухгалтерия', en: 'Accounting' }, role: { ru: 'Бухгалтер', en: 'Accountant' }, can: { ru: 'Только счета, акты и реквизиты', en: 'Invoices, acts and company details only' } },
  { who: { ru: 'Системный администратор', en: 'System administrator' }, role: { ru: 'Администратор', en: 'Administrator' }, can: { ru: 'Ключ и подключение аккаунтов, без денег', en: 'Key and account connections, no money' } },
];

const NOTIFY: { text: Bi; on: boolean }[] = [
  { text: { ru: 'Пробный период заканчивается через три дня', en: 'Trial ends in three days' }, on: true },
  { text: { ru: 'Платёж не прошёл', en: 'Payment failed' }, on: true },
  { text: { ru: 'Синхронизация сломалась или доступ отозван', en: 'Sync broke or access was revoked' }, on: true },
  { text: { ru: 'Еженедельный дайджест по воронке — понедельник, утро', en: 'Weekly funnel digest — Monday morning' }, on: false },
];

const T = {
  accounts: { ru: 'Аккаунты amoCRM', en: 'amoCRM accounts' },
  demoData: { ru: 'демо-данные', en: 'demo data' },
  amoPlan: { ru: 'Тариф amoCRM:', en: 'amoCRM plan:' },
  sync: { ru: 'Синхронизация:', en: 'Sync:' },
  reconnect: { ru: 'Переподключить', en: 'Reconnect' },
  refresh: { ru: 'Обновить сейчас', en: 'Refresh now' },
  unlink: { ru: 'Отвязать', en: 'Unlink' },
  addAccount: { ru: 'Подключить ещё аккаунт', en: 'Connect another account' },
  soonAccounts: { ru: 'Кнопки включатся вместе с входом и живыми данными', en: 'Buttons switch on together with sign-in and live data' },
  accountsP: {
    ru: 'Аккаунтов может быть сколько угодно: по юрлицам, проектам или клиентам. Подписка считается по каждому, счёт приходит один.',
    en: 'Any number of accounts: per legal entity, project or client. The subscription is counted per account, the invoice comes as one.',
  },
  docs: { ru: 'Счета и документы', en: 'Invoices and documents' },
  period: { ru: 'Период', en: 'Period' },
  paidFor: { ru: 'Что оплачено', en: 'Paid for' },
  amount: { ru: 'Сумма', en: 'Amount' },
  status: { ru: 'Статус', en: 'Status' },
  documents: { ru: 'Документы', en: 'Documents' },
  proTrial: { ru: 'Про · пробный период', en: 'Pro · trial' },
  free: { ru: 'бесплатно', en: 'free' },
  active: { ru: 'активен', en: 'active' },
  docsP: {
    ru: 'Счёт, акт и счёт-фактура появляются здесь после каждой оплаты, скачиваются в PDF. Возврат за первый оплаченный месяц — кнопкой рядом со счётом.',
    en: 'Invoice, act and tax invoice appear here after every payment, downloadable as PDF. A refund for the first paid month is one button next to the invoice.',
  },
  details: { ru: 'Реквизиты плательщика', en: 'Payer details' },
  detailsP: { ru: 'Заполняются один раз и подставляются во все документы.', en: 'Entered once and used in every document.' },
  fields: {
    ru: ['Название организации', 'ИНН', 'КПП', 'Юридический адрес', 'Подписант', 'Почта для документов'],
    en: ['Company name', 'Tax ID', 'Registration code', 'Legal address', 'Signatory', 'Email for documents'],
  },
  save: { ru: 'Сохранить реквизиты', en: 'Save details' },
  invoice: { ru: 'Выставить счёт', en: 'Issue an invoice' },
  soonPay: { ru: 'Оплата картой и по счёту включится вместе с платёжным провайдером', en: 'Card and invoice payments switch on together with the payment provider' },
  team: { ru: 'Команда', en: 'Team' },
  teamP: {
    ru: 'Платит финансовый директор, ставит виджет администратор, смотрит отчёты РОП. Пересылать ключ в мессенджере им не нужно.',
    en: 'The CFO pays, the admin installs the widget, the head of sales reads the reports. None of them needs to forward the key in a messenger.',
  },
  who: { ru: 'Кто', en: 'Who' },
  role: { ru: 'Роль', en: 'Role' },
  can: { ru: 'Что может', en: 'Can do' },
  invite: { ru: 'Пригласить по почте', en: 'Invite by email' },
  soonInvite: { ru: 'Приглашения включатся вместе с входом', en: 'Invitations switch on together with sign-in' },
  notifications: { ru: 'Уведомления', en: 'Notifications' },
  notifyP: {
    ru: 'Если синхронизация встала или платёж не прошёл, вы узнаете от нас, а не по пустым отчётам.',
    en: 'If sync stops or a payment fails, you hear it from us, not from empty reports.',
  },
  telegram: { ru: 'Привязать Telegram', en: 'Connect Telegram' },
  soonNotify: { ru: 'Письма и Telegram включатся вместе с входом', en: 'Emails and Telegram switch on together with sign-in' },
  support: { ru: 'Поддержка', en: 'Support' },
  supportP: {
    ru: 'Из вкладки «Лицензия» в виджете аккаунт, план и версия подставятся в письмо сами. Отвечаем в рабочее время, лично, без тикетов.',
    en: 'From the widget’s “Licence” tab your account, plan and version go into the email automatically. We answer in business hours, personally, no tickets.',
  },
  writeTg: { ru: 'Написать в Telegram', en: 'Write on Telegram' },
  subject: { ru: 'Аналитика KLASTER — вопрос из кабинета', en: 'KLASTER Analytics — question from the account' },
};

export async function CabinetView({ demo }: { demo: boolean }) {
  const lang = await getLang();
  const t = tr(lang);
  const session = demo ? null : await readSession();
  const providerOn = isProviderConfigured();

  return (
    <CabinetShell demo={demo || session === null} email={session?.email ?? null} providerOn={providerOn}>
      <Overview demo />

      <section className={c.card} id="аккаунты" aria-label={t(T.accounts)}>
        <div className={c.cardHead}>
          <h2 className={c.cardTitle}>{t(T.accounts)}</h2>
          <Mark kind="demo">{t(T.demoData)}</Mark>
        </div>
        <div className="acc-list">
          {ACCOUNTS.map((a) => (
            <div key={a.subdomain} className="acc">
              <div className="acc__main">
                <p className="acc__name">{a.subdomain}</p>
                <p className="acc__meta">
                  {t(T.amoPlan)} {t(a.tariff)}
                </p>
                <p className={`acc__sync${a.state === 'stale' ? ' acc__sync--warn' : ''}`}>
                  {t(T.sync)} {t(a.sync)}
                </p>
              </div>
              <div className="acc__actions">
                <button type="button" className={`btn btn--sm${a.state === 'stale' ? '' : ' btn--ghost'}`} disabled>
                  {a.state === 'stale' ? t(T.reconnect) : t(T.refresh)}
                </button>
                <button type="button" className="btn btn--ghost btn--sm" disabled>
                  {t(T.unlink)}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="contact-row">
          <button type="button" className="btn btn--ghost" disabled>
            {t(T.addAccount)}
          </button>
        </div>
        <Soon>{t(T.soonAccounts)}</Soon>
        <p className={c.cardP} style={{ marginTop: 12 }}>
          {t(T.accountsP)}
        </p>
      </section>

      <SubscriptionCard />
      <KeyCard />

      <section className={c.card} id="счета" aria-label={t(T.docs)}>
        <div className={c.cardHead}>
          <h2 className={c.cardTitle}>{t(T.docs)}</h2>
          <Mark kind="demo">{t(T.demoData)}</Mark>
        </div>
        <div className="cmp-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t(T.period)}</th>
                <th scope="col">{t(T.paidFor)}</th>
                <th scope="col">{t(T.amount)}</th>
                <th scope="col">{t(T.status)}</th>
                <th scope="col">{t(T.documents)}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="num">
                  {formatDate(LICENSE_DEMO.trialStart, lang)} — {formatDate(LICENSE_DEMO.trialEnd, lang)}
                </td>
                <td>{t(T.proTrial)}</td>
                <td>{t(T.free)}</td>
                <td>
                  <Mark kind="live">{t(T.active)}</Mark>
                </td>
                <td className="doc-cell">—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={c.cardP}>{t(T.docsP)}</p>

        <h3 className="card__h" style={{ marginTop: 22 }}>
          {t(T.details)}
        </h3>
        <p className={c.cardP}>{t(T.detailsP)}</p>
        <div className="req-grid">
          {t(T.fields).map((label) => (
            <label className="field" key={label}>
              <span className="field__label">{label}</span>
              <input className="field__input" disabled placeholder="—" aria-label={label} />
            </label>
          ))}
        </div>
        <div className="contact-row">
          <button type="button" className="btn btn--ghost" disabled>
            {t(T.save)}
          </button>
          <button type="button" className="btn btn--ghost" disabled>
            {t(T.invoice)}
          </button>
        </div>
        <Soon>{t(T.soonPay)}</Soon>
      </section>

      <section className={c.card} id="команда" aria-label={t(T.team)}>
        <div className={c.cardHead}>
          <h2 className={c.cardTitle}>{t(T.team)}</h2>
          <Mark kind="demo">{t(T.demoData)}</Mark>
        </div>
        <p className={c.cardP}>{t(T.teamP)}</p>
        <div className="cmp-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t(T.who)}</th>
                <th scope="col">{t(T.role)}</th>
                <th scope="col">{t(T.can)}</th>
              </tr>
            </thead>
            <tbody>
              {TEAM.map((m) => (
                <tr key={m.role.ru}>
                  <td>{t(m.who)}</td>
                  <td>{t(m.role)}</td>
                  <td>{t(m.can)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="contact-row">
          <button type="button" className="btn btn--ghost" disabled>
            {t(T.invite)}
          </button>
        </div>
        <Soon>{t(T.soonInvite)}</Soon>
      </section>

      <section className={c.card} id="уведомления" aria-label={t(T.notifications)}>
        <div className={c.cardHead}>
          <h2 className={c.cardTitle}>{t(T.notifications)}</h2>
          <Mark kind="demo">{t(T.demoData)}</Mark>
        </div>
        <p className={c.cardP}>{t(T.notifyP)}</p>
        <ul className="notify">
          {NOTIFY.map((n) => (
            <li key={n.text.ru}>
              <label className="check check--row">
                <input type="checkbox" defaultChecked={n.on} disabled />
                <span>{t(n.text)}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="contact-row">
          <button type="button" className="btn btn--ghost" disabled>
            {t(T.telegram)}
          </button>
        </div>
        <Soon>{t(T.soonNotify)}</Soon>
      </section>

      <section className={c.card} id="поддержка" aria-label={t(T.support)}>
        <h2 className={c.cardTitle}>{t(T.support)}</h2>
        <p className={c.cardP} style={{ marginTop: 8 }}>
          {t(T.supportP)}
        </p>
        {/* Каналы списком: которого нет в CONTACTS — того нет и на витрине. */}
        <div className="contact-row">
          {[
            { href: CONTACTS.telegram, label: t(T.writeTg), out: true },
            { href: CONTACTS.whatsapp, label: 'WhatsApp', out: true },
            { href: mailLink(t(T.subject)), label: CONTACTS.email, out: false },
          ]
            .filter((ch): ch is { href: string; label: string; out: boolean } => ch.href !== null)
            .map((ch, i) => (
              <a
                key={ch.label}
                className={i === 0 ? 'btn' : 'btn btn--ghost'}
                href={ch.href}
                target={ch.out ? '_blank' : undefined}
                rel={ch.out ? 'noopener noreferrer' : undefined}
              >
                {i === 0 && <Icon name="send" size={16} />}
                {ch.label}
              </a>
            ))}
        </div>
      </section>
    </CabinetShell>
  );
}
