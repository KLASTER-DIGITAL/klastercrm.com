-- ── Четвёртый продукт линейки: KLASTER Duplicates ────────────────
--
-- ЗАЧЕМ. Виджет дублей спрашивает лицензию у того же кабинета с
-- `product: 'klaster_duplicates'`. Без этой миграции строку его лицензии база не
-- примет: словарь `licenses_web_product_chk` знает только три продукта.
--
-- СОВМЕСТИМОСТЬ. Словарь только расширяется, строки остальных продуктов ему
-- удовлетворяют. Планов у виджета пока нет, `plan` у его строк null, словарь
-- планов это допускает.
--
-- Миграция идемпотентна: повторный прогон ничего не меняет.

alter table licenses_web drop constraint if exists licenses_web_product_chk;
alter table licenses_web add constraint licenses_web_product_chk
  check (product in ('klaster_analytics', 'klaster_distribution', 'klaster_amobell', 'klaster_duplicates'));

comment on column licenses_web.product is
  'Продукт линейки: klaster_analytics | klaster_distribution | klaster_amobell | klaster_duplicates. Ключ лицензии привязан к паре (аккаунт, продукт).';
