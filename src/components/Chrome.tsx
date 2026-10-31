import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, tween } from "../anim";
import { Brand } from "../../ui/src";
import { BRAND } from "../data";
import { theme } from "../theme";
import { SceneKey, beats } from "../timeline";

export const TopBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { T, s } = beats(fps);
  const p = pop(frame, fps, s(0.2), theme.spring.snappy);
  const exit = tween(frame, [T.outro.from - s(0.4), T.outro.from], [0, 1], theme.ease.in);
  return (
    <div
      style={{
        position: "absolute",
        left: 150,
        top: 64,
        display: "flex",
        alignItems: "center",
        opacity: Math.min(1, p) * (1 - exit),
        transform: `translateY(${interpolate(p, [0, 1], [-16, 0]) - 16 * exit}px)`,
      }}
    >
      <Brand name={BRAND} tagline="Precision crop care" />
    </div>
  );
};

const STEPS: { key: SceneKey; label: string }[] = [
  { key: "segment", label: "Segment" },
  { key: "ndvi", label: "NDVI scan" },
  { key: "drone", label: "Drone" },
  { key: "diagnose", label: "Vision" },
  { key: "action", label: "Farmer acts" },
];

export const StepTracker: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { T, s } = beats(fps);
  const enter = pop(frame, fps, T.segment.from + s(0.2));
  const exit = tween(frame, [T.payoff.from, T.payoff.from + s(0.35)], [0, 1], theme.ease.in);
  if (frame < T.segment.from || exit >= 1) return null;

  const width = 1620;
  const step = width / (STEPS.length - 1);
  // Progress eases between steps instead of moving linearly.
  const prog = STEPS.slice(1).reduce(
    (acc, st) => acc + tween(frame, [T[st.key].from, T[st.key].from + s(0.6)], [0, 1], theme.ease.inOut),
    0,
  );
  const active = Math.round(prog);

  return (
    <div
      style={{
        position: "absolute",
        left: 150,
        top: 962,
        width,
        height: 60,
        opacity: Math.min(1, enter) * (1 - exit),
        transform: `translateY(${interpolate(enter, [0, 1], [24, 0]) + 16 * exit}px)`,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 7, width, height: 2, background: theme.colors.border }} />
      <div style={{ position: "absolute", left: 0, top: 7, width: prog * step, height: 2, background: theme.colors.primary }} />
      {STEPS.map((st, i) => {
        const done = i < active;
        const isActive = i === active;
        const ring = isActive ? 0.5 + 0.5 * Math.sin(frame / 8) : 0;
        return (
          <div key={st.key} style={{ position: "absolute", left: i * step, top: 0, transform: "translateX(-50%)" }}>
            <div
              style={{
                width: 16,
                height: 16,
                margin: "0 auto",
                borderRadius: "50%",
                background: done || isActive ? theme.colors.primary : theme.colors.bg,
                border: `2px solid ${done || isActive ? theme.colors.primary : theme.colors.textFaint}`,
                boxShadow: isActive ? `0 0 0 ${4 + ring * 6}px ${theme.colors.primary}33` : undefined,
              }}
            />
            <div
              style={{
                marginTop: 12,
                whiteSpace: "nowrap",
                fontFamily: theme.fonts.mono,
                fontSize: 15,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: isActive ? theme.colors.text : theme.colors.textFaint,
              }}
            >
              {String(i + 1).padStart(2, "0")} {st.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
