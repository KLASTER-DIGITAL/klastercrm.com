import type { ReactNode } from 'react';
import Link from 'next/link';
import { PILOT, RETENTION_DAYS, THRESHOLDS } from '@/lib/company';
import { count, fmt, tr, word, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { PLAN_LIMITS } from '@/lib/license-demo';
import { CRYPTO, GRACE_DAYS } from '@/lib/pricing';

/**
 * Вопросы, которые РОП всё равно задаст на первом созвоне. Отвечаем здесь,
 * чтобы созвон начинался не с них. Раскрытие — нативный <details>, без js.
 *
 * Вопрос пишется словами клиента, ответ — коротко и первой строкой по существу:
 * «Нет», «Нечем», «Подойдёт». Объяснение идёт после ответа, а не вместо него.
 *
 * Серверный компонент: язык читает сам через getLang(). Каждый ответ — пара
 * { ru, en } рядом; числа — из lib/company и lib/pricing.
 */

const MINUTES = { ru: ['минуту', 'минуты', 'минут'], en: ['minute', 'minutes'] };
const DAYS = { ru: ['день', 'дня', 'дней'], en: ['day', 'days'] };
const TRANSITIONS = { ru: ['переход', 'перехода', 'переходов'], en: ['transition', 'transitions'] };
const PIPELINES = { ru: ['воронка', 'воронки', 'воронок'], en: ['pipeline', 'pipelines'] };

const nRu = fmt('ru');
const nEn = fmt('en');

const QA: { q: Bi; a: Bi<ReactNode> }[] = [
  {
    q: { ru: 'Что вы видите в нашей amoCRM?', en: 'What do you see in our amoCRM?' },
    a: {
      ru: (
        <>
          Сделки, их статусы, историю переходов и справочники: воронки, этапы, пользователи, поля.
          Задачи и звонки не синхронизируем — отчётов по ним нет. Имена, телефоны, почты, переписку и
          примечания не читаем и не храним: воронке они не нужны.
        </>
      ),
      en: (
        <>
          Deals, their statuses, the transition history and the directories: pipelines, stages, users,
          fields. Tasks and calls are not synced — there are no reports on them. Names, phones, emails,
          messages and notes are neither read nor stored: the funnel does not need them.
        </>
      ),
    },
  },
  {
    q: { ru: 'Вы можете что-нибудь сломать у нас в CRM?', en: 'Can you break anything in our CRM?' },
    a: {
      ru: (
        <>
          Нечем. Доступ только на чтение: в коде интеграции нет ни одного метода, который пишет в вашу
          CRM. Передумали — администратор отзывает доступ в «Выданных доступах» одной кнопкой, наше
          согласие не требуется.
        </>
      ),
      en: (
        <>
          We have nothing to break it with. Access is read-only: the integration code has no method that
          writes to your CRM. Changed your mind — the administrator revokes access under “Granted access”
          with one button, and no approval from us is needed.
        </>
      ),
    },
  },
  {
    q: { ru: 'Менеджер увидит чужие сделки?', en: 'Will a manager see other people’s deals?' },
    a: {
      ru: (
        <>
          Нет. Права наследуются от amoCRM: менеджер видит своё, руководитель группы — группу,
          администратор — всё. Виджет никому ничего не расширяет.
        </>
      ),
      en: (
        <>
          No. Permissions are inherited from amoCRM: a manager sees their own deals, a group lead sees
          the group, an administrator sees everything. The widget extends nobody’s rights.
        </>
      ),
    },
  },
  {
    q: { ru: 'Нам нужен программист или проект внедрения?', en: 'Do we need a developer or an implementation project?' },
    a: {
      ru: (
        <>
          Нет. Администратор ставит виджет и выдаёт доступ, руководитель отдела подтверждает разметку
          этапов. Отдельного экрана для разметки пока нет: список присылаете письмом, мы его проставляем
          и пересчитываем отчёты. Дальше вы только смотрите цифры.
        </>
      ),
      en: (
        <>
          No. The administrator installs the widget and grants access; the head of sales confirms the
          stage markup. There is no separate screen for the markup yet: you send the list by email, we
          apply it and recalculate the reports. After that you just read the numbers.
        </>
      ),
    },
  },
  {
    q: { ru: 'Когда мы увидим первые цифры?', en: 'When do we see the first numbers?' },
    a: {
      ru: (
        <>
          Первая загрузка идёт {count('ru', PILOT.firstLoadMinutes, MINUTES)} — это замер на аккаунте с{' '}
          {PILOT.historyYears}-летней историей ({nRu.format(PILOT.leads)} сделок,{' '}
          {nRu.format(PILOT.transitions)} {word('ru', PILOT.transitions, TRANSITIONS)}), а не расчёт.
          Отчётов по половине истории не показываем: до конца загрузки на экране процент. Дальше данные
          обновляются каждые {count('ru', PILOT.syncEveryMinutes, MINUTES)}.
        </>
      ),
      en: (
        <>
          The first load takes {count('en', PILOT.firstLoadMinutes, MINUTES)} — measured on an account
          with {PILOT.historyYears} years of history ({nEn.format(PILOT.leads)} deals,{' '}
          {nEn.format(PILOT.transitions)} transitions), not estimated. We do not show reports on half the
          history: until the load finishes the screen shows a percentage. After that the data refreshes
          every {count('en', PILOT.syncEveryMinutes, MINUTES)}.
        </>
      ),
    },
  },
  {
    q: { ru: 'У нас десяток воронок и бардак в этапах. Потянете?', en: 'We have a dozen pipelines and a mess in the stages. Can you handle it?' },
    a: {
      ru: (
        <>
          Потянем. Это обычная картина: на аккаунте, где мы всё калибровали,{' '}
          {count('ru', PILOT.pipelines, PIPELINES)} и {PILOT.pipelinesActive} живых. Эвристика размечает
          парковочные этапы и показывает, что нашла, — подтверждаете вы, не алгоритм. Бардак виджет не
          вылечит, но покажет его в цифрах.
        </>
      ),
      en: (
        <>
          We can. That is the usual picture: the account we calibrated on has{' '}
          {count('en', PILOT.pipelines, PIPELINES)}, {PILOT.pipelinesActive} of them active. The
          heuristic marks parking stages and shows what it found — you confirm, not the algorithm. The
          widget will not cure the mess, but it will show it in numbers.
        </>
      ),
    },
  },
  {
    q: { ru: 'У нас половина полей пустая. Нам вообще не подойдёт?', en: 'Half of our fields are empty. Is it useless for us?' },
    a: {
      ru: (
        <>
          Подойдёт. Воронка, откаты, пропуски этапов, время на этапе и работа менеджеров считаются из
          истории статусов — заполненность полей им не нужна. Пустые поля бьют только по разрезам: «по
          источнику», «по проекту», «по бюджету». Заполнено меньше чем у {THRESHOLDS.fillBlock}% сделок —
          разрез не строим и говорим почему.
        </>
      ),
      en: (
        <>
          It works. Funnel, rollbacks, skipped stages, time per stage and manager performance are
          calculated from status history — they do not need field completeness at all. Empty fields only
          hurt breakdowns: “by source”, “by project”, “by budget”. Filled in for fewer than{' '}
          {THRESHOLDS.fillBlock}% of deals — we do not build that breakdown and say why.
        </>
      ),
    },
  },
  {
    q: { ru: 'Сколько это выйдет на отдел из пятнадцати человек?', en: 'What does it cost for a team of fifteen?' },
    a: {
      ru: (
        <>
          Столько же, сколько на отдел из трёх, — если вы на одном плане. Мы считаем аккаунт amoCRM, а не
          места: минимального пакета мест нет, новый сотрудник счёт не меняет. Пятнадцать человек — это
          «Про»: там лимита пользователей нет вовсе. «Старт» дешевле, но рассчитан на команду до{' '}
          {PLAN_LIMITS.start.seats}. Суммы, планы и лимиты —{' '}
          <Link href="/widgets/analytics/pricing">на странице тарифов</Link>.
        </>
      ),
      en: (
        <>
          The same as for a team of three — if you are on the same plan. We count the amoCRM account, not
          seats: there is no minimum seat bundle and a new hire does not change the invoice. Fifteen people
          means Pro, which has no user cap at all. Start is cheaper but is built for a team of up to{' '}
          {PLAN_LIMITS.start.seats}. Amounts, plans and limits are{' '}
          <Link href="/widgets/analytics/pricing">on the pricing page</Link>.
        </>
      ),
    },
  },
  {
    q: { ru: 'А на нашем тарифе amoCRM заработает?', en: 'Will it work on our amoCRM plan?' },
    a: {
      ru: (
        <>
          На «Расширенном» проверено на живом аккаунте. По «Базовому» ответа от поддержки amoCRM пока
          нет. Напишите — проверим на вашем аккаунте и ответим как есть.
        </>
      ),
      en: (
        <>
          Verified on a live account on the “Advanced” plan. For the “Basic” plan we have no answer from
          amoCRM support yet. Write to us — we will check on your account and tell you straight.
        </>
      ),
    },
  },
  {
    q: { ru: 'Как отключиться и что будет с историей?', en: 'How do we disconnect, and what happens to the history?' },
    a: {
      ru: (
        <>
          Одна кнопка в самой amoCRM: администратор отзывает доступ в разделе «Выданные доступы», писать
          нам не надо. После окончания оплаты отчёты работают ещё {count('ru', GRACE_DAYS, DAYS)}, потом
          закрываются, а история продолжает копиться: вернётесь через полгода — увидите её целиком. После
          отключения виджета накопленное храним {count('ru', RETENTION_DAYS, DAYS)}, затем удаляем;
          попросите удалить раньше — удалим по письму.
        </>
      ),
      en: (
        <>
          One button inside amoCRM: the administrator revokes access under “Granted access”, no need to
          write to us. After the paid period ends, reports keep working for {count('en', GRACE_DAYS, DAYS)},
          then close, while the history keeps accumulating: come back in six months and you see all of it.
          After the widget is disconnected we keep the data for {count('en', RETENTION_DAYS, DAYS)}, then
          delete it; ask earlier and we delete on request.
        </>
      ),
    },
  },
  {
    q: { ru: 'Как платить и будут ли закрывающие?', en: 'How do we pay, and do we get closing documents?' },
    a: {
      ru: (
        <>
          По счёту на юрлицо или криптой ({CRYPTO.networks.ru}) — и то и другое через поддержку.
          Автоматической оплаты картой пока нет: ключ выдаём вручную в течение рабочего дня. Валюту
          выбираете сами, счёт выставляем по курсу на день оплаты, закрывающие присылаем следом.
        </>
      ),
      en: (
        <>
          By invoice to your company or in crypto ({CRYPTO.networks.en}) — both via support. There are no
          automatic card payments yet: we issue the key manually within a business day. You choose the
          currency, the invoice uses the rate on the payment day, closing documents follow.
        </>
      ),
    },
  },
  {
    q: { ru: 'Кому вы не подойдёте?', en: 'Who is it not for?' },
    a: {
      ru: (
        <>
          Одна воронка из трёх этапов и десяток сделок в месяц — хватит штатного отчёта. Нужна сквозная
          аналитика от рекламного клика до сделки — это другой класс инструментов: мы считаем то, что
          происходит внутри CRM. Нужны деньги в разрезе полей, которые никто не заполняет, — сначала
          данные, потом отчёты.
        </>
      ),
      en: (
        <>
          One three-stage pipeline and a dozen deals a month — the stock report is enough. Need end-to-end
          analytics from ad click to deal — that is a different class of tools: we count what happens
          inside the CRM. Need revenue broken down by fields nobody fills in — data first, then reports.
        </>
      ),
    },
  },
];

export async function Faq() {
  const t = tr(await getLang());
  return (
    <div className="faq">
      {QA.map((item) => (
        <details key={item.q.ru} className="faq__item">
          <summary className="faq__q">{t(item.q)}</summary>
          <div className="faq__a">{t(item.a)}</div>
        </details>
      ))}
    </div>
  );
}
