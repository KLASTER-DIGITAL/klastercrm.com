/**
 * Кадр продукта на странице сайта.
 *
 * Скриншоты сняты с живого виджета на демо-данных (scripts/site-shots.mjs,
 * ширина окна 1360 CSS-пикселей, deviceScaleFactor 2). Пересняли — картинка
 * обновилась; расходиться с продуктом ей негде.
 *
 * Реестр SHOTS держит src, размеры и alt в одном месте по одной причине:
 * шесть страниц не должны переписывать ширину и высоту руками. Разъехавшиеся
 * width/height дают дёрганье страницы при загрузке, а разъехавшиеся alt —
 * шесть разных описаний одного и того же экрана.
 *
 * Кадр никогда не единственный носитель факта: числа с него всегда продублированы
 * текстом рядом. Скриншот показывает, как это выглядит, а не сообщает данные.
 */

import Image from 'next/image';
import { tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { Source } from './ui';
import s from './shot.module.css';

/** CSS-ширина окна, при которой сняты все кадры. Отсюда считается высота обрезки. */
const FRAME_WIDTH = 1360;

/**
 * Ширина колонки страницы: max-width 1160 минус боковые отступы 24px (16px
 * на телефоне). Без этого браузер тянет кадр в 2720px на экран в 375px.
 */
const SIZES =
  '(min-width: 1160px) 1112px, (min-width: 641px) calc(100vw - 48px), calc(100vw - 32px)';

export interface ShotFrame {
  /** Путь от корня public: /shots/<имя>.png */
  src: string;
  /** Что именно на кадре — не «скриншот виджета», а содержание экрана. */
  alt: Bi;
  /** Пиксельные размеры файла. Нужны next/image, чтобы место было занято до загрузки. */
  width: number;
  height: number;
  /**
   * Высота окна кадра по умолчанию, в CSS-пикселях исходника (кадр снят при
   * ширине 1360). Подобрана по границе содержимого конкретного кадра, чтобы
   * обрез не резал строку таблицы пополам.
   */
  tall: number;
}

export type ShotKey = 'overview' | 'funnel' | 'path' | 'managers' | 'journey';

/** Реестр кадров. Страница берёт запись целиком: `<Shot {...SHOTS.funnel} />`. */
export const SHOTS: Record<ShotKey, ShotFrame> = {
  overview: {
    src: '/shots/overview.png',
    alt: {
      ru: 'Вкладка «Обзор»: карточки за июль — 1 015 новых сделок, 782 взято в работу, 46 дошли до встречи, 5 успешно реализовано, 912 закрыто; ниже блок «Где теряются сделки» с разбором узких мест, справа — продажная цепочка с конверсией каждого этапа.',
      en: '“Overview” tab: July cards — 1,015 new deals, 782 taken into work, 46 reached a meeting, 5 won, 912 closed; below, the “Where deals get lost” block with bottlenecks, on the right the sales chain with conversion for every stage.',
    },
    width: 2720,
    height: 1960,
    tall: 600,
  },
  funnel: {
    src: '/shots/funnel.png',
    alt: {
      ru: 'Вкладка «Воронка»: таблица «Движение по этапам» — вошло в этап, конверсия из предыдущего, изменение к прошлому периоду, медиана времени. Три строки-парковки подсвечены жёлтым, помечены словом «парковка» и вместо конверсии показывают «вне цепочки».',
      en: '“Funnel” tab: the “Movement by stage” table — entered the stage, conversion from the previous one, change vs. the previous period, median time. Three parking rows are highlighted in yellow, labelled “parking” and show “outside the chain” instead of a conversion.',
    },
    width: 2720,
    height: 2160,
    tall: 640,
  },
  path: {
    src: '/shots/path.png',
    alt: {
      ru: 'Вкладка «Путь заявки»: диаграмма «Вся воронка целиком» — поток сделок по продажной цепочке с конверсией под каждым переходом, а парковочные этапы «Нет контакта» (860) и «Реактивация» (115) вынесены отдельной нижней полосой вне цепочки.',
      en: '“Lead path” tab: the “Whole funnel” diagram — the deal flow along the sales chain with conversion under every transition, while the parking stages “No contact” (860) and “Reactivation” (115) sit in a separate bottom band outside the chain.',
    },
    width: 2720,
    height: 1960,
    tall: 860,
  },
  managers: {
    src: '/shots/managers.png',
    alt: {
      ru: 'Вкладка «Менеджеры»: таблица отдела продаж — сколько сделок каждый сотрудник провёл через взятие в работу, квалификацию, назначенную и проведённую встречу, конверсия «работа → встреча» и отклонение от медианы отдела. Переходы автоматики стоят отдельной строкой с пометкой «робот».',
      en: '“Managers” tab: the sales team table — how many deals each person moved through work, qualification, scheduled and held meetings, the “work → meeting” conversion and the deviation from the team median. Automation transitions sit on a separate row marked “bot”.',
    },
    width: 2720,
    height: 1800,
    tall: 750,
  },
  journey: {
    src: '/shots/journey.png',
    alt: {
      ru: 'Вкладка «Путь лида»: блок «Почему сделки стоят» и таблица «Где лиды застревают» — медиана и 90-й перцентиль времени на этапе, норматив, сколько сделок зависло сверх норматива и какая это доля этапа.',
      en: '“Lead journey” tab: the “Why deals stall” block and the “Where leads get stuck” table — median and 90th percentile time per stage, the norm, how many deals exceeded it and what share of the stage that is.',
    },
    width: 2720,
    height: 1800,
    tall: 710,
  },
};

/* tall переопределяем: в реестре это обязательное число, у компонента — ещё и
   `tall` без значения, то есть «показать кадр целиком». */
export interface ShotProps extends Omit<ShotFrame, 'tall'> {
  /** Подпись под кадром: что здесь смотреть. Необязательна. */
  caption?: React.ReactNode;
  /** Текст сноски-источника. Компонент Source подставляется сам — не оборачивай. */
  source?: React.ReactNode;
  /**
   * Высота окна кадра в CSS-пикселях исходника (ширина исходника — 1360).
   * Число из SHOTS приходит вместе со спредом; `tall` без значения показывает
   * кадр целиком, без обрезки.
   */
  tall?: number | boolean;
  /** Первый кадр на странице грузится сразу, остальные — лениво. */
  priority?: boolean;
}

export async function Shot({
  src,
  alt,
  width,
  height,
  caption,
  source,
  tall = 600,
  priority = false,
}: ShotProps) {
  const t = tr(await getLang());
  /* Высота кадра в тех же CSS-пикселях, в которых задана обрезка. Считаем из
     пиксельных размеров файла, а не делим на 2: масштаб съёмки — деталь
     скрипта, менять его здесь ничего не должно. */
  const frameHeight = (height * FRAME_WIDTH) / width;
  const windowHeight = typeof tall === 'number' ? Math.min(tall, frameHeight) : frameHeight;
  /* Полпикселя запаса: окно вровень с кадром — это не обрезка, и гасить там нечего. */
  const cropped = windowHeight < frameHeight - 0.5;

  return (
    <figure className={s.shot}>
      <div
        className={s.frame}
        /* Пропорция, а не пиксели: обрезка одинакова на 1440 и на 375, и место
           под кадр занято до того, как файл загрузился. */
        style={cropped ? { aspectRatio: `${FRAME_WIDTH} / ${windowHeight}` } : undefined}
      >
        <Image
          className={s.img}
          src={src}
          alt={t(alt)}
          width={width}
          height={height}
          sizes={SIZES}
          priority={priority}
        />
        {cropped ? <span className={s.fade} aria-hidden="true" /> : null}
      </div>
      {caption ? <figcaption className={s.caption}>{caption}</figcaption> : null}
      {source ? <Source>{source}</Source> : null}
    </figure>
  );
}
