import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark, BeforeAfter } from '@/app/site/ui';
import { Shot, SHOTS } from '@/app/site/shot';
import { PILOT } from '@/lib/company';
import { count, fmt, joinWords, tr, word, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { CUMULATIVE, PARKING_INCIDENT, PIPELINE, STAGES, type DemoStage } from '@/lib/funnel-data';

/**
 * Разбор нашей собственной ошибки в эвристике парковок. Все тексты — парами
 * { ru, en }; числа — только из lib/funnel-data и lib/company.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Парковочные этапы: почему размечает человек, а не алгоритм',
    description:
      `Наша эвристика на семилетней истории объявила парковкой этап, откуда ${PARKING_INCIDENT.contractWinShare}% ` +
      'сделок уходят в деньги. Разбор ошибки с цифрами.',
  },
  en: {
    title: 'Parking stages: why a person confirms the markup, not the algorithm',
    description:
      `On seven years of history our heuristic declared a stage that turns ${PARKING_INCIDENT.contractWinShare}% ` +
      'of deals into revenue a parking stage. A post-mortem with numbers.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  return { title: m.title, description: m.description };
}

/**
 * Имена этапов не пишутся руками: ложные срабатывания заданы ключами, подписи
 * приходят из той же таблицы, по которой считается демо-воронка.
 */
const FALSE_POSITIVES: DemoStage[] = PARKING_INCIDENT.falsePositiveStatusIds
  .map((id) => STAGES.find((s) => s.statusId === id))
  .filter((s): s is DemoStage => s !== undefined);

const REAL_PARKING: DemoStage[] = STAGES.filter((s) => s.kind === 'parking');

/** Этапы приходят по-русски из lib/funnel-data; английские подписи — здесь, как COUNTRY на главной. */
const STAGE_EN: Record<string, string> = {
  'НОВЫЙ ЛИД': 'NEW LEAD',
  'Взято в работу': 'Taken into work',
  'РЕАКТИВАЦИЯ НОВОГО ПРОЕКТА': 'NEW PROJECT REACTIVATION',
  'Нет контакта': 'No contact',
  'Клиент квалифицирован': 'Client qualified',
  'ВСТРЕЧА НАЗНАЧЕНА': 'MEETING SCHEDULED',
  'ВСТРЕЧА ПРОВЕДЕНА КЭВ': 'KEY MEETING HELD',
  'Резерв квартиры': 'Flat reserved',
  'Договор подписан': 'Contract signed',
  'Отложенный спрос': 'Deferred demand',
  'Успешно реализовано': 'Won',
};

const T = {
  h1: {
    ru: 'Эвристика назвала свалкой этап, из которого сделки уходят в деньги',
    en: 'The heuristic called a stage that turns deals into revenue a dump',
  },
  lead: {
    ru: 'Разбор нашей собственной ошибки: с числами, датой и объяснением, почему последнее её срабатывание не чинится порогом. Ошибка задела ядро продукта — конверсия середины воронки посчиталась кратно ниже настоящей. Вывод встроен в продукт: разметку этапов предлагает алгоритм, подтверждает человек.',
    en: 'A post-mortem of our own mistake: with numbers, a date and an explanation of why its last false positive cannot be fixed by a threshold. The mistake hit the core of the product — mid-funnel conversion came out several times lower than the truth. The conclusion is built into the product: the algorithm proposes the stage markup, a person confirms it.',
  },
  markPostmortem: { ru: 'разбор ошибки', en: 'post-mortem' },
  status: {
    ru: `${PILOT.who.ru}, полная история за ${PILOT.historyYears} лет. Исправлено, правка в продукте.`,
    en: `${PILOT.who.en}, full ${PILOT.historyYears}-year history. Fixed, the change is in the product.`,
  },
  whatH2: {
    ru: 'Что такое парковочный этап и почему разметка стоит так дорого',
    en: 'What a parking stage is and why the markup costs so much',
  },
  and: { ru: ' и ', en: ' and ' },
  whatP1a: {
    ru: 'В любой живой воронке есть этапы, которые не являются ступенями продажи. На пилотном аккаунте это ',
    en: 'Every live pipeline has stages that are not sales steps. On the pilot account those are ',
  },
  whatP1b: {
    ru: '. Туда кладут сделку, когда до клиента не дозвонились или он попросил вернуться через полгода. Из полки выходят вперёд, назад и вбок; сделка может побывать в ней не один раз.',
    en: '. A deal goes there when the client could not be reached or asked to come back in six months. Deals leave a parking stage forwards, backwards and sideways, and can visit it more than once.',
  },
  whatP2: {
    ru: (at: string, parked: string) =>
      `Штатный «Анализ продаж» держит такие этапы в цепочке наравне с продажными, и конверсия проваливается на ровном месте: ${at} на «Взято в работу» превращаются в ${parked} на парковочных строках. Мы полки размечаем и выносим из расчёта. Поэтому разметка — самое дорогое место в продукте: ошибка в одну сторону оставляет полку внутри цепочки и занижает конверсию, ошибка в другую выбрасывает из цепочки настоящий продажный этап. Мы сделали второе.`,
    en: (at: string, parked: string) =>
      `The stock “Sales analysis” report keeps such stages in the chain alongside sales stages, and conversion collapses for no reason: ${at} at “Taken into work” turns into ${parked} on the parking rows. We mark parking stages up and exclude them from the calculation. That is why the markup is the most expensive place in the product: an error one way leaves a parking stage inside the chain and understates conversion; an error the other way throws a real sales stage out of the chain. We did the second.`,
  },
  whatSource: {
    ru: (deals: string) => `${PILOT.who.ru} · накопительная воронка по ${deals} сделкам · штатный «Анализ продаж» amoCRM`,
    en: (deals: string) => `${PILOT.who.en} · cumulative funnel over ${deals} deals · stock amoCRM “Sales analysis” report`,
  },
  happenedH2: { ru: 'Что случилось', en: 'What happened' },
  happenedP1: {
    ru: (num: string, den: string, pct: string, s1: string, s2: string, trans: string) =>
      `Пороги эвристики калибровались на месячной выгрузке и на ней работали. На полной истории того же аккаунта — ${PILOT.historyYears} лет — эвристика объявила парковками ${PARKING_INCIDENT.flagged} этапов главной воронки вместо ${PARKING_INCIDENT.real}. Позиция в продажной цепочке осталась всего у ${PARKING_INCIDENT.chainLeft} этапов: конверсия середины воронки за месяц посчиталась как ${num} из ${den} — ${pct} — вместо двух настоящих шагов, ${s1} и ${s2}. Заодно неверным оказался флаг пропуска этапа — во всех ${trans} переходах аккаунта.`,
    en: (num: string, den: string, pct: string, s1: string, s2: string, trans: string) =>
      `The heuristic thresholds were calibrated on a one-month export and worked on it. On the full history of the same account — ${PILOT.historyYears} years — the heuristic declared ${PARKING_INCIDENT.flagged} stages of the main pipeline parking instead of ${PARKING_INCIDENT.real}. Only ${PARKING_INCIDENT.chainLeft} stages kept a position in the sales chain: mid-funnel conversion for the month came out as ${num} of ${den} — ${pct} — instead of two real steps, ${s1} and ${s2}. The stage-skip flag was wrong too — across all ${trans} transitions in the account.`,
  },
  fpStages: { ru: ['продажный этап', 'продажных этапа', 'продажных этапов'], en: ['sales stage', 'sales stages'] },
  happenedP2a: { ru: 'К настоящим полкам добавились ', en: 'The real parking stages were joined by ' },
  happenedP2b: { ru: ' — вся середина и весь конец воронки:', en: ' — the entire middle and end of the funnel:' },
  thStage: { ru: 'Этап', en: 'Stage' },
  thHeuristic: { ru: 'Что решила эвристика', en: 'What the heuristic decided' },
  thReal: { ru: 'Что это на самом деле', en: 'What it actually is' },
  tdHeuristic: { ru: 'парковка, из расчёта убрать', en: 'parking, exclude from the calculation' },
  srcIncident: {
    ru: `${PILOT.who.ru} · полная история, ${PILOT.historyYears} лет · разбор ${PARKING_INCIDENT.measuredAt} · docs/РЕШЕНИЯ.md, п. 41`,
    en: `${PILOT.who.en} · full history, ${PILOT.historyYears} years · reviewed ${PARKING_INCIDENT.measuredAt} · docs/РЕШЕНИЯ.md, item 41`,
  },
  baBefore: { ru: 'Посчитала эвристика', en: 'What the heuristic computed' },
  baAfter: { ru: 'Настоящий первый шаг цепочки', en: 'The real first step of the chain' },
  baVerdict: {
    ru: (s2: string) =>
      `Один шаг вместо двух: второй, ${s2}, исчез вместе с выброшенным этапом. Это число, которое руководитель увидел бы на первом экране и по которому принял бы решение о людях.`,
    en: (s2: string) =>
      `One step instead of two: the second, ${s2}, vanished with the discarded stage. This is the number a head of sales would see on the first screen and use to make decisions about people.`,
  },
  causeH2: { ru: 'Причина — в одной строке кода', en: 'The cause is one line of code' },
  causeP1: {
    ru: (share: string, base: string) =>
      `Один из признаков парковки: «из этапа сделки в основном уходят в закрытие, значит это свалка». Порог — ${share} исходов в закрытие при базе не меньше ${base} входов. Признак читал долю исходов в закрытие как сумму: выигрыши и отказы вместе.`,
    en: (share: string, base: string) =>
      `One of the parking signals: “deals mostly leave this stage for closure, so it is a dump”. The threshold is ${share} of exits to closure with a base of at least ${base} entries. The signal read the share of exits to closure as a sum: wins and losses together.`,
  },
  causeP2: {
    ru: (name: string, closings: string, wins: string, share: string) =>
      `У этапа «${name}» на полной истории ${closings} закрытий, из них ${wins} выигрышей — ${share}. Свалкой был назван этап, откуда сделки уходят в деньги. Выигрыш — конец пути, а не его отсутствие, и признак этого не различал.`,
    en: (name: string, closings: string, wins: string, share: string) =>
      `On the full history the “${name}” stage has ${closings} closures, ${wins} of them wins — ${share}. A stage that turns deals into revenue was called a dump. A win is the end of the journey, not its absence, and the signal did not tell the two apart.`,
  },
  whyH2: { ru: 'Почему на месячной выгрузке это не проявлялось', en: 'Why it did not show on the monthly export' },
  whyP1: {
    ru: `Доля закрытий измеряет не свойство этапа, а глубину окна наблюдения. За месяц половина исходов ещё не случилась: сделка стоит на этапе и ждёт. За ${PILOT.historyYears} лет не обрезано почти ничего — все, кто мог закрыться, закрылись. Поэтому со временем свалкой начинает выглядеть любой этап, и чем длиннее история аккаунта, тем сильнее.`,
    en: `The closure share measures the depth of the observation window, not a property of the stage. Within a month half the exits have not happened yet: the deal sits on the stage and waits. Over ${PILOT.historyYears} years almost nothing is cut off — everyone who could close has closed. So over time any stage starts to look like a dump, and the longer the account history, the stronger the effect.`,
  },
  whyP2: {
    ru: 'Это общее правило. Любой признак, у которого в числителе доля уже случившегося, на длинном окне ведёт себя иначе, чем на коротком. Мы этого не учли и калибровали пороги на том, что было под рукой.',
    en: 'This is a general rule. Any signal with the share of what has already happened in its numerator behaves differently on a long window than on a short one. We did not account for that and calibrated the thresholds on what was at hand.',
  },
  fixH2: { ru: 'Починка', en: 'The fix' },
  fixP1: {
    ru: (noContact: string, delayed: string) =>
      `Признак теперь читает только отказы. Замер на той же полной истории: ${PARKING_INCIDENT.fixedFalsePositives} ложных срабатывания из ${FALSE_POSITIVES.length} снялись, настоящие полки не задело. У «Нет контакта» ${noContact} исходов в отказ, у «Отложенного спроса» — ${delayed}; обе остались парковками, как и должны.`,
    en: (noContact: string, delayed: string) =>
      `The signal now reads losses only. Measured on the same full history: ${PARKING_INCIDENT.fixedFalsePositives} of ${FALSE_POSITIVES.length} false positives cleared, the real parking stages were untouched. “No contact” has ${noContact} of exits to lost, “Deferred demand” ${delayed}; both remain parking stages, as they should.`,
  },
  fixP2: {
    ru: 'Чего делать не стали. Разбор предлагал ещё несколько правок, в том числе скользящее окно наблюдения длиной в год. Прогон по живой базе показал, что окно ломает эталон: теряет «Отложенный спрос», то есть вставляет настоящую полку внутрь продажной цепочки. Взята одна правка, верная по смыслу, а не пакет правок, дающих красивую картинку на одном аккаунте.',
    en: 'What we did not do. The review proposed several more changes, including a rolling one-year observation window. A run on the live database showed the window breaks the reference: it loses “Deferred demand”, i.e. puts a real parking stage inside the sales chain. We took one change that is right in substance, not a bundle of changes that produce a pretty picture on one account.',
  },
  fourthH2: { ru: 'Четвёртое срабатывание порогом не чинится', en: 'The fourth false positive cannot be fixed by a threshold' },
  fourthP1: {
    ru: (name: string, qualified: string, noContact: string) =>
      `«${name}» остался помеченным как парковка и после починки. У него ${qualified} внутренних исходов в отказ. У настоящей полки «Нет контакта» — ${noContact}. По этому признаку они неразличимы.`,
    en: (name: string, qualified: string, noContact: string) =>
      `“${name}” stayed marked as parking after the fix. It has ${qualified} of internal exits to lost. The real parking stage “No contact” has ${noContact}. By this signal they are indistinguishable.`,
  },
  fourthP2: {
    ru: 'Разводящий их порог подобрать несложно, и он будет работать — на одном аккаунте, том самом, на котором подбирался. Это подгонка: следующий клиент получил бы отчёт, построенный на числе, которое нельзя защитить. Мы порог не двигали.',
    en: 'A threshold that separates them is easy to pick, and it would work — on one account, the very one it was picked on. That is overfitting: the next client would get a report built on a number that cannot be defended. We did not move the threshold.',
  },
  followsH2: { ru: 'Что из этого следует', en: 'What follows from this' },
  c1Title: { ru: 'Эвристика предлагает, человек подтверждает', en: 'The heuristic proposes, a person confirms' },
  c1Body: {
    ru: 'Разметка при подключении — не формальность и не мастер настройки, который можно прокликать. Это единственное место, где ошибку алгоритма ловит тот, кто знает свою воронку. Экрана подтверждения в виджете пока нет: механизм написан и покрыт тестами, а список полок мы согласуем письмом и проставляем на вашем аккаунте.',
    en: 'The markup at connection is not a formality or a setup wizard to click through. It is the only place where the algorithm’s mistake is caught by someone who knows their pipeline. There is no confirmation screen in the widget yet: the mechanism is written and covered by tests, and we agree the parking list by email and set it on your account.',
  },
  c2Title: { ru: 'Подтверждение меняет расчёт целиком', en: 'Confirmation changes the whole calculation' },
  c2Body: {
    ru: 'Здесь была вторая ошибка: подтверждение меняло вид этапа, но не давало ему позицию в продажной цепочке — этап становился продажным и всё равно выпадал из конверсии. Теперь подтверждение пересчитывает позиции и флаги пропуска одной транзакцией.',
    en: 'This is where the second bug was: confirmation changed the stage kind but did not give it a position in the sales chain — the stage became a sales stage and still dropped out of the conversion. Now confirmation recomputes positions and skip flags in a single transaction.',
  },
  c3Title: { ru: 'Пороги названы вслух', en: 'The thresholds are stated openly' },
  c3Body: {
    ru: 'Значения признаков и порогов лежат в документации, а не только в коде. Если разметка на вашей воронке выглядит странно, вы можете посмотреть, по какому признаку этап попал в полки, и не согласиться.',
    en: 'The signal values and thresholds are in the documentation, not only in the code. If the markup on your pipeline looks odd, you can see which signal put a stage into parking and disagree.',
  },
  parkingWord: { ru: ['полка', 'полки', 'полок'], en: ['parking stage', 'parking stages'] },
  captionA: { ru: 'Жёлтым — ', en: 'In yellow — ' },
  captionB: {
    ru: ' с меткой «парковка»: вместо конверсии у них стоит «вне цепочки», в шаги воронки они не входят. «',
    en: ' labelled “parking”: instead of a conversion they show “outside the chain” and are not funnel steps. “',
  },
  captionC: {
    ru: '» идёт обычной строкой цепочки, с конверсией из предыдущего этапа — это и есть подпись человека: признак после починки всё ещё считает этот этап полкой.',
    en: '” is an ordinary chain row with a conversion from the previous stage — that is the human sign-off: after the fix the signal still considers this stage parking.',
  },
  shotSource: { ru: `Демо-данные · ${PILOT.who.ru} · ${PIPELINE.period}`, en: `Demo data · ${PILOT.who.en} · July 2026` },
  notProveH2: { ru: 'Чего этот разбор не доказывает', en: 'What this post-mortem does not prove' },
  notProveP1: {
    ru: 'Вся калибровка — один аккаунт. Пороги, настроенные на его месячной выгрузке, разъехались на его же полной истории. Что произойдёт на втором и третьем аккаунте, мы не знаем. Фраз вида «у застройщиков обычно» на сайте не будет, пока аккаунтов не станет больше, а когда станет — появится и второй разбор, вместе с тем, что в нём сломается.',
    en: 'The entire calibration is one account. Thresholds tuned on its monthly export drifted on its own full history. What happens on the second and third account we do not know. There will be no “property developers usually…” on this site until there are more accounts — and when there are, there will be a second post-mortem, with whatever breaks in it.',
  },
  demoH2: { ru: 'Посмотреть, как размечена живая воронка', en: 'See how a live pipeline is marked up' },
  demoP: {
    ru: 'В демо полки вынесены из цепочки и идут отдельным списком со своими числами — видно и саму разметку, и то, что она меняет в конверсии. Без регистрации и без доступа к вашей CRM.',
    en: 'In the demo, parking stages are excluded from the chain and listed separately with their own numbers — you see both the markup and what it changes in conversion. No sign-up and no access to your CRM.',
  },
  openDemo: { ru: 'Открыть демо', en: 'Open the demo' },
  whatWidget: { ru: 'Что умеет виджет', en: 'What the widget does' },
};

export default async function ParkingPostmortem() {
  const lang = await getLang();
  const t = tr(lang);
  const n = (v: number): string => fmt(lang).format(v);
  const pct = (v: number): string => `${n(v)}%`;
  const stage = (name: string): string => (lang === 'en' ? (STAGE_EN[name] ?? name) : name);
  const srcIncident = t(T.srcIncident);
  const lastFp = FALSE_POSITIVES[FALSE_POSITIVES.length - 1];
  const firstFp = FALSE_POSITIVES[0];

  return (
    <SiteShell active="/method">
      <h1 className="site-h1">{t(T.h1)}</h1>

      <p className="site-lead">{t(T.lead)}</p>

      <div className="site-status">
        <Mark kind="demo">{t(T.markPostmortem)}</Mark>
        <span>{t(T.status)}</span>
      </div>

      <h2 className="site-h2">{t(T.whatH2)}</h2>
      <p className="site-p">
        {t(T.whatP1a)}
        {joinWords(
          lang,
          REAL_PARKING.map((s) => `${lang === 'ru' ? '«' : '“'}${stage(s.name)}${lang === 'ru' ? '»' : '”'}`),
        )}
        {t(T.whatP1b)}
      </p>
      <p className="site-p">{t(T.whatP2)(pct(CUMULATIVE.atTakenToWork), pct(CUMULATIVE.atParkingRows))}</p>
      <Source>{t(T.whatSource)(n(CUMULATIVE.basisDeals))}</Source>

      <h2 className="site-h2">{t(T.happenedH2)}</h2>
      <p className="site-p">
        {t(T.happenedP1)(
          n(PARKING_INCIDENT.brokenMidNum),
          n(PARKING_INCIDENT.brokenMidDen),
          pct(PARKING_INCIDENT.brokenMidPct),
          pct(PARKING_INCIDENT.trueStepPct[0]),
          pct(PARKING_INCIDENT.trueStepPct[1]),
          n(PILOT.transitions),
        )}
      </p>
      <p className="site-p">
        {t(T.happenedP2a)}
        {count(lang, FALSE_POSITIVES.length, T.fpStages)}
        {t(T.happenedP2b)}
      </p>

      <table className="site-table">
        <thead>
          <tr>
            <th>{t(T.thStage)}</th>
            <th>{t(T.thHeuristic)}</th>
            <th>{t(T.thReal)}</th>
          </tr>
        </thead>
        <tbody>
          {FALSE_POSITIVES.map((s) => (
            <tr key={s.statusId}>
              <td data-label={t(T.thStage)}>
                {lang === 'ru' ? `«${s.name}»` : `“${stage(s.name)}”`}
              </td>
              <td data-label={t(T.thHeuristic)}>{t(T.tdHeuristic)}</td>
              <td data-label={t(T.thReal)}>
                {t({
                  ru: (
                    <>
                      продажный этап, за месяц вошло <span className="num">{n(s.entered)}</span> сделок
                    </>
                  ),
                  en: (
                    <>
                      sales stage, <span className="num">{n(s.entered)}</span> deals entered in the month
                    </>
                  ),
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Source>{srcIncident}</Source>

      <BeforeAfter
        beforeLabel={t(T.baBefore)}
        before={pct(PARKING_INCIDENT.brokenMidPct)}
        afterLabel={t(T.baAfter)}
        after={pct(PARKING_INCIDENT.trueStepPct[0])}
        verdict={t(T.baVerdict)(pct(PARKING_INCIDENT.trueStepPct[1]))}
      />
      <Source>{srcIncident}</Source>

      <h2 className="site-h2">{t(T.causeH2)}</h2>
      <p className="site-p">
        {t(T.causeP1)(pct(PARKING_INCIDENT.dumpShareThreshold), n(PARKING_INCIDENT.dumpBaseThreshold))}
      </p>
      <p className="site-p">
        {t(T.causeP2)(
          stage(lastFp?.name ?? ''),
          n(PARKING_INCIDENT.contractClosings),
          n(PARKING_INCIDENT.contractWins),
          pct(PARKING_INCIDENT.contractWinShare),
        )}
      </p>
      <Source>{srcIncident}</Source>

      <h2 className="site-h2">{t(T.whyH2)}</h2>
      <p className="site-p">{t(T.whyP1)}</p>
      <p className="site-p">{t(T.whyP2)}</p>

      <h2 className="site-h2">{t(T.fixH2)}</h2>
      <p className="site-p">
        {t(T.fixP1)(
          pct(PARKING_INCIDENT.lostShareAfterFix.noContact),
          pct(PARKING_INCIDENT.lostShareAfterFix.delayedDemand),
        )}
      </p>
      <p className="site-p">{t(T.fixP2)}</p>
      <Source>{srcIncident}</Source>

      <h2 className="site-h2">{t(T.fourthH2)}</h2>
      <p className="site-p">
        {t(T.fourthP1)(
          stage(firstFp?.name ?? ''),
          pct(PARKING_INCIDENT.qualifiedLostShare),
          pct(PARKING_INCIDENT.lostShareAfterFix.noContact),
        )}
      </p>
      <p className="site-p">{t(T.fourthP2)}</p>
      <Source>{srcIncident}</Source>

      <h2 className="site-h2">{t(T.followsH2)}</h2>
      <div className="site-grid site-grid--3">
        <div className="site-card">
          <h3 className="site-h3">{t(T.c1Title)}</h3>
          <p className="site-p">{t(T.c1Body)}</p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">{t(T.c2Title)}</h3>
          <p className="site-p">{t(T.c2Body)}</p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">{t(T.c3Title)}</h3>
          <p className="site-p">{t(T.c3Body)}</p>
        </div>
      </div>

      {/*
        Кадр стоит именно здесь: выше сказано, что решение подписывает человек, —
        ниже видно, чем это кончается в отчёте. Высота окна больше реестровой,
        чтобы в кадр попали все три полки: «Отложенный спрос» стоит последним и
        при обрезке по умолчанию срезается, а тогда подпись про три полки врёт.
      */}
      <Shot
        {...SHOTS.funnel}
        tall={940}
        caption={
          <>
            {t(T.captionA)}
            {REAL_PARKING.length} {word(lang, REAL_PARKING.length, T.parkingWord)}
            {t(T.captionB)}
            {stage(firstFp?.name ?? '')}
            {t(T.captionC)}
          </>
        }
        source={t(T.shotSource)}
      />

      <h2 className="site-h2">{t(T.notProveH2)}</h2>
      <p className="site-p">{t(T.notProveP1)}</p>
      <p className="site-p">
        {t({
          ru: (
            <>
              Как считается всё остальное — <Link href="/method">правила счёта KLASTER</Link>. Как
              разметка выглядит в интерфейсе и что делать, если эвристика ошиблась на вашей воронке, —{' '}
              <Link href="/widgets/analytics/docs/stages">разметка этапов и парковки</Link>.
            </>
          ),
          en: (
            <>
              How everything else is counted — <Link href="/method">the KLASTER counting rules</Link>. How
              the markup looks in the interface and what to do if the heuristic got your pipeline wrong —{' '}
              <Link href="/widgets/analytics/docs/stages">stage markup and parking</Link>.
            </>
          ),
        })}
      </p>

      <h2 className="site-h2">{t(T.demoH2)}</h2>
      <p className="site-p">{t(T.demoP)}</p>
      <div className="site-actions">
        <Link className="btn" href="/widgets/analytics/demo">
          {t(T.openDemo)}
        </Link>
        <Link className="btn btn--ghost" href="/widgets/analytics">
          {t(T.whatWidget)}
        </Link>
      </div>
    </SiteShell>
  );
}
