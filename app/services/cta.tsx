/**
 * Целевое действие раздела услуг. Отличается от остального сайта: там ведут в
 * демо, здесь демо ни при чём — услугу нельзя посмотреть, о ней разговаривают.
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
    ru: 'Расскажите, что происходит сейчас и что должно происходить. Если задача решается настройкой за полчаса, так и скажем.',
    en: 'Tell us what happens now and what should happen instead. If a half-hour setting solves it, we say so.',
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
      <p className="site-p">{t(T.lead)}</p>
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
