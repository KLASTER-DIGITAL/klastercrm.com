/**
 * Суточный толчок прохода по срокам лицензий. Запускается расписанием Hostinger.
 *
 * Панель: Advanced → Cron Jobs → Node.js, поле команды — `scripts/cron-licenses.js`.
 * Hostinger подставляет перед ним `node --env-file=…`, поэтому переменные
 * окружения сайта здесь доступны как обычный `process.env`.
 *
 * ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ, А НЕ `wget` ОДНОЙ СТРОКОЙ. Роут закрыт секретом, и в
 * строке задания он лежал бы открытым текстом — его видно всем, у кого есть
 * доступ к панели, и он попадает в вывод задания. Здесь секрет читается из
 * окружения и в команде не появляется вовсе.
 *
 * Вывод — одна строка JSON: её видно в панели по кнопке «View Output», и по ней
 * сразу понятно, сработал ли проход и сколько писем ушло.
 *
 * Выход с ненулевым кодом, когда проход ответил ошибкой: Hostinger отмечает
 * такое задание как упавшее, и отказ не выглядит успехом.
 */

const URL_DEFAULT = 'https://klastercrm.com/api/v1/cron/licenses';

async function main() {
  const secret = (process.env.CRON_SECRET ?? '').trim();
  if (secret === '') {
    console.error('CRON_SECRET не задан в переменных окружения сайта — проход не запускался');
    process.exit(1);
  }

  const url = (process.env.LICENSE_CRON_URL ?? URL_DEFAULT).trim();
  /* `dry=1` в переменной — способ посмотреть, что ушло бы, не отправляя писем:
     пригодится в первый день после настройки. */
  const dry = (process.env.LICENSE_CRON_DRY ?? '').trim() === '1';
  const target = dry ? `${url}?dry=1` : url;

  const started = Date.now();
  let response;
  try {
    response = await fetch(target, {
      headers: { 'x-cron-secret': secret },
      signal: AbortSignal.timeout(120_000),
    });
  } catch (error) {
    console.error(JSON.stringify({ event: 'cron_licenses_unreachable', message: String(error) }));
    process.exit(1);
  }

  const text = await response.text();
  const tookMs = Date.now() - started;

  if (!response.ok) {
    console.error(JSON.stringify({ event: 'cron_licenses_http', status: response.status, body: text.slice(0, 500), tookMs }));
    process.exit(1);
  }

  console.log(JSON.stringify({ event: 'cron_licenses_ok', tookMs, body: text.slice(0, 1000) }));
}

main().catch((error) => {
  console.error(JSON.stringify({ event: 'cron_licenses_failed', message: String(error) }));
  process.exit(1);
});
