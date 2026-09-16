/* Строки вкладки «AI». Владелец — агент «лицензия и AI».
   Правило CLAUDE.md: детекторы считают, модель формулирует. Поэтому здесь
   отдельно тексты детекторов (работают всегда) и отдельно — блок вопроса к модели. */

export const ai: { ru: Record<string, string>; en: Record<string, string> } = {
  ru: {
    'ai.title': 'AI-аналитик',
    'ai.sub':
      'Сначала считает код, потом объясняет модель. Инсайты ниже посчитаны детекторами и работают даже без подключённого AI.',

    /* ── детекторы ── */
    'ai.det.title': 'Что видно в этом срезе',
    'ai.det.sub':
      'Детекторы сравнивают выбранный срез с прошлым периодом и с медианой по отделу. Порядок — по цене вопроса в сделках, а не по красоте формулировки.',
    'ai.det.none':
      'Детекторы ничего не нашли: либо в этом срезе всё ровно, либо данных слишком мало. Попробуйте более широкий период.',
    'ai.det.more': 'Показать все — {n}',
    'ai.det.less': 'Свернуть',
    'ai.det.impact': 'цена вопроса ≈ {n} {word}',
    'ai.det.gain': 'прибавка ≈ {n} {word}',
    'ai.det.where': 'Смотреть во вкладке «{tab}»',
    'ai.det.staticNote': 'считается по всей выгрузке, от фильтров не зависит',

    'ai.where.funnel': 'Воронка',
    'ai.where.path': 'Путь заявки',
    'ai.where.managers': 'Менеджеры',
    'ai.where.overview': 'Обзор',

    'ai.d.convDrop.t': 'Конверсия «{from}» → «{to}» просела на {dpp} п.п.',
    'ai.d.convDrop.b':
      'Было {was}%, стало {now}%. При потоке в {base} на предыдущем этапе это примерно {lost} {word}, которые в прошлом периоде прошли бы дальше.',
    'ai.d.convGrow.t': 'Конверсия «{from}» → «{to}» выросла на {dpp} п.п.',
    'ai.d.convGrow.b':
      'Было {was}%, стало {now}%. Здесь стало заметно лучше — стоит разобраться, что именно изменилось, пока помнят.',
    'ai.d.stuck.t': 'В этапе «{stage}» сделки лежат медианно {days} {word}',
    'ai.d.stuck.b':
      'За период через этап прошло {entered}. Медиана времени {note} — это оценка по истории, а не по вашему фильтру. Смотрим медиану, а не среднее: одна зависшая сделка ломает среднее.',
    'ai.d.parking.t': '{pct}% потока уходит в парковочные этапы',
    'ai.d.parking.b':
      '{park} входов в парковки против {sales} входов в продажные этапы. Парковка — это не ступень продажи, а полка: «{list}». Штатный «Анализ продаж» считает их частью цепочки, и конверсия проваливается на ровном месте.',
    'ai.d.mgr.t': '{name}: до встречи доходит {pct}% при медиане отдела {median}%',
    'ai.d.mgr.b':
      'В работу взято {work}, до встречи дошло {held}. На уровне медианы встреч было бы около {expected} — разница примерно {lost} {word} за период. Сравниваем с медианой живых менеджеров, а не с планом: медиана — это то, что отдел реально умеет.',
    'ai.d.fill.t': 'Полей, по которым разрез строить нельзя: {n}',
    'ai.d.fill.b':
      'Заполненность ниже 30%: {list}. Отчёт по такому полю показывает не картину продаж, а привычки тех, кто его заполняет. Мы такой отчёт не строим — и это осознанно.',
    'ai.d.lost.t': 'В отказ ушло {lost} при {created} созданных',
    'ai.d.lost.b':
      'Это {pct}% от созданного за период. Причина отказа заполнена у {fill}% сделок, поэтому разложить отказы по причинам сейчас не получится.',

    /* ── вопрос к модели ── */
    'ai.ask.title': 'Спросить AI',
    'ai.ask.sub':
      'Вопрос уходит в модель вместе с агрегатами текущего среза: числа по этапам, конверсии, медианы, заполненность полей.',
    'ai.ask.label': 'Ваш вопрос',
    'ai.ask.placeholder': 'Например: почему просела конверсия до встречи?',
    'ai.ask.send': 'Спросить',
    'ai.ask.sending': 'Считаю…',
    'ai.ask.clear': 'Очистить',
    'ai.ask.examples': 'С чего начать',
    'ai.ask.ex1': 'Почему просела конверсия до встречи?',
    'ai.ask.ex2': 'Кто из менеджеров теряет на квалификации?',
    'ai.ask.ex3': 'Где в воронке дольше всего стоят сделки?',
    'ai.ask.ex4': 'Что мешает строить отчёты по полям сделки?',
    'ai.ask.ex5': 'Что я увижу, если убрать парковки из расчёта?',
    'ai.ask.answer': 'Ответ',
    'ai.ask.model': 'Ответила модель {model}',
    'ai.ask.check':
      'Числа модель получает из наших же расчётов, а формулировки — её. Спорное место проверяйте по вкладке, на которую она ссылается.',
    'ai.ask.counter': '{n} из {max}',

    /* ── AI не подключён ── */
    'ai.off.title': 'AI не подключён',
    'ai.off.body':
      'На сервере виджета не задан ключ OpenAI API, поэтому свободный вопрос сейчас недоступен. Придумывать ответ вместо модели мы не будем.',
    'ai.off.how': 'Что нужно: переменная окружения OPENAI_API_KEY на стороне сервера.',
    'ai.off.still': 'Инсайты выше от этого не зависят — их считает код.',

    /* ── ошибки ── */
    'ai.err.empty': 'Напишите вопрос.',
    'ai.err.rate': 'Слишком много вопросов подряд. Попробуйте через минуту.',
    'ai.err.upstream': 'Модель не ответила. Попробуйте ещё раз.',
    'ai.err.net': 'Сервер не ответил. Проверьте соединение.',
    'ai.err.long': 'Вопрос длиннее {max} символов.',

    /* ── что уходит в модель ── */
    'ai.privacy.title': 'Что уходит в модель',
    'ai.privacy.show': 'Показать',
    'ai.privacy.hide': 'Свернуть',
    'ai.privacy.sends': 'Уходит',
    'ai.privacy.s1': 'сколько сделок вошло в каждый этап за период',
    'ai.privacy.s2': 'конверсии между соседними этапами и разметка парковок',
    'ai.privacy.s3': 'медианы времени на этапах',
    'ai.privacy.s4': 'заполненность полей сделки в процентах',
    'ai.privacy.s5': 'менеджеры под номерами: M1, M2 — имена подставляются обратно уже в ответе',
    'ai.privacy.never': 'Не уходит',
    'ai.privacy.n1': 'имена, телефоны, почты и переписки клиентов',
    'ai.privacy.n2': 'тексты примечаний и задач',
    'ai.privacy.n3': 'суммы конкретных сделок и реквизиты',
    'ai.privacy.note':
      'Не уходит потому, что этого нет в базе: персональные поля мы не синхронизируем вообще.',

    /* ── склонения ── */
    'ai.deal1': 'сделка',
    'ai.deal2': 'сделки',
    'ai.deal5': 'сделок',
    'ai.day1': 'день',
    'ai.day2': 'дня',
    'ai.day5': 'дней',
  },

  en: {
    'ai.title': 'AI analyst',
    'ai.sub':
      'Code counts first, the model explains second. The insights below are computed by detectors and work even without AI connected.',

    'ai.det.title': 'What this slice shows',
    'ai.det.sub':
      'Detectors compare the selected slice with the previous period and with the team median. Ordered by the cost in deals, not by how good the wording sounds.',
    'ai.det.none':
      'Detectors found nothing: either this slice is flat, or there is too little data. Try a wider period.',
    'ai.det.more': 'Show all — {n}',
    'ai.det.less': 'Collapse',
    'ai.det.impact': 'cost ≈ {n} {word}',
    'ai.det.gain': 'gain ≈ {n} {word}',
    'ai.det.where': 'See the “{tab}” tab',
    'ai.det.staticNote': 'computed over the whole export, independent of the filters',

    'ai.where.funnel': 'Funnel',
    'ai.where.path': 'Lead path',
    'ai.where.managers': 'Managers',
    'ai.where.overview': 'Overview',

    'ai.d.convDrop.t': 'Conversion “{from}” → “{to}” dropped by {dpp} pp',
    'ai.d.convDrop.b':
      'It was {was}%, now it is {now}%. With {base} in the previous stage that is roughly {lost} {word} that would have moved on last period.',
    'ai.d.convGrow.t': 'Conversion “{from}” → “{to}” grew by {dpp} pp',
    'ai.d.convGrow.b':
      'It was {was}%, now it is {now}%. Something here got visibly better — worth finding out what changed while people still remember.',
    'ai.d.stuck.t': 'Deals sit in “{stage}” for a median of {days} {word}',
    'ai.d.stuck.b':
      '{entered} went through the stage in this period. The median time {note} — it is an estimate from history, not from your filter. We show the median, not the average: one stuck deal ruins the average.',
    'ai.d.parking.t': '{pct}% of the flow goes into parking stages',
    'ai.d.parking.b':
      '{park} entries into parking stages against {sales} into selling ones. A parking stage is not a step of the sale, it is a shelf: “{list}”. The stock “Sales analysis” counts them as part of the chain, and conversion collapses for no reason.',
    'ai.d.mgr.t': '{name}: {pct}% reach the meeting against the team median of {median}%',
    'ai.d.mgr.b':
      '{work} taken into work, {held} reached the meeting. At the median rate there would be about {expected} — a gap of roughly {lost} {word} for the period. We compare against the median of human managers, not against a target: the median is what the team actually does.',
    'ai.d.fill.t': 'Fields you cannot slice reports by: {n}',
    'ai.d.fill.b':
      'Filled below 30%: {list}. A report on such a field shows the habits of whoever fills it in, not the state of sales. We do not build that report — on purpose.',
    'ai.d.lost.t': '{lost} went to lost against {created} created',
    'ai.d.lost.b':
      'That is {pct}% of everything created in the period. The loss reason is filled in {fill}% of leads, so breaking losses down by reason is not possible right now.',

    'ai.ask.title': 'Ask AI',
    'ai.ask.sub':
      'The question goes to the model together with aggregates of the current slice: stage counts, conversions, medians, field fill rates.',
    'ai.ask.label': 'Your question',
    'ai.ask.placeholder': 'For example: why did conversion to the meeting drop?',
    'ai.ask.send': 'Ask',
    'ai.ask.sending': 'Working…',
    'ai.ask.clear': 'Clear',
    'ai.ask.examples': 'Where to start',
    'ai.ask.ex1': 'Why did conversion to the meeting drop?',
    'ai.ask.ex2': 'Which manager loses deals at qualification?',
    'ai.ask.ex3': 'Where in the funnel do deals sit the longest?',
    'ai.ask.ex4': 'What stops us from slicing reports by lead fields?',
    'ai.ask.ex5': 'What changes if parking stages are taken out of the calculation?',
    'ai.ask.answer': 'Answer',
    'ai.ask.model': 'Answered by {model}',
    'ai.ask.check':
      'The numbers come from our own calculations, the wording is the model’s. Check anything doubtful on the tab it points to.',
    'ai.ask.counter': '{n} of {max}',

    'ai.off.title': 'AI is not connected',
    'ai.off.body':
      'The widget server has no OpenAI API key, so free-form questions are unavailable. We are not going to invent an answer in place of the model.',
    'ai.off.how': 'What is needed: an OPENAI_API_KEY environment variable on the server.',
    'ai.off.still': 'The insights above do not depend on it — they are computed by code.',

    'ai.err.empty': 'Write a question.',
    'ai.err.rate': 'Too many questions in a row. Try again in a minute.',
    'ai.err.upstream': 'The model did not answer. Try again.',
    'ai.err.net': 'The server did not respond. Check the connection.',
    'ai.err.long': 'The question is longer than {max} characters.',

    'ai.privacy.title': 'What goes to the model',
    'ai.privacy.show': 'Show',
    'ai.privacy.hide': 'Collapse',
    'ai.privacy.sends': 'Sent',
    'ai.privacy.s1': 'how many deals entered each stage in the period',
    'ai.privacy.s2': 'conversions between neighbouring stages and the parking markup',
    'ai.privacy.s3': 'median time spent in stages',
    'ai.privacy.s4': 'lead field fill rates, in percent',
    'ai.privacy.s5': 'managers as numbers: M1, M2 — names are substituted back into the answer',
    'ai.privacy.never': 'Not sent',
    'ai.privacy.n1': 'client names, phone numbers, emails and conversations',
    'ai.privacy.n2': 'the text of notes and tasks',
    'ai.privacy.n3': 'amounts of individual deals and payment details',
    'ai.privacy.note':
      'Not sent because it is not in the database: we do not synchronise personal fields at all.',

    'ai.deal1': 'deal',
    'ai.deal2': 'deals',
    'ai.deal5': 'deals',
    'ai.day1': 'day',
    'ai.day2': 'days',
    'ai.day5': 'days',
  },
};
