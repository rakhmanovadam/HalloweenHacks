import React from "react";
import { Chip } from "@agrivision/ui";

const Stage = ({ children }: { children: React.ReactNode }) => (
  <div className="av-root" style={{ padding: 24, borderRadius: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
    {children}
  </div>
);

export const Tones = () => (
  <Stage>
    <Chip dot>RGB camera</Chip>
    <Chip tone="accent" dot glow>NDVI layer</Chip>
    <Chip tone="danger" dot glow>5 zones flagged</Chip>
    <Chip tone="warn" dot>Weeds detected</Chip>
    <Chip tone="spray" dot>Spot-treat</Chip>
    <Chip tone="primary" dot>Healthy</Chip>
  </Stage>
);

export const MapTags = () => (
  <Stage>
    <Chip size="sm" variant="solid" tone="warn">Weeds 94%</Chip>
    <Chip size="sm" variant="solid" tone="warn">Dehydration</Chip>
    <Chip size="sm" variant="solid" tone="danger">Flagged</Chip>
    <Chip size="sm" variant="solid" tone="accent">Watered</Chip>
    <Chip size="sm" variant="solid" tone="primary">Treated</Chip>
  </Stage>
);

export const Sizes = () => (
  <Stage>
    <Chip tone="accent" dot>Zone C2 · NDVI 0.31</Chip>
    <Chip size="sm" tone="accent" dot>Zone C2 · NDVI 0.31</Chip>
  </Stage>
);

export const ZoneStatusRow = () => (
  <div className="av-root" style={{ padding: 24, borderRadius: 16 }}>
    <div className="av-surface" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
      <Chip size="sm">Zone C2</Chip>
      <span className="av-mono" style={{ flex: 1, color: "var(--av-color-text-dim)", fontSize: 14 }}>NDVI 0.31 · scanned 06:42</span>
      <Chip size="sm" variant="solid" tone="warn">Dehydration</Chip>
      <Chip size="sm" tone="accent" dot>Water only</Chip>
    </div>
  </div>
);
