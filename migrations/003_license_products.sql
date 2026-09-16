-- ── Лицензии на несколько продуктов линейки KLASTER ────────────────────────
--
-- ЗАЧЕМ. Кабинет один на всю линейку, а продуктов стало два: «Аналитика KLASTER»
-- и «Распределение KLASTER». До этой миграции строка лицензии была одна на
-- аккаунт, и роут отвечал про подписку, не называя продукт. Для распределения
-- это означало бы ответ про чужую подписку: «active» сделало бы его бессрочно
-- бесплатным, «canceled» — остановило бы у того, кто заплатил.
--
-- СОВМЕСТИМОСТЬ. Колонка добавляется с умолчанием `klaster_analytics`, поэтому
-- все существующие строки остаются лицензиями аналитики, а виджет аналитики,
-- который про продукты ничего не знает и поля не шлёт, получает ровно то же, что
-- получал вчера.
--
-- Миграция идемпотентна: повторный прогон ничего не делает.

alter table licenses_web
  add column if not exists product text not null default 'klaster_analytics';

comment on column licenses_web.product is
  'Продукт линейки: klaster_analytics | klaster_distribution. Ключ лицензии привязан к паре (аккаунт, продукт): подписка на аналитику не открывает распределение и наоборот.';

-- Первичный ключ: account_id → (account_id, product).
-- Меняется только если он ещё одноколоночный, иначе повторный прогон упал бы.
do $$
declare
  cols int;
begin
  select cardinality(conkey) into cols
    from pg_constraint
   where conrelid = 'licenses_web'::regclass and contype = 'p';

  if cols = 1 then
    alter table licenses_web drop constraint licenses_web_pkey;
    alter table licenses_web add constraint licenses_web_pkey
      primary key (account_id, product);
  end if;
end $$;

-- Тарифы распределения: $100 за полгода и $180 за год (CLAUDE.md распределения,
-- раздел 1). У аналитики свои три плана, они остаются.
alter table licenses_web drop constraint if exists licenses_web_plan_chk;
alter table licenses_web add constraint licenses_web_plan_chk
  check (plan is null or plan in ('start', 'pro', 'developer', 'half_year', 'year'));

-- Продукт тоже из словаря: опечатка в этой колонке означала бы лицензию,
-- которую ни один продукт не найдёт, а клиент при этом заплатил.
alter table licenses_web drop constraint if exists licenses_web_product_chk;
alter table licenses_web add constraint licenses_web_product_chk
  check (product in ('klaster_analytics', 'klaster_distribution'));

create index if not exists licenses_web_product_idx
  on licenses_web (product, status, period_end);
