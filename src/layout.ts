import { COLS, ROWS } from "./data";

export const CELL = 88;
export const GAP = 8;
export const FIELD = { x: 150, y: 300 };
export const PANEL = { x: 1190, y: 196, w: 600 };

export const fieldSize = (gap: number) => ({
  w: COLS * CELL + (COLS - 1) * gap,
  h: ROWS * CELL + (ROWS - 1) * gap,
});

export const cellPos = (c: number, r: number, gap = GAP) => ({ x: c * (CELL + gap), y: r * (CELL + gap) });

export const cellCenter = (c: number, r: number, gap = GAP) => {
  const p = cellPos(c, r, gap);
  return { x: p.x + CELL / 2, y: p.y + CELL / 2 };
};
