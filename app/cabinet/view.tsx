import Link from 'next/link';
import { Icon } from '@/app/site/icons';
import { Mark } from '@/app/site/ui';
import { readSession } from '@/lib/auth';
import { tr, fmt, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { CONTACTS, mailLink } from '@/lib/pricing';
import { loadCabinet, type CabinetData, type CrmAccount, type License } from '@/lib/cabinet';
import { MIN_PAYOUT_USD, PARTNER_TIERS, SERVICE_RATE, partnerTier } from '@/lib/partner';
import { CabinetShell } from './shell';
import { LinkAccount } from './link-account';
import c from './cabinet.module.css';

/**
 * Кабинет: живые данные плательщика.
 *
 * ЧТО ИЗ НЕГО УБРАНО И ПОЧЕМУ. Раньше здесь была витрина с вымышленной
 * компанией, восемью разделами и переключателем семи состояний ключа. Из них
 * человеку, вошедшему в СВОЙ кабинет, нужны четыре вещи: что у меня подключено,
 * до какого числа оплачено, где документы и с кем говорить. Остальное было
 * демонстрацией возможностей самому себе.
 *
 * Разделы: подключения (аккаунт + его лицензия одной карточкой — это одна и та
 * же вещь), документы, команда, партнёрская программа, поддержка.
 */

const T = {
  /* ── пусто ── */
  emptyTitle: { ru: 'Подключите первый аккаунт', en: 'Connect your first account' },
  emptyText: {
    ru: 'Откройте виджет в amoCRM, вкладка «Лицензия» → «Привязать к кабинету». Виджет покажет шесть знаков — введите их здесь.',
    en: 'Open the widget in amoCRM, the “Licence” tab → “Link to account”. The widget shows six characters — enter them here.',
  },
  emptyWhy: {
    ru: 'Почему так, а не вводом номера аккаунта: номер знает любой, кто видел адрес вашей CRM. Код выдаётся только изнутри самого аккаунта.',
    en: 'Why not just type the account number: anyone who has seen your CRM address knows it. The code is issued only from inside the account itself.',
  },

  /* ── подключения ── */
  connections: { ru: 'Подключения', en: 'Connections' },
  addAccount: { ru: 'Подключить ещё аккаунт', en: 'Connect another account' },
  noLicense: { ru: 'Лицензии нет', en: 'No licence' },
  until: { ru: 'до', en: 'until' },
  keyLabel: { ru: 'Ключ', en: 'Key' },
  lastSeen: { ru: 'последняя проверка', en: 'last checked' },
  never: { ru: 'ещё не проверялся', en: 'not checked yet' },

  /* ── статусы ── */
  st_trialing: { ru: 'пробный период', en: 'trial' },
  st_active: { ru: 'оплачен', en: 'paid' },
  st_past_due: { ru: 'оплата не поступила', en: 'payment overdue' },
  st_canceled: { ru: 'остановлен', en: 'stopped' },
  st_revoked: { ru: 'доступ отозван', en: 'access revoked' },
  revokedWhat: {
    ru: 'Администратор CRM отключил интеграцию. Оплата ни при чём: ключ жив, деньги не тратятся. Переподключите доступ — синхронизация продолжится с места остановки.',
    en: 'A CRM administrator disconnected the integration. Payment has nothing to do with it: the key is alive, no money is spent. Reconnect and sync resumes where it stopped.',
  },
  pastDueWhat: {
    ru: 'Период оплаты закончился. Отчёты работают ещё три дня, потом закрываются. История продолжает копиться.',
    en: 'The paid period has ended. Reports keep working for three more days, then close. History keeps accumulating.',
  },

  /* ── документы ── */
  docs: { ru: 'Счета и документы', en: 'Invoices and documents' },
  noDocs: {
    ru: 'Оплат ещё не было. Счёт выставляем на юрлицо, акт и счёт-фактура появятся здесь после оплаты.',
    en: 'No payments yet. We invoice your company; the act and tax invoice appear here after payment.',
  },
  period: { ru: 'Период', en: 'Period' },
  what: { ru: 'Что оплачено', en: 'Paid for' },
  amount: { ru: 'Сумма', en: 'Amount' },
  status: { ru: 'Статус', en: 'Status' },
  documents: { ru: 'Документы', en: 'Documents' },
  paid: { ru: 'оплачен', en: 'paid' },
  pending: { ru: 'ожидает оплаты', en: 'awaiting payment' },

  /* ── команда ── */
  team: { ru: 'Команда', en: 'Team' },
  teamText: {
    ru: 'Платит финансовый директор, ставит виджет администратор, смотрит отчёты РОП. Пересылать ключ в мессенджере им не нужно.',
    en: 'The CFO pays, the admin installs the widget, the head of sales reads the reports. None of them needs to forward the key in a messenger.',
  },
  you: { ru: 'Вы', en: 'You' },
  invite: { ru: 'Пригласить по почте', en: 'Invite by email' },
  soonTeam: { ru: 'Приглашения включим в ближайшем обновлении', en: 'Invitations arrive in the next update' },

  /* ── партнёрка ── */
  partner: { ru: 'Партнёрская программа', en: 'Partner programme' },
  partnerJoin: {
    ru: 'Приводите клиентов и получайте процент с каждого их платежа, пока они платят.',
    en: 'Bring clients and earn a percentage of every payment they make, for as long as they pay.',
  },
  partnerRates: {
    ru: (rates: string) => `Ставка ${rates} растёт по числу активных клиентов. За переданный контакт, которого ведём мы, — ${SERVICE_RATE}%.`,
    en: (rates: string) => `The rate ${rates} grows with the number of active clients. For a contact you pass on and we handle — ${SERVICE_RATE}%.`,
  },
  partnerMore: { ru: 'Условия программы', en: 'Programme terms' },
  yourLink: { ru: 'Ваша ссылка', en: 'Your link' },
  yourTier: { ru: 'Ступень', en: 'Tier' },
  clients: { ru: 'Активных клиентов', en: 'Active clients' },
  toPay: { ru: 'К выплате', en: 'To be paid' },
  onHold: { ru: 'Ожидает подтверждения', en: 'Awaiting approval' },
  paidOut: { ru: 'Выплачено', en: 'Paid out' },
  minPayout: {
    ru: `Выплата от $${MIN_PAYOUT_USD}, раз в месяц, после подтверждения платежей клиентов.`,
    en: `Payouts from $${MIN_PAYOUT_USD}, once a month, after client payments clear.`,
  },
  partnerPending: {
    ru: 'Заявка на рассмотрении. Ответим в рабочий день и откроем раздел полностью.',
    en: 'Your application is under review. We answer within a business day and open the section.',
  },

  /* ── поддержка ── */
  support: { ru: 'Поддержка', en: 'Support' },
  supportText: {
    ru: 'Пишите напрямую тем, кто пишет код. Из вкладки «Лицензия» аккаунт, план и версия подставятся в письмо сами.',
    en: 'Write directly to the people who write the code. From the “Licence” tab your account, plan and version go into the email automatically.',
  },
  writeTg: { ru: 'Написать в Telegram', en: 'Write on Telegram' },
  subject: { ru: 'Вопрос из кабинета KLASTER', en: 'Question from the KLASTER account' },

  /* ── нет базы ── */
  offlineTitle: { ru: 'Данные временно недоступны', en: 'Data is temporarily unavailable' },
  offlineText: {
    ru: 'База не отвечает. Это наша авария, а не проблема с вашей подпиской: виджеты продолжают работать. Напишите нам, если это надолго.',
    en: 'The database is not responding. This is our outage, not a problem with your subscription: the widgets keep working. Write to us if it lasts.',
  },
};

const STATUS_LABEL: Record<License['status'], Bi> = {
  trialing: T.st_trialing,
  active: T.st_active,
  past_due: T.st_past_due,
  canceled: T.st_canceled,
  revoked: T.st_revoked,
};

const STATUS_MARK: Record<License['status'], 'live' | 'estimate' | 'danger'> = {
  trialing: 'live',
  active: 'live',
  past_due: 'estimate',
  canceled: 'danger',
  revoked: 'danger',
};

const PRODUCT_NAME: Record<string, Bi> = {
  klaster_analytics: { ru: 'Аналитика KLASTER', en: 'KLASTER Analytics' },
  klaster_distribution: { ru: 'Распределение KLASTER', en: 'KLASTER Routing' },
};

const CRM_NAME: Record<string, string> = { amo: 'amoCRM', bitrix: 'Bitrix24' };

function fdate(iso: string | null, lang: 'ru' | 'en'): string {
  if (iso === null) return '—';
  return new Date(iso).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export async function CabinetView(): Promise<React.ReactElement> {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);
  const session = await readSession();
  const userId = session?.cabUser ?? null;
  const data: CabinetData | null = userId === null ? null : await loadCabinet(userId);

  const shell = (children: React.ReactNode): React.ReactElement => (
    <CabinetShell email={session?.email ?? null} orgName={data?.org?.name ?? null} hasPartner={data?.partner !== null}>
      {children}
    </CabinetShell>
  );

  /* База молчит — говорим об этом прямо и не рисуем пустой кабинет. */
  if (data === null) {
    return shell(
      <section className={c.card}>
        <h2 className={c.cardTitle}>{t(T.offlineTitle)}</h2>
        <p className={c.cardP} style={{ marginTop: 8 }}>
          {t(T.offlineText)}
        </p>
        <div className="contact-row" style={{ marginTop: 16 }}>
          <a className="btn" href={mailLink(t(T.subject))}>
            <Icon name="mail" size={16} />
            {CONTACTS.email}
          </a>
        </div>
      </section>,
    );
  }

  const byAccount = new Map<string, License[]>();
  for (const l of data.licenses) {
    const key = `${l.crm}:${l.externalId}`;
    byAccount.set(key, [...(byAccount.get(key) ?? []), l]);
  }

  const rates = PARTNER_TIERS.map((x) => `${x.rate}%`).join(' → ');
  const tier = partnerTier(data.partner?.clientsActive ?? 0);
  const usd = (cents: number): string => `$${n.format(Math.round(cents / 100))}`;

  return shell(
    <>
      {/* ── подключения ── */}
      <section className={c.card} id="подключения" aria-label={t(T.connections)}>
        <div className={c.cardHead}>
          <h2 className={c.cardTitle}>{t(T.connections)}</h2>
        </div>

        {data.accounts.length === 0 ? (
          <>
            <h3 className={c.emptyTitle}>{t(T.emptyTitle)}</h3>
            <p className={c.cardP}>{t(T.emptyText)}</p>
            <LinkAccount />
            <p className={c.hint}>{t(T.emptyWhy)}</p>
          </>
        ) : (
          <>
            <div className={c.connList}>
              {data.accounts.map((a: CrmAccount) => {
                const licenses = byAccount.get(`${a.crm}:${a.externalId}`) ?? [];
                return (
                  <article key={a.id} className={c.conn}>
                    <div className={c.connHead}>
                      <span className={c.connCrm}>{CRM_NAME[a.crm] ?? a.crm}</span>
                      <b className={c.connTitle}>{a.title ?? a.externalId}</b>
                      {a.status === 'revoked' && <Mark kind="danger">{t(T.st_revoked)}</Mark>}
                    </div>

                    {licenses.length === 0 ? (
                      <p className={c.cardP}>{t(T.noLicense)}</p>
                    ) : (
                      licenses.map((l) => (
                        <div key={l.product} className={c.lic}>
                          <div className={c.licMain}>
                            <b>{t(PRODUCT_NAME[l.product] ?? { ru: l.product, en: l.product })}</b>
                            <Mark kind={STATUS_MARK[l.status]}>{t(STATUS_LABEL[l.status])}</Mark>
                          </div>
                          <p className={c.licMeta}>
                            {l.plan !== null && <span>{l.plan}</span>}
                            {l.periodEnd !== null && (
                              <span>
                                {t(T.until)} {fdate(l.periodEnd, lang)}
                              </span>
                            )}
                            {l.key !== null && (
                              <span className={c.key}>
                                {t(T.keyLabel)}: {l.key}
                              </span>
                            )}
                          </p>
                          {l.status === 'revoked' && <p className={c.warn}>{t(T.revokedWhat)}</p>}
                          {l.status === 'past_due' && <p className={c.warn}>{t(T.pastDueWhat)}</p>}
                        </div>
                      ))
                    )}

                    <p className={c.hint}>
                      {t(T.lastSeen)}: {a.lastSeenAt === null ? t(T.never) : fdate(a.lastSeenAt, lang)}
                    </p>
                  </article>
                );
              })}
            </div>
            <details className={c.more}>
              <summary>{t(T.addAccount)}</summary>
              <LinkAccount />
            </details>
          </>
        )}
      </section>

      {/* ── документы ── */}
      <section className={c.card} id="счета" aria-label={t(T.docs)}>
        <div className={c.cardHead}>
          <h2 className={c.cardTitle}>{t(T.docs)}</h2>
        </div>
        {data.payments.length === 0 ? (
          <p className={c.cardP}>{t(T.noDocs)}</p>
        ) : (
          <div className="cmp-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{t(T.period)}</th>
                  <th scope="col">{t(T.what)}</th>
                  <th scope="col">{t(T.amount)}</th>
                  <th scope="col">{t(T.status)}</th>
                  <th scope="col">{t(T.documents)}</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="num">
                      {fdate(p.periodStart, lang)} — {fdate(p.periodEnd, lang)}
                    </td>
                    <td>{p.product === null ? '—' : t(PRODUCT_NAME[p.product] ?? { ru: p.product, en: p.product })}</td>
                    <td className="num">{usd(p.amountCents)}</td>
                    <td>
                      <Mark kind={p.status === 'paid' ? 'live' : 'estimate'}>
                        {t(p.status === 'paid' ? T.paid : T.pending)}
                      </Mark>
                    </td>
                    <td className="doc-cell">
                      {p.invoiceUrl !== null ? <a href={p.invoiceUrl}>PDF</a> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── партнёрская программа ── */}
      <section className={c.card} id="партнёрам" aria-label={t(T.partner)}>
        <div className={c.cardHead}>
          <h2 className={c.cardTitle}>{t(T.partner)}</h2>
          {data.partner !== null && <Mark kind="live">{t(tier.name)}</Mark>}
        </div>

        {data.partner === null ? (
          <>
            <p className={c.cardP}>{t(T.partnerJoin)}</p>
            <p className={c.cardP}>{t(T.partnerRates)(rates)}</p>
            <div className="contact-row" style={{ marginTop: 16 }}>
              <Link className="btn" href="/partners">
                {t(T.partnerMore)}
                <Icon name="arrow" size={16} />
              </Link>
            </div>
          </>
        ) : data.partner.status === 'pending' ? (
          <p className={c.cardP}>{t(T.partnerPending)}</p>
        ) : (
          <>
            <div className={c.three} style={{ marginTop: 8 }}>
              <div className={c.q}>
                <span className={c.qLabel}>{t(T.clients)}</span>
                <p className={c.qBig}>{data.partner.clientsActive}</p>
                <p className={c.qP}>
                  {t(T.yourTier)}: {t(tier.name)} · {data.partner.rate}%
                </p>
              </div>
              <div className={c.q}>
                <span className={c.qLabel}>{t(T.toPay)}</span>
                <p className={c.qBig}>{usd(data.partner.approvedCents)}</p>
                <p className={c.qP}>
                  {t(T.onHold)}: {usd(data.partner.pendingCents)}
                </p>
              </div>
              <div className={c.q}>
                <span className={c.qLabel}>{t(T.paidOut)}</span>
                <p className={c.qBig}>{usd(data.partner.paidCents)}</p>
                <p className={c.qP}>{t(T.minPayout)}</p>
              </div>
            </div>
            <p className={c.cardP} style={{ marginTop: 16 }}>
              {t(T.yourLink)}: <code className={c.key}>klastercrm.com/?p={data.partner.code}</code>
            </p>
          </>
        )}
      </section>

      {/* ── команда ── */}
      <section className={c.card} id="команда" aria-label={t(T.team)}>
        <div className={c.cardHead}>
          <h2 className={c.cardTitle}>{t(T.team)}</h2>
        </div>
        <p className={c.cardP}>{t(T.teamText)}</p>
        <p className={c.cardP} style={{ marginTop: 12 }}>
          <b>{t(T.you)}</b> — {data.user?.email ?? data.user?.phone ?? '—'} · {data.org?.role ?? 'owner'}
        </p>
        <div className="contact-row" style={{ marginTop: 14 }}>
          <button type="button" className="btn btn--ghost" disabled>
            {t(T.invite)}
          </button>
        </div>
        <p className={c.hint}>{t(T.soonTeam)}</p>
      </section>

      {/* ── поддержка ── */}
      <section className={c.card} id="поддержка" aria-label={t(T.support)}>
        <h2 className={c.cardTitle}>{t(T.support)}</h2>
        <p className={c.cardP} style={{ marginTop: 8 }}>
          {t(T.supportText)}
        </p>
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
    </>,
  );
}
