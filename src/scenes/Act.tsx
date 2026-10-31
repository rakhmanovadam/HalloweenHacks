import React from "react";
import { interpolate, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { Chip, Icon, type IconName } from "../../ui/src";
import { pop, tween } from "../anim";
import { Entrance, Headline, Panel, StepLabel } from "../components/Type";
import { ACTION_ORDER, CAUSES, CHEM_ZONES, Cause, FLAGGED, WATER_ZONES, zonesFor } from "../data";
import { theme } from "../theme";
import { beats } from "../timeline";

const CAUSE_ICON: Record<Cause, IconName> = {
  dehydration: "droplet",
  weeds: "weed",
  disease: "leaf",
  insects: "bug",
};

export const Act: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = beats(fps);
  const { s } = b;
  const gf = frame + b.T.action.from;

  return (
    <Panel dur={dur}>
      <StepLabel text="STEP 05 · FARMER ACTS" delay={s(0.2)} color={theme.colors.primary} />
      <Headline text="The farmer treats the cause, not the field." highlight={["cause,"]} size={58} delay={s(0.35)} />
      <Entrance delay={s(0.8)} style={{ marginTop: 26 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "14px 18px",
            borderRadius: 16,
            background: `${theme.colors.primary}14`,
            border: `1px solid ${theme.colors.primary}55`,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: theme.colors.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="check" size={22} color={theme.colors.ink} strokeWidth={3} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 22, color: theme.colors.text }}>
              Work order sent to the farmer
            </div>
            <div style={{ fontFamily: theme.fonts.body, fontSize: 16, color: theme.colors.textDim, marginTop: 2 }}>
              Exact zones, cause and fix. Nothing else gets touched.
            </div>
          </div>
          <Chip size="sm" tone="primary">
            {FLAGGED.length} zones
          </Chip>
        </div>
      </Entrance>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        {ACTION_ORDER.map((cause, g) => {
          const info = CAUSES[cause];
          const start = b.action(g);
          const p = pop(gf, fps, start - s(0.4));
          const live =
            tween(gf, [start, start + s(0.2)], [0, 1]) *
            tween(gf, [start + b.effectLen, start + b.effectLen + s(0.3)], [1, 0], theme.ease.in);
          const tone = info.chemical ? theme.colors.spray : theme.colors.accent;
          return (
            <div
              key={cause}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "12px 18px",
                borderRadius: 16,
                background: theme.colors.surface,
                border: `1px solid ${interpolateColors(live, [0, 1], [theme.colors.border, tone])}`,
                boxShadow: live > 0 ? `0 0 ${30 * live}px ${tone}33` : undefined,
                opacity: Math.min(1, p),
                transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px) scale(${interpolate(p, [0, 1], [0.95, 1])})`,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${tone}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name={CAUSE_ICON[cause]} size={24} color={tone} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 21, color: theme.colors.text }}>
                  {info.label} <span style={{ color: theme.colors.textFaint }}>→</span>{" "}
                  <span style={{ color: tone }}>{info.action}</span>
                </div>
                <div style={{ fontFamily: theme.fonts.body, fontSize: 16, color: theme.colors.textDim, marginTop: 2 }}>
                  {info.detail}
                </div>
              </div>
              <span style={{ fontFamily: theme.fonts.mono, fontSize: 15, color: theme.colors.textDim }}>
                {zonesFor(cause)
                  .map((z) => z.id)
                  .join(" · ")}
              </span>
            </div>
          );
        })}
      </div>
      <Entrance delay={b.action(ACTION_ORDER.length - 1) - b.T.action.from + s(0.9)} y={16} style={{ marginTop: 14 }}>
        <div style={{ fontFamily: theme.fonts.mono, fontSize: 15, letterSpacing: "0.08em", color: theme.colors.textDim }}>
          {WATER_ZONES} ZONES: WATER ONLY · {CHEM_ZONES} ZONES: SPOT-TREATED
        </div>
      </Entrance>
    </Panel>
  );
};
