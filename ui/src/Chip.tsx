import type { CSSProperties, ReactNode } from "react";
import { type Tone, toneColor, vars } from "./tokens";

export interface ChipProps {
  children: ReactNode;
  /** Semantic colour. `danger` = flagged zone, `warn` = detection, `accent` = sensing/water, `spray` = chemical, `primary` = healthy/done. */
  tone?: Tone;
  /** `outline` (tinted pill, default) for status; `solid` (filled tag) for labels on imagery/maps. */
  variant?: "outline" | "solid";
  /** `md` pill (default) or compact `sm` tag. */
  size?: "sm" | "md";
  /** Leading status dot in the tone colour. */
  dot?: boolean;
  /** Soft glow on the dot (use for live/active states only). */
  glow?: boolean;
  style?: CSSProperties;
}

/** Monospace status pill / tag. Use for zone IDs, layer names, detection labels and pipeline status. */
export function Chip({ children, tone = "neutral", variant = "outline", size = "md", dot = false, glow = false, style }: ChipProps) {
  const c = toneColor(tone);
  const solid = variant === "solid";
  const sm = size === "sm";
  const tinted = tone === "neutral" ? vars.color.surface : `color-mix(in srgb, ${c} 12%, transparent)`;
  const border = tone === "neutral" ? vars.color.border : `color-mix(in srgb, ${c} 40%, transparent)`;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: sm ? 6 : 10,
        padding: sm ? "4px 8px" : "10px 18px",
        borderRadius: sm ? vars.radius.sm : vars.radius.pill,
        border: solid ? "1px solid transparent" : `1px solid ${border}`,
        background: solid ? c : tinted,
        color: solid ? vars.color.ink : c,
        fontFamily: vars.font.mono,
        fontWeight: 600,
        fontSize: sm ? 11 : 16,
        lineHeight: 1.2,
        letterSpacing: sm ? "0.06em" : "0.12em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        boxShadow: solid ? vars.shadow.pop : undefined,
        ...style,
      }}
    >
      {dot ? (
        <span
          style={{
            width: sm ? 7 : 10,
            height: sm ? 7 : 10,
            borderRadius: "50%",
            background: solid ? vars.color.ink : c,
            boxShadow: glow ? `0 0 10px ${c}` : undefined,
            flexShrink: 0,
          }}
        />
      ) : null}
      {children}
    </span>
  );
}
