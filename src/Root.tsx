import React from "react";
import { Composition } from "remotion";
import { Explainer } from "./Explainer";
import { TOTAL_S } from "./timeline";

const FPS = 30;

export const Root: React.FC = () => (
  <Composition
    id="AgriVisionExplainer"
    component={Explainer}
    durationInFrames={Math.round(FPS * TOTAL_S)}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
