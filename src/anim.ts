import { interpolate, spring } from "remotion";
import { theme } from "./theme";

type EasingFn = (t: number) => number;
type SpringConfig = { damping: number; stiffness: number; mass: number };

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const tween = (
  value: number,
  range: [number, number],
  out: [number, number],
  easing: EasingFn = theme.ease.out,
) => interpolate(value, range, out, { easing, ...clamp });

export const pop = (frame: number, fps: number, at: number, config: SpringConfig = theme.spring.smooth) =>
  spring({ frame: Math.max(0, frame - at), fps, config });

// 0 → 1 over the last ~0.4s of a scene (exits are faster than entrances).
export const exitProgress = (frame: number, dur: number, fps: number) =>
  tween(frame, [dur - Math.round(fps * 0.4), dur - 2], [0, 1], theme.ease.in);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
