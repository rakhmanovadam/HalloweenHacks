import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, pop, tween } from "../anim";
import { ACTION_ORDER, CARD_ORDER, CAUSES, COLS, FLAGGED, ROWS, flaggedIndex, ndviAt, zoneId } from "../data";
import { CELL, FIELD, GAP, cellCenter, cellPos, fieldSize } from "../layout";
import { theme } from "../theme";
import { beats } from "../timeline";
import { Drone } from "./Drone";
import { Chip, Icon } from "../../ui/src";

const ndviColor = (v: number) => interpolateColors(v, theme.ndvi.stops, theme.ndvi.colors);

const Brackets: React.FC<{ color: string; opacity: number; scale?: number; len?: number; inset?: number }> = ({
  color,
  opacity,
  scale = 1,
  len = 18,
  inset = -9,
}) => {
  const corners: [("top" | "bottom"), ("left" | "right")][] = [
    ["top", "left"],
    ["top", "right"],
    ["bottom", "left"],
    ["bottom", "right"],
  ];
  const edge = (side: string) => `border${side[0].toUpperCase()}${side.slice(1)}`;
  return (
    <div
      style={{
        position: "absolute",
        left: inset,
        top: inset,
        width: CELL - 2 * inset,
        height: CELL - 2 * inset,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {corners.map(([v, h]) => (
        <div
          key={v + h}
          style={
            {
              position: "absolute",
              [v]: 0,
              [h]: 0,
              width: len,
              height: len,
              [edge(v)]: `3px solid ${color}`,
              [edge(h)]: `3px solid ${color}`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

export const Field: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = beats(fps);
  const { T, s } = b;

  if (frame >= b.fieldExit[1]) return null;

  // Container motion
  const enter = pop(frame, fps, s(0.1));
  const exit = tween(frame, b.fieldExit, [0, 1], theme.ease.in);

  // Segmentation: the continuous field splits into zones
  const gap = tween(frame, b.gap, [0, GAP], theme.ease.inOut);
  const size = fieldSize(gap);
  const full = fieldSize(GAP);
  const radius = interpolate(gap, [0, GAP], [2, 10]);

  // Hook: blanket spray boom sweeping the whole field
  const boomX = tween(frame, b.boom, [-40, size.w + 40], theme.ease.inOut);
  const boomVis =
    tween(frame, [b.boom[0] - s(0.3), b.boom[0]], [0, 1]) *
    tween(frame, [b.boom[1], b.boom[1] + s(0.3)], [1, 0], theme.ease.in);
  const hazeFade = tween(frame, [T.segment.from, T.segment.from + s(0.6)], [1, 0], theme.ease.in);

  // NDVI scan line
  const scanY = tween(frame, b.scan, [-30, full.h + 30], theme.ease.inOut);
  const scanVis =
    tween(frame, [b.scan[0] - s(0.2), b.scan[0]], [0, 1]) *
    tween(frame, [b.scan[1], b.scan[1] + s(0.3)], [1, 0], theme.ease.in);
  const ndviMode = tween(frame, [b.scan[0] - s(0.3), b.scan[0] + s(0.2)], [0, 1]);

  // Drone flight path (field coordinates)
  const START = { x: full.w * 0.62, y: -340 };
  const EXIT = { x: full.w * 0.9, y: -360 };
  const dronePos = (f: number) => {
    let prev = START;
    for (let i = 0; i < FLAGGED.length; i++) {
      const v = b.visit(i);
      const wp = cellCenter(FLAGGED[i].c, FLAGGED[i].r);
      if (f < v.arrive) {
        const p = tween(f, [v.depart, v.arrive], [0, 1], theme.ease.inOut);
        return { x: lerp(prev.x, wp.x, p), y: lerp(prev.y, wp.y, p) };
      }
      if (f < v.leave) return wp;
      prev = wp;
    }
    const p = tween(f, b.droneExit, [0, 1], theme.ease.in);
    return { x: lerp(prev.x, EXIT.x, p), y: lerp(prev.y, EXIT.y, p) };
  };
  const firstDepart = b.visit(0).depart;
  const droneVis =
    tween(frame, [firstDepart, firstDepart + s(0.3)], [0, 1]) *
    tween(frame, [b.droneExit[1] - s(0.25), b.droneExit[1]], [1, 0], theme.ease.in);
  const dp = dronePos(frame);
  const dNext = dronePos(frame + 1);
  const tilt = Math.max(-16, Math.min(16, (dNext.x - dp.x) * 0.9));
  const hoverIdx = FLAGGED.findIndex((_, i) => frame >= b.visit(i).arrive && frame < b.visit(i).leave);

  const cells: React.ReactNode[] = [];
  const overlays: React.ReactNode[] = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const fi = flaggedIndex(c, r);
      const zone = fi >= 0 ? FLAGGED[fi] : null;
      const { x, y } = cellPos(c, r, gap);
      const baseNdvi = ndviAt(c, r);

      // Treatment + recovery (action scene)
      const g = zone ? ACTION_ORDER.indexOf(zone.cause) : -1;
      const fxStart = zone ? b.action(g) : 0;
      const recover = zone
        ? tween(frame, [fxStart + b.recoverDelay, fxStart + b.recoverDelay + b.recoverLen], [0, 1], theme.ease.inOut)
        : 0;
      const fxEnv = zone
        ? tween(frame, [fxStart, fxStart + s(0.2)], [0, 1]) *
          tween(frame, [fxStart + b.effectLen - s(0.3), fxStart + b.effectLen], [1, 0], theme.ease.in)
        : 0;
      const chemical = zone ? CAUSES[zone.cause].chemical : false;

      const healthyNatural = interpolateColors(baseNdvi, [0.64, 0.84], [theme.colors.cropLow, theme.colors.cropHigh]);
      const natural = zone
        ? interpolateColors(recover, [0, 1], [
            interpolateColors(0.55, [0, 1], [theme.colors.cropLow, theme.colors.cropStressed]),
            theme.colors.cropHigh,
          ])
        : healthyNatural;
      const v = interpolate(recover, [0, 1], [baseNdvi, 0.8]);
      const mix = tween(scanY, [y, y + CELL], [0, 1]);
      const color = interpolateColors(mix, [0, 1], [natural, ndviColor(v)]);
      const haze = tween(boomX, [x, x + CELL], [0, 1]) * hazeFade;
      const idP = pop(frame, fps, b.labels + (r + c) * 2, theme.spring.snappy);
      const local = frame - fxStart;

      cells.push(
        <div
          key={`cell-${c}-${r}`}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: CELL,
            height: CELL,
            borderRadius: radius,
            backgroundColor: color,
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 5px, rgba(0,0,0,0) 5px, rgba(0,0,0,0) 13px)",
            overflow: "hidden",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
          }}
        >
          {haze > 0 && (
            <div style={{ position: "absolute", inset: 0, background: theme.colors.spray, opacity: 0.28 * haze }} />
          )}
          {fxEnv > 0 && !chemical && (
            <>
              <div style={{ position: "absolute", inset: 0, background: theme.colors.accent, opacity: 0.28 * fxEnv }} />
              {Array.from({ length: 7 }).map((_, k) => (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: 8 + k * 11 + (k % 2) * 4,
                    top: ((local * 4.5 + k * 23) % (CELL + 24)) - 12,
                    width: 5,
                    height: 9,
                    borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                    background: "#BFE9FF",
                    opacity: fxEnv,
                  }}
                />
              ))}
            </>
          )}
          {fxEnv > 0 && chemical && (
            <div
              style={{
                position: "absolute",
                left: CELL / 2 - CELL * 0.7,
                top: CELL / 2 - CELL * 0.7,
                width: CELL * 1.4,
                height: CELL * 1.4,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${theme.colors.spray}CC 0%, ${theme.colors.spray}44 45%, transparent 70%)`,
                transform: `scale(${tween(local, [0, s(0.8)], [0.3, 1.2])})`,
                opacity: fxEnv,
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              left: 8,
              top: 6,
              fontFamily: theme.fonts.mono,
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,255,255,0.8)",
              opacity: Math.min(1, idP) * 0.85,
              transform: `translateY(${interpolate(idP, [0, 1], [8, 0])}px)`,
            }}
          >
            {zoneId(c, r)}
          </div>
        </div>,
      );

      if (!zone) continue;

      // Overlays (outside the clipped cell)
      const problemP = pop(frame, fps, b.problems + fi * 4, theme.spring.snappy) * hazeFade;
      const flagP = pop(frame, fps, b.flags + fi * 5, theme.spring.snappy);
      const pulse = 0.6 + 0.4 * Math.sin(frame / 6 + fi);
      const flagColor = interpolateColors(recover, [0, 1], [theme.colors.danger, theme.colors.primary]);
      const visit = b.visit(fi);
      const hoverEnv =
        tween(frame, [visit.arrive - s(0.15), visit.arrive], [0, 1]) *
        tween(frame, [visit.leave, visit.leave + s(0.2)], [1, 0], theme.ease.in);
      const visitedP = pop(frame, fps, visit.arrive + s(0.3), theme.spring.bouncy);
      const tagP = pop(frame, fps, b.diagnose(CARD_ORDER.indexOf(zone.cause)) + s(0.6), theme.spring.snappy);
      const treatedP = tween(recover, [0.35, 0.65], [0, 1], theme.ease.inOut);

      overlays.push(
        <div key={`ov-${zone.id}`} style={{ position: "absolute", left: x, top: y, width: CELL, height: CELL }}>
          {problemP > 0.01 && (
            <div
              style={{
                position: "absolute",
                inset: -6,
                borderRadius: radius + 6,
                border: `3px dashed ${theme.colors.danger}`,
                opacity: Math.min(1, problemP),
                transform: `scale(${interpolate(problemP, [0, 1], [1.35, 1])})`,
              }}
            />
          )}
          {flagP > 0.01 && (
            <div
              style={{
                position: "absolute",
                inset: -4,
                borderRadius: radius + 4,
                border: `3px solid ${flagColor}`,
                boxShadow: `0 0 ${10 + 18 * pulse}px ${flagColor}`,
                opacity: Math.min(1, flagP),
                transform: `scale(${interpolate(flagP, [0, 1], [1.3, 1])})`,
              }}
            />
          )}
          {hoverEnv > 0 && <Brackets color={theme.colors.accent} opacity={hoverEnv} scale={interpolate(hoverEnv, [0, 1], [1.25, 1])} />}
          {fxEnv > 0 && chemical && (
            <Brackets color={theme.colors.spray} opacity={fxEnv} scale={interpolate(fxEnv, [0, 1], [1.3, 1])} />
          )}
          {visitedP > 0.01 && (
            <div
              style={{
                position: "absolute",
                right: -11,
                top: -11,
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: theme.colors.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${visitedP})`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              <Icon name="check" size={16} color={theme.colors.ink} strokeWidth={3} />
            </div>
          )}
          {tagP > 0.01 && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: -14,
                transform: `translateX(-50%) translateY(${interpolate(tagP, [0, 1], [10, 0])}px)`,
                opacity: Math.min(1, tagP),
              }}
            >
              <div style={{ display: "grid", justifyItems: "center" }}>
                <Chip size="sm" variant="solid" tone="warn" style={{ gridArea: "1 / 1", opacity: 1 - treatedP }}>
                  {CAUSES[zone.cause].label}
                </Chip>
                {treatedP > 0 && (
                  <Chip size="sm" variant="solid" tone={chemical ? "primary" : "accent"} style={{ gridArea: "1 / 1", opacity: treatedP }}>
                    {chemical ? "Treated" : "Watered"}
                  </Chip>
                )}
              </div>
            </div>
          )}
        </div>,
      );
    }
  }

  // Header + axis labels
  const zonesChipP = pop(frame, fps, b.labels + s(0.4), theme.spring.snappy);
  const axisP = (i: number) => pop(frame, fps, b.labels + i * 3, theme.spring.snappy);

  return (
    <AbsoluteFill style={{ opacity: Math.min(1, enter) * (1 - exit) }}>
      <div
        style={{
          position: "absolute",
          left: FIELD.x,
          top: FIELD.y,
          width: size.w,
          height: size.h,
          transform: `translate(${-140 * exit}px, ${interpolate(enter, [0, 1], [40, 0])}px) scale(${interpolate(enter, [0, 1], [0.94, 1])})`,
        }}
      >
        {/* header */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: -104,
            width: full.w,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", height: 44, width: 260 }}>
            <Chip style={{ position: "absolute", opacity: 1 - ndviMode, transform: `translateY(${-12 * ndviMode}px)` }} dot>
              RGB CAMERA
            </Chip>
            <Chip
              tone="accent"
              dot
              glow
              style={{ position: "absolute", opacity: ndviMode, transform: `translateY(${12 * (1 - ndviMode)}px)` }}
            >
              NDVI LAYER
            </Chip>
          </div>
          <Chip style={{ opacity: Math.min(1, zonesChipP), transform: `translateY(${interpolate(zonesChipP, [0, 1], [12, 0])}px)` }}>
            {COLS * ROWS} ZONES
          </Chip>
        </div>

        {/* plate behind the zones */}
        <div
          style={{
            position: "absolute",
            inset: -14,
            borderRadius: 22,
            background: "rgba(255,255,255,0.025)",
            border: theme.card.border,
            boxShadow: theme.card.boxShadow,
          }}
        />

        {Array.from({ length: COLS }).map((_, c) => (
          <div
            key={`col-${c}`}
            style={{
              position: "absolute",
              top: -46,
              left: cellPos(c, 0, gap).x,
              width: CELL,
              textAlign: "center",
              fontFamily: theme.fonts.mono,
              fontSize: 16,
              color: theme.colors.textFaint,
              opacity: Math.min(1, axisP(c)),
              transform: `translateY(${interpolate(axisP(c), [0, 1], [10, 0])}px)`,
            }}
          >
            {String.fromCharCode(65 + c)}
          </div>
        ))}
        {Array.from({ length: ROWS }).map((_, r) => (
          <div
            key={`row-${r}`}
            style={{
              position: "absolute",
              left: -48,
              top: cellPos(0, r, gap).y + CELL / 2 - 11,
              width: 24,
              textAlign: "right",
              fontFamily: theme.fonts.mono,
              fontSize: 16,
              color: theme.colors.textFaint,
              opacity: Math.min(1, axisP(r)),
              transform: `translateX(${interpolate(axisP(r), [0, 1], [-10, 0])}px)`,
            }}
          >
            {r + 1}
          </div>
        ))}

        {cells}
        {overlays}

        {/* blanket spray boom */}
        {boomVis > 0 && (
          <>
            <div
              style={{
                position: "absolute",
                left: boomX - 150,
                top: -20,
                width: 150,
                height: size.h + 40,
                background: `linear-gradient(90deg, transparent, ${theme.colors.spray}66)`,
                opacity: boomVis,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: boomX - 3,
                top: -30,
                width: 6,
                height: size.h + 60,
                borderRadius: 3,
                background: "#DDE5DF",
                boxShadow: `0 0 30px 8px ${theme.colors.spray}66`,
                opacity: boomVis,
              }}
            />
            <div style={{ position: "absolute", left: boomX - 92, top: size.h + 46, opacity: boomVis }}>
              <Chip tone="spray" dot glow>
                BLANKET SPRAY
              </Chip>
            </div>
          </>
        )}

        {/* NDVI scan line */}
        {scanVis > 0 && (
          <>
            <div
              style={{
                position: "absolute",
                left: -24,
                top: scanY - 110,
                width: full.w + 48,
                height: 110,
                background: `linear-gradient(180deg, transparent, ${theme.colors.accent}26)`,
                opacity: scanVis,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: -24,
                top: scanY - 1.5,
                width: full.w + 48,
                height: 3,
                background: theme.colors.accent,
                boxShadow: `0 0 24px 6px ${theme.colors.accent}88`,
                opacity: scanVis,
              }}
            />
          </>
        )}

        {/* drone */}
        {droneVis > 0 && (
          <>
            {hoverIdx >= 0 &&
              (() => {
                const v = b.visit(hoverIdx);
                const hp = tween(frame, [v.arrive, v.leave], [0, 1]);
                return [0, 0.5].map((off) => {
                  const t = (hp + off) % 1;
                  return (
                    <div
                      key={off}
                      style={{
                        position: "absolute",
                        left: dp.x - 30 - 50 * t,
                        top: dp.y - 30 - 50 * t,
                        width: 60 + 100 * t,
                        height: 60 + 100 * t,
                        borderRadius: "50%",
                        border: `2px solid ${theme.colors.accent}`,
                        opacity: (1 - t) * droneVis,
                      }}
                    />
                  );
                });
              })()}
            <div
              style={{
                position: "absolute",
                left: dp.x - 42 + 22,
                top: dp.y - 30 + 34,
                width: 84,
                height: 60,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.45)",
                filter: "blur(10px)",
                opacity: droneVis,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: dp.x - 60,
                top: dp.y - 60 + Math.sin(frame / 7) * 2,
                opacity: droneVis,
                transform: `rotate(${tilt}deg)`,
              }}
            >
              <Drone spin={frame * 37} />
            </div>
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};
