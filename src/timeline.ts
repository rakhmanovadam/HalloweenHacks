// Scene lengths in seconds. Every frame number in the project derives from these + fps.
export const SCENES = {
  hook: 8.5,
  segment: 7,
  ndvi: 8.5,
  drone: 9.5,
  diagnose: 9.5,
  action: 10,
  payoff: 7.5,
  outro: 6,
};

export type SceneKey = keyof typeof SCENES;
export const TOTAL_S = Object.values(SCENES).reduce((a, b) => a + b, 0);

export const timeline = (fps: number) => {
  const out = {} as Record<SceneKey, { from: number; dur: number }>;
  let acc = 0;
  for (const key of Object.keys(SCENES) as SceneKey[]) {
    const from = Math.round(acc * fps);
    acc += SCENES[key];
    out[key] = { from, dur: Math.round(acc * fps) - from };
  }
  return out;
};

// Shared beats (global frames) so the field layer and the text panels stay in sync.
export const beats = (fps: number) => {
  const T = timeline(fps);
  const s = (x: number) => Math.round(x * fps);
  const droneStart = T.drone.from + s(0.8);
  const travel = s(0.9);
  const hover = s(0.75);
  const visit = (i: number) => {
    const depart = droneStart + i * (travel + hover);
    return { depart, arrive: depart + travel, leave: depart + travel + hover };
  };
  return {
    T,
    s,
    boom: [s(1.0), s(3.6)] as [number, number],
    problems: s(5.0),
    gap: [T.segment.from + s(0.4), T.segment.from + s(1.5)] as [number, number],
    labels: T.segment.from + s(1.2),
    scan: [T.ndvi.from + s(0.9), T.ndvi.from + s(4.2)] as [number, number],
    flags: T.ndvi.from + s(4.7),
    visit,
    droneExit: [T.diagnose.from + s(0.2), T.diagnose.from + s(1.0)] as [number, number],
    diagnose: (k: number) => T.diagnose.from + s(1.0) + k * s(1.1),
    action: (g: number) => T.action.from + s(1.6) + g * s(1.4),
    effectLen: s(2.0),
    recoverDelay: s(0.9),
    recoverLen: s(1.3),
    fieldExit: [T.payoff.from, T.payoff.from + s(0.5)] as [number, number],
  };
};
