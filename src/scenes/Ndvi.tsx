import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { Chip } from "../../ui/src";
import { Body, Entrance, Headline, Panel, StepLabel } from "../components/Type";
import { FLAGGED } from "../data";
import { theme } from "../theme";
import { beats } from "../timeline";

export const Ndvi: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = beats(fps);
  const { s } = b;
  const flagAt = b.flags - b.T.ndvi.from;
  const flagP = pop(frame, fps, flagAt, theme.spring.bouncy);
  const threshold = Math.max(...FLAGGED.map((z) => z.ndvi)) + 0.02;

  return (
    <Panel dur={dur}>
      <StepLabel text="STEP 02 · NDVI SCAN" delay={s(0.2)} />
      <Headline text="Spot stressed crops from above." highlight={["stressed"]} color={theme.colors.danger} delay={s(0.35)} />
      <Entrance delay={s(1.0)} style={{ marginTop: 34 }}>
        <div
          style={{
            padding: "22px 26px",
            borderRadius: theme.card.borderRadius,
            border: theme.card.border,
            background: theme.colors.surface,
          }}
        >
          <div style={{ fontFamily: theme.fonts.mono, fontSize: 27, color: theme.colors.text }}>
            NDVI = (<span style={{ color: theme.colors.accent }}>NIR</span> − Red) / (
            <span style={{ color: theme.colors.accent }}>NIR</span> + Red)
          </div>
          <div style={{ fontFamily: theme.fonts.body, fontSize: 20, color: theme.colors.textDim, marginTop: 10 }}>
            Healthy leaves reflect more near-infrared light. Low NDVI means stressed plants.
          </div>
        </div>
      </Entrance>
      <Entrance delay={s(1.5)} style={{ marginTop: 30 }}>
        <div
          style={{
            height: 14,
            borderRadius: 7,
            background: `linear-gradient(90deg, ${theme.ndvi.colors.join(", ")})`,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 10,
            fontFamily: theme.fonts.mono,
            fontSize: 15,
            color: theme.colors.textDim,
          }}
        >
          <span>{theme.ndvi.stops[0].toFixed(1)} STRESSED</span>
          <span>HEALTHY {theme.ndvi.stops[theme.ndvi.stops.length - 1].toFixed(2)}</span>
        </div>
      </Entrance>
      <div
        style={{
          marginTop: 34,
          alignSelf: "flex-start",
          opacity: Math.min(1, flagP),
          transform: `scale(${interpolate(flagP, [0, 1], [0.8, 1])}) translateY(${interpolate(flagP, [0, 1], [16, 0])}px)`,
          transformOrigin: "left center",
        }}
      >
        <Chip tone="danger" dot glow style={{ fontSize: 19, padding: "14px 22px", letterSpacing: "0.06em" }}>
          {FLAGGED.length} zones flagged · NDVI &lt; {threshold.toFixed(2)}
        </Chip>
      </div>
      <Body delay={flagAt + s(0.5)} size={21} style={{ marginTop: 18 }}>
        NDVI tells us <em>where</em> plants are struggling, but not <em>why</em>.
      </Body>
    </Panel>
  );
};
