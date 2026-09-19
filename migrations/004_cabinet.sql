-- ═══════════════════════════════════════════════════════════════════════════
-- 004_cabinet.sql — настоящий личный кабинет: плательщик, люди, аккаунты CRM,
-- привязка виджета к кабинету и партнёрская программа.
--
-- ЧТО БЫЛО НЕ ТАК. До этой миграции «кабинетом» была витрина с вымышленными
-- данными, а вся модель лицензии сводилась к строке на `account_id` amoCRM.
-- Три вещи в неё не помещались:
--
--   1. Один клиент — несколько аккаунтов CRM. Это уже наш случай: два
--      застройщика в Батуми, у каждого свой аккаунт, счёт один.
--   2. Bitrix24. Его портал не имеет `account_id` типа bigint: устойчивый
--      идентификатор там `member_id` — строка. Ключ лицензии обязан быть парой
--      (какая CRM, какой идентификатор), иначе первый же портал Bitrix24
--      потребует переносить боевые лицензии.
--   3. Партнёр, который приводит клиентов и получает комиссию с их подписок.
--
-- ПОЧЕМУ ИДЕНТИФИКАТОРЫ ТЕКСТОВЫЕ И С ПРЕФИКСОМ. `org_3f2b…` в логе, в письме
-- поддержки и в чужой выгрузке читается сам: видно, что это организация, а не
-- аккаунт и не лицензия. Перепутанный bigint из двух таблиц — это тихая
-- ошибка, перепутанный префикс — заметная.
--
-- Миграция идемпотентна: повторный прогон ничего не ломает.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── организация-плательщик ─────────────────────────────────────────────────
--
-- Не «компания клиента» в юридическом смысле, а то, на что выставляется счёт и
-- к чему привязаны аккаунты CRM. У интегратора это он сам, у застройщика —
-- юрлицо, у частного пилота — человек.

create table if not exists orgs (
  id            text primary key default ('org_' || replace(gen_random_uuid()::text, '-', '')),
  name          text not null,
  country       text,
  -- Реквизиты для счетов и актов. Заполняются один раз, подставляются в документы.
  legal         jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  constraint orgs_name_chk check (length(name) between 1 and 200)
);

comment on table orgs is
  'Плательщик. Один плательщик — сколько угодно аккаунтов CRM и сколько угодно людей в кабинете; счёт при этом один.';
comment on column orgs.legal is
  'Реквизиты: название юрлица, ИНН, КПП, адрес, подписант, почта для документов. jsonb, потому что набор полей разный в Грузии, Казахстане и России.';

-- ── человек в кабинете ─────────────────────────────────────────────────────
--
-- Пароля нет и не будет: вход по одноразовому коду на почту или телефон.
-- Паролю нужны хранение, восстановление, утечки и вторая форма.
--
-- Почта ИЛИ телефон — хотя бы одно. Оба поля уникальны, но допускают NULL:
-- человек, вошедший по телефону, может не оставить почту вовсе.

create table if not exists users_web (
  id             text primary key default ('usr_' || replace(gen_random_uuid()::text, '-', '')),
  email          text,
  phone          text,
  name           text,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  created_at     timestamptz not null default now(),
  last_login_at  timestamptz,
  constraint users_web_contact_chk check (email is not null or phone is not null),
  constraint users_web_email_chk check (email is null or email = lower(email)),
  -- E.164 без пробелов и скобок: +995579151731. Нормализуется в приложении.
  constraint users_web_phone_chk check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$')
);

create unique index if not exists users_web_email_key on users_web (email) where email is not null;
create unique index if not exists users_web_phone_key on users_web (phone) where phone is not null;

comment on table users_web is
  'Человек, входящий в кабинет. Почта хранится только в нижнем регистре, телефон только в E.164 — иначе один и тот же человек заведётся дважды.';

-- ── кто в какой организации и с какими правами ─────────────────────────────
--
-- Роли те же, что показывает кабинет: владелец платит, бухгалтер видит только
-- документы, администратор подключает аккаунты, но не трогает деньги.

create table if not exists org_members (
  org_id     text not null references orgs(id) on delete cascade,
  user_id    text not null references users_web(id) on delete cascade,
  role       text not null default 'owner',
  invited_by text references users_web(id),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id),
  constraint org_members_role_chk check (role in ('owner', 'billing', 'admin'))
);

create index if not exists org_members_user_idx on org_members (user_id);

comment on column org_members.role is
  'owner — тарифы, оплата, ключи, аккаунты. billing — только счета, акты и реквизиты. admin — ключ и подключение аккаунтов, без денег.';

-- ── одноразовые коды входа ─────────────────────────────────────────────────
--
-- Код шестизначный, живёт 10 минут, сгорает после пяти неверных попыток и
-- после первого удачного ввода. Хранится ХЕШЕМ: утёкшая таблица не должна
-- давать войти, пока код ещё жив.
--
-- Строка создаётся на каждый запрос кода, а не обновляется: иначе повторный
-- запрос гасил бы код, который человек уже вводит с другого устройства.

create table if not exists login_codes (
  id         bigserial primary key,
  channel    text not null,
  address    text not null,
  code_hash  text not null,
  expires_at timestamptz not null,
  attempts   int not null default 0,
  used_at    timestamptz,
  created_at timestamptz not null default now(),
  ip         inet,
  constraint login_codes_channel_chk check (channel in ('email', 'phone'))
);

create index if not exists login_codes_lookup_idx on login_codes (channel, address, created_at desc);
create index if not exists login_codes_expiry_idx on login_codes (expires_at);

comment on table login_codes is
  'Одноразовые коды входа. Хранится хеш, а не код: таблица в чужих руках не должна давать вход. Строки старше суток чистятся по расписанию.';

-- ── аккаунт CRM, подключённый к кабинету ───────────────────────────────────
--
-- ГЛАВНОЕ РЕШЕНИЕ ЭТОЙ МИГРАЦИИ: ключ аккаунта — пара (crm, external_id).
--
--   amo    → external_id = account_id аккаунта amoCRM (число, но хранится
--            текстом: это идентификатор, а не величина, складывать его не с чем).
--   bitrix → external_id = member_id портала. Именно member_id, а не адрес:
--            адрес портала меняется при переезде, member_id остаётся.
--
-- `title` — то, что человек узнаёт глазами (поддомен, адрес портала). Оно
-- меняется, и на нём ничего не держится.

create table if not exists crm_accounts (
  id            text primary key default ('acc_' || replace(gen_random_uuid()::text, '-', '')),
  org_id        text not null references orgs(id) on delete cascade,
  crm           text not null,
  external_id   text not null,
  title         text,
  status        text not null default 'active',
  connected_at  timestamptz not null default now(),
  last_seen_at  timestamptz,
  revoked_at    timestamptz,
  constraint crm_accounts_crm_chk check (crm in ('amo', 'bitrix')),
  constraint crm_accounts_status_chk check (status in ('active', 'revoked', 'detached')),
  constraint crm_accounts_external_chk check (length(external_id) between 1 and 100)
);

create unique index if not exists crm_accounts_key on crm_accounts (crm, external_id);
create index if not exists crm_accounts_org_idx on crm_accounts (org_id, status);

comment on table crm_accounts is
  'Аккаунт CRM, привязанный к плательщику. Один аккаунт принадлежит ровно одному плательщику — иначе два кабинета спорили бы за одну лицензию.';
comment on column crm_accounts.status is
  'revoked — администратор CRM отозвал доступ. Это НЕ «не оплачено»: ключ жив, деньги не тратятся, продукт обязан назвать причину именно так.';

-- ── код привязки аккаунта к кабинету ───────────────────────────────────────
--
-- ЗАЧЕМ ОТДЕЛЬНЫЙ КОД. Вход в кабинет удостоверяет почту, а не аккаунт CRM.
-- Между «я владею этой почтой» и «этот аккаунт amoCRM мой» нет ничего, и без
-- явного шага любой вошедший мог бы вписать чужой номер аккаунта.
--
-- Шаг такой: во вкладке «Лицензия» виджета, то есть уже ВНУТРИ аккаунта CRM,
-- нажимается «Привязать к кабинету». Виджет просит у нашего API код —
-- запрос подписан токеном CRM, значит аккаунт удостоверен платформой. Код
-- живёт 15 минут и вводится в кабинете. Так обе стороны доказаны.

create table if not exists link_codes (
  id          bigserial primary key,
  crm         text not null,
  external_id text not null,
  title       text,
  code        text not null unique,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  used_by     text references users_web(id),
  created_at  timestamptz not null default now(),
  constraint link_codes_crm_chk check (crm in ('amo', 'bitrix'))
);

create index if not exists link_codes_expiry_idx on link_codes (expires_at);

comment on table link_codes is
  'Код привязки аккаунта CRM к кабинету. Выдаётся только запросу, подписанному платформой, — то есть изнутри самого аккаунта.';

-- ── лицензии: (crm, external_id, product) вместо (account_id, product) ─────
--
-- СОВМЕСТИМОСТЬ. Виджет аналитики шлёт `account_id` и не знает ни про `crm`,
-- ни про `external_id`. Поэтому колонка `account_id` остаётся на месте, а
-- `crm` получает умолчание `amo`: все существующие строки продолжают быть
-- лицензиями amoCRM и отвечают ровно как вчера.

alter table licenses_web add column if not exists crm text not null default 'amo';
alter table licenses_web add column if not exists external_id text;
alter table licenses_web add column if not exists crm_account_id text references crm_accounts(id);

update licenses_web set external_id = account_id::text where external_id is null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_name = 'licenses_web' and column_name = 'external_id' and is_nullable = 'YES'
  ) and not exists (select 1 from licenses_web where external_id is null) then
    alter table licenses_web alter column external_id set not null;
  end if;
end $$;

alter table licenses_web drop constraint if exists licenses_web_crm_chk;
alter table licenses_web add constraint licenses_web_crm_chk check (crm in ('amo', 'bitrix'));

-- Первичный ключ: (account_id, product) → (crm, external_id, product).
--
-- ПОРЯДОК ВАЖЕН И ПРОВЕРЕН НА ЖИВОЙ БАЗЕ. Снять NOT NULL с `account_id` можно
-- только ПОСЛЕ того, как он перестал быть частью первичного ключа: Postgres
-- отвечает «column "account_id" is in a primary key» и откатывает миграцию.
do $$
declare
  cols int;
begin
  select cardinality(conkey) into cols
    from pg_constraint
   where conrelid = 'licenses_web'::regclass and contype = 'p';

  if cols = 2 then
    alter table licenses_web drop constraint licenses_web_pkey;
    alter table licenses_web add constraint licenses_web_pkey
      primary key (crm, external_id, product);
  end if;
end $$;

-- Теперь account_id можно освободить: у портала Bitrix24 числового id нет.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_name = 'licenses_web' and column_name = 'account_id' and is_nullable = 'NO'
  ) then
    alter table licenses_web alter column account_id drop not null;
  end if;
end $$;

-- Статус `revoked` — отзыв доступа администратором CRM. Отдельно от `canceled`:
-- клиент платит, продукт молчит, и виноваты выглядим мы. Различать обязательно.
alter table licenses_web drop constraint if exists licenses_web_status_chk;
alter table licenses_web add constraint licenses_web_status_chk
  check (status in ('trialing', 'active', 'past_due', 'canceled', 'revoked'));

create index if not exists licenses_web_account_link_idx on licenses_web (crm_account_id);

-- ── платежи и документы ────────────────────────────────────────────────────
--
-- Платёжного провайдера ещё нет, но кабинет уже обязан показывать историю:
-- ручная оплата по счёту — такой же платёж, просто заведённый нами.

create table if not exists payments (
  id            bigserial primary key,
  org_id        text not null references orgs(id) on delete cascade,
  crm_account_id text references crm_accounts(id),
  product       text,
  plan          text,
  amount_cents  bigint not null,
  currency      text not null,
  status        text not null default 'pending',
  method        text,
  period_start  date,
  period_end    date,
  paid_at       timestamptz,
  invoice_url   text,
  act_url       text,
  created_at    timestamptz not null default now(),
  constraint payments_status_chk check (status in ('pending', 'paid', 'refunded', 'canceled')),
  constraint payments_amount_chk check (amount_cents >= 0)
);

create index if not exists payments_org_idx on payments (org_id, created_at desc);

comment on column payments.method is
  'card | invoice | crypto | manual. Пока провайдера нет, все строки — invoice или manual, и кабинет об этом пишет прямо.';

-- ── партнёрская программа ──────────────────────────────────────────────────
--
-- МОДЕЛЬ. Партнёр приводит клиента, клиент платит, партнёр получает процент с
-- КАЖДОГО платежа, пока клиент платит. Разовая выплата за приведённого клиента
-- не работает на подписке: партнёру выгодно привести кого угодно и забыть, а
-- нам нужен тот, кто останется.
--
-- Ставка ступенчатая и считается по числу активных клиентов партнёра. Ступень
-- пересчитывается на момент начисления, а не задаётся руками: иначе ставка
-- разъедется с условиями на сайте.

create table if not exists partners (
  id            text primary key default ('prt_' || replace(gen_random_uuid()::text, '-', '')),
  user_id       text not null references users_web(id) on delete cascade,
  org_id        text references orgs(id),
  code          text not null unique,
  company       text,
  legal_form    text,
  status        text not null default 'pending',
  payout_details jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  approved_at   timestamptz,
  constraint partners_status_chk check (status in ('pending', 'active', 'suspended')),
  constraint partners_legal_chk
    check (legal_form is null or legal_form in ('individual', 'self_employed', 'entrepreneur', 'company')),
  constraint partners_code_chk check (code ~ '^[a-z0-9-]{3,32}$')
);

create unique index if not exists partners_user_key on partners (user_id);

comment on column partners.code is
  'Метка в ссылке и промокоде: klastercrm.com/?p=<code>. Только строчные латинские буквы, цифры и дефис — код диктуют голосом.';
comment on column partners.legal_form is
  'Физлицо, самозанятый, ИП или компания. От этого зависят документы на выплату, а не размер комиссии.';

-- Приведённый клиент. Фиксируется за партнёром навсегда по первому касанию:
-- спор «кто привёл» решается меткой и датой, а не перепиской.
create table if not exists referrals (
  id             bigserial primary key,
  partner_id     text not null references partners(id) on delete cascade,
  org_id         text references orgs(id),
  contact        text,
  company        text,
  source         text not null default 'link',
  status         text not null default 'lead',
  first_touch_at timestamptz not null default now(),
  signed_at      timestamptz,
  note           text,
  constraint referrals_source_chk check (source in ('link', 'promo', 'manual')),
  constraint referrals_status_chk check (status in ('lead', 'signed', 'active', 'lost'))
);

create unique index if not exists referrals_org_key on referrals (org_id) where org_id is not null;
create index if not exists referrals_partner_idx on referrals (partner_id, status);

comment on index referrals_org_key is
  'Одна организация числится ровно за одним партнёром. Без этого два партнёра предъявили бы права на одного клиента.';

-- Начисление комиссии. Одна строка на один платёж клиента.
create table if not exists commissions (
  id            bigserial primary key,
  partner_id    text not null references partners(id) on delete cascade,
  referral_id   bigint references referrals(id) on delete set null,
  payment_id    bigint references payments(id) on delete set null,
  kind          text not null default 'subscription',
  base_cents    bigint not null,
  currency      text not null,
  rate          numeric(5, 2) not null,
  amount_cents  bigint not null,
  status        text not null default 'pending',
  period        text,
  created_at    timestamptz not null default now(),
  approved_at   timestamptz,
  paid_at       timestamptz,
  payout_id     bigint,
  constraint commissions_kind_chk check (kind in ('subscription', 'service')),
  constraint commissions_status_chk check (status in ('pending', 'approved', 'paid', 'canceled')),
  constraint commissions_rate_chk check (rate >= 0 and rate <= 100)
);

create index if not exists commissions_partner_idx on commissions (partner_id, status, created_at desc);
create unique index if not exists commissions_payment_key on commissions (payment_id) where payment_id is not null;

comment on index commissions_payment_key is
  'Один платёж — одно начисление. Повторный прогон расчёта не должен платить партнёру дважды.';
comment on column commissions.status is
  'pending — платёж получен, идёт срок возврата. approved — можно выплачивать. paid — выплачено. canceled — возврат клиенту, комиссия снята.';

-- Выплата партнёру. Собирает подтверждённые начисления в одну сумму.
create table if not exists payouts (
  id           bigserial primary key,
  partner_id   text not null references partners(id) on delete cascade,
  amount_cents bigint not null,
  currency     text not null,
  status       text not null default 'requested',
  method       text,
  requested_at timestamptz not null default now(),
  paid_at      timestamptz,
  note         text,
  constraint payouts_status_chk check (status in ('requested', 'processing', 'paid', 'rejected')),
  constraint payouts_amount_chk check (amount_cents > 0)
);

create index if not exists payouts_partner_idx on payouts (partner_id, requested_at desc);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'commissions_payout_fk'
  ) then
    alter table commissions add constraint commissions_payout_fk
      foreign key (payout_id) references payouts(id) on delete set null;
  end if;
end $$;

-- ── партнёр в заявке с лендинга ────────────────────────────────────────────
--
-- Метка `?p=<код>` кладётся кукой в middleware и живёт 90 дней. Без этой
-- колонки она никуда не попадала бы: заявка приходила бы «ниоткуда», а партнёр
-- узнавал бы о своём клиенте из переписки. Спор «кто привёл» решается строкой
-- в базе с датой, а не памятью двух людей.

alter table early_access add column if not exists partner_code text;

create index if not exists early_access_partner_idx on early_access (partner_code, created_at desc)
  where partner_code is not null;

comment on column early_access.partner_code is
  'Код партнёра из метки в ссылке или промокода. Первое касание сильнее последнего: middleware не перетирает уже стоящую куку.';
