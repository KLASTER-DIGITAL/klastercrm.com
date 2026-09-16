/* Строки вкладки «Воронка». Владелец — агент «обзор+воронка». */

export const funnel: { ru: Record<string, string>; en: Record<string, string> } = {
  ru: {
    'fn.move.title': 'Движение по этапам',
    'fn.move.sub':
      'Вошло в этап — по факту перехода, а не по текущему положению сделки. Первая строка — сделки, созданные в воронке',
    'fn.col.entered.cohort': 'Дошло сделок',
    'fn.move.sub.cohort':
      'Когорта: считаются сделки, СОЗДАННЫЕ в выбранном периоде, — сколько из них дошло до этапа, когда бы они до него ни дошли. Первая строка — все созданные сделки',
    'fn.col.stage': 'Этап',
    'fn.col.entered': 'Вошло в этап',
    'fn.outcome.toggle': 'Показать, что стало с этими сделками',
    'fn.now.open': 'Показать список сделок',
    'fn.outcome.title': 'Что стало с {n} сделками, вошедшими в «{stage}» за период',
    'fn.outcome.forward': 'прошли дальше',
    'fn.outcome.won': 'успешно реализовано',
    'fn.outcome.still_here': 'всё ещё здесь',
    'fn.outcome.parking': 'в парковке',
    'fn.outcome.back': 'откатились назад',
    'fn.outcome.lost': 'закрыто и не реализовано',
    'fn.outcome.other_pipeline': 'ушли в другую воронку',
    'fn.outcome.unsorted': 'вернулись в неразобранное',
    'fn.outcome.unmarked': 'этап не размечен',
    'fn.outcome.deleted': 'сделка удалена',
    'fn.outcome.gone': 'сделки нет в выгрузке',
    'fn.col.leads': 'Уникальных сделок',
    'fn.col.now': 'Сейчас на этапе',
    'fn.col.now.sub': 'на сегодня',
    'fn.hint.leads':
      'Сколько РАЗНЫХ сделок входило в этап за период. Соседнее число — входы: сделка, которая откатилась и вернулась, посчитана там дважды. Именно это число отвечает на вопрос «сколько встреч назначено в итоге».',
    'fn.hint.now':
      'Сколько сделок стоит на этапе прямо сейчас, по текущему статусу в amoCRM. От выбранного периода не зависит. У «Успешно» и «Закрыто» здесь копится вся история аккаунта — это не ошибка. Клик открывает ровно этот список в amoCRM.',
    'fn.col.enteredB': 'Вошло, период B',
    'fn.col.enteredDelta': 'Изменение',
    'fn.fromZero': 'было ноль',
    'fn.col.conv': 'Из предыдущего',
    'fn.col.delta': 'к прошлому',
    'fn.col.median': 'Медиана',
    'fn.col.obs': 'Сделок в расчёте',
    'fn.obs.title': 'Медиана посчитана по {n} сделкам',
    'fn.days': '{d} дн',
    'fn.delta.flat': 'без изм.',
    'fn.pp': 'п.п.',
    'fn.anomTitle': 'в этап приходят не только из предыдущего',
    'fn.note.std':
      'Конверсия считается между соседними этапами продажной цепочки. Парковки исключены.',
    'fn.note.anom':
      'Конверсия больше 100% на этапах {stages} — это не ошибка. В эти этапы сделки приходят не только из предыдущего этапа цепочки: часть возвращается из парковок, часть перепрыгивает. Линейная воронка такое показать не может — подробности на вкладке «Путь заявки».',
    'fn.note.noCompare':
      'Колонка «к прошлому» пуста: за выбранный период сравнения данных в отчёте нет.',
    'fn.note.cmpOff':
      'Колонка «к прошлому» пуста: сравнение выключено. Выберите период в поле «Сравнить с» над отчётом.',

    'fn.park.title': 'Парковочные этапы',
    'fn.park.sub':
      'Стоят внутри линейной воронки, но продажей не являются. Мы их размечаем и убираем из конверсии',
    'fn.park.col.entered': 'Вошло',
    'fn.park.col.share': 'Доля парковок',
    'fn.park.total': 'Итого в парковках',
    'fn.park.hint':
      'В парковки за период попало {n} {word} — это {pct} всего движения по воронке. Пока они там лежат, они не в продаже и не в отказе.',
  },
  en: {
    'fn.move.title': 'Stage flow',
    'fn.move.sub':
      'Entered the stage — by actual transition, not by the lead’s current position. The first row is leads created in the pipeline',
    'fn.col.entered.cohort': 'Leads reached',
    'fn.move.sub.cohort':
      'Cohort: counts leads CREATED in the selected period — how many of them reached the stage, whenever they reached it. The first row is all created leads',
    'fn.col.stage': 'Stage',
    'fn.col.entered': 'Entered',
    'fn.outcome.toggle': 'Show what happened to these leads',
    'fn.now.open': 'Show the lead list',
    'fn.outcome.title': 'What happened to the {n} leads that entered "{stage}" during the period',
    'fn.outcome.forward': 'moved further',
    'fn.outcome.won': 'won',
    'fn.outcome.still_here': 'still here',
    'fn.outcome.parking': 'in a parking stage',
    'fn.outcome.back': 'rolled back',
    'fn.outcome.lost': 'lost',
    'fn.outcome.other_pipeline': 'moved to another pipeline',
    'fn.outcome.unsorted': 'back to unsorted',
    'fn.outcome.unmarked': 'stage not mapped',
    'fn.outcome.deleted': 'lead deleted',
    'fn.outcome.gone': 'lead not in the extract',
    'fn.col.leads': 'Unique leads',
    'fn.col.now': 'In stage now',
    'fn.col.now.sub': 'as of today',
    'fn.hint.leads':
      'How many DISTINCT leads entered the stage during the period. The number next to it counts entries: a lead that rolled back and returned is counted twice there. This is the number that answers "how many meetings were scheduled in total".',
    'fn.hint.now':
      'How many leads sit in the stage right now, by their current status in amoCRM. Does not depend on the selected period. For "Won" and "Lost" this accumulates the whole account history — that is not an error. Clicking opens exactly this list in amoCRM.',
    'fn.col.enteredB': 'Entered, period B',
    'fn.col.enteredDelta': 'Change',
    'fn.fromZero': 'was zero',
    'fn.col.conv': 'From previous',
    'fn.col.delta': 'vs previous',
    'fn.col.median': 'Median',
    'fn.col.obs': 'Samples',
    'fn.obs.title': 'Median over {n} leads',
    'fn.days': '{d} d',
    'fn.delta.flat': 'no change',
    'fn.pp': 'pp',
    'fn.anomTitle': 'leads enter this stage not only from the previous one',
    'fn.note.std':
      'Conversion is computed between adjacent stages of the sales chain. Parking stages are excluded.',
    'fn.note.anom':
      'Conversion above 100% at {stages} is not an error. Leads enter these stages not only from the previous chain stage: some return from parking stages, some skip ahead. A linear funnel cannot show this — see the "Lead path" tab.',
    'fn.note.noCompare':
      'The "vs previous" column is empty: the selected comparison period has no data in this report.',
    'fn.note.cmpOff':
      'The "vs previous" column is empty: comparison is off. Pick a period in "Compare with" above the report.',

    'fn.park.title': 'Parking stages',
    'fn.park.sub':
      'They sit inside the linear funnel but are not sales. We label them and remove them from conversion',
    'fn.park.col.entered': 'Entered',
    'fn.park.col.share': 'Share of parking',
    'fn.park.total': 'Parking total',
    'fn.park.hint':
      'During the period {n} {word} landed in parking stages — {pct} of all funnel movement. While they sit there, they are neither in sales nor lost.',
  },
};
