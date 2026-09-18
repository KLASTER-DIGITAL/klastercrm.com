'use client';

/**
 * Движение сайта. Один скрипт на все страницы, ни одной зависимости.
 *
 *   1. Появление по скроллу. Элементы с data-reveal получают .is-in, когда
 *      входят в окно. Элементам из AUTO (карточки, заголовки) атрибут ставится
 *      здесь — но ТОЛЬКО тем, что ниже сгиба: иначе видимый текст мигнул бы,
 *      исчезнув на кадр перед появлением.
 *   2. Параллакс. data-parallax="0.18" — доля скорости скролла. Считается от
 *      центра элемента к центру окна, поэтому работает в любом месте страницы,
 *      а не только на первом экране. Только transform, ничего не перекладывает.
 *   3. Состояние шапки: html[data-scrolled] после 8px — шапка получает тень.
 *
 * prefers-reduced-motion: всё выключено, страница статична (см. globals.css).
 */

import { useEffect } from 'react';

const AUTO =
  '.site-card, .site-h2, .site-lead, .site-table, .site-rule, .site-status, .site-actions, .beforeAfter';

function prefersReduced(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Motion() {
  useEffect(() => {
    const root = document.documentElement;

    /* ── шапка ── */
    const onScrollHead = () => {
      if (window.scrollY > 8) root.setAttribute('data-scrolled', '');
      else root.removeAttribute('data-scrolled');
    };
    onScrollHead();
    window.addEventListener('scroll', onScrollHead, { passive: true });

    if (prefersReduced()) {
      return () => window.removeEventListener('scroll', onScrollHead);
    }

    /* ── появление ── */
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    const arm = (scope: ParentNode) => {
      const fold = window.innerHeight;
      scope.querySelectorAll<HTMLElement>(AUTO).forEach((el) => {
        if (el.hasAttribute('data-reveal') || el.closest('[data-no-reveal]')) return;
        if (el.getBoundingClientRect().top > fold) el.setAttribute('data-reveal', '');
      });
      scope.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el));
    };
    arm(document);

    /* ── параллакс ── */
    const layers = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    let raf = 0;
    const tick = () => {
      raf = 0;
      const mid = window.innerHeight / 2;
      for (const el of layers) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) continue;
        const k = Number(el.dataset['parallax'] ?? '0.15');
        const y = (r.top + r.height / 2 - mid) * -k;
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => {
      if (raf === 0) raf = window.requestAnimationFrame(tick);
    };
    if (layers.length > 0) {
      tick();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
    }

    return () => {
      window.removeEventListener('scroll', onScrollHead);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf !== 0) window.cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return null;
}
