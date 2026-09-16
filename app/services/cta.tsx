/**
 * Целевое действие раздела услуг. Отличается от остального сайта: там ведут в
 * демо, здесь демо ни при чём — услугу нельзя посмотреть, о ней разговаривают.
 *
 * Каналы берутся из lib/pricing и фильтруются по наличию адреса: нет адреса —
 * нет и кнопки. Кнопка в никуда тратит время человека ровно в тот момент, когда
 * он решил написать.
 */

import { CONTACTS, mailLink, telegramLink, whatsappLink } from '@/lib/pricing';

export function ServiceCta({ subject, text }: { subject: string; text: string }) {
  const tg = telegramLink(text);
  const wa = whatsappLink(text);

  return (
    <>
      <h2 className="site-h2">Обсудить задачу</h2>
      <p className="site-p">
        Расскажите, что у вас происходит сейчас и что должно происходить. Если выяснится, что задача
        решается настройкой за полчаса, так и скажем — это дешевле для обеих сторон, чем проект,
        который не был нужен.
      </p>
      <p className="site-p" style={{ marginTop: 20 }}>
        {tg !== null && (
          <>
            <a className="btn" href={tg}>
              Написать в Telegram
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
        <a className="btn btn--ghost" href={mailLink(subject)}>
          {CONTACTS.email}
        </a>
      </p>
    </>
  );
}
