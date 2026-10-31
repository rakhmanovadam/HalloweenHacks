import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, tween } from "../anim";
import { Icon } from "../../ui/src";
import { Body, Headline, Panel, StepLabel } from "../components/Type";
import { FLAGGED } from "../data";
import { theme } from "../theme";
import { beats } from "../timeline";

export const DroneScan: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = beats(fps);
  const { s } = b;
  const gf = frame + b.T.drone.from;

  return (
    <Panel dur={dur}>
      <StepLabel text="STEP 03 · DRONE" delay={s(0.2)} />
      <Headline text="Fly only to the flagged zones." highlight={["only"]} delay={s(0.35)} />
      <Body delay={s(0.9)} style={{ marginTop: 26 }}>
        The drone only scouts. It photographs the zones NDVI flagged; it never sprays anything.
      </Body>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 30 }}>
        {FLAGGED.map((z, i) => {
          const v = b.visit(i);
          const p = pop(gf, fps, v.depart - s(0.15), theme.spring.snappy);
          const prog = tween(gf, [v.depart, v.leave], [0, 1], theme.ease.inOut);
          const done = gf >= v.leave;
          const status = gf < v.arrive ? "EN ROUTE" : done ? "CAPTURED" : "CAPTURING";
          return (
            <div
              key={z.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "12px 18px",
                borderRadius: 14,
                border: theme.card.border,
                background: theme.colors.surface,
                opacity: Math.min(1, p),
                transform: `translateX(${interpolate(p, [0, 1], [30, 0])}px) scale(${interpolate(p, [0, 1], [0.96, 1])})`,
              }}
            >
              <span style={{ fontFamily: theme.fonts.mono, fontWeight: 600, fontSize: 20, color: theme.colors.text, width: 40 }}>
                {z.id}
              </span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: theme.colors.border }}>
                <div style={{ width: `${prog * 100}%`, height: 6, borderRadius: 3, background: theme.colors.accent }} />
              </div>
              <span
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: 14,
                  letterSpacing: "0.1em",
                  width: 110,
                  textAlign: "right",
                  color: done ? theme.colors.accent : theme.colors.textDim,
                }}
              >
                {status}
              </span>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: done ? theme.colors.accent : "transparent",
                  border: `2px solid ${done ? theme.colors.accent : theme.colors.textFaint}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {done && <Icon name="check" size={14} color={theme.colors.ink} strokeWidth={3} />}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};
