/**
 * Целевое действие раздела услуг. Отличается от остального сайта: там ведут в
 * демо, здесь демо ни при чём — услугу нельзя посмотреть, о ней разговаривают.
 *
 * Блок отвечает на два молчаливых вопроса читателя, который уже дозрел: что
 * написать и что будет дальше. Без них кнопка «Обсудить задачу» упирается в
 * пустое поле ввода, и человек уходит думать ещё неделю.
 *
 * Сроков ответа здесь нет намеренно: обещание «ответим за 15 минут» ничем на
 * сайте не подкреплено, а невыполненное обещание дороже отсутствующего.
 *
 * Каналы берутся из lib/pricing и фильтруются по наличию адреса: нет адреса —
 * нет и кнопки. Кнопка в никуда тратит время человека ровно в тот момент, когда
 * он решил написать.
 *
 * Тексты — парами { ru, en }: меняешь русский — правь английский рядом.
 */

import { CONTACTS, mailLink, telegramLink, whatsappLink } from '@/lib/pricing';
import { tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

const T = {
  h2: { ru: 'Обсудить задачу', en: 'Discuss your task' },
  lead: {
    ru: 'Расскажите, что происходит сейчас и что должно происходить вместо этого. Решается настройкой за полчаса — так и скажем, счёт выставлять не будем.',
    en: 'Tell us what happens now and what should happen instead. If a half-hour setting solves it, we say so and send no invoice.',
  },
  whatH: { ru: 'Что написать, чтобы разговор был по делу', en: 'What to write so the conversation gets somewhere' },
  what1: { ru: 'какая CRM и сколько человек в отделе', en: 'which CRM and how many people are in the team' },
  what2: { ru: 'что болит: теряются заявки, врут отчёты, нет виджета', en: 'what hurts: leads go missing, reports lie, the widget you need does not exist' },
  what3: { ru: 'что уже пробовали и чем это закончилось', en: 'what you already tried and how that ended' },
  next: {
    ru: 'В ответ скажем, что сделаем, чего делать не станем и что для этого нужно с вашей стороны. Доступ к аккаунту на этом этапе не нужен.',
    en: 'In reply we say what we would do, what we would not and what we need from your side. No account access is required at this point.',
  },
  tg: { ru: 'Написать в Telegram', en: 'Write on Telegram' },
};

export async function ServiceCta({ subject, text }: { subject: Bi; text: Bi }) {
  const lang = await getLang();
  const t = tr(lang);
  const tg = telegramLink(t(text));
  const wa = whatsappLink(t(text));

  return (
    <>
      <h2 className="site-h2">{t(T.h2)}</h2>
      <p className="site-lead">{t(T.lead)}</p>
      <div className="site-card" style={{ marginTop: 20 }}>
        <h3 className="site-h3">{t(T.whatH)}</h3>
        <ul className="ticks ticks--yes" style={{ marginTop: 12 }}>
          <li>{t(T.what1)}</li>
          <li>{t(T.what2)}</li>
          <li>{t(T.what3)}</li>
        </ul>
      </div>
      <p className="site-p" style={{ marginTop: 20 }}>
        {t(T.next)}
      </p>
      <p className="site-p" style={{ marginTop: 20 }}>
        {tg !== null && (
          <>
            <a className="btn" href={tg}>
              {t(T.tg)}
            </a>{' '}
          </>
        )}
        {wa !== null && (
          <>
            <a className="btn btn--ghost" href={wa}>
              WhatsApp
            </a>{' '}
          </>
        )}
        <a className="btn btn--ghost" href={mailLink(t(subject))}>
          {CONTACTS.email}
        </a>
      </p>
    </>
  );
}
