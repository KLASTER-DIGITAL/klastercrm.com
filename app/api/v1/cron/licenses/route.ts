/**
 * GET /api/v1/cron/licenses — суточный проход по срокам лицензий.
 *
 * ЗАЧЕМ. 04.11.2026 у Like House встало распределение: подписка кончилась 31.10,
 * трое суток отсрочки прошли незаметно, и заявки перестали расходиться по
 * менеджерам. Предупредить было нечем: виджет считает «осталось три дня», но
 * канала доставки у него нет вовсе, а задача «уведомить» падала с ошибкой
 * «отправка не подключена». Решение (K-378): за сроком следит кабинет. Он один
 * знает дату, продукт и адресатов, и только он может заметить, что виджет
 * работает без строки лицензии.
 *
 * ПОЧЕМУ ЗДЕСЬ, А НЕ В КАЖДОМ ВИДЖЕТЕ. Виджетов четыре, и каждому пришлось бы
 * отдать почтовый пароль и свою копию этого кода. А главное: виджет, которого в
 * кабинете нет, о себе не напомнит по определению — именно это и случилось.
 *
 * ЧТО ДЕЛАЕТ ЗА ОДИН ПРОХОД:
 *   1. Лицензии со сроком (оплаченные и пробные) — письмо за 7, 3 и 1 сутки, в
 *      день окончания и в день, когда отсрочка кончилась. Одно письмо на
 *      событие: отметки в `license_notices`.
 *   2. Аккаунты, чьи виджеты за сутки спрашивали лицензию, которой в кабинете
 *      нет, — письмо владельцу линейки, не чаще раза в сутки.
 *
 * Проход идемпотентен в пределах суток: второй запуск в тот же день не
 * отправляет ничего, потому что отметка уже стоит. Поэтому крон можно дёргать
 * руками, не боясь задвоить письма.
 *
 * ДОСТУП. Vercel Cron шлёт `Authorization: Bearer $CRON_SECRET` сам, если
 * переменная задана в проекте. Тот же секрет принимается в `x-cron-secret` —
 * так проход дёргается руками через curl. Секрет не задан: на проде роут
 * отвечает 503 и не делает ничего (открытый роут рассылки — это чужая рука на
 * нашей почте), в разработке работает без секрета.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { isDbConfigured, queryRows } from '@/lib/db';
import { isMailConfigured, sendMail } from '@/lib/mail';
import { COMPANY } from '@/lib/company';
import { dueNotice, type NoticeKind } from '@/lib/license-notices';
import {
  clientNotice,
  graceDaysFor,
  ownerNotice,
  type NoticeContext,
  type Product,
} from '@/lib/license-notice-mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Проход ходит в базу и на SMTP по каждому аккаунту: минута с запасом. */
export const maxDuration = 60;

const DAY_MS = 86_400_000;

/**
 * Куда уходит служебное письмо. Отдельная переменная, а не адрес поддержки по
 * умолчанию: письма о деньгах и сроках читает владелец линейки, а не общая
 * почта, куда пишут клиенты.
 */
function ownerRecipients(): string[] {
  const raw = (process.env['LICENSE_NOTICE_TO'] ?? '').trim();
  const list = raw
    .split(/[,\s]+/u)
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.includes('@'));
  return list.length > 0 ? [...new Set(list)] : [COMPANY.email];
}

/**
 * Дата срока называется в этой таймзоне. Срок стоит на конец дня по месту
 * клиента (у Like House `23:59:59+04`), а таймзоны аккаунта в кабинете нет —
 * она живёт в базе виджета. При положительном смещении UTC-дата совпадает с
 * местной, поэтому UTC здесь безопасен; переменная оставлена, чтобы однажды
 * не пришлось править код из-за клиента западнее Лондона.
 */
function timeZone(): string {
  const tz = (process.env['LICENSE_NOTICE_TZ'] ?? '').trim();
  return tz === '' ? 'UTC' : tz;
}

interface LicenseRow {
  account_id: string;
  external_id: string;
  product: string;
  plan: string | null;
  status: string;
  period_end: string | null;
  trial_ends_at: string | null;
  org_name: string | null;
  account_title: string | null;
}

interface NoticeRow {
  kind: string;
}

interface MemberRow {
  email: string;
}

interface ForgottenRow {
  account_id: string;
  checks: number;
  account_title: string | null;
  org_name: string | null;
}

type Outcome = 'sent' | 'skipped_late' | 'no_recipient' | 'failed';

interface Report {
  checked: number;
  sent: { account: string; product: string; kind: string; to: string[] }[];
  skipped: { account: string; product: string; kind: string }[];
  failed: { account: string; product: string; kind: string; error: string }[];
  forgotten: string[];
}

/** Продукт из базы — из словаря, иначе письмо назвало бы его `undefined`. */
function asProduct(value: string): Product | null {
  return value === 'klaster_analytics' || value === 'klaster_distribution' || value === 'klaster_amobell'
    ? value
    : null;
}

async function mark(
  accountId: string,
  product: string,
  kind: string,
  periodEnd: Date,
  outcome: Outcome,
  recipients: readonly string[],
  error: string | null,
): Promise<void> {
  /* ON CONFLICT DO UPDATE, а не DO NOTHING: отметка о сбое почты должна
     смениться на «отправлено», когда почта починится и проход пойдёт снова. */
  await queryRows(
    `insert into license_notices (account_id, product, kind, period_end, at, outcome, recipients, error)
     values ($1, $2, $3, $4, now(), $5, $6::text[], $7)
     on conflict (account_id, product, kind, period_end) do update
        set at = now(), outcome = excluded.outcome,
            recipients = excluded.recipients, error = excluded.error`,
    [
      Number(accountId),
      product,
      kind,
      periodEnd.toISOString(),
      outcome,
      `{${recipients.map((r) => `"${r}"`).join(',')}}`,
      error,
    ],
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = (process.env['CRON_SECRET'] ?? '').trim();
  const isProd = process.env.NODE_ENV === 'production';
  if (secret === '') {
    if (isProd) {
      console.error('[cron:licenses] CRON_SECRET не задан — проход отключён');
      return NextResponse.json({ ok: false, reason: 'no_cron_secret' }, { status: 503 });
    }
  } else {
    const header = request.headers.get('authorization') ?? '';
    const own = request.headers.get('x-cron-secret') ?? '';
    const ok = header === `Bearer ${secret}` || own === secret;
    if (!ok) return NextResponse.json({ ok: false, reason: 'forbidden' }, { status: 401 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, reason: 'no_database' }, { status: 503 });
  }

  /* `dry=1` — посмотреть, что бы ушло, ничего не отправляя и не отмечая. Нужен,
     чтобы проверить проход на живых данных до первого письма клиенту. */
  const dry = request.nextUrl.searchParams.get('dry') === '1';
  /* Подменить «сегодня» можно только вне прода: иначе любой, кто знает секрет,
     разослал бы письма об остановке, сдвинув дату на месяц вперёд. */
  const nowParam = request.nextUrl.searchParams.get('now');
  const now = !isProd && nowParam !== null ? new Date(nowParam) : new Date();
  if (Number.isNaN(now.getTime())) {
    return NextResponse.json({ ok: false, reason: 'bad_now' }, { status: 400 });
  }

  const tz = timeZone();
  const owner = ownerRecipients();
  const report: Report = { checked: 0, sent: [], skipped: [], failed: [], forgotten: [] };

  /* ── 1. Лицензии со сроком ─────────────────────────────────────────────── */

  const licenses = await queryRows<LicenseRow>(
    `select l.account_id::text as account_id, l.external_id, l.product, l.plan, l.status,
            l.period_end, l.trial_ends_at,
            o.name as org_name, a.title as account_title
       from licenses_web l
       left join crm_accounts a on a.crm = l.crm and a.external_id = l.external_id
       left join orgs o on o.id = a.org_id
      where l.status in ('trialing', 'active', 'past_due')
        and coalesce(l.period_end, l.trial_ends_at) is not null
      order by coalesce(l.period_end, l.trial_ends_at)`,
  );

  for (const row of licenses) {
    const product = asProduct(row.product);
    if (product === null) continue;
    const untilRaw = row.period_end ?? row.trial_ends_at;
    if (untilRaw === null) continue;
    const until = new Date(untilRaw);
    if (Number.isNaN(until.getTime())) continue;
    report.checked += 1;

    const graceDays = graceDaysFor(row.status);
    const graceUntil = new Date(until.getTime() + graceDays * DAY_MS);

    const done = await queryRows<NoticeRow>(
      `select kind from license_notices
        where account_id = $1 and product = $2 and period_end = $3`,
      [Number(row.account_id), row.product, until.toISOString()],
    );

    const decision = dueNotice({
      now,
      until,
      graceDays,
      done: new Set(done.map((d) => d.kind as NoticeKind)),
    });

    const ctx: NoticeContext = {
      product,
      until,
      graceUntil,
      daysLeft: decision.daysLeft,
      timeZone: tz,
      accountId: Number(row.account_id),
      accountTitle: row.account_title,
      orgName: row.org_name,
      plan: row.plan,
      status: row.status,
    };

    /* Запоздавшие события закрываем отметкой без письма: напоминание «за семь
       дней», пришедшее за два, вводит в заблуждение. */
    for (const kind of decision.skip) {
      report.skipped.push({ account: row.external_id, product: row.product, kind });
      if (!dry) await mark(row.account_id, row.product, kind, until, 'skipped_late', [], null);
    }

    if (decision.send === null) continue;
    const kind = decision.send;

    /* Клиенту пишем на подтверждённые адреса членов кабинета. Неподтверждённый
       адрес — это кто-то, кто ввёл почту и не вошёл; письмо о деньгах туда
       отправлять нельзя. */
    const members = await queryRows<MemberRow>(
      `select distinct u.email
         from crm_accounts a
         join org_members m on m.org_id = a.org_id
         join users_web u on u.id = m.user_id
        where a.crm = 'amo' and a.external_id = $1
          and u.email is not null and u.email_verified_at is not null`,
      [row.external_id],
    );
    const clients = members.map((m) => m.email).filter((email) => !owner.includes(email));

    if (dry) {
      report.sent.push({ account: row.external_id, product: row.product, kind, to: [...clients, ...owner] });
      continue;
    }

    if (!isMailConfigured()) {
      report.failed.push({ account: row.external_id, product: row.product, kind, error: 'mail_not_configured' });
      await mark(row.account_id, row.product, kind, until, 'failed', [], 'mail_not_configured');
      continue;
    }

    const errors: string[] = [];
    const delivered: string[] = [];

    for (const to of clients) {
      const letter = clientNotice(kind, ctx, 'ru');
      const result = await sendMail(to, letter.subject, letter.text, letter.html);
      if (result.sent) delivered.push(to);
      else errors.push(`${to}: ${result.error ?? 'not_sent'}`);
    }

    /* Служебное письмо уходит ПОСЛЕ клиентского и знает, кому оно ушло: так в
       нём видно и то, что клиент предупреждён, и то, что предупреждать было
       некого. */
    const ownerLetter = ownerNotice(kind, ctx, delivered);
    for (const to of owner) {
      const result = await sendMail(to, ownerLetter.subject, ownerLetter.text, ownerLetter.html);
      if (result.sent) delivered.push(to);
      else errors.push(`${to}: ${result.error ?? 'not_sent'}`);
    }

    if (delivered.length > 0) {
      report.sent.push({ account: row.external_id, product: row.product, kind, to: delivered });
      await mark(row.account_id, row.product, kind, until, 'sent', delivered, errors.length > 0 ? errors.join('; ') : null);
    } else {
      const error = errors.length > 0 ? errors.join('; ') : 'no_recipient';
      report.failed.push({ account: row.external_id, product: row.product, kind, error });
      await mark(row.account_id, row.product, kind, until, errors.length > 0 ? 'failed' : 'no_recipient', [], error);
    }
  }

  /* ── 2. Виджеты без строки лицензии ────────────────────────────────────── */

  /* Журнал проверок уже пишет каждый запрос виджета с причиной отказа — отдельно
     ловить это в самом роуте лицензии не нужно, и письмо не окажется в горячем
     пути проверки ключа. Берём аккаунты, которые кабинет знает (есть в
     crm_accounts): незнакомый account_id — это чей-то чужой или ошибочный
     запрос, а не наш забытый клиент. */
  const forgotten = await queryRows<ForgottenRow>(
    `select c.account_id::text as account_id,
            count(*)::int as checks,
            a.title as account_title, o.name as org_name
       from license_checks_web c
       join crm_accounts a on a.crm = 'amo' and a.external_id = c.account_id::text
       left join orgs o on o.id = a.org_id
      where c.ok = false and c.reason = 'not_found' and c.at > $1
      group by c.account_id, a.title, o.name`,
    [new Date(now.getTime() - DAY_MS).toISOString()],
  );

  /* Продукт в журнале проверок не записан (колонки нет), поэтому письмо говорит
     про аккаунт, а не про конкретный виджет, и отметка кладётся на служебный
     ключ `no_license` с нулевым сроком: одно письмо в сутки на аккаунт. */
  const EPOCH = new Date(0);
  for (const row of forgotten) {
    const already = await queryRows<{ at: string }>(
      `select at::text from license_notices
        where account_id = $1 and product = 'all' and kind = 'no_license'
          and period_end = $2 and at > $3`,
      [Number(row.account_id), EPOCH.toISOString(), new Date(now.getTime() - DAY_MS).toISOString()],
    );
    if (already.length > 0) continue;

    report.forgotten.push(row.account_id);
    if (dry) continue;

    const ctx: NoticeContext = {
      product: 'klaster_distribution',
      until: EPOCH,
      graceUntil: EPOCH,
      daysLeft: 0,
      timeZone: tz,
      accountId: Number(row.account_id),
      accountTitle: row.account_title,
      orgName: row.org_name,
      plan: null,
      status: `Проверок за сутки: ${String(row.checks)}`,
    };
    const letter = ownerNotice('no_license', ctx, []);

    const delivered: string[] = [];
    const errors: string[] = [];
    if (isMailConfigured()) {
      for (const to of owner) {
        const result = await sendMail(to, letter.subject, letter.text, letter.html);
        if (result.sent) delivered.push(to);
        else errors.push(`${to}: ${result.error ?? 'not_sent'}`);
      }
    } else {
      errors.push('mail_not_configured');
    }

    await mark(
      row.account_id,
      'all',
      'no_license',
      EPOCH,
      delivered.length > 0 ? 'sent' : 'failed',
      delivered,
      errors.length > 0 ? errors.join('; ') : null,
    );
  }

  console.info(
    JSON.stringify({
      event: 'cron_licenses',
      dry,
      checked: report.checked,
      sent: report.sent.length,
      skipped: report.skipped.length,
      failed: report.failed.length,
      forgotten: report.forgotten.length,
    }),
  );

  return NextResponse.json({ ok: true, dry, ...report });
}
