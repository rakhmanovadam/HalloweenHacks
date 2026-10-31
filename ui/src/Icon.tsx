import type { CSSProperties, ReactNode } from "react";

export const iconNames = ["check", "alert", "droplet", "leaf", "bug", "weed", "target", "drone"] as const;
export type IconName = (typeof iconNames)[number];

const PATHS: Record<IconName, ReactNode> = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: (
    <>
      <path d="M12 3.5L21.5 20H2.5Z" />
      <path d="M12 10V14M12 17V17.2" />
    </>
  ),
  droplet: <path d="M12 3C12 3 5 11 5 15.5A7 7 0 0 0 19 15.5C19 11 12 3 12 3Z" />,
  leaf: (
    <>
      <path d="M5 19C5 10 11 5 20 4C19 13 14 19 5 19Z" />
      <path d="M5 19L14 10" />
    </>
  ),
  bug: (
    <>
      <ellipse cx="12" cy="14" rx="5" ry="6.5" />
      <circle cx="12" cy="5.5" r="2.2" />
      <path d="M7 11L3.5 9M7 15H3M7.5 18.5L4.5 21M17 11L20.5 9M17 15H21M16.5 18.5L19.5 21M12 8V20.5" />
    </>
  ),
  weed: (
    <>
      <path d="M12 21V11" />
      <path d="M12 14C8 14 5.5 11 5.5 7.5C9.5 7.5 12 10.5 12 14Z" />
      <path d="M12 11.5C12 7.5 14.5 4.5 18.5 4.5C18.5 8.5 16 11.5 12 11.5Z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2.5V5.5M12 18.5V21.5M2.5 12H5.5M18.5 12H21.5" />
    </>
  ),
  drone: (
    <>
      <rect x="9.5" y="9.5" width="5" height="5" rx="1.5" />
      <path d="M9.5 9.5L6.5 6.5M14.5 9.5L17.5 6.5M9.5 14.5L6.5 17.5M14.5 14.5L17.5 17.5" />
      <circle cx="5.5" cy="5.5" r="2.5" />
      <circle cx="18.5" cy="5.5" r="2.5" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </>
  ),
};

export interface IconProps {
  /** Which glyph to draw. Causes: `weed`, `leaf` (disease), `droplet` (dehydration/water), `bug` (insects). */
  name: IconName;
  /** Pixel size of the square icon. Default 24. */
  size?: number;
  /** Stroke colour. Defaults to `currentColor` so it inherits text colour. */
  color?: string;
  /** Stroke width in 24px viewBox units. Default 2. */
  strokeWidth?: number;
  /** Accessible label; when omitted the icon is decorative (aria-hidden). */
  title?: string;
  style?: CSSProperties;
}

/** AgriVision line icon set: crop-issue causes (weed, leaf, bug, droplet) and field-ops glyphs (drone, target, check, alert). */
export function Icon({ name, size = 24, color = "currentColor", strokeWidth = 2, title, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      style={{ display: "inline-block", flexShrink: 0, ...style }}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}
