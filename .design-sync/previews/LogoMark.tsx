import React from "react";
import { LogoMark } from "@agrivision/ui";

export const Default = () => (
  <div className="av-root" style={{ padding: 32, borderRadius: 16, display: "flex", justifyContent: "center", background: "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--av-color-primary) 32%, transparent) 0%, color-mix(in srgb, var(--av-color-primary) 8%, transparent) 40%, transparent 62%), var(--av-color-bg)" }}>
    <LogoMark size={180} />
  </div>
);

export const OnTile = () => (
  <div className="av-root" style={{ padding: 24, borderRadius: 16, display: "flex", alignItems: "flex-end", gap: 20 }}>
    <LogoMark size={32} tile />
    <LogoMark size={48} tile />
    <LogoMark size={72} tile />
  </div>
);

export const BuildIn = () => (
  <div className="av-root" style={{ padding: 24, borderRadius: 16, display: "flex", gap: 28 }}>
    {[0.3, 0.55, 0.8, 1].map((p) => (
      <div key={p} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <LogoMark size={88} tile progress={p} />
        <span className="av-mono" style={{ fontSize: 12, color: "var(--av-color-text-dim)" }}>progress {p}</span>
      </div>
    ))}
  </div>
);
