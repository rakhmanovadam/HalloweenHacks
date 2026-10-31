import type { CSSProperties } from "react";
import { vars } from "./tokens";

// Traced from the AgriVision logo artwork (1254px master): six parallel crop-row bars + the lime "detected zone" square.
const BAR_WIDTH = 123;
const BARS: [number, number, number, number][] = [
  [230, 644, 590, 310],
  [235, 858, 800, 335],
  [381, 948, 625, 722],
  [842, 520, 986, 387],
  [606, 968, 1019, 585],
  [847, 959, 1044, 776],
];
const SQUARE = { cx: 735, cy: 622, side: 120, r: 20, rotate: 47.2 };
const VIEWBOX = "148 150 977 977";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - (1 - t) ** 3;

export interface LogoMarkProps {
  /** Pixel size of the square mark. Default 40. */
  size?: number;
  /** Build-in amount, 0–1: bars grow in one by one, then the lime square lands. Default 1 (complete). Drive it for intro/loading states. */
  progress?: number;
  /** Place the mark on a pale rounded app-icon tile. Use at small sizes on dark backgrounds so the deep-green bars stay legible. */
  tile?: boolean;
  style?: CSSProperties;
}

/** AgriVision logo mark: crop-row bars with the lime square marking the one zone that needs attention. */
export function LogoMark({ size = 40, progress = 1, tile = false, style }: LogoMarkProps) {
  const p = clamp01(progress);
  const sq = easeOut(clamp01((p - 0.72) / 0.28));
  const mark = (
    <svg
      width={tile ? size * 0.8 : size}
      height={tile ? size * 0.8 : size}
      viewBox={VIEWBOX}
      role="img"
      aria-label="AgriVision"
      style={{ display: "block", flexShrink: 0, overflow: "visible", ...(tile ? {} : style) }}
    >
      {BARS.map(([x1, y1, x2, y2], i) => {
        const k = clamp01((p - i * 0.09) / 0.4);
        if (k <= 0) return null;
        const e = easeOut(k);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x1 + (x2 - x1) * e}
            y2={y1 + (y2 - y1) * e}
            stroke={vars.color.brandDeep}
            strokeWidth={BAR_WIDTH}
            strokeLinecap="round"
            opacity={clamp01(k * 3)}
          />
        );
      })}
      {sq > 0 ? (
        <rect
          x={SQUARE.cx - SQUARE.side / 2}
          y={SQUARE.cy - SQUARE.side / 2}
          width={SQUARE.side}
          height={SQUARE.side}
          rx={SQUARE.r}
          fill={vars.color.primary}
          opacity={clamp01(sq * 2)}
          transform={`rotate(${SQUARE.rotate} ${SQUARE.cx} ${SQUARE.cy}) translate(${SQUARE.cx} ${SQUARE.cy}) scale(${0.4 + 0.6 * sq}) translate(${-SQUARE.cx} ${-SQUARE.cy})`}
        />
      ) : null}
    </svg>
  );
  if (!tile) return mark;
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        background: vars.color.brandTile,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      {mark}
    </span>
  );
}
