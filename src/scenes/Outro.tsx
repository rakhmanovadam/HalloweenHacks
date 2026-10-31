import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { exitProgress, pop, tween } from "../anim";
import { Chip, LogoMark } from "../../ui/src";
import { Entrance } from "../components/Type";
import { BRAND } from "../data";
import { theme } from "../theme";
import { beats } from "../timeline";

const PILLS: string[] = ["SEGMENT", "NDVI", "DRONE SCOUTING", "FARMER ACTS"];

export const Outro: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { s } = beats(fps);
  const mark = pop(frame, fps, 0, theme.spring.smooth);
  const build = tween(frame, [s(0.15), s(1.9)], [0, 1], theme.ease.inOut);
  const glow = tween(frame, [s(1.3), s(2.3)], [0, 1]);
  const e = exitProgress(frame, dur, fps);
  const breathe = 1 + Math.sin(frame / 22) * 0.015;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        opacity: 1 - e,
        transform: `translateY(${-30 * e}px)`,
      }}
    >
      <div
        style={{
          position: "relative",
          opacity: Math.min(1, mark),
          transform: `scale(${interpolate(mark, [0, 1], [0.85, 1]) * breathe})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -150,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.colors.primary}55 0%, ${theme.colors.primary}1A 38%, transparent 66%)`,
            opacity: 0.35 + 0.65 * glow,
          }}
        />
        <LogoMark size={250} progress={build} style={{ position: "relative" }} />
      </div>
      <div style={{ display: "flex", marginTop: 26 }}>
        {BRAND.split("").map((ch, i) => {
          const p = pop(frame, fps, s(1.5) + i * 3, theme.spring.snappy);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontFamily: theme.fonts.display,
                fontWeight: 700,
                fontSize: 128,
                lineHeight: 1,
                letterSpacing: "-0.04em",
                color: theme.colors.text,
                opacity: Math.min(1, p),
                transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px)`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <Entrance delay={s(2.3)} style={{ marginTop: 22, transformOrigin: "center" }}>
        <div style={{ fontFamily: theme.fonts.body, fontSize: 34, color: theme.colors.textDim }}>
          Diagnose first. Treat only what&apos;s needed.
        </div>
      </Entrance>
      <div style={{ display: "flex", gap: 14, marginTop: 44 }}>
        {PILLS.map((p, i) => (
          <Entrance key={p} delay={s(2.8) + i * 4} y={20} style={{ transformOrigin: "center" }}>
            <Chip tone={i === PILLS.length - 1 ? "primary" : "neutral"}>{p}</Chip>
          </Entrance>
        ))}
      </div>
    </AbsoluteFill>
  );
};
