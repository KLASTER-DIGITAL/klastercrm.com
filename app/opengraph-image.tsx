import { ImageResponse } from 'next/og';
import { getLang } from '@/lib/i18n-server';

/**
 * OG-картинка для всех страниц: абстрактная графика, бренд, тезис. Никакого
 * интерфейса продукта и людей (CLAUDE.md, п. 5). Шрифт Onest тянется с Google
 * Fonts при отрисовке; не дотянулся — системный, картинка всё равно отдаётся.
 */

export const runtime = 'edge';
export const alt = 'KLASTER — amoCRM и Bitrix24: внедрение, сопровождение, виджеты';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const TEXT = {
  ru: {
    h: 'Наведём порядок в amoCRM и покажем в цифрах, что изменилось',
    sub: 'Внедрение · Сопровождение · Аудит · Свои виджеты',
  },
  en: {
    h: 'We put your amoCRM in order and show the change in numbers',
    sub: 'Implementation · Support · Audit · Custom widgets',
  },
} as const;

async function onest(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch('https://fonts.googleapis.com/css2?family=Onest:wght@600&subset=cyrillic', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0' },
    }).then((r) => r.text());
    const url = /src: url\((https:[^)]+\.(?:woff|ttf))\)/u.exec(css)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image() {
  const lang = await getLang();
  const t = TEXT[lang];
  const font = await onest();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: 'linear-gradient(135deg, #0d1117 0%, #131a2b 60%, #1b2a5e 100%)',
          color: '#fff',
          fontFamily: font ? 'Onest' : 'sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -120,
            top: -160,
            width: 520,
            height: 520,
            borderRadius: 999,
            background: 'radial-gradient(circle, rgba(38,80,255,0.55) 0%, rgba(38,80,255,0) 70%)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 34, fontWeight: 600 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#fff',
              color: '#0e1116',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
            }}
          >
            K
          </div>
          KLASTER
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 60, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2, maxWidth: 1000 }}>{t.h}</div>
          <div style={{ fontSize: 28, color: '#9aa3ae' }}>{t.sub}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, color: '#9aa3ae' }}>
          <span>klastercrm.com</span>
          <span>amoCRM · Bitrix24</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: 'Onest', data: font, weight: 600, style: 'normal' }] : [],
    },
  );
}
