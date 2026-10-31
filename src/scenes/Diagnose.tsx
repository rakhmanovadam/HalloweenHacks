import React from "react";
import { useVideoConfig } from "remotion";
import { Headline, Panel, StepLabel } from "../components/Type";
import { VisionCard } from "../components/VisionCard";
import { CARD_ORDER } from "../data";
import { PANEL } from "../layout";
import { beats } from "../timeline";

const GRID_GAP = 18;

export const Diagnose: React.FC<{ dur: number }> = ({ dur }) => {
  const { fps } = useVideoConfig();
  const b = beats(fps);
  const cardW = (PANEL.w - GRID_GAP) / 2;
  return (
    <Panel dur={dur}>
      <StepLabel text="STEP 04 · COMPUTER VISION" delay={b.s(0.2)} />
      <Headline text="Find out what's wrong." highlight={["wrong."]} delay={b.s(0.35)} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: GRID_GAP, marginTop: 30 }}>
        {CARD_ORDER.map((cause, k) => (
          <VisionCard key={cause} cause={cause} at={b.diagnose(k) - b.T.diagnose.from} width={cardW} />
        ))}
      </div>
    </Panel>
  );
};
