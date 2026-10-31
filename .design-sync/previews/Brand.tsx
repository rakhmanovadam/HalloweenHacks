import React from "react";
import { Brand, Chip } from "@agrivision/ui";

export const AppHeader = () => (
  <div className="av-root" style={{ padding: 20, borderRadius: 16 }}>
    <div className="av-surface" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "14px 20px" }}>
      <Brand tagline="Precision crop care" />
      <Chip size="sm" tone="primary" dot glow>North field · live</Chip>
    </div>
  </div>
);

export const Splash = () => (
  <div className="av-root" style={{ padding: 40, borderRadius: 16, display: "flex", justifyContent: "center" }}>
    <Brand size="lg" tagline="Diagnose first. Treat only what's needed." />
  </div>
);

export const Compact = () => (
  <div className="av-root" style={{ padding: 24, borderRadius: 16 }}>
    <Brand />
  </div>
);
