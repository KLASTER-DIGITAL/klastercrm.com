/* Строки вкладки «Обзор» + общий блок «воронка без детальной выгрузки» (nomain.*),
   который использует и вкладка «Воронка». Владелец — агент «обзор+воронка». */

export const overview: { ru: Record<string, string>; en: Record<string, string> } = {
  ru: {
    'ov.tile.new': 'Новых сделок в воронке',
    'ov.tile.meet': 'Дошли до встречи',
    'ov.tile.won': 'Успешно реализовано',
    'ov.tile.nocontact': 'Ушли в «Нет контакта»',
    'ov.tile.lost': 'Закрыто и не реализовано',
    'ov.cmp.range': 'Период {a} · сравнение с {b}',
    'ov.cmp.none': 'Период {a} · сравнить не с чем: предыдущего отрезка в данных нет',
    'ov.cmp.off': 'Период {a} · сравнение выключено',
    'ov.tile.fresh': 'из них новых: {n} · из прошлых периодов: {old}',
    'ov.tile.fresh.hint':
      'Вход в этап за период считает все сделки, которые сделали этот переход, — и созданные раньше тоже. «Новые» — созданы в этом же периоде.',
    'ov.delta.prev': 'к прошлому периоду',
    'ov.delta.flat': 'без изменений',
    'ov.pp': 'п.п.',

    'ov.holes.title': 'Где теряются сделки',
    'ov.holes.sub': 'Считается по фактической истории смены статусов за выбранный период',

    'ov.chain.title': 'Продажная цепочка',
    'ov.chain.sub': 'Без парковок',
    'ov.chain.note':
      'Первая строка — сделки, созданные в воронке: создание сделки не порождает событие смены статуса, поэтому число берётся из даты создания. Знак ⚠ значит, что в этап приходят не только из предыдущего: часть возвращается из парковок, часть перепрыгивает.',
    'ov.anomTitle': 'в этап приходят не только из предыдущего',

    'ov.ins.noContact.t':
      '«Нет контакта» получил {noContact} {deals} — больше, чем «Взято в работу» ({work})',
    'ov.ins.noContact.b':
      'Медиана простоя там {medianDays} дн. Это не этап воронки, а накопитель необработанных заявок. В штатном «Анализе продаж» он стоит в общей цепочке и обнуляет накопительную конверсию.',
    'ov.ins.meetToReserveOver.t': 'Из {held} проведённых встреч до резерва дошло {reserve} — {heldToReservePct}%',
    'ov.ins.meetToReserveOver.b':
      'Самое узкое место продажной цепочки. Проведённых встреч ({held}) больше, чем назначенных ({meet}, это {meetToHeldPct}%): часть сделок попадает в «проведено», минуя «назначено» — этап пропускают, и назначение встречи в CRM не фиксируется.',
    'ov.tile.work': 'Взято в работу',
    'ov.go.funnel': 'Подробнее',
    'trend.now': 'текущий, не закончился',
    'ov.ins.meetToReserve.t':
      'Из {held} проведённых встреч до резерва дошло {reserve} — {heldToReservePct}%',
    'ov.ins.meetToReserve.b':
      'Самое узкое место продажной цепочки. Для сравнения: «Встреча назначена → Встреча проведена» даёт {meetToHeldPct}% — на встречи клиенты доходят, а бронировать не начинают.',
    'ov.ins.qualification.t':
      'Квалификация: {workToQualPct}% от взятых в работу, дальше на встречу — {qualToMeetPct}%',
    'ov.ins.qualification.b':
      'Из {work} взятых в работу квалифицировано {qual}, встреча назначена {meet} раз.',
    'ov.ins.rollSkip.t': '{rollbacks} {rollWord} и {skips} {skipWord} этапа за период',
    'ov.ins.rollSkip.b':
      'Самый частый маршрут — «{topSkipFrom} → {topSkipTo}» напрямую, {topSkipN} раз. Откаты и пропуски — признак того, что порядок этапов в CRM не совпадает с реальным процессом.',
    'ov.ins.automation.t': '{bot} {trWord} за период сделала автоматика, а не люди',
    'ov.ins.automation.b':
      'Это {botPct}% всех переходов ({totalTransitions} за период). Их надо вычитать из оценки менеджеров, иначе конверсия робота засчитывается человеку.',
    'ov.ins.fill.t':
      'Поля заполнены на 1–41%: причина отказа {loss}%, проект {project}%, источник {source}%, бюджет {budget}%',
    'ov.ins.fill.b':
      'Любой разрез по проекту покроет треть сделок, по источнику — пятую часть. Отчёт «выручка по источникам» на этих данных построить нельзя.',

    /* формы множественного числа: подставляются в тексты параметрами */
    'pl.dealAcc.one': 'сделку',
    'pl.dealAcc.few': 'сделки',
    'pl.dealAcc.many': 'сделок',
    'pl.dealNom.one': 'сделка',
    'pl.dealNom.few': 'сделки',
    'pl.dealNom.many': 'сделок',
    'pl.roll.one': 'откат',
    'pl.roll.few': 'отката',
    'pl.roll.many': 'откатов',
    'pl.skip.one': 'пропуск',
    'pl.skip.few': 'пропуска',
    'pl.skip.many': 'пропусков',
    'pl.tr.one': 'переход',
    'pl.tr.few': 'перехода',
    'pl.tr.many': 'переходов',

    /* воронка без детальной выгрузки — используется на «Обзоре» и «Воронке» */
    'nomain.title': 'Воронка «{name}»',
    'nomain.sub':
      'В демо-данные выгружена детальная история только по главной воронке. По остальным показаны реальные итоги',
    'nomain.transitions': 'Переходов за период',
    'nomain.created': 'Сделок создано за период',
    'nomain.hint':
      'В продукте детализация одинаковая для всех воронок, включая сшивку клиентского пути между ними. За период между воронками было {cross} переходов, из них {top} — «{from} → {to}».',
    'ov.tile.revenue': 'Выручка (успешно)',

    'plan.title': 'План на месяц · {month}',
    'plan.partial': 'месяц не закончился, факт за {days} дн.',
    'plan.empty':
      'План не задан. Задайте цели месяца — и виджет покажет выполнение и прогноз по темпу.',
    'plan.set': 'Задать план',
    'plan.edit': 'Изменить план',
    'plan.metric': 'Показатель',
    'plan.target': 'План',
    'plan.fact': 'Факт',
    'plan.done': 'Выполнение',
    'plan.forecast': 'Прогноз по темпу',
    'plan.m.created': 'Создано сделок',
    'plan.m.won': 'Успешно реализовано',
    'plan.m.revenue': 'Выручка',
    'plan.save': 'Сохранить план',
    'plan.cancel': 'Отмена',
    'plan.err': 'Не сохранилось. Попробуйте ещё раз.',
    'plan.rrNote':
      'Прогноз по темпу — линейная оценка «как закончится месяц при текущей скорости». Это модель, а не обещание.',

    'trend.title': 'Динамика по месяцам',
    'trend.unsliced': 'Динамика — по всей воронке: фильтры менеджера, проекта и группы на неё не действуют.',
    'trend.sub':
      'Создано сделок по месяцам за год. Зелёное число под столбиком — успешно реализовано в этом месяце.',
    'trend.legend': 'Выручка успешных за текущий месяц: {revenue} — по заполненным бюджетам сделок.',

  },
  en: {
    'ov.tile.new': 'New leads in the pipeline',
    'ov.tile.meet': 'Reached a meeting',
    'ov.tile.won': 'Won',
    'ov.tile.nocontact': 'Moved to "No contact"',
    'ov.tile.lost': 'Closed lost',
    'ov.cmp.range': 'Period {a} · compared with {b}',
    'ov.cmp.none': 'Period {a} · nothing to compare with: the previous range is not in the data',
    'ov.cmp.off': 'Period {a} · comparison is off',
    'ov.tile.fresh': 'new: {n} · from earlier periods: {old}',
    'ov.tile.fresh.hint':
      'Stage entries for the period count every deal that made this transition — including deals created earlier. "New" were created within this period.',
    'ov.delta.prev': 'vs previous period',
    'ov.delta.flat': 'no change',
    'ov.pp': 'pp',

    'ov.holes.title': 'Where leads are lost',
    'ov.holes.sub': 'Computed from the actual status-change history for the selected period',

    'ov.chain.title': 'Sales chain',
    'ov.chain.sub': 'Parking stages excluded',
    'ov.chain.note':
      'The first row is leads created in the pipeline: lead creation produces no status-change event, so the number comes from the creation date. The ⚠ mark means leads enter the stage not only from the previous one: some return from parking stages, some skip ahead.',
    'ov.anomTitle': 'leads enter this stage not only from the previous one',

    'ov.ins.noContact.t':
      '"No contact" received {noContact} {deals} — more than "Taken to work" ({work})',
    'ov.ins.noContact.b':
      'Median idle time there is {medianDays} days. This is not a funnel stage but a backlog of unprocessed leads. The stock "Sales analysis" keeps it inside the chain and zeroes out the cumulative conversion.',
    'ov.ins.meetToReserveOver.t': 'Of {held} meetings held, {reserve} reached reservation — {heldToReservePct}%',
    'ov.ins.meetToReserveOver.b':
      'The narrowest point of the sales chain. More meetings were held ({held}) than scheduled ({meet}, that is {meetToHeldPct}%): some deals land in "held" bypassing "scheduled" — the stage is skipped and scheduling is not recorded in the CRM.',
    'ov.tile.work': 'Taken into work',
    'ov.go.funnel': 'Details',
    'trend.now': 'current, not finished',
    'ov.ins.meetToReserve.t':
      'Out of {held} held meetings, {reserve} reached a reservation — {heldToReservePct}%',
    'ov.ins.meetToReserve.b':
      'The narrowest point of the sales chain. For comparison, "Meeting scheduled → Meeting held" gives {meetToHeldPct}% — clients do show up for meetings, they just do not start booking.',
    'ov.ins.qualification.t':
      'Qualification: {workToQualPct}% of leads taken to work, then to a meeting — {qualToMeetPct}%',
    'ov.ins.qualification.b':
      'Of {work} leads taken to work, {qual} were qualified and a meeting was scheduled {meet} times.',
    'ov.ins.rollSkip.t': '{rollbacks} {rollWord} and {skips} stage {skipWord} over the period',
    'ov.ins.rollSkip.b':
      'The most frequent route is "{topSkipFrom} → {topSkipTo}" directly, {topSkipN} times. Rollbacks and skips are a sign that the stage order in the CRM does not match the real process.',
    'ov.ins.automation.t': '{bot} {trWord} over the period were made by automation, not people',
    'ov.ins.automation.b':
      'That is {botPct}% of all transitions ({totalTransitions} over the period). They must be excluded from manager evaluation, otherwise the robot’s conversion is credited to a person.',
    'ov.ins.fill.t':
      'Fields are 1–41% filled: loss reason {loss}%, project {project}%, source {source}%, budget {budget}%',
    'ov.ins.fill.b':
      'Any slice by project covers a third of the leads, by source — a fifth. A "revenue by source" report cannot be built on this data.',

    'pl.dealAcc.one': 'lead',
    'pl.dealAcc.few': 'leads',
    'pl.dealAcc.many': 'leads',
    'pl.dealNom.one': 'lead',
    'pl.dealNom.few': 'leads',
    'pl.dealNom.many': 'leads',
    'pl.roll.one': 'rollback',
    'pl.roll.few': 'rollbacks',
    'pl.roll.many': 'rollbacks',
    'pl.skip.one': 'skip',
    'pl.skip.few': 'skips',
    'pl.skip.many': 'skips',
    'pl.tr.one': 'transition',
    'pl.tr.few': 'transitions',
    'pl.tr.many': 'transitions',

    'nomain.title': 'Pipeline "{name}"',
    'nomain.sub':
      'The demo export contains detailed history for the main pipeline only. For the rest, genuine totals are shown',
    'nomain.transitions': 'Transitions over the period',
    'nomain.created': 'Leads created over the period',
    'nomain.hint':
      'In the product, every pipeline gets the same level of detail, including stitching the client journey across pipelines. Over the period there were {cross} cross-pipeline transitions, {top} of them "{from} → {to}".',
    'ov.tile.revenue': 'Revenue (won)',

    'plan.title': 'Monthly plan · {month}',
    'plan.partial': 'month in progress, facts for {days} d.',
    'plan.empty':
      'No plan set. Enter the monthly targets and the widget will show completion and a pace forecast.',
    'plan.set': 'Set plan',
    'plan.edit': 'Edit plan',
    'plan.metric': 'Metric',
    'plan.target': 'Plan',
    'plan.fact': 'Fact',
    'plan.done': 'Completion',
    'plan.forecast': 'Pace forecast',
    'plan.m.created': 'Leads created',
    'plan.m.won': 'Won',
    'plan.m.revenue': 'Revenue',
    'plan.save': 'Save plan',
    'plan.cancel': 'Cancel',
    'plan.err': 'Not saved. Try again.',
    'plan.rrNote':
      'The pace forecast is a linear estimate of how the month ends at the current speed. A model, not a promise.',

    'trend.title': 'Monthly dynamics',
    'trend.unsliced': 'The trend covers the whole pipeline: manager, project and group filters do not apply to it.',
    'trend.sub':
      'Deals created per month over the year. The green number under a bar is won deals in that month.',
    'trend.legend': 'Won revenue for the current month: {revenue} — from filled deal budgets.',

  },
};
