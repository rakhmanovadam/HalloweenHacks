import React from "react";
import { useVideoConfig } from "remotion";
import { Chip } from "../../ui/src";
import { Body, Entrance, Headline, Panel, StepLabel } from "../components/Type";
import { COLS, ROWS, zoneId } from "../data";
import { beats } from "../timeline";

export const Segment: React.FC<{ dur: number }> = ({ dur }) => {
  const { fps } = useVideoConfig();
  const { s } = beats(fps);
  return (
    <Panel dur={dur}>
      <StepLabel text="STEP 01 · SEGMENT" delay={s(0.2)} />
      <Headline text="Divide the field into zones." highlight={["zones."]} delay={s(0.35)} />
      <Body delay={s(1.0)} style={{ marginTop: 30 }}>
        Every zone gets its own ID, so it can be monitored and treated on its own instead of as one big field.
      </Body>
      <div style={{ display: "flex", gap: 14, marginTop: 36 }}>
        <Entrance delay={s(1.7)}>
          <Chip>{COLS * ROWS} ZONES</Chip>
        </Entrance>
        <Entrance delay={s(1.7) + 4}>
          <Chip>
            {zoneId(0, 0)} → {zoneId(COLS - 1, ROWS - 1)}
          </Chip>
        </Entrance>
      </div>
    </Panel>
  );
};
