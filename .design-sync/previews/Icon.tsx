import React from "react";
import { Icon, iconNames } from "@agrivision/ui";

export const AllIcons = () => (
  <div className="av-root" style={{ padding: 24, borderRadius: 16, display: "grid", gridTemplateColumns: "repeat(4, 96px)", gap: 16 }}>
    {iconNames.map((name) => (
      <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--av-color-text)" }}>
        <div className="av-surface" style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={name} size={26} />
        </div>
        <span className="av-mono" style={{ fontSize: 12, color: "var(--av-color-text-dim)" }}>{name}</span>
      </div>
    ))}
  </div>
);

const CAUSES = [
  { icon: "droplet", label: "Dehydration", fix: "Water the zone", tone: "var(--av-color-accent)" },
  { icon: "weed", label: "Weeds", fix: "Spot-treat weeds", tone: "var(--av-color-spray)" },
  { icon: "leaf", label: "Disease", fix: "Targeted fungicide", tone: "var(--av-color-spray)" },
  { icon: "bug", label: "Insects", fix: "Targeted insecticide", tone: "var(--av-color-spray)" },
] as const;

export const CauseRows = () => (
  <div className="av-root" style={{ padding: 24, borderRadius: 16, display: "flex", flexDirection: "column", gap: 10, width: 420 }}>
    {CAUSES.map((c) => (
      <div key={c.label} className="av-surface" style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: `color-mix(in srgb, ${c.tone} 14%, transparent)` }}>
          <Icon name={c.icon} size={22} color={c.tone} />
        </div>
        <div>
          <div className="av-display" style={{ fontSize: 18 }}>{c.label}</div>
          <div className="av-body" style={{ fontSize: 14, color: c.tone }}>{c.fix}</div>
        </div>
      </div>
    ))}
  </div>
);

export const Sizes = () => (
  <div className="av-root" style={{ padding: 24, borderRadius: 16, display: "flex", alignItems: "flex-end", gap: 24, color: "var(--av-color-primary)" }}>
    {[16, 24, 32, 48].map((s) => (
      <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <Icon name="leaf" size={s} />
        <span className="av-mono" style={{ fontSize: 12, color: "var(--av-color-text-dim)" }}>{s}px</span>
      </div>
    ))}
  </div>
);
