# design-sync notes: @agrivision/ui

- The DS is the `ui/` package inside the Remotion video repo. Build it first: `npm --prefix ui run build` (tsc → `ui/dist`, then `ui/scripts/build-css.mjs` generates `styles.css`/`tokens.css`/`fonts.css` from `src/tokens.ts`).
- Converter invocation: `--node-modules ./node_modules --entry ./ui/dist/index.js` (react lives in the repo-root node_modules).
- `ui/dist/styles.css` must stay self-contained (no `@import`): the converter copies only the cssEntry file, so imported siblings went missing (`[CSS_IMPORT_MISSING]`). Fonts ship via `extraFonts: ["dist/fonts.css"]` (7 OFL woff2 files copied from @fontsource into `ui/fonts/`).
- Brand renamed Pharmtir → AgriVision (pkg `@agrivision/ui`, global `AgriVisionUI`, CSS prefix `--av-`/`av-`). LogoMark is traced from `ui/assets/agrivision-logo.png`; regenerate geometry with `scripts/trace_logo.py` if the artwork changes.
- Render check / capture use system Chrome, not a playwright download: `DS_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`. playwright is installed in `.ds-sync/node_modules` and symlinked into `node_modules/playwright` so the validator's `import('playwright')` resolves.
- All four previews are wider than a grid cell → `cardMode: "column"` overrides for Brand, Chip, Icon, LogoMark.
- Video renders: use Remotion's headless shell (default). Rendering through system Chrome (`--browser-executable` + chrome-for-testing) produced a few mis-scaled frames (top-left quarter tiled 2×2). `scripts/flicker.py` detects such frames.
- The machine's disk filled up once mid-run (ENOSPC). Check `df -h` before rendering video or installing browsers.

## Known render warns
- none

## Re-sync risks
- Components use `color-mix()` for chip tints; fine in current Chrome, worth re-checking if the design pane renders in an older engine.
- Previews and conventions.md hard-code token names (`--av-*`) and class names (`av-*`). Renaming a token in `ui/src/tokens.ts` or a class in `build-css.mjs` silently breaks them. Re-run the conventions validation grep.
- The Remotion video imports `ui/src` directly, so DS changes also change the video. Re-render stills after DS edits.
