/* Строки страницы входа /login. Владелец — агент «защита».
   В словарь виджета (lib/messages/index.ts) НЕ подключаются: вход живёт
   в верхнем окне, а не внутри iframe, и общих ключей у них нет.

   Формулировки без обещаний, которых мы не выполняем: письмо приходит только
   разрешённым адресам, и страница честно об этом пишет вместо «проверьте почту». */

export const auth: { ru: Record<string, string>; en: Record<string, string> } = {
  ru: {
    'auth.title': 'Вход в кабинет',
    'auth.sub': 'По рабочей почте: паролем, через Google или GitHub. Адрес должен быть подтверждён.',
    'auth.enter': 'Войти',
    'auth.entering': 'Входим…',
    'auth.again': 'Попробовать ещё раз',
    'auth.write': 'Написать нам',

    'auth.why.no_token': 'В ссылке нет токена. Запросите новую',
    'auth.why.bad_token': 'Ссылка устарела или испорчена. Запросите новую',
    'auth.why.used': 'По этой ссылке уже входили. Она одноразовая — запросите новую',
    'auth.why.not_allowed': 'Этого адреса больше нет в списке доступа',
    'auth.why.provider_off': 'Вход временно не работает: сервер не настроен',
    'auth.why.no_provider_session': 'Вход не завершён. Проверьте, что перешли по ссылке из письма и подтвердили адрес',
    'auth.why.not_invited': 'Этого адреса нет в списке доступа. Напишите нам — откроем',
    'auth.email': 'Рабочая почта',
    'auth.placeholder': 'you@company.com',
    'auth.submit': 'Прислать ссылку',
    'auth.sending': 'Отправляем…',
    'auth.pilot':
      'Закрытый пилот: входят только адреса из списка доступа. Вашего там нет — напишите нам, откроем.',

    'auth.sent.title': 'Проверьте почту',
    'auth.sent.body':
      'Если {email} есть в списке доступа, письмо со ссылкой уже отправлено. Ссылка живёт 15 минут.',
    'auth.sent.again': 'Отправить ещё раз',

    'auth.dev.title': 'Почта не подключена — ссылка ниже',
    'auth.dev.body':
      'Так работает только локальная разработка. На боевом сервере ссылка в ответе не отдаётся никогда.',
    'auth.dev.open': 'Войти по ссылке',

    'auth.err.invalid_email': 'Это не похоже на адрес почты',
    'auth.err.too_many': 'Слишком много попыток. Попробуйте через час',
    'auth.err.mail_not_configured': 'Отправка почты пока не настроена. Напишите нам, откроем доступ вручную',
    'auth.err.mail_not_implemented': 'Отправка почты пока не настроена. Напишите нам, откроем доступ вручную',
    'auth.err.not_configured': 'Вход временно не работает: сервер не настроен',
    'auth.err.network': 'Сервер не ответил. Проверьте связь и попробуйте ещё раз',
    'auth.err.unknown': 'Не получилось. Попробуйте ещё раз',

    /* Ошибки перехода по ссылке из письма — приезжают в ?e= */
    'auth.link.no_token': 'В ссылке нет токена. Запросите новую',
    'auth.link.bad_token': 'Ссылка устарела или испорчена. Запросите новую',
    'auth.link.used': 'По этой ссылке уже входили. Она одноразовая — запросите новую',
    'auth.link.not_allowed': 'Этого адреса больше нет в списке доступа',

    'auth.back': 'На главную',
    'auth.support': 'Написать в поддержку',
  },

  en: {
    'auth.title': 'Sign in',
    'auth.sub': 'Sign in with your work email — by password, Google or GitHub. The address must be verified.',
    'auth.enter': 'Sign in',
    'auth.entering': 'Signing you in…',
    'auth.again': 'Try again',
    'auth.write': 'Write to us',

    'auth.why.no_token': 'The link has no token. Request a new one',
    'auth.why.bad_token': 'The link is stale or broken. Request a new one',
    'auth.why.used': 'This link has already been used. Request a new one',
    'auth.why.not_allowed': 'This address is no longer on the access list',
    'auth.why.provider_off': 'Sign-in is unavailable: the server is not configured',
    'auth.why.no_provider_session': 'Sign-in did not complete. Check that you opened the link from the email and confirmed the address',
    'auth.why.not_invited': 'This address is not on the access list. Write to us and we will add it',
    'auth.email': 'Work email',
    'auth.placeholder': 'you@company.com',
    'auth.submit': 'Send the link',
    'auth.sending': 'Sending…',
    'auth.pilot':
      'Closed pilot: the link is only sent to addresses on the access list. If yours is not there, no email will arrive — write to us.',

    'auth.sent.title': 'Check your email',
    'auth.sent.body':
      'If {email} is on the access list, the link is already on its way. It expires in 15 minutes.',
    'auth.sent.again': 'Send again',

    'auth.dev.title': 'Email is not connected — here is the link',
    'auth.dev.body':
      'This happens in local development only. In production the link is never returned in the response.',
    'auth.dev.open': 'Open the link',

    'auth.err.invalid_email': 'That does not look like an email address',
    'auth.err.too_many': 'Too many attempts. Try again in an hour',
    'auth.err.mail_not_configured': 'Email delivery is not set up yet. Write to us and we will open access manually',
    'auth.err.mail_not_implemented': 'Email delivery is not set up yet. Write to us and we will open access manually',
    'auth.err.not_configured': 'Sign-in is temporarily unavailable: the server is not configured',
    'auth.err.network': 'The server did not answer. Check your connection and try again',
    'auth.err.unknown': 'That did not work. Try again',

    'auth.link.no_token': 'The link carries no token. Request a new one',
    'auth.link.bad_token': 'The link has expired or is broken. Request a new one',
    'auth.link.used': 'This link has already been used. Request a new one',
    'auth.link.not_allowed': 'This address is no longer on the access list',

    'auth.back': 'Back to the site',
    'auth.support': 'Contact support',
  },
};

export type AuthLang = keyof typeof auth;

/** Перевод с подстановкой {param}. Нет ключа — фолбэк на ru, потом сам ключ. */
export function tAuth(
  lang: AuthLang,
  key: string,
  params?: Record<string, string>,
): string {
  const raw = auth[lang][key] ?? auth.ru[key] ?? key;
  if (params === undefined) return raw;
  return raw.replace(/\{(\w+)\}/g, (whole, name: string) => params[name] ?? whole);
}

export default auth;
