// AgriVision design tokens. Single source for the app UI, the explainer video,
// and the generated CSS custom properties (dist/tokens.css, prefix --av-).

export const color = {
  bg: "#050B08",
  bgAlt: "#0B1610",
  surface: "rgba(255, 255, 255, 0.035)",
  border: "rgba(255, 255, 255, 0.08)",
  primary: "#A6FC03", // brand lime (logo square): healthy, done, positive outcomes
  brandDeep: "#092E1B", // logo bars
  brandTile: "#EAF4DF", // pale app-icon tile behind the logo on dark UI
  accent: "#38BDF8", // sensing (NDVI, drone) and water
  warn: "#F5B53D", // computer-vision detections
  danger: "#F26D5B", // stressed / flagged zones
  spray: "#C084FC", // chemicals (pesticide, fungicide, herbicide)
  text: "#F1F5F2",
  textDim: "#9AA89E",
  textFaint: "#5B685F",
  ink: "#07110B", // text on solid tone fills
  cropLow: "#2A5531",
  cropHigh: "#356D3D",
  cropStressed: "#6F6A35",
};

// NDVI colour ramp: stressed (low) → healthy (high).
export const ndvi = {
  stops: [0.2, 0.45, 0.6, 0.85],
  colors: ["#D9483B", "#E8A13A", "#9BC53D", "#1F9D55"],
};

export const font = {
  display: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  body: "Inter, ui-sans-serif, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};

export const radius = { sm: "6px", md: "14px", lg: "22px", pill: "999px" };

export const shadow = {
  card: "0 40px 80px -20px rgba(0, 0, 0, 0.6)",
  pop: "0 6px 16px rgba(0, 0, 0, 0.45)",
};

export const tokens = { color, ndvi, font, radius, shadow };

export type ColorToken = keyof typeof color;
export type Tone = "neutral" | "primary" | "accent" | "warn" | "danger" | "spray";

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

const varsFor = <T extends Record<string, string>>(group: string, values: T) =>
  Object.fromEntries(
    Object.entries(values).map(([k, val]) => [k, `var(--av-${group}-${kebab(k)}, ${val})`]),
  ) as { [K in keyof T]: string };

// CSS-variable references with literal fallbacks: themeable via styles.css,
// and still correct where the stylesheet isn't loaded (e.g. video renders).
export const vars = {
  color: varsFor("color", color),
  font: varsFor("font", font),
  radius: varsFor("radius", radius),
  shadow: varsFor("shadow", shadow),
};

export const toneColor = (tone: Tone) => (tone === "neutral" ? vars.color.text : vars.color[tone]);

// Flat map of every custom property, used to generate tokens.css.
export const cssCustomProperties = (): Record<string, string> => {
  const out: Record<string, string> = {};
  const groups: [string, Record<string, string>][] = [
    ["color", color],
    ["font", font],
    ["radius", radius],
    ["shadow", shadow],
  ];
  for (const [group, values] of groups) {
    for (const [k, val] of Object.entries(values)) out[`--av-${group}-${kebab(k)}`] = val;
  }
  out["--av-ndvi-gradient"] = `linear-gradient(90deg, ${ndvi.colors.join(", ")})`;
  return out;
};
