/* Строки вкладки «Путь лида». Владелец — агент «путь».

   Вкладка отвечает на вопрос «почему сделки стоят»: где они зависают дольше норматива,
   какими маршрутами ходят и у кого из менеджеров их больше. Ключ 'tab.journey' переопределён
   здесь намеренно — содержимое вкладки про путь одной сделки внутри воронки, а не про сшивку
   воронок; сшивка живёт на вкладке «Путь заявки». */

export const journey: { ru: Record<string, string>; en: Record<string, string> } = {
  ru: {
    'tab.journey': 'Путь лида',

    /* общее */
    'jr.days': '{d} дн.',
    'jr.badge.model': 'модель',
    'jr.badge.fact': 'факт',
    'jr.lead.title': 'Почему сделки стоят',
    'jr.lead.sub':
      'Конверсия говорит, сколько потерялось. Этот раздел говорит, где именно сделки лежат без движения, какими кругами ходят и у кого из менеджеров их больше всего.',
    'jr.model.title': 'Что здесь факт, а что модель',
    'jr.model.body':
      'Из выгрузки настоящие: «вошло в этап», медиана времени на этапе, число замеров, конверсия каждого менеджера, состав и веса откатов. Пер-лидовой истории в демо-выгрузке нет, поэтому 90-й перцентиль, число зависших сделок, разложение по маршрутам и таймлайн ниже восстановлены моделью и помечены значком «модель». После подключения вашего аккаунта эти же цифры считаются по вашим событиям, без модели.',

    /* норматив */
    'jr.norm.label': 'Норматив на этапе',
    'jr.norm.opt': 'медиана × {k}',
    'jr.norm.hint':
      'Норматив — это срок, после которого сделка считается зависшей. По умолчанию медиана этапа, умноженная на 3: половина сделок проходит этап за медиану, тройной запас — уже не «чуть дольше», а остановка. Норматив не опускается ниже суток: просрочка в четыре часа — шум замера, а не проблема процесса.',

    /* зависания по этапам */
    'jr.stuck.title': 'Где лиды застревают',
    'jr.stuck.sub': 'Этапы отсортированы по числу зависших сделок, а не по порядку в воронке',
    'jr.col.stage': 'Этап',
    'jr.col.median': 'Медиана',
    'jr.col.p90': 'p90',
    'jr.col.norm': 'Норматив',
    'jr.col.entered': 'Вошло',
    'jr.col.stuck': 'Зависло',
    'jr.col.share': 'Доля',
    'jr.col.over': 'Дней сверх',
    'jr.col.obs': 'Сделок в расчёте',
    'jr.stuck.total': 'Итого',
    'jr.stuck.hint':
      'Дольше норматива тянутся {stuck} проходов через этап из {entered} — суммарно {days} дней потерянного времени. Хуже всех «{worst}»: медиана {median}, а десятая часть сделок лежит там дольше {p90}. Считаем проходы, а не сделки: одна сделка проходит несколько этапов и может застрять на каждом.',
    'jr.stuck.median.hint':
      'Медиана, а не среднее: одна сделка, забытая на полгода, поднимает среднее так, что оно перестаёт описывать работу отдела.',
    'jr.stuck.p90.hint':
      'Девять сделок из десяти проходят этап быстрее этого срока. Оставшаяся десятая и есть то, что руководитель ищет глазами в списке.',

    /* деньги */
    'jr.money.title': 'Сколько денег заморожено',
    'jr.money.blocked':
      'Не считаем. Поле «Бюджет сделки» заполнено у {rate}% сделок — при такой заполненности сумма зависших будет отличаться от правды в разы, а выглядеть будет убедительно. Заполните бюджет хотя бы у трети сделок, и этот блок посчитается сам.',

    /* маршруты */
    'jr.routes.title': 'Маршруты',
    'jr.routes.sub':
      'Фактические цепочки этапов от «Взято в работу» до конца. Сумма по маршрутам равна числу входов в «Взято в работу» за период',
    'jr.col.route': 'Маршрут',
    'jr.col.leads': 'Сделок',
    'jr.col.loops': 'Возвратов',
    'jr.col.routeDays': 'Сумма медиан',
    'jr.col.wonConv': 'Дошло до успеха',
    'jr.route.noContactClose': 'Тихая потеря',
    'jr.route.straightLost': 'Отказ сразу',
    'jr.route.qualMeetLost': 'Дошёл до встречи и отвалился',
    'jr.route.reactLoop': 'Круг через реактивацию',
    'jr.route.delayedLoop': 'Отложили и забыли',
    'jr.route.clean': 'Прямой маршрут',
    'jr.route.rest': 'Прочие маршруты',
    'jr.routes.hint':
      'Короткий маршрут ведёт к сделке, длинный — к отказу. «{top}» — самый массовый маршрут воронки: {n} сделок за период.',
    'jr.routes.loops.hint':
      'Возврат — переход на этап с меньшим порядковым номером в той же воронке. Два возврата в маршруте означают, что сделку доставали из архива дважды.',
    'jr.routes.days.hint':
      'Сумма медиан этапов маршрута — настоящие числа из выгрузки. Это не средний срок сделки, а нижняя оценка: столько маршрут занимает, если каждый этап пройден за медиану.',

    /* менеджеры */
    'jr.mgr.title': 'Зависания по менеджерам',
    'jr.mgr.sub':
      'Сколько сделок менеджера стоят дольше норматива на каждом этапе. Автоматика — отдельной строкой, в медиану отдела не входит',
    'jr.col.manager': 'Менеджер',
    'jr.col.mgrStuck': 'Всего',
    'jr.col.mgrShare': 'Доля',
    'jr.col.conv': 'Конверсия до встречи · по зависшим',
    'jr.col.stuckConv': 'по зависшим',
    'jr.col.delta': 'к медиане',
    'jr.mgr.bot': 'вне медианы',
    'jr.mgr.median': 'Медиана отдела: {v}',
    'jr.mgr.hint':
      'Конверсия и число сделок здесь настоящие. Смоделирована связь между ними: чем сильнее менеджер отстаёт по конверсии, тем больше у него сделок за нормативом. На вашем аккаунте эта связь считается напрямую по времени на этапе, и она может оказаться другой.',
    'jr.mgr.conv.hint':
      'Доля сделок, которые менеджер довёл от «Взято в работу» до «Встреча проведена». Считается только при базе больше 20 сделок — на меньшей выборке процент не показываем.',
    'jr.mgr.stuckConv.hint':
      'Конверсия тех же менеджеров по сделкам, которые простояли дольше норматива. Величина модельная: показывает порядок потерь, а не точное число.',

    /* таймлайн */
    'jr.tl.title': 'Таймлайн сделки',
    'jr.tl.sub':
      'История смены статусов одной сделки: этап, сколько на нём простояла, кто вёл. В карточке amoCRM это лента событий вперемешку с письмами и звонками — здесь только движение по воронке',
    'jr.tl.case.clean': 'Прошла насквозь',
    'jr.tl.case.parked': 'Легла в парковку',
    'jr.tl.case.loop': 'Ходила по кругу',
    'jr.tl.outcome.won': 'успешно реализовано',
    'jr.tl.outcome.lost': 'закрыто и не реализовано',
    'jr.tl.outcome.open': 'в работе',
    'jr.tl.created': 'Сделка создана',
    'jr.tl.total': 'Всего {d} дн. · возвратов {n}',
    'jr.tl.resp': 'вёл',
    'jr.tl.back': 'откат',
    'jr.tl.over': 'дольше норматива',
    'jr.tl.hint':
      'Три примера собраны из настоящих этапов и настоящих медиан, но сами сделки модельные: пер-лидовой истории в демо-выгрузке нет. На подключённом аккаунте сюда открывается любая сделка из списка зависших.',

    /* ── живой режим: всё по истории аккаунта ── */
    'jr.live.title': 'Всё по истории вашего аккаунта',
    'jr.live.body':
      'Зависшие сделки, маршруты и таймлайн считаются по переходам между этапами из вашего amoCRM, без моделей. Зависшая — открытая сделка, которая стоит на текущем этапе дольше норматива по факту последнего перехода. Снимок открытых сделок на {at}.',
    'jr.live.noHistory':
      'У {n} сделок история не содержит перехода в текущий этап (данные до подключения или созданы прямо в этапе) — для них срок считается от даты создания.',
    'jr.live.loading': 'Читаем историю сделок…',
    'jr.live.error': 'Не удалось прочитать историю сделок. Обновите страницу или повторите позже.',
    'jr.live.truncated': 'Открытых сделок в воронке больше {cap} — поштучный расчёт для такого объёма не выполняется. Сузьте воронку или напишите нам.',
    'jr.live.routesTruncated': 'Сделок в маршрутах больше {cap} — сузьте период.',
    'jr.norm.days.label': 'Норматив',
    'jr.norm.days.opt': '{d} дн.',
    'jr.norm.days.hint':
      'Сделка считается зависшей, если стоит на текущем этапе дольше этого срока по факту последнего перехода в него. Медиана и p90 рядом показывают, сколько этап обычно занимает — по ним видно, где норматив мягкий, а где жёсткий.',
    'jr.col.open': 'Сейчас на этапе',
    'jr.col.longest': 'Самая давняя',
    'jr.stuck.sub.live': 'Открытые сделки воронки на сегодня. Этапы отсортированы по числу зависших',
    'jr.stuck.p90.hint.live': 'Девять из десяти уходов с этапа за период случились быстрее этого срока — по вашим переходам, не по модели.',
    'jr.stuck.hint.live':
      'Дольше {norm} дн. стоят {stuck} из {open} открытых сделок — суммарно {days} дней сверх норматива. Больше всего зависших на «{worst}»: {n}, самая давняя стоит {longest} дн.',
    'jr.routes.sub.live':
      'Реальные цепочки этапов сделок, вошедших в «{start}» за период, до последнего перехода. Сумма по маршрутам равна числу таких сделок; переходы в другие воронки в цепочке не показаны',
    'jr.routes.noProject': 'Срез по проекту к маршрутам не применяется: у строки маршрута нет поля сделки.',
    'jr.col.routeDaysLive': 'Медиана дней',
    'jr.routes.days.live.hint':
      'Медиана длительности маршрута по его сделкам: у закрытых — до последнего перехода, у открытых — до сегодня.',
    'jr.routes.hint.live': 'Самый массовый маршрут — «{top}»: {n} сделок за период.',
    'jr.mgr.sub.live': 'Открытые сделки каждого ответственного, стоящие дольше норматива, по этапам',
    'jr.col.mgrOpen': 'Открыто',
    'jr.mgr.hint.live':
      'Считается по текущему ответственному: сделку двигает тот, у кого она сейчас. Доля — от открытых сделок менеджера, показывается при базе от 8.',
    'jr.tl.sub.live':
      'История смены статусов одной сделки по вашим событиям: этап, сколько на нём простояла, кто был ответственным. Ниже — сделки, которые стоят дольше всех; можно ввести любой номер',
    'jr.tl.pick': 'Дольше всех стоят',
    'jr.tl.input': 'Номер сделки',
    'jr.tl.show': 'Показать',
    'jr.tl.loading': 'Читаем историю…',
    'jr.tl.notFound': 'Сделки с таким номером нет или она вам недоступна.',
    'jr.tl.error': 'Не удалось прочитать историю сделки.',
    'jr.tl.empty': 'Зависших сделок в этом срезе нет — выберите номер вручную.',
    'jr.tl.now': 'стоит сейчас',
    'jr.tl.synthetic': 'создана в этапе',
    'jr.tl.other': 'другая воронка',
    'jr.tl.openAmo': 'Открыть в amoCRM',
    'jr.tl.hint.live':
      'Дни на этапе — от перехода в него до следующего перехода; на текущем этапе — до сегодня. Откат — переход на этап с меньшим порядковым номером.',
    'jr.money.blocked.live':
      'Не считаем. Бюджет заполнен у {rate}% открытых сделок — сумма зависших при такой заполненности отличалась бы от правды в разы, а выглядела бы убедительно. Заполните бюджет хотя бы у трети открытых сделок, и этот блок посчитается сам.',
    'jr.money.sum': 'В зависших сделках {sum} — бюджет указан у {n} из {stuck}.',
    'jr.money.warn': 'Бюджет заполнен у {rate}% открытых сделок: сумма занижена, пользуйтесь ею как порядком величины.',
    'jr.routes.start': 'Маршруты от этапа',
    'jr.click.hint': 'Число открывает список сделок.',
  },
  en: {
    'tab.journey': 'Lead journey',

    'jr.days': '{d} d',
    'jr.badge.model': 'modelled',
    'jr.badge.fact': 'actual',
    'jr.lead.title': 'Why deals stand still',
    'jr.lead.sub':
      'Conversion tells you how much was lost. This section tells you where deals sit without moving, which loops they run, and which managers hold the most of them.',
    'jr.model.title': 'What is measured here and what is modelled',
    'jr.model.body':
      'Taken from the export as is: entries per stage, median time in stage, number of measurements, each manager conversion, and the composition and weights of rollbacks. The demo export holds no per-lead history, so the 90th percentile, the number of stuck deals, the route breakdown and the timeline below are reconstructed by a model and marked "modelled". Once your own account is connected, the same figures are computed from your events, with no model involved.',

    'jr.norm.label': 'Stage norm',
    'jr.norm.opt': 'median × {k}',
    'jr.norm.hint':
      'The norm is the point after which a deal counts as stuck. By default it is the stage median times three: half the deals clear the stage within the median, and a threefold margin is no longer "a bit slower", it is a stop. The norm never drops below one day: a four-hour overrun is measurement noise, not a process problem.',

    'jr.stuck.title': 'Where leads get stuck',
    'jr.stuck.sub':
      'Stages are sorted by the number of stuck deals, not by their order in the funnel',
    'jr.col.stage': 'Stage',
    'jr.col.median': 'Median',
    'jr.col.p90': 'p90',
    'jr.col.norm': 'Norm',
    'jr.col.entered': 'Entered',
    'jr.col.stuck': 'Stuck',
    'jr.col.share': 'Share',
    'jr.col.over': 'Days over',
    'jr.col.obs': 'Measurements',
    'jr.stuck.total': 'Total',
    'jr.stuck.hint':
      '{stuck} stage visits out of {entered} last longer than the norm — {days} days of lost time in total. The worst is "{worst}": median {median}, while a tenth of the deals lie there longer than {p90}. We count visits, not deals: one deal passes several stages and can stall at each of them.',
    'jr.stuck.median.hint':
      'Median, not average: a single deal forgotten for half a year lifts the average until it no longer describes the team at all.',
    'jr.stuck.p90.hint':
      'Nine deals out of ten clear the stage faster than this. The remaining tenth is exactly what a head of sales scans the list for.',

    'jr.money.title': 'How much money is frozen',
    'jr.money.blocked':
      'Not computed. The "Deal budget" field is filled in {rate}% of deals — at that fill rate the frozen amount would be off by multiples while looking perfectly convincing. Fill in the budget for at least a third of your deals and this block computes itself.',

    'jr.routes.title': 'Routes',
    'jr.routes.sub':
      'Actual stage chains from "Taken to work" to the end. The routes add up to the number of entries into "Taken to work" for the period',
    'jr.col.route': 'Route',
    'jr.col.leads': 'Deals',
    'jr.col.loops': 'Returns',
    'jr.col.routeDays': 'Sum of medians',
    'jr.col.wonConv': 'Reached a sale',
    'jr.route.noContactClose': 'Quiet loss',
    'jr.route.straightLost': 'Rejected outright',
    'jr.route.qualMeetLost': 'Met and fell off',
    'jr.route.reactLoop': 'Loop through reactivation',
    'jr.route.delayedLoop': 'Postponed and forgotten',
    'jr.route.clean': 'Straight route',
    'jr.route.rest': 'Other routes',
    'jr.routes.hint':
      'The short route leads to a sale, the long one to a rejection. "{top}" is the busiest route in the funnel: {n} deals in the period.',
    'jr.routes.loops.hint':
      'A return is a move to a stage with a lower sort order inside the same pipeline. Two returns in a route mean the deal was pulled out of the archive twice.',
    'jr.routes.days.hint':
      'The sum of stage medians along the route is made of real numbers from the export. It is not an average deal length but a lower bound: this is how long the route takes if every stage is cleared within its median.',

    'jr.mgr.title': 'Stuck deals by manager',
    'jr.mgr.sub':
      'How many of a manager deals stand longer than the norm at each stage. Automation is a separate row and stays out of the team median',
    'jr.col.manager': 'Manager',
    'jr.col.mgrStuck': 'Total',
    'jr.col.mgrShare': 'Share',
    'jr.col.conv': 'Conversion to meeting · on stuck',
    'jr.col.stuckConv': 'on stuck deals',
    'jr.col.delta': 'vs median',
    'jr.mgr.bot': 'out of median',
    'jr.mgr.median': 'Team median: {v}',
    'jr.mgr.hint':
      'The conversions and deal counts here are real. What is modelled is the link between them: the further a manager falls behind on conversion, the more of their deals sit past the norm. On your own account this link is computed directly from time in stage, and it may turn out different.',
    'jr.mgr.conv.hint':
      'The share of deals the manager moved from "Taken to work" to "Meeting held". Computed only on a base above 20 deals — on a smaller sample the percentage is not shown.',
    'jr.mgr.stuckConv.hint':
      'The same managers conversion on deals that stood longer than the norm. A modelled figure: it shows the order of magnitude of the loss, not an exact number.',

    'jr.tl.title': 'Deal timeline',
    'jr.tl.sub':
      'The status history of a single deal: the stage, how long it stood there, who owned it. In the amoCRM card this is a feed mixed with emails and calls — here it is only movement through the funnel',
    'jr.tl.case.clean': 'Went straight through',
    'jr.tl.case.parked': 'Landed in a parking stage',
    'jr.tl.case.loop': 'Ran in circles',
    'jr.tl.outcome.won': 'won',
    'jr.tl.outcome.lost': 'closed and lost',
    'jr.tl.outcome.open': 'in progress',
    'jr.tl.created': 'Deal created',
    'jr.tl.total': '{d} days in total · {n} returns',
    'jr.tl.resp': 'owner',
    'jr.tl.back': 'rollback',
    'jr.tl.over': 'longer than the norm',
    'jr.tl.hint':
      'The three examples are built from real stages and real medians, but the deals themselves are modelled: the demo export holds no per-lead history. On a connected account any deal from the stuck list opens here.',

    'jr.live.title': 'Everything from your account history',
    'jr.live.body':
      'Stuck deals, routes and the timeline are computed from stage transitions in your amoCRM, with no models. A stuck deal is an open deal that has stayed on its current stage longer than the norm since its last transition. Snapshot of open deals as of {at}.',
    'jr.live.noHistory':
      '{n} deals have no transition into their current stage in the history (data before connection, or created directly on the stage) — their time is counted from the creation date.',
    'jr.live.loading': 'Reading deal history…',
    'jr.live.error': 'Could not read deal history. Reload the page or try again later.',
    'jr.live.truncated': 'More than {cap} open deals in the pipeline — the per-deal calculation is not run at this size. Narrow the pipeline or contact us.',
    'jr.live.routesTruncated': 'More than {cap} deals in routes — narrow the period.',
    'jr.norm.days.label': 'Norm',
    'jr.norm.days.opt': '{d} d',
    'jr.norm.days.hint':
      'A deal counts as stuck when it has stayed on its current stage longer than this since the last transition into it. The median and p90 next to it show how long the stage usually takes, so you can see where the norm is soft and where it is strict.',
    'jr.col.open': 'On stage now',
    'jr.col.longest': 'Oldest',
    'jr.stuck.sub.live': 'Open deals of the pipeline as of today. Stages sorted by the number of stuck deals',
    'jr.stuck.p90.hint.live': 'Nine out of ten exits from the stage in the period happened faster than this — from your transitions, not a model.',
    'jr.stuck.hint.live':
      '{stuck} of {open} open deals have been on their stage longer than {norm} d — {days} days over the norm in total. Most stuck deals are on "{worst}": {n}, the oldest has been there {longest} d.',
    'jr.routes.sub.live':
      'Real stage chains of deals that entered "{start}" in the period, up to their last transition. The routes sum to the number of such deals; moves to other pipelines are not shown in the chain',
    'jr.routes.noProject': 'The project slice does not apply to routes: a route row has no deal field.',
    'jr.col.routeDaysLive': 'Median days',
    'jr.routes.days.live.hint':
      'Median route duration over its deals: closed ones up to the last transition, open ones up to today.',
    'jr.routes.hint.live': 'The most common route is "{top}": {n} deals in the period.',
    'jr.mgr.sub.live': 'Each owner’s open deals that have been on a stage longer than the norm, by stage',
    'jr.col.mgrOpen': 'Open',
    'jr.mgr.hint.live':
      'Counted by the current owner: the deal is moved by whoever holds it now. The share is of the manager’s open deals and is shown from a base of 8.',
    'jr.tl.sub.live':
      'Status history of one deal from your events: stage, time spent, who owned it. Below are the deals that have been standing the longest; any deal number can be entered',
    'jr.tl.pick': 'Standing the longest',
    'jr.tl.input': 'Deal number',
    'jr.tl.show': 'Show',
    'jr.tl.loading': 'Reading history…',
    'jr.tl.notFound': 'No deal with this number, or it is not available to you.',
    'jr.tl.error': 'Could not read the deal history.',
    'jr.tl.empty': 'No stuck deals in this slice — enter a number manually.',
    'jr.tl.now': 'standing now',
    'jr.tl.synthetic': 'created on stage',
    'jr.tl.other': 'other pipeline',
    'jr.tl.openAmo': 'Open in amoCRM',
    'jr.tl.hint.live':
      'Days on a stage run from the transition into it to the next transition; on the current stage — until today. A rollback is a move to a stage with a lower order.',
    'jr.money.blocked.live':
      'Not counted. The budget is filled in for {rate}% of open deals — at that fill rate the sum of stuck deals would be off by multiples while looking convincing. Fill in the budget for at least a third of open deals and this block computes itself.',
    'jr.money.sum': 'In stuck deals: {sum} — the budget is set on {n} of {stuck}.',
    'jr.money.warn': 'The budget is filled in for {rate}% of open deals: the sum is understated, treat it as an order of magnitude.',
    'jr.routes.start': 'Routes from stage',
    'jr.click.hint': 'A number opens the list of deals.',
  },
};

export default journey;
