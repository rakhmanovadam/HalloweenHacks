import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";

export const BgMesh: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${28 + Math.sin(f / 110) * 5}% ${46 + Math.cos(f / 130) * 6}%, rgba(74, 222, 128, 0.13), transparent 46%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${82 + Math.cos(f / 140) * 4}% ${18 + Math.sin(f / 120) * 5}%, rgba(56, 189, 248, 0.10), transparent 42%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${70 + Math.sin(f / 160) * 6}% ${92}%, rgba(192, 132, 252, 0.06), transparent 40%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.05,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
        }}
      />
    </AbsoluteFill>
  );
};

export const Grade: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "linear-gradient(180deg, rgba(10, 40, 24, 0.5) 0%, rgba(0, 0, 0, 0.6) 100%)",
      opacity: 0.2,
      mixBlendMode: "soft-light",
      pointerEvents: "none",
    }}
  />
);

// Static grain: a per-frame seed reads as flicker, so the texture stays fixed.
export const Grain: React.FC = () => {
  return (
    <AbsoluteFill style={{ opacity: 0.04, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={7} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "radial-gradient(ellipse at center, transparent 56%, rgba(0, 0, 0, 0.35) 100%)",
      pointerEvents: "none",
    }}
  />
);
