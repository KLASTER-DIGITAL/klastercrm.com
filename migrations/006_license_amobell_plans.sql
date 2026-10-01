-- ── Тарифы колокола: «Базовый» и «Про», период 1 / 6 / 12 месяцев ─────────
--
-- ЗАЧЕМ. До 01.10.2026 у KLASTER AMOBELL планов не было: строка лицензии
-- хранила `plan = null`, и ответ открывал один список возможностей. Владелец
-- ввёл два плана — «Базовый» ($25) и «Про» ($50) за аккаунт в месяц — и периоды
-- 1, 6 и 12 месяцев со своей скидкой (lib/pricing.ts, блок AMOBELL). Без этой
-- миграции база не примет `plan = 'base'` (словарь 003 знает пять планов), а
-- полгода от года по строке не отличить: `period_end` говорит, до какого числа,
-- но не на какой срок выдан ключ.
--
-- СОВМЕСТИМОСТЬ. Словарь планов только расширяется: `pro` в нём уже есть (план
-- аналитики), добавляется `base`. Строки колокола с `plan = null` остаются как
-- есть, роут отвечает на них `plan: null` и списком «Базового». `period_months`
-- — новая колонка, null у всех старых строк; роут читает её так, что до наката
-- этой миграции ответ не ломается (app/api/v1/license/route.ts).
--
-- Миграция идемпотентна. Словарь планов пересоздаётся, только если в нём ещё
-- нет `base`: так следующая миграция, которая его расширит, не упадёт на
-- повторном прогоне этой (тот же приём, что в 003 для словаря продуктов).

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'licenses_web'::regclass and conname = 'licenses_web_plan_chk'
       and pg_get_constraintdef(oid) like '%''base''%'
  ) then
    alter table licenses_web drop constraint if exists licenses_web_plan_chk;
    alter table licenses_web add constraint licenses_web_plan_chk
      check (plan is null or plan in ('start', 'pro', 'developer', 'half_year', 'year', 'base'));
  end if;
end $$;

alter table licenses_web add column if not exists period_months smallint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'licenses_web'::regclass and conname = 'licenses_web_period_months_chk'
  ) then
    alter table licenses_web add constraint licenses_web_period_months_chk
      check (period_months is null or period_months in (1, 6, 12));
  end if;
end $$;

comment on column licenses_web.plan is
  'Аналитика: start | pro | developer. Распределение: half_year | year. Колокол: base | pro (null — строка до тарифов колокола, ответ открывает «Базовый»).';
comment on column licenses_web.period_months is
  'На сколько месяцев выдан ключ: 1 | 6 | 12. Отличает полгода от года при одинаковом period_end. null — не записано (строки до 006) или триал.';
