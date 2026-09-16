/* Строки каркаса виджета: вкладки, фильтры, период, сравнение, экспорт, словарь терминов.
   Владелец — агент «UX виджета». Ключи вкладок живут в messages/<tab>.ts.
   Словарь `term.*` общий: его дёргает <Term k="…" /> из любой вкладки. */

import { PILOT } from '@/lib/company';
import { withPlural } from '@/lib/plural';

/* Длительность первой загрузки — замер на пилотном аккаунте, а не арифметика
   при выбранном пределе запросов. Раньше здесь стояло «4–6 минут»: сайт эту
   формулировку уже отозвал, а виджет продолжал показывать её тому самому
   клиенту, который только что подключился и ждёт загрузки. Число приходит из
   PILOT — тогда сайт и продукт не разойдутся снова. */
const FIRST_LOAD_RU = withPlural(PILOT.firstLoadMinutes, 'минуту', 'минуты', 'минут');

export const common = {
  ru: {
    'app.title': 'Аналитика KLASTER',
    'badge.demo': 'демо-данные · обезличенный аккаунт застройщика',
    'tabs.label': 'Разделы виджета',
    'tab.overview': 'Обзор',
    'tab.funnel': 'Воронка',
    'tab.path': 'Путь заявки',
    'tab.journey': 'Путь клиента',
    'tab.managers': 'Менеджеры',
    'tab.ai': 'AI-разбор',
    'tab.license': 'Лицензия',

    'filter.pipeline': 'Воронка',
    'filter.period': 'Период',
    'filter.group': 'Группа',
    'filter.group.all': 'Группа: все',
    'hint.group':
      'Группа пользователей из amoCRM. Сужает таблицы, медиану отдела и список менеджеров до выбранного отдела.',
    'filter.manager': 'Менеджер',
    'filter.manager.all': 'Менеджер: все',
    'filter.project': 'Проект',
    'filter.project.all': 'Проект: все',
    'filter.project.empty': 'не заполнено',
    'filter.reset': 'Сбросить',
    'filter.share': 'Скопировать ссылку на отчёт',
    'filter.shareDone': 'Ссылка скопирована',
    'filter.projWarn':
      'Поле «Название проекта» заполнено у {rate}% сделок. Срез по проекту покрывает часть данных — остальные попадают в «Не указан».',

    'q.fill.unknown': 'не считалась',

    'period.jul': 'Июль 2026',
    'period.jun': 'Июнь 2026',
    'period.both': 'Июнь + июль 2026',
    'period.today': 'Сегодня',
    'period.yesterday': 'Вчера',
    'period.week': 'Эта неделя',
    'period.d7': 'Последние 7 дней',
    'period.d30': 'Последние 30 дней',
    'period.mtd': 'Этот месяц',
    'period.prevMonth': 'Прошлый месяц',
    'period.custom': 'Свой период…',
    'period.group.data': 'Периоды демонстрации',
    'period.group.rel': 'Относительные',
    'period.from': 'С',
    'period.to': 'по',
    'period.rangeLabel': '{from} — {to}',
    'period.limits.live': 'История аккаунта: {dataRange}',
    'period.limits': 'Демо-выгрузка: {dataRange}',

    'data.live.none.title': 'За этот период данных нет',
    'data.live.none.text':
      'В {range} по выбранной воронке не было ни одного перехода. Возьмите период шире или другую воронку.',
    'data.none.title': 'За этот период данных нет',
    'data.none.text':
      'Демо-выгрузка — это июнь и июль 2026 ({dataRange}). Выбранный период {range} в неё не попадает. Показать нули как факт мы не можем: это была бы неправда. Выберите период внутри выгрузки — или подключите свой аккаунт, и виджет посчитает по вашей истории.',
    'data.partial.title': 'Период попадает в выгрузку только частью',
    'data.partial.text':
      'В демо-выгрузке лежат агрегаты за целые месяцы — июнь и июль 2026 ({dataRange}). Период {range} захватывает дни за их пределами, и посчитать его честно нечем. На подключённом аккаунте этого ограничения нет: там история хранится по дням.',
    'data.back': 'Показать июль 2026',

    'mode.label': 'Режим отчёта',
    'mode.flow': 'Поток',
    'mode.cohort': 'Когорта',
    'hint.mode':
      'Поток: период режет дату перехода — «сколько раз за июль сделки входили в этап». Когорта: период режет дату создания сделки — «из заявок, созданных в июле, сколько дошло до этапа, когда бы они до него ни дошли». Это разные вопросы, и числа у них разные по определению.',
    'cmp.label': 'Сравнить с',
    'cmp.off': 'Без сравнения',
    'cmp.prev': 'Те же числа месяц назад',
    'cmp.prevMonth': 'Прошлый месяц',
    'cmp.yearAgo': 'Тот же период год назад',
    'cmp.month': 'Месяц…',
    'cmp.custom': 'Свой период…',
    'month.01': 'январь',
    'month.02': 'февраль',
    'month.03': 'март',
    'month.04': 'апрель',
    'month.05': 'май',
    'month.06': 'июнь',
    'month.07': 'июль',
    'month.08': 'август',
    'month.09': 'сентябрь',
    'month.10': 'октябрь',
    'month.11': 'ноябрь',
    'month.12': 'декабрь',
    'cmp.title': 'Сравнение периодов',
    'cmp.a': 'Период A',
    'cmp.b': 'Период B',
    'cmp.delta': 'Изменение',
    'cmp.flat': 'без изменений',
    'cmp.turnOff': 'выключить сравнение',
    'cmp.fromZero': 'было ноль',
    'cmp.metric': 'Показатель',
    'cmp.created': 'Создано сделок',
    'cmp.noData':
      'За период B ({range}) данных в выгрузке нет — сравнивать не с чем. Это ответ, а не пустая таблица.',
    'cmp.hint':
      'A — выбранный период, B — период сравнения. Изменение считается от B к A: +10% значит, что в A на десятую часть больше.',

    'drill.aria': 'Открыть в amoCRM: {what}',
    'drill.hint':
      'Клик по числу открывает список этих сделок внутри виджета. В amoCRM ({subdomain}) ссылкой уходит только «сейчас на этапе»: список amoCRM из ссылки умеет фильтровать только по текущему статусу, а не по датам и истории этапов.',

    'hint.aria': 'Что это значит',
    'hint.pipeline':
      'Отчёт считается по одной воронке. Переходы между воронками — на вкладке «Путь заявки».',
    'hint.period':
      'Период, за который считаются переходы. Можно выбрать готовый отрезок или задать свой датами.',
    'hint.manager':
      'Переход засчитывается тому, кто вёл сделку в момент перехода, а не текущему ответственному.',
    'hint.project':
      'Разрез по полю сделки «Название проекта». Поле заполнено не у всех сделок — под фильтром написано, у какой доли.',
    'hint.compare':
      '«Предыдущий период» — окно той же длины прямо перед выбранным, без пересечения с ним.',
    'hint.entered':
      'Сколько раз сделки входили в этап за период — по событиям смены статуса, а не по тому, где сделки лежат сейчас. Одна сделка может войти в этап дважды: это два входа.',
    'hint.created':
      'Сделки, созданные в выбранном периоде. Создание сделки не порождает событие смены статуса, поэтому число берётся из даты создания.',
    'hint.prev': 'То же число за период сравнения.',
    'hint.delta':
      'Разница с периодом сравнения. «п.п.» — процентные пункты: разница двух процентов, а не процент от процента.',
    'hint.fewData':
      'В основании меньше 8 сделок. На такой базе процент скачет от одной сделки, поэтому мы его не показываем.',
    'hint.outOfChain':
      'Этап не входит в продажную цепочку, поэтому конверсия «из предыдущего» для него не считается.',

    'legend.label': 'Термины отчёта:',
    'term.parking.label': 'парковка',
    'term.parking.text':
      'Этап, на котором сделка ждёт, а не движется к продаже («Нет контакта», «Отложенный спрос»). Мы выносим его из расчёта конверсии — иначе воронка врёт: без такой разметки конверсия цепочки занижается на десятки пунктов: парковка съедает поток, который потом возвращается в продажу.',
    'term.chain.label': 'продажная цепочка',
    'term.chain.text':
      'Этапы, через которые сделка реально идёт к деньгам, по порядку. Парковки и «Неразобранное» в цепочку не входят, и конверсия считается только между соседями по ней.',
    'term.rollback.label': 'откат',
    'term.rollback.text':
      'Сделку вернули на этап раньше того, где она была. Единичный откат — рабочая ситуация, много откатов из одного этапа значит, что его проходят формально.',
    'term.skip.label': 'пропуск этапа',
    'term.skip.text':
      'Сделку перевели через голову одного или нескольких продажных этапов. Пропуск парковки пропуском не считается — парковка и не должна быть на пути.',
    'term.cohort.label': 'когорта',
    'term.cohort.text':
      'Считаем по сделкам, созданным в выбранном периоде, и смотрим, куда они дошли потом. Обычный режим — «поток»: он считает переходы, случившиеся в периоде, независимо от того, когда сделка создана.',
    'term.median.label': 'медиана',
    'term.median.text':
      'Серединное значение: половина сделок прошла этап быстрее, половина — дольше. Среднее мы не показываем: одна сделка, зависшая на год, делает его бессмысленным.',
    'term.conversion.label': 'конверсия',
    'term.conversion.text':
      'Доля сделок, дошедших с предыдущего этапа цепочки на следующий. Больше 105% — не ошибка: в этап приходят не только сверху. Такие значения мы помечаем, а не прячем.',
    'term.automation.label': 'автоматика',
    'term.automation.text':
      'Переход сделал робот — цифровая воронка или бот, а не человек. Такие переходы идут отдельной строкой и не входят в медиану по менеджерам.',
    'term.truncated.label': 'история обрезана',
    'term.truncated.text':
      'Часть пути сделки прошла раньше, чем начинается доступная история, и первого перехода мы не видели. Такие сделки помечаются и не участвуют в расчёте времени на этапе.',

    'reports.button': 'Отчёты',
    'reports.demo': 'Сохранённые отчёты работают при входе из amoCRM — в демо их нет.',
    'reports.loading': 'Загружаем список…',
    'reports.empty': 'Сохранённых отчётов пока нет. Соберите срез и нажмите «Сохранить текущий».',
    'reports.saveCurrent': 'Сохранить текущий…',
    'reports.applyHint': 'Применить этот отчёт',
    'reports.badge.mine': 'личный',
    'reports.badge.shared': 'общий',
    'reports.overwrite': 'Перезаписать текущим срезом',
    'reports.share': 'Сделать общим для команды',
    'reports.unshare': 'Сделать личным',
    'reports.delete': 'Удалить',
    'reports.save.title': 'Сохранить отчёт',
    'reports.save.name': 'Название',
    'reports.save.placeholder': 'Например: Понедельник, отдел продаж',
    'reports.save.shared': 'Виден всей команде',
    'reports.save.ok': 'Сохранить',
    'reports.save.cancel': 'Отмена',
    'reports.err.list': 'Список не загрузился. Обновите страницу.',
    'reports.err.load': 'Отчёт не открылся. Возможно, его удалили.',
    'reports.err.save': 'Не удалось сохранить. Попробуйте ещё раз.',
    'reports.err.limit': 'Лимит {max} отчётов на пользователя. Удалите ненужные.',
    'reports.warn.managerMissing':
      'Менеджера из отчёта нет в этом периоде — показаны все менеджеры.',
    'reports.warn.projectMissing': 'Проекта из отчёта нет в данных — показаны все проекты.',
    'reports.warn.groupMissing': 'Группы из отчёта больше нет — фильтр группы сброшен.',
    'reports.warn.pipelineMissing':
      'Воронки из отчёта больше нет — показана главная воронка.',
    'reports.warn.dismiss': 'Скрыть предупреждение',
    'export.button': 'Экспорт PDF',
    'export.title': 'Отчёт для руководителя',
    'export.reportTitle': 'Заголовок отчёта',
    'export.defaultTitle': 'Отчёт по продажам',
    'export.blocks': 'Блоки отчёта',
    'export.print': 'Печать / Сохранить в PDF',
    'export.cancel': 'Отмена',
    'export.close': 'Закрыть',
    'export.none': 'Выберите хотя бы один блок',
    'export.hint':
      'В диалоге печати выберите «Сохранить как PDF». Лист A4 альбомный, каждый блок начинается с новой страницы.',
    'export.html': 'Скачать HTML',
    'export.xlsx': 'Скачать Excel',
    'export.xlsx.busy': 'Готовим файл…',
    'export.summary.label': 'AI-резюме для руководства',
    'export.summary.gen': 'Сгенерировать',
    'export.summary.regen': 'Сгенерировать заново',
    'export.summary.busy': 'Пишем…',
    'export.summary.err': 'Резюме не получилось: сервис недоступен. Напишите текст вручную ниже.',
    'export.summary.ph': 'Короткое резюме для руководства — сгенерируйте или напишите сами',
    'export.summary.hint':
      'Резюме попадёт первой страницей в печатный отчёт и в лист «Сводка» Excel. Текст можно править.',
    'export.summary.printTitle': 'Резюме',
    'print.conclusions': 'Выводы',
    'xlsx.sheet.summary': 'Сводка',
    'xlsx.sheet.funnel': 'Воронка',
    'xlsx.sheet.managers': 'Менеджеры',
    'xlsx.sheet.trend': 'Динамика',
    'xlsx.stage': 'Этап',
    'xlsx.entered': 'Вошло',
    'xlsx.conversion': 'Конверсия',
    'xlsx.medianDays': 'Медиана, дней',
    'xlsx.name': 'Менеджер',
    'xlsx.field': 'Поле',
    'xlsx.month': 'Месяц',
    'xlsx.wonCount': 'Успешно (шт.)',
    'xlsx.wonRevenue': 'Выручка',
    'xlsx.note': 'Суммы — в валюте аккаунта amoCRM.',
    'refresh.label': 'Обновить',
    'refresh.busy': 'Обновляем…',
    'refresh.hint':
      'Перечитать данные. Виджет считает по своей базе — она пополняется синхронизацией с amoCRM, время последней видно в шапке.',
    'money.label': 'Валюта показа',
    'money.hint': 'Деньги в валюте аккаунта amoCRM',
    'lang.label': 'Язык интерфейса',
    'lang.ru': 'RU',
    'lang.en': 'EN',
    'print.account': 'Аккаунт',
    'print.period': 'Период',
    'print.filters': 'Фильтры',
    'print.date': 'Сформирован',
    'common.all': 'все',
    'common.fewData': 'мало данных',
    'common.noCompare': 'нет данных для сравнения',
    'common.outOfChain': 'вне цепочки',
    'common.parking': 'парковка',
    'stub.note': 'Раздел собирается — данные уже считаются из демо-выгрузки.',
    'foot.demo':
      'Демо-данные: реальная выгрузка обезличенного аккаунта застройщика за июнь–июль 2026. Итоги настоящие; после подключения аккаунта виджет считает по вашей истории.',
    'foot.live':
      'Живые данные вашего аккаунта amoCRM. Персональные данные мы не храним: имена и телефоны подтягиваются из CRM в вашем браузере.',

    /* ── живой режим: подпись источника и экран состояния ── */
    'badge.live': 'живые данные',
    'badge.synced': 'синхронизировано {at}',
    'badge.neverSynced': 'синхронизация ещё не проходила',
    'live.loading.title': 'Считаем по вашим данным',
    'live.loading.text': 'Запрос ушёл в аналитическую базу. Обычно это занимает пару секунд.',
    'live.not-synced.title': 'Данные ещё не загружены',
    'live.not-synced.text':
      `Аккаунт подключён, но история сделок ещё не выгружена из amoCRM. Первичная загрузка занимает ${FIRST_LOAD_RU}; отчёты появятся сразу после неё. Нули вместо чисел мы не рисуем.`,
    'live.no-db.title': 'Аналитическая база не подключена',
    'live.no-db.text':
      'В этом окружении нет строки подключения к базе, поэтому живые отчёты недоступны. Демо-режим продолжает работать.',
    'live.unauthorized.title': 'Доступ к данным не подтверждён',
    'live.unauthorized.text':
      'Сессия виджета истекла или доступ отозван в разделе amoCRM «Выданные доступы». Обновите страницу виджета — amoCRM выдаст новый ключ.',
    'live.failed.title': 'Не удалось получить данные',
    'live.failed.text':
      'Аналитическая база не ответила. Обновите страницу; если повторяется — напишите нам, вкладка «Лицензия».',
    'live.ready.title': 'Данные загружены, отчёты готовим',
    'live.ready.text':
      'История аккаунта в базе есть, но экраны виджета пока считают по демо-выгрузке. Подписывать демо-числа вашим аккаунтом мы не будем — переключим экраны на живые расчёты и покажем их здесь.',
    'live.progress.backfill': 'Собираем историю сделок: {pct}%',
    'live.progress.leadsOnly': 'Сделки загружены ({leads}), строим переходы…',
    'live.progress.starting': 'Загрузка началась, оцениваем объём…',
  },
  en: {
    'app.title': 'KLASTER Analytics',
    'badge.demo': 'demo data · anonymized developer account',
    'tabs.label': 'Widget sections',
    'tab.overview': 'Overview',
    'tab.funnel': 'Funnel',
    'tab.path': 'Lead path',
    'tab.journey': 'Customer journey',
    'tab.managers': 'Managers',
    'tab.ai': 'AI review',
    'tab.license': 'License',

    'filter.pipeline': 'Pipeline',
    'filter.period': 'Period',
    'filter.group': 'Group',
    'filter.group.all': 'Group: all',
    'hint.group':
      'A user group from amoCRM. Narrows the tables, the team median and the manager list to the selected department.',
    'filter.manager': 'Manager',
    'filter.manager.all': 'Manager: all',
    'filter.project': 'Project',
    'filter.project.all': 'Project: all',
    'filter.project.empty': 'not filled',
    'filter.reset': 'Reset',
    'filter.share': 'Copy a link to this report',
    'filter.shareDone': 'Link copied',
    'filter.projWarn':
      'The "Project name" field is filled in {rate}% of leads. The project slice covers part of the data — the rest falls into "Not set".',

    'q.fill.unknown': 'not measured',

    'period.jul': 'July 2026',
    'period.jun': 'June 2026',
    'period.both': 'June + July 2026',
    'period.today': 'Today',
    'period.yesterday': 'Yesterday',
    'period.week': 'This week',
    'period.d7': 'Last 7 days',
    'period.d30': 'Last 30 days',
    'period.mtd': 'This month',
    'period.prevMonth': 'Previous month',
    'period.custom': 'Custom range…',
    'period.group.data': 'Demonstration periods',
    'period.group.rel': 'Relative',
    'period.from': 'From',
    'period.to': 'to',
    'period.rangeLabel': '{from} — {to}',
    'period.limits.live': 'Account history: {dataRange}',
    'period.limits': 'Demo export: {dataRange}',

    'data.live.none.title': 'No data for this period',
    'data.live.none.text':
      'No transitions in the selected pipeline during {range}. Try a wider period or another pipeline.',
    'data.none.title': 'No data for this period',
    'data.none.text':
      'The demo export covers June and July 2026 ({dataRange}). The selected period {range} falls outside it. We will not show zeros as if they were facts. Pick a period inside the export — or connect your own account and the widget will compute from your history.',
    'data.partial.title': 'The period only partly falls into the export',
    'data.partial.text':
      'The demo export holds whole-month aggregates — June and July 2026 ({dataRange}). The period {range} reaches beyond them, so there is nothing to compute it from honestly. A connected account has no such limit: history is stored day by day there.',
    'data.back': 'Show July 2026',

    'mode.label': 'Report mode',
    'mode.flow': 'Flow',
    'mode.cohort': 'Cohort',
    'hint.mode':
      'Flow: the period cuts by transition date — "how many times leads entered the stage in July". Cohort: the period cuts by lead creation date — "of the leads created in July, how many reached the stage, whenever they reached it". These are different questions, and their numbers differ by definition.',
    'cmp.label': 'Compare with',
    'cmp.off': 'No comparison',
    'cmp.prev': 'Same dates a month ago',
    'cmp.prevMonth': 'Previous month',
    'cmp.yearAgo': 'Same period a year ago',
    'cmp.month': 'Month…',
    'cmp.custom': 'Custom range…',
    'month.01': 'January',
    'month.02': 'February',
    'month.03': 'March',
    'month.04': 'April',
    'month.05': 'May',
    'month.06': 'June',
    'month.07': 'July',
    'month.08': 'August',
    'month.09': 'September',
    'month.10': 'October',
    'month.11': 'November',
    'month.12': 'December',
    'cmp.title': 'Period comparison',
    'cmp.a': 'Period A',
    'cmp.b': 'Period B',
    'cmp.delta': 'Change',
    'cmp.flat': 'no change',
    'cmp.turnOff': 'turn comparison off',
    'cmp.fromZero': 'was zero',
    'cmp.metric': 'Metric',
    'cmp.created': 'Leads created',
    'cmp.noData':
      'The export has no data for period B ({range}) — there is nothing to compare against. That is an answer, not an empty table.',
    'cmp.hint':
      'A is the selected period, B is the comparison one. Change is measured from B to A: +10% means A is a tenth larger.',

    'drill.aria': 'Open in amoCRM: {what}',
    'drill.hint':
      'Clicking a number opens the list of those leads inside the widget. Only "in stage now" links out to amoCRM ({subdomain}): a list opened by link can filter only by current status, not by dates or stage history.',

    'hint.aria': 'What this means',
    'hint.pipeline':
      'The report is computed for one pipeline. Moves between pipelines are on the "Lead path" tab.',
    'hint.period':
      'The period transitions are counted for. The demo export holds June and July 2026; a custom period is set by dates.',
    'hint.manager':
      'A transition is credited to whoever owned the lead at that moment, not to the current owner.',
    'hint.project':
      'A slice by the "Project name" lead field. The field is not filled everywhere — the share is stated under the filter.',
    'hint.compare':
      '"Same dates a month ago" — 1–4 September is compared with 1–4 August; a full month with the full previous month. "Previous month" is the whole calendar month before the start of the selected period.',
    'hint.entered':
      'How many times leads entered the stage during the period — from status-change events, not from where leads sit right now. One lead can enter a stage twice: that is two entries.',
    'hint.created':
      'Leads created within the selected period. Creating a lead produces no status-change event, so the number comes from the creation date.',
    'hint.prev': 'The same number for the comparison period.',
    'hint.delta':
      'The difference against the comparison period. "pp" means percentage points: the gap between two percentages, not a percentage of a percentage.',
    'hint.fewData':
      'Fewer than 8 leads at the base. On such a base a percentage swings with a single lead, so we do not show it.',
    'hint.outOfChain':
      'The stage is not part of the sales chain, so "from previous" conversion is not computed for it.',

    'legend.label': 'Terms used here:',
    'term.parking.label': 'parking stage',
    'term.parking.text':
      'A stage where a lead waits instead of moving towards a sale ("No contact", "Postponed demand"). We take it out of the conversion math — otherwise the funnel lies: on the live account marking parking stages moves chain conversion from 66% to 84%.',
    'term.chain.label': 'sales chain',
    'term.chain.text':
      'The stages a lead actually walks through towards money, in order. Parking stages and "Incoming leads" are not part of it, and conversion is computed only between neighbours in the chain.',
    'term.rollback.label': 'rollback',
    'term.rollback.text':
      'The lead was moved back to a stage earlier than where it was. One rollback is routine; many rollbacks out of one stage mean the stage is passed on paper only.',
    'term.skip.label': 'skipped stage',
    'term.skip.text':
      'The lead was moved over the head of one or more sales stages. Skipping a parking stage does not count — a parking stage is not supposed to be on the way.',
    'term.cohort.label': 'cohort',
    'term.cohort.text':
      'We take leads created within the period and look at where they got later. The default mode is "flow": it counts transitions that happened within the period, no matter when the lead was created.',
    'term.median.label': 'median',
    'term.median.text':
      'The middle value: half of the leads passed the stage faster, half slower. We never show the average — a single lead stuck for a year makes it meaningless.',
    'term.conversion.label': 'conversion',
    'term.conversion.text':
      'The share of leads that made it from the previous chain stage to the next one. Above 105% is not an error: leads arrive into a stage not only from above. We flag such values rather than hide them.',
    'term.automation.label': 'automation',
    'term.automation.text':
      'The transition was made by a robot — a digital pipeline or a bot, not a person. Such transitions get their own row and stay out of the manager median.',
    'term.truncated.label': 'truncated history',
    'term.truncated.text':
      'Part of the lead path happened before the available history starts, so we never saw its first transition. Such leads are flagged and excluded from time-in-stage math.',

    'reports.button': 'Reports',
    'reports.demo': 'Saved reports work when opened from amoCRM — the demo has none.',
    'reports.loading': 'Loading the list…',
    'reports.empty': 'No saved reports yet. Set up a slice and press "Save current".',
    'reports.saveCurrent': 'Save current…',
    'reports.applyHint': 'Apply this report',
    'reports.badge.mine': 'personal',
    'reports.badge.shared': 'shared',
    'reports.overwrite': 'Overwrite with the current slice',
    'reports.share': 'Share with the team',
    'reports.unshare': 'Make personal',
    'reports.delete': 'Delete',
    'reports.save.title': 'Save report',
    'reports.save.name': 'Title',
    'reports.save.placeholder': 'e.g. Monday, sales team',
    'reports.save.shared': 'Visible to the whole team',
    'reports.save.ok': 'Save',
    'reports.save.cancel': 'Cancel',
    'reports.err.list': 'The list failed to load. Reload the page.',
    'reports.err.load': 'The report did not open. It may have been deleted.',
    'reports.err.save': 'Could not save. Try again.',
    'reports.err.limit': 'Limit of {max} reports per user. Delete the ones you do not need.',
    'reports.warn.managerMissing':
      'The manager from this report is absent in the period — showing all managers.',
    'reports.warn.projectMissing': 'The project from this report is absent — showing all projects.',
    'reports.warn.groupMissing': 'The group from this report no longer exists — group filter reset.',
    'reports.warn.pipelineMissing':
      'The pipeline from this report no longer exists — showing the main one.',
    'reports.warn.dismiss': 'Dismiss the warning',
    'export.button': 'Export PDF',
    'export.title': 'Executive report',
    'export.reportTitle': 'Report title',
    'export.defaultTitle': 'Sales report',
    'export.blocks': 'Report blocks',
    'export.print': 'Print / Save as PDF',
    'export.cancel': 'Cancel',
    'export.close': 'Close',
    'export.none': 'Select at least one block',
    'export.hint':
      'Choose "Save as PDF" in the print dialog. A4 landscape, each block starts on a new page.',
    'export.html': 'Download HTML',
    'export.xlsx': 'Download Excel',
    'export.xlsx.busy': 'Preparing file…',
    'export.summary.label': 'AI summary for leadership',
    'export.summary.gen': 'Generate',
    'export.summary.regen': 'Regenerate',
    'export.summary.busy': 'Writing…',
    'export.summary.err': 'Summary failed: the service is unavailable. Write the text manually below.',
    'export.summary.ph': 'A short summary for leadership — generate it or write your own',
    'export.summary.hint':
      'The summary becomes the first page of the printed report and goes to the Excel Summary sheet. The text is editable.',
    'export.summary.printTitle': 'Summary',
    'print.conclusions': 'Conclusions',
    'xlsx.sheet.summary': 'Summary',
    'xlsx.sheet.funnel': 'Funnel',
    'xlsx.sheet.managers': 'Managers',
    'xlsx.sheet.trend': 'Trend',
    'xlsx.stage': 'Stage',
    'xlsx.entered': 'Entered',
    'xlsx.conversion': 'Conversion',
    'xlsx.medianDays': 'Median, days',
    'xlsx.name': 'Manager',
    'xlsx.field': 'Field',
    'xlsx.month': 'Month',
    'xlsx.wonCount': 'Won (count)',
    'xlsx.wonRevenue': 'Revenue',
    'xlsx.note': 'Amounts are in the amoCRM account currency.',
    'refresh.label': 'Refresh',
    'refresh.busy': 'Refreshing…',
    'refresh.hint':
      'Re-read the data. The widget computes from its own database, which is topped up by the amoCRM sync — the last run time is shown in the header.',
    'money.label': 'Display currency',
    'money.hint': 'Money in the amoCRM account currency',
    'lang.label': 'Interface language',
    'lang.ru': 'RU',
    'lang.en': 'EN',
    'print.account': 'Account',
    'print.period': 'Period',
    'print.filters': 'Filters',
    'print.date': 'Generated',
    'common.all': 'all',
    'common.fewData': 'not enough data',
    'common.noCompare': 'no data to compare with',
    'common.outOfChain': 'out of chain',
    'common.parking': 'parking',
    'stub.note': 'Section under construction — numbers are already computed from the demo export.',
    'foot.demo':
      'Demo data: a real export of an anonymized developer account, June–July 2026. Totals are genuine; once your account is connected, the widget computes from your own history.',
    'foot.live':
      'Live data from your amoCRM account. We store no personal data: names and phone numbers are pulled from the CRM by your own browser.',

    /* ── live mode: source badge and status screen ── */
    'badge.live': 'live data',
    'badge.synced': 'synced {at}',
    'badge.neverSynced': 'never synced yet',
    'live.loading.title': 'Computing from your data',
    'live.loading.text': 'The query has been sent to the analytics database. This usually takes a couple of seconds.',
    'live.not-synced.title': 'Data not loaded yet',
    'live.not-synced.text':
      `The account is connected, but the deal history has not been exported from amoCRM yet. The initial load takes ${PILOT.firstLoadMinutes} minutes; reports appear right after it. We do not draw zeros instead of numbers.`,
    'live.no-db.title': 'Analytics database is not connected',
    'live.no-db.text':
      'This environment has no database connection string, so live reports are unavailable. Demo mode keeps working.',
    'live.unauthorized.title': 'Data access not confirmed',
    'live.unauthorized.text':
      'The widget session has expired, or access was revoked in the amoCRM «Granted access» section. Reload the widget page — amoCRM will issue a new key.',
    'live.failed.title': 'Could not fetch the data',
    'live.failed.text':
      'The analytics database did not respond. Reload the page; if it keeps happening, write to us from the «License» tab.',
    'live.ready.title': 'Data loaded, reports on the way',
    'live.ready.text':
      'The account history is in the database, but the widget screens still compute from the demo export. We will not sign demo numbers with your account name — the screens will switch to live computation and appear here.',
    'live.progress.backfill': 'Loading deal history: {pct}%',
    'live.progress.leadsOnly': 'Deals loaded ({leads}), building transitions…',
    'live.progress.starting': 'Load started, sizing it up…',
  },
};

export default common;
