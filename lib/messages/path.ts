/* Строки вкладки «Путь заявки». Владелец — агент «путь+менеджеры». */

export const path: { ru: Record<string, string>; en: Record<string, string> } = {
  ru: {
    'path.nomain.title': 'Эта воронка — вне демо-куба',
    'path.nomain.body':
      'Подробная раскладка в демо построена для главной воронки «Продажи новым клиентам». По воронке «{name}» в выгрузке: {transitions} переходов за два месяца и {newJul} новых сделок за июль. После подключения аккаунта отчёт считается по любой воронке.',
    'path.sankey.title': 'Вся воронка целиком',
    'path.sankey.sub':
      'Верхний ряд — продажная цепочка и оба финала, нижняя полоса — этапы вне цепочки. Под каждым переходом конверсия. Ширина потока сжата степенью 0,6, чтобы хвост оставался видимым',
    'path.sankey.aria': 'Воронка целиком: поток сделок по этапам, финалы и парковочные этапы',
    'path.sankey.created': 'Создано сделок',
    'path.node.open': 'нажмите, чтобы увидеть сделки',
    'path.sankey.entered': 'Вошло в этап',
    'path.sankey.parkTitle': 'Полки вне цепочки',
    'path.sankey.parkA': 'Штриховкой — этапы, размеченные как',
    'path.sankey.parkB':
      ': они стоят внутри воронки, но продажей не являются и в конверсию цепочки не входят. Именно из-за них штатный «Анализ продаж» показывает обвал там, где его нет.',
    'path.sankey.lostNote':
      'В «{lost}» приходят со всех этапов сразу, поэтому вместо потока — пунктирный веер: он показывает источники, а не ширину. За период туда ушло {n} сделок.',
    'path.sankey.colorNote':
      'Цвета узлов и потоков — те же, что на доске в вашей amoCRM: воронку можно сверять глазами.',
    'path.sankey.note':
      'Первый столбик — сделки, созданные в воронке за период: создание сделки не порождает событие смены статуса, поэтому число берётся из даты создания. Знак ⚠ у конверсии — в этап приходят не только из предыдущего.',
    'path.static.note':
      'Откаты, пропуски и переходы между воронками посчитаны за июнь + июль целиком — фильтры периода, менеджера и проекта на эти блоки не действуют.',
    'path.roll.title': 'Откаты назад',
    'path.roll.sub': '{n} за июнь + июль. Штатная аналитика этого не показывает',
    'path.roll.hint':
      'В «РЕАКТИВАЦИЮ» возвращаются из четырёх разных мест. Этап работает как общая корзина, а не как ступень.',
    'path.skip.title': 'Пропуски этапов',
    'path.skip.sub': '{n} за июнь + июль',
    'path.skip.hint':
      '«Взято в работу → Нет контакта» {top} раз — это и есть основной маршрут воронки. Продажная цепочка работает на остатке.',
    'path.skip.note':
      'По правилу продукта пропуск парковки пропуском не считается: почти все записи выше — уход в парковку или возврат из неё. Настоящих пропусков продажного этапа — {honest} из {total}.',
    'path.skip.real': 'пропуск продажного этапа',
    'path.cross.title': 'Переходы между воронками',
    'path.cross.sub':
      '{n} за два месяца. Без сшивки сквозная конверсия по клиенту не считается вообще',
    'path.cross.from': 'Из воронки',
    'path.cross.to': 'В воронку',
    'path.cross.count': 'Переходов',
  },
  en: {
    'path.nomain.title': 'This pipeline is outside the demo cube',
    'path.nomain.body':
      'The detailed demo breakdown is built for the main pipeline "New client sales". Pipeline "{name}" in the export: {transitions} transitions over two months and {newJul} new leads in July. Once your account is connected, the report works for any pipeline.',
    'path.sankey.title': 'The whole funnel',
    'path.sankey.sub':
      'The top row is the sales chain and both endings; the lower band holds the stages outside the chain. Conversion is shown under each transition. Flow width is compressed with a 0.6 power so the tail stays visible',
    'path.sankey.aria': 'The whole funnel: lead flow through stages, both endings and parking stages',
    'path.sankey.created': 'Leads created',
    'path.node.open': 'click to see the leads',
    'path.sankey.entered': 'Entered stage',
    'path.sankey.parkTitle': 'Shelves outside the chain',
    'path.sankey.parkA': 'Hatched bars are the stages marked as',
    'path.sankey.parkB':
      ': they sit inside the funnel but are not a sale, so they stay out of the chain conversion. They are exactly why the built-in sales report shows a collapse where there is none.',
    'path.sankey.lostNote':
      'Leads reach "{lost}" from every stage at once, so instead of a flow there is a dashed fan: it shows the sources, not the width. {n} leads went there during the period.',
    'path.sankey.colorNote':
      'Node and flow colours are the ones from your amoCRM board, so the funnel can be checked by eye.',
    'path.sankey.note':
      'The first bar is leads created in the pipeline during the period: creating a lead does not emit a status-change event, so the number comes from the creation date. The ⚠ mark on a conversion means leads enter the stage not only from the previous one.',
    'path.static.note':
      'Rollbacks, skips and cross-pipeline transitions are computed for June + July as a whole — the period, manager and project filters do not apply to these blocks.',
    'path.roll.title': 'Rollbacks',
    'path.roll.sub': '{n} in June + July. Built-in analytics does not show this at all',
    'path.roll.hint':
      'Leads return to "REACTIVATION" from four different places. The stage works as a shared bucket, not as a step.',
    'path.skip.title': 'Stage skips',
    'path.skip.sub': '{n} in June + July',
    'path.skip.hint':
      '"Taken to work → No contact" {top} times — that is the main route of this funnel. The sales chain runs on what is left.',
    'path.skip.note':
      'By product rule, skipping a parking stage does not count as a skip: almost every row above is a move into or out of a parking stage. Genuine sales-stage skips — {honest} out of {total}.',
    'path.skip.real': 'sales-stage skip',
    'path.cross.title': 'Cross-pipeline transitions',
    'path.cross.sub':
      '{n} over two months. Without stitching, end-to-end client conversion cannot be computed at all',
    'path.cross.from': 'From pipeline',
    'path.cross.to': 'To pipeline',
    'path.cross.count': 'Transitions',
  },
};
