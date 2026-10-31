// Usage: node scripts/stills.mjs 60 165 300 ...  → out/check_<frame>.png
// Set CHROME=<path> to render with a specific browser instead of Remotion's headless shell.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";

const browser = process.env.CHROME ? { browserExecutable: process.env.CHROME, chromeMode: "chrome-for-testing" } : {};
const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "AgriVisionExplainer", ...browser, logLevel: "verbose" });
for (const frame of frames) {
  const output = path.resolve(`out/check_${frame}.png`);
  await renderStill({ serveUrl, composition, frame, output, overwrite: true, scale: 0.5, ...browser });
  console.log("wrote", output);
}
