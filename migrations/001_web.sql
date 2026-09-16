-- ═══════════════════════════════════════════════════════════════════════════
-- 001_web.sql — минимальная схема, которая нужна сайту и виджету СЕЙЧАС.
--
-- Живёт в Neon (бесплатный serverless Postgres), накатывается
-- `node scripts/db-neon.mjs`. Это НЕ схема аналитики: воронки, переходы и
-- справочники amoCRM лежат в отдельной базе воркера, миграции /migrations в
-- корне репозитория. Здесь только три таблицы, каждая обслуживает один роут.
--
-- Имена с суффиксом _web выбраны нарочно: если однажды обе базы съедутся в
-- одну, таблицы не столкнутся с licenses/license_checks из 004_license.sql.
--
-- Персональные данные: единственное, что мы храним о человеке, — контакт,
-- который он сам вписал в форму на лендинге, и IP. Больше ничего.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── заявки на ранний доступ ────────────────────────────────────────────────
create table if not exists early_access (
  id         bigserial primary key,
  subdomain  text,                       -- поддомен amoCRM, если человек его назвал
  contact    text not null,              -- как с ним связаться: почта, телеграм, телефон
  plan       text,                       -- какой тариф смотрел: start|pro|developer
  currency   text,                       -- в какой валюте видел цену
  comment    text,
  created_at timestamptz not null default now(),
  ip         inet,                       -- только для лимита частоты, чистим по сроку
  constraint early_access_contact_chk check (length(contact) between 3 and 200),
  constraint early_access_subdomain_chk check (subdomain is null or length(subdomain) <= 100),
  constraint early_access_comment_chk check (comment is null or length(comment) <= 2000)
);

create index if not exists early_access_created_idx on early_access (created_at desc);
create index if not exists early_access_ip_idx      on early_access (ip, created_at desc);

comment on table early_access is
  'Заявки с лендинга до открытия оплаты. Ни имени, ни компании не спрашиваем: контакт и есть всё, что нужно, чтобы ответить.';
comment on column early_access.ip is
  'Нужен только чтобы поймать заваливание формы с одного адреса. Записи старше 90 дней чистим по расписанию.';

-- ── лицензии, которыми управляет личный кабинет ────────────────────────────
create table if not exists licenses_web (
  account_id    bigint primary key,      -- account_id amoCRM, ключ привязан к нему
  key           text unique,
  plan          text,                    -- start|pro|developer
  status        text not null default 'trialing',
  currency      text,
  period_end    timestamptz,
  trial_ends_at timestamptz,
  updated_at    timestamptz not null default now(),
  constraint licenses_web_plan_chk
    check (plan is null or plan in ('start', 'pro', 'developer')),
  constraint licenses_web_status_chk
    check (status in ('trialing', 'active', 'past_due', 'canceled'))
);

create index if not exists licenses_web_status_idx on licenses_web (status, period_end);

comment on table licenses_web is
  'Состояние подписки на аккаунт amoCRM. Статуса оплаты в API amoCRM нет — проверено, поэтому источник истины здесь.';
comment on column licenses_web.account_id is
  'Ключ привязан к аккаунту, а не к пользователю: введённый в другом аккаунте не работает.';
comment on column licenses_web.period_end is
  'После окончания — grace 3 дня: предупреждение, отчёты работают. Дальше отчёты закрываются, синхронизация продолжает копить историю.';

-- ── аудит проверок ключа ───────────────────────────────────────────────────
create table if not exists license_checks_web (
  id         bigserial primary key,
  account_id bigint,                     -- без внешнего ключа: чужой ключ тоже пишем
  key        text,
  at         timestamptz not null default now(),
  ip         inet,
  ok         boolean not null,
  reason     text
);

create index if not exists license_checks_web_account_idx on license_checks_web (account_id, at desc);
create index if not exists license_checks_web_key_idx     on license_checks_web (key, at desc);

comment on table license_checks_web is
  'Журнал проверок. Ответ кэшируется на 15 минут, строк немного. Один ключ из разных account_id — это шаринг, видно отсюда.';
