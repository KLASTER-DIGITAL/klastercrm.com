'use client';

/**
 * Движение сайта. Один скрипт на все страницы, ни одной зависимости.
 *
 *   1. Появление по скроллу: элемент с `data-reveal` получает `data-in`, когда
 *      входит в окно. Элементам из AUTO атрибут ставится здесь — но только тем,
 *      что ниже сгиба: иначе видимый текст мигнул бы, исчезнув на кадр.
 *   2. Параллакс: `data-parallax="0.18"` — доля скорости скролла, только
 *      transform, раскладку не трогает.
 *   3. Состояние шапки: `html[data-scrolled]` после 8px.
 *
 * ГЛАВНОЕ ПРАВИЛО ЭТОГО ФАЙЛА: НИ ОДИН ТЕКСТ НЕ ИМЕЕТ ПРАВА ОСТАТЬСЯ
 * НЕВИДИМЫМ. Прятать контент до срабатывания скрипта можно только с запасным
 * выходом, и здесь их три:
 *
 *   — эффект перезапускается на каждой навигации (`usePathname`). Без этого
 *     переход по меню оставлял новую страницу с `opacity: 0` навсегда: React
 *     не размонтирует `Motion` из корневой раскладки, эффект с пустым списком
 *     зависимостей больше не срабатывает, а разметка приходит уже скрытой.
 *     Это и был баг «иногда текст не появляется»;
 *   — проверка на скролле, не зависящая от IntersectionObserver: всё, что
 *     попало в окно, показывается, даже если наблюдатель промолчал;
 *   — `MutationObserver` ловит блоки, добавленные после первой отрисовки
 *     (раскрытие `<details>`, клиентские части кабинета).
 *
 * Четвёртый запасной выход снаружи: инлайновый скрипт в `app/layout.tsx`
 * снимает `data-js` через четыре секунды, если этот файл так и не отметился.
 *
 * prefers-reduced-motion: всё выключено, страница статична (см. globals.css).
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Что показываем по скроллу само, без атрибута в разметке. */
const AUTO =
  '.site-card, .site-h2, .site-lead, .site-table, .site-rule, .site-status, .site-actions, .beforeAfter';

/** Насколько глубоко элемент должен войти в окно, чтобы считаться видимым. */
const ENTER_PX = 40;

/**
 * Ниже этой ширины параллакса нет.
 *
 * На телефоне он сдвигал абсолютно позиционированные карточки героя вверх, и
 * верхняя наезжала на кнопки: сдвиг на полсотни пикселей, который на широком
 * экране теряется в пустом поле, на 375px съедает весь зазор. Плюс на длинной
 * странице это лишняя работа на каждый кадр прокрутки.
 */
const PARALLAX_MIN_WIDTH = 720;

export function Motion(): null {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    /* Метка для запасного выхода из layout: скрипт жив, прятать можно. */
    root.setAttribute('data-motion', '');

    /* ── шапка ── */
    const onScrollHead = (): void => {
      if (window.scrollY > 8) root.setAttribute('data-scrolled', '');
      else root.removeAttribute('data-scrolled');
    };
    onScrollHead();
    window.addEventListener('scroll', onScrollHead, { passive: true });

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      /* Движение отключено — просто показываем всё и уходим. */
      document.querySelectorAll('[data-reveal]').forEach((el) => el.setAttribute('data-in', ''));
      return () => {
        window.removeEventListener('scroll', onScrollHead);
      };
    }

    /* ── появление ──
       threshold: 0 намеренно. При 0.08 блок выше окна (длинная таблица,
       список правил) мог не набрать восьми процентов собственной высоты и
       не показаться вовсе. Любой вошедший пиксель — уже повод показать. */
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.setAttribute('data-in', '');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: `0px 0px -${ENTER_PX}px 0px`, threshold: 0 },
    );

    /**
     * @param mark — раздавать ли `data-reveal` блокам из AUTO.
     *
     * Только на первом проходе после навигации. Пометить уже отрисованный
     * блок — значит запустить переход из единицы в ноль, то есть погасить
     * текст, который человек видит. Появление обязано начинаться со скрытого
     * состояния, а на втором проходе скрытых не осталось.
     */
    const arm = (scope: ParentNode, mark: boolean): void => {
      if (mark) {
        const fold = window.innerHeight;
        scope.querySelectorAll<HTMLElement>(AUTO).forEach((el) => {
          if (el.hasAttribute('data-reveal') || el.closest('[data-no-reveal]') !== null) return;
          if (el.getBoundingClientRect().top > fold) el.setAttribute('data-reveal', '');
        });
      }
      scope.querySelectorAll<HTMLElement>('[data-reveal]:not([data-in])').forEach((el) => {
        io.observe(el);
      });
    };

    /** Запасной выход: показать всё, что уже в окне. Наблюдателя не спрашиваем. */
    const sweep = (): void => {
      const limit = window.innerHeight - ENTER_PX;
      document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-in])').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < limit && r.bottom > 0) el.setAttribute('data-in', '');
      });
    };

    arm(document, true);
    sweep();

    /* ── параллакс ── */
    let layers = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    let raf = 0;
    const tick = (): void => {
      raf = 0;
      if (window.innerWidth < PARALLAX_MIN_WIDTH) {
        /* Поворот телефона или сужение окна: снимаем сдвиг, иначе он застынет. */
        for (const el of layers) el.style.transform = '';
        sweep();
        return;
      }
      const mid = window.innerHeight / 2;
      for (const el of layers) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) continue;
        const k = Number(el.dataset['parallax'] ?? '0.15');
        const y = (r.top + r.height / 2 - mid) * -k;
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      }
      sweep();
    };
    const onScroll = (): void => {
      if (raf === 0) raf = window.requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    /* ── блоки, появившиеся позже ──
       Раскрыли `<details>`, догрузился клиентский кусок — их тоже надо
       вооружить, иначе они останутся скрытыми. */
    let moRaf = 0;
    const mo = new MutationObserver(() => {
      /* Пачкой на кадр: раскрытие списка — это десятки мутаций подряд,
         пересобирать выборку на каждую нельзя. */
      if (moRaf !== 0) return;
      moRaf = window.requestAnimationFrame(() => {
        moRaf = 0;
        layers = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
        arm(document, false);
        sweep();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    /* Шрифты меняют высоты — после их загрузки положение блоков другое. */
    document.fonts.ready.then(sweep).catch(() => {});

    return () => {
      window.removeEventListener('scroll', onScrollHead);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf !== 0) window.cancelAnimationFrame(raf);
      if (moRaf !== 0) window.cancelAnimationFrame(moRaf);
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
