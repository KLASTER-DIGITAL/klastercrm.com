import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { COMPANY, WIDGET, PILOT, NOT_READY } from '@/lib/company';
import { plural, withPlural } from '@/lib/plural';

/**
 * Страница «О нас». Единственная её задача — заменить обычный для этого жанра
 * набор («13 лет на рынке», «350 сотрудников») на проверяемые числа и на список
 * того, чего у нас нет. Отзывов и второго кейса у нас пока не будет, а сноска
 * с источником под каждым числом — будет.
 *
 * Все факты приходят из company.ts: страница ничего не знает сама, поэтому
 * получить расхождение с главной или с тарифами здесь невозможно.
 *
 * Раздела «Компания» в верхнем меню нет, поэтому `active` не передаётся.
 */

export const metadata: Metadata = {
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  title: { absolute: 'О компании KLASTER' },
  description:
    'Кто делает продукт, чем подтверждается «работает», где юрлицо: один пилотный аккаунт, ноль отзывов, юрлицо в регистрации.',
};

/** Числа, которыми подтверждается «работает», а не «планируется». */
const FACTS: readonly { value: string; label: string }[] = [
  {
    value: PILOT.transitions.toLocaleString('ru-RU'),
    label: `${plural(PILOT.transitions, 'переход', 'перехода', 'переходов')} между этапами разобрано на боевом аккаунте`,
  },
  {
    value: PILOT.leads.toLocaleString('ru-RU'),
    label: `сделок в базе пилота, история за ${withPlural(PILOT.historyYears, 'год', 'года', 'лет')}`,
  },
  {
    value: `${PILOT.firstLoadMinutes} мин`,
    label: 'первая полная загрузка этой истории — замер, а не расчёт',
  },
  {
    value: `${PILOT.syncEveryMinutes} мин`,
    label: 'интервал синхронизации: столько данные могут отставать от CRM',
  },
];

export default function CompanyPage() {
  return (
    <SiteShell>
      <h1 className="site-h1">Кто мы и чего у нас пока нет</h1>
      <p className="site-lead">
        KLASTER — маленькая инженерная команда. Продукт написан своими руками и работает на боевом
        аккаунте застройщика. Ниже — чем это подтверждается и что мы пока не умеем.
      </p>

      <div className="site-status">
        <span>
          Виджет версии <span className="num">{WIDGET.version}</span>
        </span>
        <span>
          Технический аккаунт amoCRM получен{' '}
          <span className="num">{WIDGET.techAccountSince}</span>
        </span>
        {WIDGET.marketplace === 'moderation' && (
          <>
            <Mark kind="building">в маркетплейсе ещё нет</Mark>
            <span>Заявка на модерации, сроков amoCRM не публикует.</span>
          </>
        )}
      </div>

      <div className="site-grid site-grid--2">
        <div className="site-card">
          <h2 className="site-h3">{COMPANY.name}</h2>
          <p className="site-p">
            Мы пишем виджеты для amoCRM. Первый из них считает конверсию между соседними этапами,
            размечает этапы-полки и отказывается строить разрез по полю, заполненному у горстки
            сделок. Всё это проверено не на демо-данных, а на живом аккаунте застройщика: разобрано{' '}
            {PILOT.transitions.toLocaleString('ru-RU')}{' '}
            {plural(PILOT.transitions, 'переход', 'перехода', 'переходов')} между этапами за{' '}
            {withPlural(PILOT.historyYears, 'год', 'года', 'лет')} истории.
          </p>
          <p className="site-p" style={{ marginTop: 10 }}>
            Публичная сборка виджета принята валидатором amoCRM, заявка в маркетплейс на модерации.
            До публикации подключаем по прямой ссылке и вручную.
          </p>
          <p className="site-p" style={{ marginTop: 10 }}>
            Мы не пишем «13 лет на рынке» и «350 сотрудников» — нам нечем это заявить. И дело не
            только в скромности: число, которое нельзя проверить, стоит рядом с теми, которые мы
            измерили, и обнуляет их. Поэтому под каждой цифрой на сайте стоит источник, а список
            того, чего у нас нет, лежит на видном месте, а не в подвале.
          </p>
        </div>

        <div className="site-card">
          <h2 className="site-h3">Чего у нас пока нет</h2>
          {NOT_READY.slice(0, 4).map((n) => (
            <p key={n.what} className="site-p" style={{ marginTop: 8 }}>
              <strong>{n.what}.</strong> {n.why}
            </p>
          ))}
          <p className="site-p" style={{ marginTop: 12 }}>
            <Link href="/not-ready">Полный список того, чего мы ещё не умеем</Link>
          </p>
        </div>
      </div>

      <h2 className="site-h2">Чем подтверждается «работает»</h2>
      <div className="site-grid site-grid--4">
        {FACTS.map((f) => (
          <div key={f.label} className="site-card">
            <div className="num" style={{ fontSize: 26, fontWeight: 700 }}>
              {f.value}
            </div>
            <p className="site-p" style={{ marginTop: 6 }}>
              {f.label}
            </p>
          </div>
        ))}
      </div>
      <Source>
        {PILOT.who} · замер {PILOT.measuredAt} · источник: {PILOT.source} · названия объектов и имена
        сотрудников не публикуются
      </Source>
      <p className="site-p" style={{ marginTop: 16 }}>
        Аккаунт один, и мы об этом говорим прямо: пороги, настроенные на месячной выгрузке, на его же
        полной истории разъехались, и нам пришлось их чинить. Фраз «у застройщиков обычно» на сайте
        не будет, пока аккаунтов не станет больше.
      </p>

      <h2 className="site-h2">Берём компании в пилот</h2>
      <div className="site-card">
        <p className="site-p">
          Скидка в обмен на право опубликовать результат — это единственный способ, которым у нас
          появятся кейсы, и мы говорим о нём прямо. Что входит в наблюдение и на каких условиях
          публикуется текст, расписано там же, где перечислено недостающее:{' '}
          <Link href="/not-ready">чего мы ещё не умеем</Link>.
        </p>
        <div className="site-actions">
          <Link className="btn" href="/widgets/analytics">
            Что умеет виджет
          </Link>
          <Link className="btn btn--ghost" href="/widgets/analytics/demo">
            Открыть демо
          </Link>
          <Link className="btn btn--ghost" href="/support">
            Написать нам
          </Link>
        </div>
      </div>

      <h2 className="site-h2">Контакты</h2>
      <p className="site-p">
        Почта — <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. Отвечаем мы сами, колл-центра
        и первой линии нет. Мессенджеры, время ответа и то, что приложить к обращению, собраны на
        странице <Link href="/support">поддержки</Link>.
      </p>
      {/* Условие, а не текст-заглушка: как только реквизиты утвердят, строка
          исчезнет сама вместе с флагом в company.ts. Придумывать ИНН нельзя. */}
      {!COMPANY.legalReady && (
        <p className="site-p" style={{ marginTop: 12 }}>
          Реквизиты юрлица пока не опубликованы. Для счёта и договора запросите их письмом — пришлём
          в ответ; на сайте они появятся, когда будут утверждены.
        </p>
      )}
    </SiteShell>
  );
}
