import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsShell } from '@/app/widgets/analytics/docs/docs-shell';
import { Source, Mark, BeforeAfter } from '@/app/site/ui';
import { Shot, SHOTS } from '@/app/site/shot';
import { plural, withPlural } from '@/lib/plural';
import { PILOT } from '@/lib/company';
import {
  CUMULATIVE,
  LOST_JULY,
  PARKING_EVIDENCE,
  PARKING_HEURISTIC,
  PARKING_INCIDENT,
  PIPELINE,
  STAGES,
  TRANSITIONS,
  parkingRows,
  type StageKind,
} from '@/lib/funnel-data';

/**
 * Разметка этапов — главная страница справки по смыслу: всё остальное в продукте
 * считается поверх неё. Отсюда два обязательства этой страницы.
 *
 * Первое: ни одного утверждения о поведении продукта, которого нет в коде.
 * Пороги, признаки и порядок решений переписаны с src/core/stage-map.ts, судьба
 * флага пропуска — с src/sync/stage-skip.ts, состав видов этапа и их роль в
 * отчёте — с src/core/shared.ts и src/core/reports.ts. Справка, разошедшаяся с
 * кодом, вреднее её отсутствия: по ней принимают решение, которого код не
 * выполнит.
 *
 * Второе: экрана подтверждения разметки внутри виджета ещё нет, и страница
 * обязана сказать это прямо. Механизм под ним работает и покрыт тестами, а
 * кнопки нет. Умолчать — значит пообещать несуществующее ровно тому читателю,
 * который пришёл её искать.
 */

const ru = new Intl.NumberFormat('ru-RU');
const n = (v: number): string => ru.format(v);
const pct = (v: number): string => `${v.toLocaleString('ru-RU')}%`;

export const metadata: Metadata = {
  title: 'Разметка этапов и парковки в amoCRM',
  description:
    `Что такое этап-полка, почему без разметки конверсия падает с ${CUMULATIVE.atTakenToWork}% до ` +
    `${CUMULATIVE.atParkingRows}%, пороги эвристики и экран подтверждения.`,
};

const DEMO_SOURCE = `${PILOT.who} · воронка «${PIPELINE.name}» · ${PIPELINE.period} · расчёт по событиям смены статуса`;
/* Подпись под кадром. Кадр снят с виджета на демо-данных — это написано и в его
   собственной шапке, и здесь, чтобы числа со скриншота никто не принял за живой
   аккаунт клиента. */
const SHOT_SOURCE = `демо-данные · ${PILOT.who} · ${PIPELINE.period}`;
const INCIDENT_SOURCE = `${PILOT.who} · полная история, ${withPlural(PILOT.historyYears, 'год', 'года', 'лет')} · разбор ${PARKING_INCIDENT.measuredAt}`;

const PARKING = parkingRows();

/** Ключи этапов пилота, на которые ссылается текст. Ключ этапа — идентификатор,
    а не имя: этапы переименовывают, идентификатор живёт до удаления этапа. */
const ID = {
  takenToWork: 47182065,
  reactivation: 86766025,
  noContact: 34081147,
  delayedDemand: 55525121,
} as const;

const TAKEN_TO_WORK = STAGES.find((s) => s.statusId === ID.takenToWork);
const NO_CONTACT = STAGES.find((s) => s.statusId === ID.noContact);
const WON = STAGES.find((s) => s.kind === 'won');

/** Строка отчёта: демо-таблица показывает и терминальный отказ, которого в STAGES нет. */
interface MarkedRow {
  statusId: number;
  name: string;
  kind: StageKind;
  entered: number;
}

const MARKED_ROWS: readonly MarkedRow[] = [
  ...STAGES.map((s) => ({ statusId: s.statusId, name: s.name, kind: s.kind, entered: s.entered })),
  { statusId: LOST_JULY.statusId, name: LOST_JULY.name, kind: 'lost', entered: LOST_JULY.entered },
];

/**
 * Позиции продажной цепочки считаем ровно так же, как `buildStageMap` в ядре:
 * нумерация только по `kind = 'sales'`, подряд, с единицы, по возрастанию sort.
 * Проставить позиции руками значило бы показать читателю не то, что делает код.
 */
function chainPositions(): ReadonlyMap<number, number> {
  const result = new Map<number, number>();
  let pos = 0;
  for (const stage of [...STAGES].sort((a, b) => a.sort - b.sort)) {
    if (stage.kind === 'sales') result.set(stage.statusId, (pos += 1));
  }
  return result;
}

const CHAIN_POS = chainPositions();

/** Пять видов этапа из src/core/shared.ts. В демо-данных четыре: «Неразобранного» там нет. */
type ProductKind = StageKind | 'unsorted';

const KIND_LABEL: Record<ProductKind, string> = {
  sales: 'продажный',
  parking: 'полка',
  unsorted: 'неразобранное',
  won: 'выигрыш',
  lost: 'отказ',
};

const KINDS: readonly { kind: ProductKind; how: React.ReactNode; effect: React.ReactNode }[] = [
  {
    kind: 'sales',
    how: 'Всё, что не подошло под остальные четыре вида. Вид по умолчанию.',
    effect:
      'Получает позицию в продажной цепочке: нумерация с единицы, подряд, отдельно в каждой воронке. Конверсия считается только между соседними позициями — ни через одну, ни накопительно от первого этапа.',
  },
  {
    kind: 'parking',
    how: 'По статистике переходов — пороги ниже по странице. Либо решением человека: оно сильнее порогов.',
    effect:
      'Уходит из знаменателя конверсии и показывается отдельным списком со своими числами: сколько вошло в каждую полку, как они делят поток между собой и какая часть всего движения по воронке там осела. Вход в полку пропуском этапа не считается.',
  },
  {
    kind: 'unsorted',
    how: 'Структурный признак amoCRM: тип этапа 1, «Неразобранное».',
    effect: 'Показываем в таблице, в цепочку конверсии не берём.',
  },
  {
    kind: 'won',
    how: (
      <>
        Структурный признак amoCRM: идентификатор {WON?.statusId}, одинаковый во всех воронках
        аккаунта.
      </>
    ),
    effect:
      'Показываем, в цепочку не берём. Отдельно: уход в выигрыш не считается признаком свалки — именно на этом эвристика однажды и ошиблась.',
  },
  {
    kind: 'lost',
    how: <>Структурный признак amoCRM: идентификатор {LOST_JULY.statusId}, тоже общий для всех воронок.</>,
    effect:
      'Показываем, в цепочку не берём. Доля исходов из этапа в отказ — вход третьего признака полки.',
  },
];

/**
 * Чем именно эвристика поймала каждую полку пилота. Ключ — идентификатор этапа:
 * по имени этапы не различают ни здесь, ни в продукте.
 */
const PARKING_WHY: readonly { statusId: number; sign: string; evidence: React.ReactNode }[] = [
  {
    statusId: ID.reactivation,
    sign: 'в него возвращаются',
    evidence: (
      <>
        <span className="num">{pct(PARKING_EVIDENCE.reactivationFromAbove)}</span> входов — сверху по
        воронке, из них <span className="num">{n(PARKING_EVIDENCE.reactivationFromLost)}</span>{' '}
        пришли прямо из «{LOST_JULY.name}»
      </>
    ),
  },
  {
    statusId: ID.noContact,
    sign: 'свалка',
    evidence: (
      <>
        <span className="num">{n(PARKING_EVIDENCE.noContactEntries)}</span> входов,{' '}
        <span className="num">{pct(PARKING_EVIDENCE.noContactToLost)}</span> исходов — в отказ
      </>
    ),
  },
  {
    statusId: ID.delayedDemand,
    sign: 'из него достают обратно',
    evidence: (
      <>
        <span className="num">{pct(PARKING_EVIDENCE.delayedBackwards)}</span> исходов — назад по
        воронке
      </>
    ),
  },
];

/** Пороги в том порядке, в каком их проверяет `isParkingByStats`. */
const THRESHOLD_ROWS: readonly { what: string; value: string; why: string }[] = [
  {
    what: 'База входов',
    // Формы родительного падежа: «от одного входа», «от двух входов», «от 30 входов».
    value: `от ${withPlural(PARKING_HEURISTIC.minIncoming, 'входа', 'входов', 'входов')}`,
    why: 'Ниже этого доли неустойчивы, и эвристика молчит вместо того, чтобы гадать.',
  },
  {
    what: 'Общий фильтр: исходов вперёд по цепочке',
    value: `не больше ${pct(PARKING_HEURISTIC.forwardSharePct)}`,
    why: 'Этап, из которого сделки в основном идут вперёд, полкой не бывает. Не прошёл фильтр — признаки не смотрим.',
  },
  {
    what: 'Признак 1: входов сверху по воронке',
    value: `от ${pct(PARKING_HEURISTIC.returnSharePct)}`,
    why: '«В него возвращаются»: сделки приходят из этапов, стоящих дальше по порядку.',
  },
  {
    what: 'Признак 2: исходов назад по воронке',
    value: `от ${pct(PARKING_HEURISTIC.backSharePct)}`,
    why: '«Из него достают обратно»: сделку положили, а потом забрали на предыдущие этапы.',
  },
  {
    what: 'Признак 3: исходов в отказ',
    value: `от ${pct(PARKING_HEURISTIC.dumpSharePct)} при базе от ${n(PARKING_HEURISTIC.dumpMinIncoming)}`,
    why: 'Свалка. База выше общей: у хвостовых продажных этапов поток маленький, а доля отказов естественно высокая — на такой базе одно от другого не отличить.',
  },
];

export default function StagesPage() {
  return (
    <DocsShell
      active="stages"
      title="Разметка этапов и парковки"
      lead={
        <>
          Почему на одних и тех же сделках получается {pct(CUMULATIVE.atParkingRows)} и{' '}
          {pct(CUMULATIVE.atTakenToWork)}, что виджет считает этапом-полкой, по каким порогам он их
          находит и кто подписывает результат.
        </>
      }
    >
      <h2 className="site-h2">Этап-полка: сделка там не движется, а ждёт</h2>
      <p className="site-p">
        В любой живой воронке есть этапы, которые не являются ступенями продажи. Туда кладут сделку,
        когда до клиента не дозвонились, он попросил вернуться через полгода или проект встал на
        паузу. Из полки выходят вперёд, назад и вбок; побывать в ней сделка может не один раз. Штатный
        «Анализ продаж» держит такие этапы в цепочке наравне с продажными и считает их ступенями.
      </p>
      <p className="site-p">
        В главной воронке пилотного аккаунта полками оказались{' '}
        {withPlural(PARKING.length, 'этап', 'этапа', 'этапов')}. Каждую нашёл свой признак — не
        название и не наша догадка о том, как должна выглядеть воронка:
      </p>
      <table className="site-table">
        <thead>
          <tr>
            <th>Этап</th>
            <th>Вошло за {PIPELINE.period}</th>
            <th>Признак</th>
            <th>Чем измерен</th>
          </tr>
        </thead>
        <tbody>
          {PARKING.map((stage) => {
            const why = PARKING_WHY.find((w) => w.statusId === stage.statusId);
            return (
              <tr key={stage.statusId}>
                <td data-label="Этап">«{stage.name}»</td>
                <td data-label="Вошло">
                  <span className="num">{n(stage.entered)}</span>
                </td>
                <td data-label="Признак">{why?.sign}</td>
                <td data-label="Чем измерен">{why?.evidence}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Source>
        {PILOT.who} · воронка «{PIPELINE.name}» · июнь–{PIPELINE.period} · доли исходов считаются
        только по переходам внутри одной воронки
      </Source>

      <h2 className="site-h2">Что даёт разметка: две пары чисел</h2>
      <p className="site-p">
        Полка внутри цепочки съедает поток, который потом возвращается в продажу. На пилоте в «
        {NO_CONTACT?.name}» за месяц вошло{' '}
        <span className="num">{n(NO_CONTACT?.entered ?? 0)}</span> сделок — больше, чем в главный
        продажный этап «{TAKEN_TO_WORK?.name}» с его{' '}
        <span className="num">{n(TAKEN_TO_WORK?.entered ?? 0)}</span>. Накопительная конверсия
        ломается об эту строку, хотя ни одна сделка в ней не потеряна: она ждёт.
      </p>
      <div className="site-card">
        <BeforeAfter
          beforeLabel="Полки внутри цепочки"
          before={pct(CUMULATIVE.atParkingRows)}
          afterLabel="Полки вынесены"
          after={pct(CUMULATIVE.atTakenToWork)}
          verdict={
            <>
              Одна и та же история, {n(CUMULATIVE.basisDeals)} сделок, ни одного изменения в CRM.
              Разница целиком в том, считаются ли полки ступенями воронки. Это и есть цена разметки —
              и причина, по которой ошибиться в ней дороже, чем в любом другом месте продукта.
            </>
          }
        />
        <Source>
          {PILOT.who} · накопительная воронка по {n(CUMULATIVE.basisDeals)} сделкам · штатный «Анализ
          продаж» amoCRM
        </Source>
      </div>
      <div className="site-card" style={{ marginTop: 16 }}>
        <BeforeAfter
          beforeLabel="Разрывы по порядку этапов"
          before={n(TRANSITIONS.naiveSkips)}
          afterLabel="Пропуски продажного этапа"
          after={n(TRANSITIONS.honestSkips)}
          verdict={
            <>
              От разметки зависит и второе число. Счёт «любой разрыв по порядку этапов» даёт{' '}
              {n(TRANSITIONS.naiveSkips)}{' '}
              {plural(TRANSITIONS.naiveSkips, 'пропуск', 'пропуска', 'пропусков')}; перепрыгнутая
              полка пропуском не является, и настоящих остаётся {n(TRANSITIONS.honestSkips)}.
              Крупнейшая ложная строка — уход из работы на полку: это ожидание, а не перескок через
              ступень. Оба числа виджет показывает и объясняет разницу.
            </>
          }
        />
        <Source>
          {PIPELINE.period} · разобрано {n(TRANSITIONS.total)} переходов, из них{' '}
          {n(TRANSITIONS.rollbacks)} откатов · правило: пропуск парковочного этапа пропуском не
          считается
        </Source>
      </div>

      <h2 className="site-h2">Пять видов этапа и что даёт каждый</h2>
      <p className="site-p">
        Вид этапа — единственное, что виджет добавляет к справочнику amoCRM. Порядок решений
        зафиксирован: структурные признаки самой CRM идут первыми и не переопределяются, дальше
        решение человека, и только потом пороги эвристики.
      </p>
      <table className="site-table">
        <thead>
          <tr>
            <th>Вид</th>
            <th>Как определяется</th>
            <th>Что меняется в отчёте</th>
          </tr>
        </thead>
        <tbody>
          {KINDS.map((row) => (
            <tr key={row.kind}>
              <td data-label="Вид">
                {KIND_LABEL[row.kind]} <span className="num">{row.kind}</span>
              </td>
              <td data-label="Как определяется">{row.how}</td>
              <td data-label="Что меняется в отчёте">{row.effect}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="site-p">
        Позиция в цепочке нумеруется только по продажным этапам, поэтому выигрыш и отказ в конверсию
        не входят вовсе. Иначе бы каждое закрытие сделки читалось как перескок через всю оставшуюся
        воронку: у закрывающих этапов порядковый номер в amoCRM заведомо больше любого продажного.
        Ключ этапа — всегда пара «воронка + этап», никогда имя: этапы переименовывают, а
        идентификаторы выигрыша и отказа повторяются во всех воронках сразу.
      </p>

      <h2 className="site-h2">Как размечена демо-воронка</h2>
      <p className="site-p">
        Та же разметка, по которой виджет строит вкладку «Воронка»: продажные этапы идут с номером
        позиции, всё остальное — без него и вне расчёта конверсии.
      </p>
      {/* Кадр стоит здесь, а не в конце раздела: абзац утверждает, как разметка
          выглядит в отчёте, и следующая же строка это показывает. Обрез 900 —
          по белому полю под таблицей: все строки, включая три полки, должны
          быть видны целиком, иначе кадр доказывает не то, о чём абзац. */}
      <Shot
        {...SHOTS.funnel}
        tall={900}
        caption={
          <>
            Жёлтым — {withPlural(PARKING.length, 'этап-полка', 'этапа-полки', 'этапов-полок')}: каждый
            помечен словом «парковка», и вместо конверсии у него стоит «вне цепочки». Проценты в
            колонке «из предыдущего» посчитаны по соседним строкам без этой пометки.
          </>
        }
        source={SHOT_SOURCE}
      />
      <table className="site-table">
        <thead>
          <tr>
            <th>Этап</th>
            <th>Вид</th>
            <th>Позиция в цепочке</th>
            <th>Вошло за {PIPELINE.period}</th>
          </tr>
        </thead>
        <tbody>
          {MARKED_ROWS.map((row) => {
            const pos = CHAIN_POS.get(row.statusId);
            return (
              <tr key={row.statusId}>
                <td data-label="Этап">{row.name}</td>
                <td data-label="Вид">{KIND_LABEL[row.kind]}</td>
                <td data-label="Позиция в цепочке">
                  {pos === undefined ? '—' : <span className="num">{pos}</span>}
                </td>
                <td data-label="Вошло">
                  <span className="num">{n(row.entered)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Source>{DEMO_SOURCE}</Source>
      <p className="site-p">
        «Неразобранного» в этой таблице нет: в демо-данных нет его строки, а сочинять для неё числа
        мы не будем. В живом аккаунте этап с типом 1 размечается как неразобранное и в конверсию не
        входит.
      </p>

      <h2 className="site-h2">Эвристика: один фильтр и три признака</h2>
      <p className="site-p">
        Эвристика смотрит не на названия этапов, а на то, как через них ходят сделки. Сначала общий
        фильтр — «из этапа мало идут вперёд по продажной цепочке». Прошедший фильтр этап становится
        полкой, если сработал хотя бы один из трёх признаков.
      </p>
      <table className="site-table">
        <thead>
          <tr>
            <th>Что проверяется</th>
            <th>Порог</th>
            <th>Почему так</th>
          </tr>
        </thead>
        <tbody>
          {THRESHOLD_ROWS.map((row) => (
            <tr key={row.what}>
              <td data-label="Что проверяется">{row.what}</td>
              <td data-label="Порог">
                <span className="num">{row.value}</span>
              </td>
              <td data-label="Почему так">{row.why}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Source>
        пороги в коде — DEFAULT_PARKING_THRESHOLDS, src/core/stage-map.ts · вход в этап считается
        любой, включая создание сделки и приход из другой воронки
      </Source>

      <div className="site-grid site-grid--2" style={{ marginTop: 24 }}>
        <section className="site-card">
          <h3 className="site-h3">Чего в признаках намеренно нет</h3>
          <p className="site-p">
            Доли исходов в другую полку вперёд по порядку этапов. С ней полкой становится «
            {TAKEN_TO_WORK?.name}» — главный продажный этап аккаунта, из которого{' '}
            <span className="num">{pct(PARKING_HEURISTIC.takenToWorkToParkingPct)}</span> исходов
            уходит в «{NO_CONTACT?.name}». Исход в полку учитывается, только когда он назад по
            воронке.
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">Почему проходов больше одного</h3>
          <p className="site-p">
            Разметка и переходы связаны кольцом: вид этапа считается по потоку переходов, а поток
            размечается по видам. Кольцо разрывается итерацией — разметка пересчитывается, пока не
            перестанет меняться. Предел —{' '}
            {withPlural(PARKING_HEURISTIC.maxPasses, 'проход', 'прохода', 'проходов')}; практически
            хватает второго.
          </p>
        </section>
      </div>

      <h2 className="site-h2">Подтверждает человек, а не алгоритм</h2>
      <p className="site-p">
        На полной истории пилота — {withPlural(PILOT.historyYears, 'год', 'года', 'лет')} — эта же
        эвристика объявила полками{' '}
        {withPlural(PARKING_INCIDENT.flagged, 'этап', 'этапа', 'этапов')} вместо{' '}
        {PARKING_INCIDENT.real}, включая тот, откуда {pct(PARKING_INCIDENT.contractWinShare)}{' '}
        закрытий уходят в выигрыш. Причину нашли и починили, но последнее ложное срабатывание порогом
        не чинится вообще: у ложного этапа {pct(PARKING_INCIDENT.qualifiedLostShare)} исходов в отказ, у настоящей полки —{' '}
        {pct(PARKING_INCIDENT.lostShareAfterFix.noContact)}, и любой разводящий их порог был бы
        подгонкой под один аккаунт.{' '}
        <Link href="/method/parking">Разбор ошибки целиком — с цифрами, причиной и починкой</Link>.
      </p>
      <Source>{INCIDENT_SOURCE}</Source>
      <p className="site-p">
        Отсюда правило: эвристика предлагает, решение подписывает тот, кто знает свою воронку.
        Подтверждённый вид этапа хранится вместе с автором решения, и с этого момента пересчёт
        эвристики этот этап не трогает — даже если статистика по нему изменится. Это единственная
        разметка, которая сильнее порогов.
      </p>

      <div className="site-card">
        <div className="site-cardhead">
          <h3 className="site-h3">Экрана подтверждения внутри виджета пока нет</h3>
          <Mark kind="building">в разработке</Mark>
        </div>
        <p className="site-p">
          Механизм под ним написан и покрыт тестами: решение человека перебивает эвристику, хранится
          с автором и тут же пересчитывает отчёты. Не написана кнопка. Пока её нет, разметку
          согласуем в переписке: напишите, какой этап считать полкой, а какой — продажным, и мы
          проставим это на вашем аккаунте. Отвечаем в рабочие часы по будням, обычно в тот же рабочий
          день. <Link href="/support">Написать в поддержку</Link>
        </p>
      </div>

      <h2 className="site-h2">Как поменять разметку потом</h2>
      <p className="site-p">
        Разметка не высекается при подключении. Менять её можно в любой момент, и это дешёвая
        операция: от вида этапа зависит ровно один признак перехода — пропуск этапа. Откат считается
        по порядку этапов, смена воронки — по воронке, время в этапе — по времени; разметку из них не
        читает ни один. Поэтому смена вида переписывает одну колонку и заново нумерует позиции в
        цепочке, а история событий и сами переходы не перестраиваются. Перезагружать аккаунт и ждать
        первую загрузку заново не нужно.
      </p>
      <p className="site-p">
        Продажный этап, которому позицию в цепочке ещё не проставили, из воронки не выпадает: он
        уходит в конец цепочки и упорядочивается по порядку этапов amoCRM. Молча исчезнуть из отчёта
        этап не может — это правило важнее аккуратной картинки.
      </p>

      <h2 className="site-h2">Что читать дальше</h2>
      <p className="site-p">
        Как из размеченной цепочки получаются проценты —{' '}
        <Link href="/widgets/analytics/docs/metrics">метрики и формулы</Link>: поток и когорта,
        конверсия между соседними этапами, медиана времени, откаты и пропуски. Почему разрез по полю
        иногда не строится вовсе —{' '}
        <Link href="/widgets/analytics/docs/metrics">качество данных</Link>. Все правила счёта в
        одном месте — <Link href="/method">как мы считаем</Link>. Что теряет на тех же данных штатный
        отчёт —{' '}
        <Link href="/widgets/analytics/vs-amocrm-analiz-prodazh">сравнение с «Анализом продаж»</Link>.
      </p>
    </DocsShell>
  );
}
