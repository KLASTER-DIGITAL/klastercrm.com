/* Строки вкладки «Менеджеры». Владелец — агент «путь+менеджеры». */

export const managers: { ru: Record<string, string>; en: Record<string, string> } = {
  ru: {
    'mgr.nomain.title': 'Эта воронка — вне демо-куба',
    'mgr.nomain.body':
      'Подробная раскладка в демо построена для главной воронки «Продажи новым клиентам». По воронке «{name}» в выгрузке: {transitions} переходов за два месяца и {newJul} новых сделок за июль. После подключения аккаунта отчёт считается по любой воронке.',
    'mgr.table.title': 'Отдел продаж',
    'mgr.table.sub':
      'Медиана «Взято в работу → Встреча проведена» — {median}. Считается только по продающим группам: роботы, сопровождение, партнёрское направление и офис в неё не входят — у них другая работа',
    'mgr.table.subNoMedian':
      'Медиана по отделу не считается: в этом срезе ни у одного менеджера нет базы больше 20 сделок',
    'mgr.th.manager': 'Менеджер',
    'mgr.th.workB': 'Взято, период B',
    'mgr.th.change': 'Изменение',
    'mgr.th.workToMeet': 'Работа → встреча',
    'mgr.th.toMedian': 'к медиане',
    'mgr.total': 'Итого',
    'mgr.robot': 'робот',
    'mgr.auto': 'Автоматика',
    'mgr.none': 'Без ответственного',
    'mgr.deleted': 'Удалённый пользователь (#{id})',
    'mgr.th.group': 'Группа',
    'mgr.notCompared': 'другая задача',
    'mgr.kind.partner': 'партнёры',
    'mgr.kind.partner.hint':
      'Партнёрское направление: сделка идёт через партнёра, цикл длиннее, и сравнивать конверсию с прямыми продажами некорректно.',
    'mgr.kind.service': 'сопровождение',
    'mgr.kind.service.hint':
      'Сервисная группа: сопровождает клиента после продажи. Конверсия до встречи для неё не показатель — смотрите объём обработки и сроки.',
    'mgr.kind.office': 'офис',
    'mgr.kind.office.hint':
      'Руководство и администраторы. В продажной цепочке не участвуют, в медиану отдела не входят.',
    'mgr.kind.unset': 'тип не задан',
    'mgr.kind.unset.hint':
      'Тип группы не размечен. Пока он не задан, человек не входит в медиану отдела продаж.',
    'mgr.drill.open': 'Показать сделки',
    'mgr.drill.hint':
      'Клик по числу открывает список сделок, которые этот менеджер перевёл на этап за период — по ответственному в момент перехода. В amoCRM такого фильтра нет: его список отбирает по текущему владельцу, и переданные сделки оказались бы у нового менеджера.',
    'mgr.robot.note':
      'Переходы автоматики идут отдельной строкой: это работа роботов amoCRM, а не людей. В медиану отдела они не входят.',
    'mgr.thin.title': 'слишком мало сделок для процента',
    'mgr.kanban.title': 'Канбан по менеджерам',
    'mgr.kanban.sub': 'Колонки — этапы продажной цепочки',
    'mgr.mode.n': 'Количество',
    'mgr.mode.c': 'Конверсия',
    'mgr.mode.dev': 'Отклонение',
    'mgr.meta.n': 'сделок прошло',
    'mgr.meta.c': 'конверсия из пред.',
    'mgr.meta.dev': 'откл. от медианы',
    'mgr.units': 'шт',
    'mgr.legend.label': 'Отклонение от медианы отдела:',
    'mgr.legend.dn2': '▼ хуже на 6+ п.п.',
    'mgr.legend.dn1': '▼ хуже на 2–6',
    'mgr.legend.mid': '· в пределах ±2',
    'mgr.legend.up1': '▲ лучше на 2–6',
    'mgr.legend.up2': '▲ лучше на 6+',
    'mgr.pill.flat': 'без изм.',
    'mgr.pill.pp': 'п.п.',
  },
  en: {
    'mgr.nomain.title': 'This pipeline is outside the demo cube',
    'mgr.nomain.body':
      'The detailed demo breakdown is built for the main pipeline "New client sales". Pipeline "{name}" in the export: {transitions} transitions over two months and {newJul} new leads in July. Once your account is connected, the report works for any pipeline.',
    'mgr.table.title': 'Sales team',
    'mgr.table.sub':
      'Median for "Taken to work → Meeting held" is {median}. It counts selling groups only: bots, service, partner channel and back office are excluded — their job is different',
    'mgr.table.subNoMedian':
      'The team median is not computed: no manager has a base of more than 20 leads in this slice',
    'mgr.th.manager': 'Manager',
    'mgr.th.workB': 'Taken, period B',
    'mgr.th.change': 'Change',
    'mgr.th.workToMeet': 'Work → meeting',
    'mgr.th.toMedian': 'vs median',
    'mgr.total': 'Total',
    'mgr.robot': 'bot',
    'mgr.auto': 'Automation',
    'mgr.none': 'No owner',
    'mgr.deleted': 'Deleted user (#{id})',
    'mgr.th.group': 'Group',
    'mgr.notCompared': 'different job',
    'mgr.kind.partner': 'partners',
    'mgr.kind.partner.hint':
      'Partner channel: the deal goes through a partner, the cycle is longer, and comparing its conversion with direct sales is misleading.',
    'mgr.kind.service': 'service',
    'mgr.kind.service.hint':
      'Service group: supports the customer after the sale. Conversion to meeting is not its measure — look at volume handled and turnaround.',
    'mgr.kind.office': 'office',
    'mgr.kind.office.hint':
      'Management and administrators. They are not part of the sales chain and are excluded from the team median.',
    'mgr.kind.unset': 'type not set',
    'mgr.kind.unset.hint':
      'The group type is not marked up. Until it is, this person is excluded from the sales team median.',
    'mgr.drill.open': 'Show leads',
    'mgr.drill.hint':
      'Clicking a number opens the leads this manager moved into the stage during the period — by the person responsible at the moment of the transition. amoCRM has no such filter: its list goes by the current owner, so reassigned leads would show under the new manager.',
    'mgr.robot.note':
      'Automation transitions get their own row: this is amoCRM robots at work, not people. They are excluded from the team median.',
    'mgr.thin.title': 'too few leads to show a percentage',
    'mgr.kanban.title': 'Manager kanban',
    'mgr.kanban.sub': 'Columns are the sales chain stages',
    'mgr.mode.n': 'Count',
    'mgr.mode.c': 'Conversion',
    'mgr.mode.dev': 'Deviation',
    'mgr.meta.n': 'leads passed',
    'mgr.meta.c': 'conversion from prev.',
    'mgr.meta.dev': 'dev. from median',
    'mgr.units': 'pcs',
    'mgr.legend.label': 'Deviation from the team median:',
    'mgr.legend.dn2': '▼ worse by 6+ pp',
    'mgr.legend.dn1': '▼ worse by 2–6',
    'mgr.legend.mid': '· within ±2',
    'mgr.legend.up1': '▲ better by 2–6',
    'mgr.legend.up2': '▲ better by 6+',
    'mgr.pill.flat': 'no change',
    'mgr.pill.pp': 'pp',
  },
};
