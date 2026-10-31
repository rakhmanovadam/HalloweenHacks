import type { CSSProperties } from "react";
import { LogoMark } from "./LogoMark";
import { vars } from "./tokens";

export interface BrandProps {
  /** `sm` = app header lockup (default); `lg` = splash / hero lockup. */
  size?: "sm" | "lg";
  /** Optional descriptor shown after (sm) or under (lg) the wordmark. */
  tagline?: string;
  /** Product name. Default "AgriVision". */
  name?: string;
  style?: CSSProperties;
}

/** AgriVision logo lockup: mark + wordmark (+ optional tagline). `sm` (app headers) puts the mark on a pale tile for legibility on dark UI; `lg` is the splash/hero lockup. */
export function Brand({ size = "sm", tagline, name = "AgriVision", style }: BrandProps) {
  const lg = size === "lg";
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: lg ? "column" : "row",
        alignItems: "center",
        gap: lg ? 4 : 14,
        ...style,
      }}
    >
      {lg ? (
        // Soft primary glow keeps the deep-green bars legible on dark backgrounds.
        <span
          style={{
            padding: 36,
            borderRadius: "50%",
            background: `radial-gradient(circle, color-mix(in srgb, ${vars.color.primary} 34%, transparent) 0%, color-mix(in srgb, ${vars.color.primary} 10%, transparent) 45%, transparent 70%)`,
          }}
        >
          <LogoMark size={120} />
        </span>
      ) : (
        <LogoMark size={38} tile />
      )}
      <div style={{ display: "flex", flexDirection: lg ? "column" : "row", alignItems: lg ? "center" : "baseline", gap: lg ? 10 : 12 }}>
        <span
          style={{
            fontFamily: vars.font.display,
            fontWeight: 700,
            fontSize: lg ? 72 : 24,
            lineHeight: 1,
            letterSpacing: lg ? "-0.04em" : "-0.02em",
            color: vars.color.text,
          }}
        >
          {name}
        </span>
        {tagline ? (
          <span style={{ fontFamily: vars.font.body, fontSize: lg ? 22 : 15, color: lg ? vars.color.textDim : vars.color.textFaint }}>
            {tagline}
          </span>
        ) : null}
      </div>
    </div>
  );
}
