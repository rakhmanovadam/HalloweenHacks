import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { StepTracker, TopBar } from "./components/Chrome";
import { Field } from "./components/Field";
import { BgMesh, Grade, Grain, Vignette } from "./components/Layers";
import { Act } from "./scenes/Act";
import { Diagnose } from "./scenes/Diagnose";
import { DroneScan } from "./scenes/DroneScan";
import { Hook } from "./scenes/Hook";
import { Ndvi } from "./scenes/Ndvi";
import { Outro } from "./scenes/Outro";
import { Payoff } from "./scenes/Payoff";
import { Segment } from "./scenes/Segment";
import { SceneKey, timeline } from "./timeline";

const SCENE_COMPONENTS: Record<SceneKey, React.FC<{ dur: number }>> = {
  hook: Hook,
  segment: Segment,
  ndvi: Ndvi,
  drone: DroneScan,
  diagnose: Diagnose,
  action: Act,
  payoff: Payoff,
  outro: Outro,
};

export const Explainer: React.FC = () => {
  const { fps } = useVideoConfig();
  const T = timeline(fps);
  return (
    <AbsoluteFill>
      {/* 1. background mesh */}
      <BgMesh />
      {/* 2. persistent field "asset" layer */}
      <Field />
      {/* 3. graphics + type */}
      <TopBar />
      <StepTracker />
      {(Object.keys(SCENE_COMPONENTS) as SceneKey[]).map((key) => {
        const Scene = SCENE_COMPONENTS[key];
        return (
          <Sequence key={key} name={key} from={T[key].from} durationInFrames={T[key].dur}>
            <Scene dur={T[key].dur} />
          </Sequence>
        );
      })}
      {/* 4–5. grade, grain, vignette */}
      <Grade />
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
};
