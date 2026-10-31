// Emits dist/styles.css (+ tokens.css, fonts.css, fonts/) from the compiled tokens.
import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cssCustomProperties, font } from "../dist/tokens.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
mkdirSync(join(dist, "fonts"), { recursive: true });

const FACES = [
  ["Space Grotesk", 500, "space-grotesk-latin-500-normal"],
  ["Space Grotesk", 700, "space-grotesk-latin-700-normal"],
  ["Inter", 400, "inter-latin-400-normal"],
  ["Inter", 500, "inter-latin-500-normal"],
  ["Inter", 600, "inter-latin-600-normal"],
  ["JetBrains Mono", 400, "jetbrains-mono-latin-400-normal"],
  ["JetBrains Mono", 600, "jetbrains-mono-latin-600-normal"],
];
for (const f of readdirSync(join(root, "fonts"))) copyFileSync(join(root, "fonts", f), join(dist, "fonts", f));
writeFileSync(
  join(dist, "fonts.css"),
  FACES.map(
    ([family, weight, file]) =>
      `@font-face {\n  font-family: "${family}";\n  font-style: normal;\n  font-weight: ${weight};\n  font-display: swap;\n  src: url("./fonts/${file}.woff2") format("woff2");\n}\n`,
  ).join("\n"),
);

const props = Object.entries(cssCustomProperties())
  .map(([k, v]) => `  ${k}: ${v};`)
  .join("\n");
writeFileSync(join(dist, "tokens.css"), `/* Generated from src/tokens.ts. Do not edit. */\n:root {\n${props}\n}\n`);

writeFileSync(
  join(dist, "styles.css"),
  `/* AgriVision tokens + base/type helpers (self-contained; fonts ship separately in fonts.css). */
:root {
${props}
}

/* Dark-first: wrap screens in .av-root. */
.av-root {
  background: var(--av-color-bg);
  color: var(--av-color-text);
  font-family: var(--av-font-body);
  -webkit-font-smoothing: antialiased;
}
.av-display {
  font-family: var(--av-font-display);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: var(--av-color-text);
}
.av-eyebrow {
  font-family: var(--av-font-mono);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--av-color-accent);
}
.av-body {
  font-family: var(--av-font-body);
  line-height: 1.45;
  color: var(--av-color-text-dim);
}
.av-mono {
  font-family: var(--av-font-mono);
  font-variant-numeric: tabular-nums;
}
.av-card {
  background: var(--av-color-bg-alt);
  border: 1px solid var(--av-color-border);
  border-radius: var(--av-radius-lg);
  box-shadow: var(--av-shadow-card);
}
.av-surface {
  background: var(--av-color-surface);
  border: 1px solid var(--av-color-border);
  border-radius: var(--av-radius-md);
}
.av-ndvi-ramp {
  background: var(--av-ndvi-gradient);
  border-radius: var(--av-radius-pill);
}
`,
);
console.log("css: styles.css, tokens.css, fonts.css +", FACES.length, "font faces;", "display =", font.display);
