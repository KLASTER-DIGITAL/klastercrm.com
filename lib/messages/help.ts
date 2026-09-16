/* Строки вкладки «Инструкция». Тексты универсальные: ни одной отсылки к нише,
   к конкретному аккаунту или к нашим внутренним названиям. */

export const help = {
  ru: {
    'tab.help': 'Инструкция',

    'help.steps.title': 'Как пользоваться: пять шагов',
    'help.steps.sub': 'Сценарий руководителя отдела — от среза до отчёта наверх.',
    'help.step.slice.t': '1. Соберите срез',
    'help.step.slice.b':
      'Строка фильтров действует на все вкладки сразу: воронка, период, группа, менеджер, поле сделки. «Сравнение» добавляет второй период — виджет посчитает дельты.',
    'help.step.read.t': '2. Прочитайте, где теряются сделки',
    'help.step.read.b':
      '«Обзор» показывает узкие места по фактической истории смены статусов, «Воронка» — конверсию между соседними этапами продажной цепочки, а не накопительную от первого этапа.',
    'help.step.save.t': '3. Сохраните отчёт',
    'help.step.save.b':
      'Кнопка «Отчёты» → «Сохранить текущий». Отчёт запоминает срез, вкладку и настройки печати. Пометьте «виден всей команде», чтобы коллеги открывали ту же картину. Ссылка на отчёт — короткая, без ключа доступа.',
    'help.step.plan.t': '4. Задайте план на месяц',
    'help.step.plan.b':
      'Когда период — целый календарный месяц, на «Обзоре» появляется карточка плана: сделки, успешные, выручка. Виджет считает выполнение и прогноз по темпу; факт берётся по всей воронке, фильтры его не сужают.',
    'help.step.report.t': '5. Отчитайтесь руководству',
    'help.step.report.b':
      '«Экспорт PDF» — выберите блоки, впишите заголовок, при желании сгенерируйте AI-резюме и поправьте текст руками. Там же «Скачать Excel»: сводка, воронка, менеджеры, качество данных, динамика — числами, а не картинками.',

    'help.tabs.title': 'Что на каждой вкладке',
    'help.tabs.sub': 'Все вкладки считаются из одного среза — переключение ничего не сбрасывает.',
    'help.tab.overview':
      'Ключевые показатели периода, план/факт, динамика по месяцам и список узких мест с ценой вопроса в сделках.',
    'help.tab.funnel':
      'Продажная цепочка: сколько вошло в каждый этап, конверсия к предыдущему, медиана времени. Парковочные этапы вынесены из расчёта и показаны отдельно.',
    'help.tab.path':
      'Как заявки ходят между этапами: откаты назад, пропуски этапов и самые частые маршруты.',
    'help.tab.journey': 'Путь клиента между воронками — сшивка, которой нет в штатном отчёте amoCRM.',
    'help.tab.managers':
      'Таблица по сотрудникам: вход в этапы, конверсия «в работе → встреча», отклонение от медианы отдела. Медиана считается только по продающим группам, сервис и партнёры с ней не сравниваются.',
    'help.tab.ai':
      'Разбор среза и ответы на вопросы по вашим числам. В модель уходят только агрегаты, имена сотрудников заменяются масками.',
    'help.tab.license': 'Тариф, срок, ключ активации и связь с поддержкой.',

    'help.rules.title': 'Как виджет считает',
    'help.rules.sub': 'Пять правил, из-за которых числа отличаются от штатного отчёта amoCRM.',
    'help.rule.median':
      'Время в этапе — медиана, а не среднее: одна зависшая сделка не должна портить картину по отделу.',
    'help.rule.fewData':
      'При базе меньше 8 сделок процент не показывается — вместо него «мало данных». Проценты от двух сделок не бывают надёжными.',
    'help.rule.fillRate':
      'Разрез по полю сделки блокируется, если поле заполнено меньше чем у 30% сделок, и предупреждает в промежутке 30–60%.',
    'help.rule.parking':
      'Парковочные этапы («нет контакта», «отложено») размечаются и выносятся из продажной цепочки — иначе они обнуляют конверсию на ровном месте.',
    'help.rule.automation':
      'Переходы, сделанные роботом, идут отдельной строкой и не входят в медиану отдела: конверсия автоматики не должна засчитываться человеку.',

    'help.support.title': 'Нужна помощь',
    'help.support.sub': 'Ответим и поможем настроить разметку этапов и поля-разрезы.',
    'help.support.msg': 'Здравствуйте! Вопрос по виджету «Аналитика KLASTER». Аккаунт: {subdomain}.',
    'help.support.subject': 'Аналитика KLASTER — вопрос ({subdomain})',
  },
  en: {
    'tab.help': 'Guide',

    'help.steps.title': 'How to use it: five steps',
    'help.steps.sub': 'The sales lead scenario — from a slice to a report for management.',
    'help.step.slice.t': '1. Build a slice',
    'help.step.slice.b':
      'The filter row applies to every tab at once: pipeline, period, group, manager, deal field. "Compare" adds a second period and the widget computes the deltas.',
    'help.step.read.t': '2. See where deals are lost',
    'help.step.read.b':
      '"Overview" shows bottlenecks from the actual status-change history; "Funnel" shows conversion between adjacent stages of the sales chain, not the cumulative rate from the first stage.',
    'help.step.save.t': '3. Save the report',
    'help.step.save.b':
      '"Reports" → "Save current". A report keeps the slice, the tab and the print setup. Tick "visible to the whole team" so colleagues open the same picture. The report link is short and carries no access key.',
    'help.step.plan.t': '4. Set the monthly plan',
    'help.step.plan.b':
      'When the period is a whole calendar month, the plan card appears on "Overview": leads, won, revenue. The widget computes attainment and a run-rate forecast; the actuals cover the whole pipeline and filters do not narrow them.',
    'help.step.report.t': '5. Report to management',
    'help.step.report.b':
      '"Export PDF" — pick the blocks, set a title, optionally generate an AI summary and edit the text yourself. The same dialog has "Download Excel": summary, funnel, managers and trend — as numbers, not pictures.',

    'help.tabs.title': 'What each tab shows',
    'help.tabs.sub': 'Every tab is computed from the same slice — switching tabs resets nothing.',
    'help.tab.overview':
      'Key metrics for the period, plan vs actual, the monthly trend and a list of bottlenecks priced in deals.',
    'help.tab.funnel':
      'The sales chain: how many entered each stage, conversion from the previous one, median time. Parking stages are excluded from the chain and shown separately.',
    'help.tab.path':
      'How leads travel between stages: rollbacks, skipped stages and the most frequent routes.',
    'help.tab.journey': 'The client journey across pipelines — the stitching the built-in amoCRM report does not have.',
    'help.tab.managers':
      'A per-person table: stage entries, "in progress → meeting" conversion, deviation from the team median. The median covers selling groups only; service and partner groups are not compared against it.',
    'help.tab.ai':
      'Analysis of the slice and answers about your numbers. Only aggregates are sent to the model; employee names are replaced with masks.',
    'help.tab.license': 'Plan, period, activation key and support contacts.',

    'help.rules.title': 'How the widget counts',
    'help.rules.sub': 'Five rules that make these numbers differ from the built-in amoCRM report.',
    'help.rule.median':
      'Time in stage is the median, not the average: one stuck deal must not distort the whole team.',
    'help.rule.fewData':
      'With a base under 8 deals no percentage is shown — "not enough data" instead. Percentages from two deals are never reliable.',
    'help.rule.fillRate':
      'A breakdown by a deal field is blocked when the field is filled on less than 30% of deals, and warns between 30% and 60%.',
    'help.rule.parking':
      'Parking stages ("no contact", "postponed") are marked and taken out of the sales chain — otherwise they zero out conversion for no reason.',
    'help.rule.automation':
      'Transitions made by automation are listed separately and excluded from the team median: a robot’s conversion must not be credited to a person.',

    'help.support.title': 'Need help',
    'help.support.sub': 'We answer and help you set up stage marking and breakdown fields.',
    'help.support.msg': 'Hello! A question about the KLASTER Analytics widget. Account: {subdomain}.',
    'help.support.subject': 'KLASTER Analytics — question ({subdomain})',
  },
};
