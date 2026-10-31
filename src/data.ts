import { random } from "remotion";

export const BRAND = "AgriVision";
export const COLS = 10;
export const ROWS = 6;
export const TOTAL_ZONES = COLS * ROWS;

export type Cause = "weeds" | "disease" | "dehydration" | "insects";
export type Zone = { id: string; c: number; r: number; cause: Cause; ndvi: number };

export const zoneId = (c: number, r: number) => `${String.fromCharCode(65 + c)}${r + 1}`;

// Illustrative field. Listed in drone visit order.
export const FLAGGED: Zone[] = [
  { id: "H1", c: 7, r: 0, cause: "disease", ndvi: 0.27 },
  { id: "C2", c: 2, r: 1, cause: "dehydration", ndvi: 0.31 },
  { id: "D5", c: 3, r: 4, cause: "insects", ndvi: 0.34 },
  { id: "G4", c: 6, r: 3, cause: "weeds", ndvi: 0.38 },
  { id: "I6", c: 8, r: 5, cause: "dehydration", ndvi: 0.33 },
];

export const flaggedIndex = (c: number, r: number) => FLAGGED.findIndex((z) => z.c === c && z.r === r);

export const ndviAt = (c: number, r: number) => {
  const i = flaggedIndex(c, r);
  return i >= 0 ? FLAGGED[i].ndvi : 0.64 + random(`ndvi-${c}-${r}`) * 0.2;
};

export const CAUSES: Record<
  Cause,
  { label: string; confidence: number; action: string; detail: string; chemical: boolean }
> = {
  weeds: { label: "Weeds", confidence: 94, action: "Spot-treat weeds", detail: "Farmer treats one zone, not the field", chemical: true },
  disease: { label: "Disease", confidence: 91, action: "Targeted fungicide", detail: "Farmer sprays only the infected zone", chemical: true },
  dehydration: { label: "Dehydration", confidence: 88, action: "Water the zone", detail: "Farmer irrigates. Zero chemicals.", chemical: false },
  insects: { label: "Insects", confidence: 92, action: "Targeted insecticide", detail: "Farmer sprays only the infested zone", chemical: true },
};

export const CARD_ORDER: Cause[] = ["weeds", "disease", "dehydration", "insects"];
export const ACTION_ORDER: Cause[] = ["dehydration", "weeds", "disease", "insects"];

export const zonesFor = (cause: Cause) => FLAGGED.filter((z) => z.cause === cause);

export const CHEM_ZONES = FLAGGED.filter((z) => CAUSES[z.cause].chemical).length;
export const WATER_ZONES = FLAGGED.length - CHEM_ZONES;
export const SPRAY_REDUCTION = Math.round((1 - CHEM_ZONES / TOTAL_ZONES) * 100);
