import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, tween } from "../anim";
import { Counter, Entrance, Headline, Panel, StepLabel } from "../components/Type";
import { BRAND, CHEM_ZONES, FLAGGED, SPRAY_REDUCTION, TOTAL_ZONES, WATER_ZONES } from "../data";
import { theme } from "../theme";
import { beats } from "../timeline";

const TRACK = 820;

export const Payoff: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { s } = beats(fps);
  const countP = pop(frame, fps, s(1.0), { damping: 30, stiffness: 60, mass: 1 });
  const n = Math.round(interpolate(countP, [0, 1], [0, SPRAY_REDUCTION], { extrapolateRight: "clamp" }));

  const rows = [
    { label: "Blanket spraying", value: `${TOTAL_ZONES} / ${TOTAL_ZONES} zones sprayed`, frac: 1, color: theme.colors.danger },
    { label: `With ${BRAND}`, value: `${CHEM_ZONES} / ${TOTAL_ZONES} zones sprayed`, frac: CHEM_ZONES / TOTAL_ZONES, color: theme.colors.primary },
    { label: "Fixed with water only", value: `${WATER_ZONES} zones · 0 chemicals`, frac: WATER_ZONES / TOTAL_ZONES, color: theme.colors.accent },
  ];

  return (
    <Panel dur={dur} style={{ left: 150, top: 240, width: 1620 }}>
      <StepLabel text="THE RESULT" delay={s(0.25)} color={theme.colors.primary} />
      <Headline text="Spray only where it's needed." highlight={["only"]} size={92} delay={s(0.4)} />
      <div style={{ display: "flex", alignItems: "center", marginTop: 70, gap: 90 }}>
        <Entrance delay={s(0.9)} style={{ width: 640 }}>
          <div
            style={{
              fontFamily: theme.fonts.display,
              fontWeight: 700,
              fontSize: 220,
              lineHeight: 0.9,
              letterSpacing: "-0.05em",
              color: theme.colors.primary,
              textShadow: `0 0 60px ${theme.colors.primary}66, 0 0 120px ${theme.colors.primary}33`,
            }}
          >
            <Counter value={n} final={SPRAY_REDUCTION} />
          </div>
          <div style={{ fontFamily: theme.fonts.body, fontSize: 28, color: theme.colors.textDim, marginTop: 18 }}>
            less field area sprayed with chemicals
          </div>
        </Entrance>
        <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
          {rows.map((row, i) => {
            const at = s(1.3) + i * 5;
            const fill = tween(frame, [at + s(0.2), at + s(1.1)], [0, 1]);
            return (
              <Entrance key={row.label} delay={at}>
                <div style={{ display: "flex", justifyContent: "space-between", width: TRACK, marginBottom: 12 }}>
                  <span style={{ fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 26, color: theme.colors.text }}>
                    {row.label}
                  </span>
                  <span style={{ fontFamily: theme.fonts.mono, fontSize: 18, color: theme.colors.textDim }}>{row.value}</span>
                </div>
                <div style={{ width: TRACK, height: 16, borderRadius: 8, background: theme.colors.border }}>
                  <div
                    style={{
                      width: Math.max(16, TRACK * row.frac) * fill,
                      height: 16,
                      borderRadius: 8,
                      background: row.color,
                    }}
                  />
                </div>
              </Entrance>
            );
          })}
        </div>
      </div>
      <Entrance delay={s(2.6)} y={16} style={{ marginTop: 70 }}>
        <div style={{ fontFamily: theme.fonts.mono, fontSize: 16, letterSpacing: "0.08em", color: theme.colors.textFaint }}>
          ILLUSTRATIVE EXAMPLE · {TOTAL_ZONES}-ZONE FIELD · {FLAGGED.length} ZONES FLAGGED BY NDVI
        </div>
      </Entrance>
    </Panel>
  );
};
