/* Строки вкладки «Источники». Владелец — агент «UX виджета». */

export const sources = {
  ru: {
    'tab.sources': 'Источники',
    'src.title': 'Откуда приходят заявки',
    'src.sub':
      'Источник берётся из тегов сделки. Строка канала считает сделку один раз, строки тегов внутри — каждую в своём теге: у заявки из рекламы обычно два тега, форма и кампания. Считаются сделки, созданные за период, и сколько из них дошло до этапа — когда бы ни дошли.',
    'src.empty': 'Источник данных не отдаёт разбор по тегам — в демо-выгрузке его нет.',
    'src.sliceIgnored':
      'Срез по менеджеру, группе или проекту сюда не применяется: источники считаются по воронке целиком.',
    'src.col.source': 'Источник',
    'src.col.created': 'Создано',
    'src.col.createdB': 'Период B',
    'src.col.change': 'Изменение',
    'src.col.toMeet': '→ встреча',
    'src.hint.created': 'Сделки, созданные в выбранном периоде с этим тегом. Сделка без тега источника — без тегов вовсе или только со служебными — в строке «без тега источника».',
    'src.hint.toMeet': 'Доля созданных сделок, дошедших до «Встреча назначена». При базе меньше 8 сделок процент не показываем.',
    'src.campaign': 'кампания',
    'src.flat': 'без изм.',
    'src.total': 'Все источники',
    'src.col.status': 'Не выходит на связь',
    'src.hint.status':
      'Сколько сделок источника несут тег «Не выходит на связь» сейчас, и их доля от созданных. Тег ставится по ходу работы, поэтому у свежего периода доля растёт со временем. Ниже — разница долей с периодом B в процентных пунктах. Клик по заголовку сортирует таблицу по доле.',
    'src.status.noB': 'в B нет базы',
    'src.pp': '{v} п.п.',
    'src.sort.hint': 'Сортировать по этой колонке',
    'src.note':
      'Число открывает список сделок, из которых оно сложено; оттуда — карточка в amoCRM. Сумма строк тегов внутри канала больше итога канала: сделка с двумя тегами стоит в обеих строках, а в канале — один раз.',
    'src.hint.source':
      'Сделка с несколькими тегами стоит в строке каждого своего тега; строка канала считает её один раз. Поэтому теги внутри канала в сумме дают больше, чем канал, — это не ошибка.',
    'src.other.title': 'Служебные теги — {n}',
    'src.other.sub': 'Теги, которые не про источник: статусы работы, имена менеджеров, напоминания. В каналы не входят.',
    'src.channel.facebook': 'Реклама Facebook / Instagram',
    'src.channel.site': 'Сайты',
    'src.channel.messenger': 'Мессенджеры',
    'src.channel.call': 'Звонки',
    'src.channel.untagged': 'Без тега источника',
    'src.channel.other': 'Прочее',
    'help.tab.sources':
      'Откуда пришли заявки по тегам сделок: каналы, внутри — формы и кампании; сколько дошло до встречи.',
  },
  en: {
    'tab.sources': 'Sources',
    'src.title': 'Where leads come from',
    'src.sub':
      'The source is read from lead tags. A channel row counts a lead once; the tag rows inside count it per tag — an ad lead usually carries two tags, the form and the campaign. Counts leads created in the period and how many of them reached a stage, whenever they did.',
    'src.empty': 'The data source does not provide a tag breakdown — the demo extract has none.',
    'src.sliceIgnored':
      'Manager, group and project slices do not apply here: sources are counted for the whole pipeline.',
    'src.col.source': 'Source',
    'src.col.created': 'Created',
    'src.col.createdB': 'Period B',
    'src.col.change': 'Change',
    'src.col.toMeet': '→ meeting',
    'src.hint.created': 'Leads created in the selected period with this tag. A lead without a source tag — no tags at all or only service tags — is in the "no source tag" row.',
    'src.hint.toMeet': 'Share of created leads that reached "Meeting scheduled". Below 8 leads no percentage is shown.',
    'src.campaign': 'campaign',
    'src.flat': 'no change',
    'src.total': 'All sources',
    'src.col.status': 'No answer',
    'src.hint.status':
      'How many leads of the source carry the "no answer" tag now, and their share of created leads. The tag is added as work goes on, so the share of a fresh period grows over time. Below — the difference to period B in percentage points. Click the header to sort by share.',
    'src.status.noB': 'no base in B',
    'src.pp': '{v} pp',
    'src.sort.hint': 'Sort by this column',
    'src.note':
      'A number opens the list of leads behind it; from there — the card in amoCRM. Tag rows inside a channel add up to more than the channel total: a lead with two tags sits in both rows and once in the channel.',
    'src.hint.source':
      'A lead with several tags sits in the row of each of its tags; the channel row counts it once. That is why tags inside a channel add up to more than the channel — not an error.',
    'src.other.title': 'Service tags — {n}',
    'src.other.sub': 'Tags that are not about the source: work statuses, manager names, reminders. Not part of any channel.',
    'src.channel.facebook': 'Facebook / Instagram ads',
    'src.channel.site': 'Websites',
    'src.channel.messenger': 'Messengers',
    'src.channel.call': 'Calls',
    'src.channel.untagged': 'No source tag',
    'src.channel.other': 'Other',
    'help.tab.sources':
      'Where leads came from by lead tags: channels, with forms and campaigns inside; how many reached a meeting.',
  },
};
