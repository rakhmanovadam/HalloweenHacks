import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { tween } from "../anim";
import { Body, Counter, Entrance, Headline, Panel, StepLabel } from "../components/Type";
import { FLAGGED } from "../data";
import { theme } from "../theme";
import { beats } from "../timeline";

export const Hook: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = beats(fps);
  const gf = frame + b.T.hook.from;
  const pct = Math.round(tween(gf, b.boom, [0, 100], theme.ease.inOut));

  return (
    <Panel dur={dur}>
      <StepLabel text="THE PROBLEM" delay={b.s(0.2)} color={theme.colors.danger} />
      <Headline
        text="Farms spray pesticide across the entire field."
        highlight={["entire"]}
        color={theme.colors.danger}
        delay={b.s(0.35)}
      />
      <Entrance delay={b.boom[0] - b.T.hook.from} style={{ marginTop: 44 }}>
        <div
          style={{
            fontFamily: theme.fonts.display,
            fontWeight: 700,
            fontSize: 128,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: theme.colors.spray,
          }}
        >
          <Counter value={pct} final={100} />
        </div>
        <div style={{ fontFamily: theme.fonts.body, fontSize: 24, color: theme.colors.textDim, marginTop: 8 }}>
          of the field gets sprayed
        </div>
      </Entrance>
      <Body delay={b.problems - b.T.hook.from} style={{ marginTop: 40 }}>
        …even when only{" "}
        <span style={{ color: theme.colors.danger, fontWeight: 600 }}>{FLAGGED.length} zones</span> actually have a
        problem, and not every problem needs a chemical.
      </Body>
    </Panel>
  );
};
