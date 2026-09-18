/**
 * Иконки сайта: один набор, штриховые, 24×24, currentColor.
 * Растровых и сгенерированных картинок интерфейса на сайте нет (CLAUDE.md, п. 5):
 * графика — либо настоящий скриншот, либо вектор отсюда.
 */

import type { SVGProps } from 'react';

export type IconName =
  | 'arrow'
  | 'arrow-up'
  | 'audit'
  | 'build'
  | 'support'
  | 'widget'
  | 'funnel'
  | 'route'
  | 'key'
  | 'doc'
  | 'team'
  | 'bell'
  | 'shield'
  | 'check'
  | 'x'
  | 'menu'
  | 'mail'
  | 'send'
  | 'account'
  | 'card'
  | 'logout'
  | 'external'
  | 'clock'
  | 'alert';

const PATHS: Record<IconName, string> = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  'arrow-up': 'M12 19V5M6 11l6-6 6 6',
  audit: 'M4 20V10M10 20V4M16 20v-7M22 20H2M19 8l2-2-2-2',
  build: 'M14 7l3 3M5 19l4-1 9-9-3-3-9 9zM15 4l2-2 5 5-2 2',
  support: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16h.01M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7',
  widget: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM16.5 13v7M13 16.5h7',
  funnel: 'M3 4h18l-7 8v6l-4 2v-8z',
  route: 'M6 3v6a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v6M6 3a2 2 0 1 0 0 0M18 21a2 2 0 1 0 0 0',
  key: 'M14 10a4 4 0 1 0-3.5 3.97L4 20.5V22h3v-2h2v-2h2l1.5-1.5A4 4 0 0 0 14 10zM15 9h.01',
  doc: 'M6 2h8l4 4v16H6zM14 2v4h4M9 13h6M9 17h6',
  team: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  check: 'M5 12l5 5L20 7',
  x: 'M6 6l12 12M18 6L6 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z',
  account: 'M3 5h18v14H3zM3 9h18M7 13h4',
  card: 'M2 7h20v12H2zM2 11h20M6 16h4',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 7v5l3 2',
  alert: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
};

export function Icon({
  name,
  size = 20,
  ...rest
}: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
