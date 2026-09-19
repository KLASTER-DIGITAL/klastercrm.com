import 'server-only';

/**
 * Данные личного кабинета: вход по коду, плательщик, аккаунты CRM, лицензии,
 * платежи и партнёрская программа.
 *
 * ГРАНИЦА. Здесь вся работа с таблицами кабинета и ни одной строки разметки.
 * Страницы получают готовые объекты и ничего не знают ни про SQL, ни про то,
 * что базы может не быть вовсе.
 *
 * БЕЗ БАЗЫ. `DATABASE_URL` не задан или инстанс спит — функции возвращают
 * `null` или пустые списки, а кабинет пишет человеку, что данные временно
 * недоступны. Это лучше белого экрана и честнее выдуманных чисел.
 */

import { createHash, randomInt } from 'node:crypto';
import { isDbConfigured, queryOne, queryRows, type SqlParam } from './db';
import { isMailConfigured, loginCodeEmail, sendMail } from './mail';
import { isSmsConfigured, loginCodeSms, normalizePhone, sendSms } from './sms';
import { partnerRate } from './partner';

/* ── сроки и пределы ───────────────────────────────────────────────────────
   Числа собраны здесь, потому что о них спрашивают: «сколько живёт код»,
   «сколько попыток». Разъехавшись с текстом на экране, они превращают
   понятный отказ в загадку. */

/** Код входа живёт 10 минут. */
export const CODE_TTL_MIN = 10;
/** Пять неверных попыток — код сгорает. */
export const CODE_MAX_ATTEMPTS = 5;
/** Не чаще одного кода в минуту на адрес. */
export const CODE_COOLDOWN_SEC = 60;
/** Код привязки аккаунта живёт 15 минут. */
export const LINK_TTL_MIN = 15;

const isProd = (): boolean => process.env.NODE_ENV === 'production';

export type Channel = 'email' | 'phone';
export type Crm = 'amo' | 'bitrix';
export type MemberRole = 'owner' | 'billing' | 'admin';

export interface CabinetUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
}

export interface Org {
  id: string;
  name: string;
  country: string | null;
  role: MemberRole;
}

export interface CrmAccount {
  id: string;
  crm: Crm;
  externalId: string;
  title: string | null;
  status: 'active' | 'revoked' | 'detached';
  connectedAt: string;
  lastSeenAt: string | null;
}

export interface License {
  crm: Crm;
  externalId: string;
  product: string;
  plan: string | null;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'revoked';
  periodEnd: string | null;
  trialEndsAt: string | null;
  key: string | null;
  accountTitle: string | null;
}

export interface Payment {
  id: number;
  product: string | null;
  plan: string | null;
  amountCents: number;
  currency: string;
  status: 'pending' | 'paid' | 'refunded' | 'canceled';
  method: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  invoiceUrl: string | null;
  actUrl: string | null;
}

/* ── вход по коду ──────────────────────────────────────────────────────────
   Код хранится хешем с солью из SESSION_SECRET: таблица, попавшая в чужие
   руки, не даёт войти, пока код ещё жив. */

function hashCode(channel: Channel, address: string, code: string): string {
  const salt = process.env['SESSION_SECRET'] ?? 'dev';
  return createHash('sha256').update(`${salt}:${channel}:${address}:${code}`).digest('hex');
}

/** Шесть цифр, включая ведущие нули. `randomInt` — криптостойкий источник. */
function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export type CodeRequest =
  | { ok: true; channel: Channel; address: string; delivered: boolean }
  | { ok: false; reason: 'bad_address' | 'channel_off' | 'too_soon' | 'no_db' | 'send_failed' };

/**
 * Выдать код входа. Адрес нормализуется до записи: почта — в нижний регистр,
 * телефон — в E.164. Иначе один человек заведётся в базе дважды.
 */
export async function requestCode(
  channelRaw: string,
  addressRaw: string,
  ip: string | null,
  lang: 'ru' | 'en',
): Promise<CodeRequest> {
  const channel: Channel | null =
    channelRaw === 'email' ? 'email' : channelRaw === 'phone' ? 'phone' : null;
  if (channel === null) return { ok: false, reason: 'bad_address' };

  let address: string | null = null;
  if (channel === 'email') {
    const e = addressRaw.trim().toLowerCase();
    address = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(e) && e.length <= 200 ? e : null;
  } else {
    if (!isSmsConfigured()) return { ok: false, reason: 'channel_off' };
    address = normalizePhone(addressRaw);
  }
  if (address === null) return { ok: false, reason: 'bad_address' };

  if (!isDbConfigured()) return { ok: false, reason: 'no_db' };

  try {
    /* Частота: один код в минуту на адрес. Считаем по последней строке, а не
       счётчиком в памяти, — инстансов на Vercel много, память у каждого своя. */
    const last = await queryOne<{ created_at: string }>(
      `select created_at from login_codes where channel = $1 and address = $2 order by id desc limit 1`,
      [channel, address],
    );
    if (last !== undefined) {
      const ageSec = (Date.now() - new Date(last.created_at).getTime()) / 1000;
      if (ageSec < CODE_COOLDOWN_SEC) return { ok: false, reason: 'too_soon' };
    }

    const code = newCode();
    await queryRows(
      `insert into login_codes (channel, address, code_hash, expires_at, ip)
       values ($1, $2, $3, now() + ($4 || ' minutes')::interval, $5)`,
      [channel, address, hashCode(channel, address, code), String(CODE_TTL_MIN), ip],
    );

    const res =
      channel === 'email'
        ? await (async () => {
            const mail = loginCodeEmail(code, lang);
            return sendMail(address, mail.subject, mail.text, mail.html);
          })()
        : await sendSms(address, loginCodeSms(code, lang));

    /* Не ушло — так и говорим. В разработке без SMTP код уже напечатан в лог,
       и вход возможен; на проде «отправлено» без письма — это ложь на экране,
       после которой человек десять минут ждёт код, которого нет. */
    if (!res.sent) {
      if (isProd()) return { ok: false, reason: 'send_failed' };
      return { ok: true, channel, address, delivered: false };
    }
    return { ok: true, channel, address, delivered: true };
  } catch (e) {
    console.error('[cabinet] код не выдан:', e instanceof Error ? e.message : e);
    return { ok: false, reason: 'no_db' };
  }
}

export type CodeCheck =
  | { ok: true; user: CabinetUser; org: Org | null }
  | { ok: false; reason: 'bad_code' | 'expired' | 'too_many' | 'no_db' };

/**
 * Проверить код и вернуть человека. Первый вход заводит и человека, и его
 * плательщика: кабинет без плательщика показывать нечего, а спрашивать
 * название компании на входе — лишний экран между человеком и целью.
 */
export async function verifyCode(
  channelRaw: string,
  addressRaw: string,
  code: string,
): Promise<CodeCheck> {
  const channel: Channel | null =
    channelRaw === 'email' ? 'email' : channelRaw === 'phone' ? 'phone' : null;
  if (channel === null) return { ok: false, reason: 'bad_code' };
  const address =
    channel === 'email' ? addressRaw.trim().toLowerCase() : (normalizePhone(addressRaw) ?? '');
  if (address.length === 0 || !/^\d{6}$/u.test(code.trim())) return { ok: false, reason: 'bad_code' };
  if (!isDbConfigured()) return { ok: false, reason: 'no_db' };

  try {
    const row = await queryOne<{ id: number; code_hash: string; attempts: number; expired: boolean; used: boolean }>(
      `select id, code_hash, attempts,
              (expires_at < now()) as expired,
              (used_at is not null) as used
         from login_codes
        where channel = $1 and address = $2
        order by id desc limit 1`,
      [channel, address],
    );
    if (row === undefined) return { ok: false, reason: 'bad_code' };
    if (row.used || row.expired) return { ok: false, reason: 'expired' };
    if (row.attempts >= CODE_MAX_ATTEMPTS) return { ok: false, reason: 'too_many' };

    if (row.code_hash !== hashCode(channel, address, code.trim())) {
      await queryRows(`update login_codes set attempts = attempts + 1 where id = $1`, [row.id]);
      return { ok: false, reason: 'bad_code' };
    }

    await queryRows(`update login_codes set used_at = now() where id = $1`, [row.id]);

    const user = await upsertUser(channel, address);
    const org = await primaryOrg(user.id, address, channel);
    return { ok: true, user, org };
  } catch (e) {
    console.error('[cabinet] код не проверен:', e instanceof Error ? e.message : e);
    return { ok: false, reason: 'no_db' };
  }
}

async function upsertUser(channel: Channel, address: string): Promise<CabinetUser> {
  const column = channel === 'email' ? 'email' : 'phone';
  const verified = channel === 'email' ? 'email_verified_at' : 'phone_verified_at';
  const existing = await queryOne<CabinetUser & { id: string }>(
    `update users_web set last_login_at = now(), ${verified} = coalesce(${verified}, now())
      where ${column} = $1
      returning id, email, phone, name`,
    [address],
  );
  if (existing !== undefined) return existing;

  const created = await queryOne<CabinetUser>(
    `insert into users_web (${column}, ${verified}, last_login_at) values ($1, now(), now())
     returning id, email, phone, name`,
    [address],
  );
  if (created === undefined) throw new Error('пользователь не создан');
  return created;
}

/**
 * Плательщик человека. Нет ни одного — заводим, и человек становится владельцем.
 * Название по умолчанию — его же адрес: спрашивать «как называется ваша
 * компания» до того, как человек увидел кабинет, незачем, переименует потом.
 */
async function primaryOrg(userId: string, address: string, channel: Channel): Promise<Org | null> {
  const found = await queryOne<Org>(
    `select o.id, o.name, o.country, m.role
       from org_members m join orgs o on o.id = m.org_id
      where m.user_id = $1
      order by m.created_at limit 1`,
    [userId],
  );
  if (found !== undefined) return found;

  const name = channel === 'email' ? (address.split('@')[1] ?? address) : address;
  const org = await queryOne<{ id: string; name: string; country: string | null }>(
    `insert into orgs (name) values ($1) returning id, name, country`,
    [name],
  );
  if (org === undefined) return null;
  await queryRows(`insert into org_members (org_id, user_id, role) values ($1, $2, 'owner')`, [org.id, userId]);
  return { ...org, role: 'owner' };
}

/** Какие каналы входа реально работают. Форма показывает только их. */
export function loginChannels(): { email: boolean; phone: boolean } {
  return { email: isDbConfigured(), phone: isDbConfigured() && isSmsConfigured() };
}

/** Настроена ли доставка писем — форма пишет правду, если нет. */
export const mailReady = isMailConfigured;

/* ── содержимое кабинета ───────────────────────────────────────────────── */

export interface CabinetData {
  org: Org | null;
  user: CabinetUser | null;
  accounts: CrmAccount[];
  licenses: License[];
  payments: Payment[];
  partner: PartnerSummary | null;
}

export async function loadCabinet(userId: string): Promise<CabinetData | null> {
  if (!isDbConfigured()) return null;
  try {
    const user = await queryOne<CabinetUser>(
      `select id, email, phone, name from users_web where id = $1`,
      [userId],
    );
    const org = await queryOne<Org>(
      `select o.id, o.name, o.country, m.role
         from org_members m join orgs o on o.id = m.org_id
        where m.user_id = $1
        order by m.created_at limit 1`,
      [userId],
    );
    if (org === undefined) {
      return { org: null, user: user ?? null, accounts: [], licenses: [], payments: [], partner: null };
    }

    const accounts = await queryRows<CrmAccount>(
      `select id, crm, external_id as "externalId", title, status,
              connected_at as "connectedAt", last_seen_at as "lastSeenAt"
         from crm_accounts where org_id = $1 order by connected_at`,
      [org.id],
    );
    const licenses = await queryRows<License>(
      `select l.crm, l.external_id as "externalId", l.product, l.plan, l.status,
              l.period_end as "periodEnd", l.trial_ends_at as "trialEndsAt", l.key,
              a.title as "accountTitle"
         from licenses_web l
         join crm_accounts a on a.crm = l.crm and a.external_id = l.external_id
        where a.org_id = $1
        order by l.product`,
      [org.id],
    );
    const payments = await queryRows<Payment>(
      `select id, product, plan, amount_cents as "amountCents", currency, status, method,
              period_start as "periodStart", period_end as "periodEnd", paid_at as "paidAt",
              invoice_url as "invoiceUrl", act_url as "actUrl"
         from payments where org_id = $1 order by created_at desc limit 50`,
      [org.id],
    );
    const partner = await loadPartner(userId);

    return { org, user: user ?? null, accounts, licenses, payments, partner };
  } catch (e) {
    console.error('[cabinet] данные не загружены:', e instanceof Error ? e.message : e);
    return null;
  }
}

/* ── привязка аккаунта CRM ─────────────────────────────────────────────────
   Вход по коду удостоверяет почту, а не аккаунт CRM. Между «я владею этой
   почтой» и «этот аккаунт мой» нет ничего, поэтому привязка идёт изнутри
   аккаунта: виджет, уже удостоверенный платформой, просит код, человек
   вводит его в кабинете. */

/** Код из шести знаков без похожих символов: его диктуют и переписывают руками. */
const LINK_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function newLinkCode(): string {
  let out = '';
  for (let i = 0; i < 6; i += 1) out += LINK_ALPHABET[randomInt(0, LINK_ALPHABET.length)];
  return out;
}

export async function issueLinkCode(
  crm: Crm,
  externalId: string,
  title: string | null,
): Promise<string | null> {
  if (!isDbConfigured()) return null;
  try {
    const code = newLinkCode();
    await queryRows(
      `insert into link_codes (crm, external_id, title, code, expires_at)
       values ($1, $2, $3, $4, now() + ($5 || ' minutes')::interval)`,
      [crm, externalId, title, code, String(LINK_TTL_MIN)],
    );
    return code;
  } catch (e) {
    console.error('[cabinet] код привязки не выдан:', e instanceof Error ? e.message : e);
    return null;
  }
}

export type LinkResult =
  | { ok: true; account: CrmAccount }
  | { ok: false; reason: 'bad_code' | 'expired' | 'taken' | 'no_org' | 'no_db' };

export async function useLinkCode(code: string, userId: string): Promise<LinkResult> {
  if (!isDbConfigured()) return { ok: false, reason: 'no_db' };
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/u.test(clean)) return { ok: false, reason: 'bad_code' };

  try {
    const org = await queryOne<{ id: string }>(
      `select org_id as id from org_members where user_id = $1 order by created_at limit 1`,
      [userId],
    );
    if (org === undefined) return { ok: false, reason: 'no_org' };

    const row = await queryOne<{ id: number; crm: Crm; external_id: string; title: string | null; dead: boolean }>(
      `select id, crm, external_id, title, (used_at is not null or expires_at < now()) as dead
         from link_codes where code = $1`,
      [clean],
    );
    if (row === undefined) return { ok: false, reason: 'bad_code' };
    if (row.dead) return { ok: false, reason: 'expired' };

    /* Аккаунт принадлежит ровно одному плательщику. Занят чужим — отказываем
       словом «занят», а не молча переписываем: иначе один кабинет забрал бы
       лицензию у другого. */
    const owner = await queryOne<{ org_id: string }>(
      `select org_id from crm_accounts where crm = $1 and external_id = $2`,
      [row.crm, row.external_id],
    );
    if (owner !== undefined && owner.org_id !== org.id) return { ok: false, reason: 'taken' };

    const account = await queryOne<CrmAccount>(
      `insert into crm_accounts (org_id, crm, external_id, title, last_seen_at)
       values ($1, $2, $3, $4, now())
       on conflict (crm, external_id) do update
          set title = excluded.title, status = 'active', last_seen_at = now(), revoked_at = null
       returning id, crm, external_id as "externalId", title, status,
                 connected_at as "connectedAt", last_seen_at as "lastSeenAt"`,
      [org.id, row.crm, row.external_id, row.title],
    );
    if (account === undefined) return { ok: false, reason: 'no_db' };

    await queryRows(`update link_codes set used_at = now(), used_by = $1 where id = $2`, [userId, row.id]);
    /* Лицензия этого аккаунта, заведённая до привязки, получает владельца. */
    await queryRows(
      `update licenses_web set crm_account_id = $1 where crm = $2 and external_id = $3`,
      [account.id, row.crm, row.external_id],
    );
    return { ok: true, account };
  } catch (e) {
    console.error('[cabinet] привязка не удалась:', e instanceof Error ? e.message : e);
    return { ok: false, reason: 'no_db' };
  }
}

/* ── партнёрская программа ─────────────────────────────────────────────── */

export interface PartnerSummary {
  id: string;
  code: string;
  status: 'pending' | 'active' | 'suspended';
  clientsActive: number;
  rate: number;
  pendingCents: number;
  approvedCents: number;
  paidCents: number;
  currency: string;
}

export async function loadPartner(userId: string): Promise<PartnerSummary | null> {
  if (!isDbConfigured()) return null;
  try {
    const p = await queryOne<{ id: string; code: string; status: PartnerSummary['status'] }>(
      `select id, code, status from partners where user_id = $1`,
      [userId],
    );
    if (p === undefined) return null;

    const stats = await queryOne<{
      clients: number;
      pending: number;
      approved: number;
      paid: number;
    }>(
      `select
         (select count(*)::int from referrals where partner_id = $1 and status = 'active') as clients,
         coalesce((select sum(amount_cents) from commissions where partner_id = $1 and status = 'pending'), 0)::bigint  as pending,
         coalesce((select sum(amount_cents) from commissions where partner_id = $1 and status = 'approved'), 0)::bigint as approved,
         coalesce((select sum(amount_cents) from commissions where partner_id = $1 and status = 'paid'), 0)::bigint     as paid`,
      [p.id],
    );

    const clientsActive = stats?.clients ?? 0;
    return {
      id: p.id,
      code: p.code,
      status: p.status,
      clientsActive,
      rate: partnerRate(clientsActive),
      pendingCents: Number(stats?.pending ?? 0),
      approvedCents: Number(stats?.approved ?? 0),
      paidCents: Number(stats?.paid ?? 0),
      currency: 'USD',
    };
  } catch (e) {
    console.error('[cabinet] партнёр не загружен:', e instanceof Error ? e.message : e);
    return null;
  }
}

export type { SqlParam };
