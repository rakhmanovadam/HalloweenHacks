# AgriVision design conventions

AgriVision is precision crop care: a field is split into zones, NDVI flags stressed zones, a drone **only scouts** (photographs flagged zones; it never sprays), computer vision names the cause, and **the farmer** acts on a work order (water, or spot-treat one zone). Designs should make that "diagnose first, treat only what's needed" story obvious.

## Setup
- Dark-first. Wrap every screen in `<div className="av-root">` (sets `--av-color-bg`, text colour, Inter body font). Without it text renders on white in the wrong font.
- No provider needed. Components read CSS variables from `styles.css`; they also carry literal fallbacks.
- Components: `Brand`, `Chip`, `Icon`, `LogoMark` from `window.AgriVisionUI`. Everything else is your own layout using the tokens and classes below.

## Styling idiom: CSS variables + a few `av-*` classes (no utility framework)
| Use | Name |
|---|---|
| Page / raised card / glass surface | `--av-color-bg`, `--av-color-bg-alt`, `--av-color-surface` + `--av-color-border` |
| Text: primary / secondary / tertiary / on solid fills | `--av-color-text`, `--av-color-text-dim`, `--av-color-text-faint`, `--av-color-ink` |
| Fonts | `--av-font-display` (Space Grotesk, headings), `--av-font-body` (Inter), `--av-font-mono` (JetBrains Mono: IDs, numbers, labels) |
| Radius / shadow | `--av-radius-sm` `-md` `-lg` `-pill`, `--av-shadow-card`, `--av-shadow-pop` |
| Classes | `av-root`, `av-display` (headline type), `av-eyebrow` (mono uppercase section label), `av-body` (dim paragraph), `av-mono` (tabular numbers), `av-card` (raised card), `av-surface` (row/panel), `av-ndvi-ramp` (NDVI legend bar) |

**Colour has meaning; never use a tone decoratively:**
- `--av-color-primary` lime (#A6FC03, the logo square): healthy, done, brand. At most one glowing hero element per screen.
- `--av-color-brand-deep` (logo bars) and `--av-color-brand-tile` (pale tile) are for the logo only.
- `--av-color-danger`: NDVI-flagged / stressed zones.
- `--av-color-warn`: computer-vision detections (weeds, disease, dehydration, insects).
- `--av-color-accent` blue: sensing (NDVI, drone) and water/irrigation.
- `--av-color-spray` purple: any chemical (fungicide, insecticide, herbicide).
- NDVI values use the ramp `--av-ndvi-gradient` (red → amber → green, 0.2 → 0.85).

## Components
- `Chip` `tone` = `neutral|primary|accent|warn|danger|spray` (the meanings above); `variant="solid" size="sm"` for tags on maps/imagery ("WEEDS 94%", "WATERED"); outline `md` with `dot` for status; `glow` only for live states.
- `Icon` `name` = `check|alert|droplet|leaf|bug|weed|target|drone`. Causes: `weed`=weeds, `leaf`=disease, `droplet`=dehydration/water, `bug`=insects. Inherits `currentColor`.
- `Brand` `size="sm"` in app headers (mark sits on a pale tile; optional `tagline`), `size="lg"` for splash. `LogoMark`: the mark's bars are deep green, so on dark backgrounds use `tile` at small sizes or put a primary-colour glow behind it at large sizes; `progress` 0–1 builds it in (loading/intro).
- Zone IDs are column letter + row number (`C2`, `G4`) in mono.

## Example
```jsx
const { Brand, Chip, Icon } = window.AgriVisionUI;
<div className="av-root" style={{ padding: 24 }}>
  <Brand tagline="Precision crop care" />
  <p className="av-eyebrow" style={{ marginTop: 32 }}>Work order · 2 zones</p>
  <div className="av-surface" style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px" }}>
    <Icon name="droplet" color="var(--av-color-accent)" />
    <span className="av-display" style={{ fontSize: 18, flex: 1 }}>Water zone C2</span>
    <Chip size="sm" variant="solid" tone="warn">Dehydration</Chip>
  </div>
</div>
```
