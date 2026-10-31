import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, pop, tween } from "../anim";
import { CAUSES, Cause, zonesFor } from "../data";
import { theme } from "../theme";

const FW = 300;
const FH = 160;

const star = (cx: number, cy: number, r1: number, r2: number, n: number, rot = 0) => {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = rot + (Math.PI * i) / n;
    d += `${i === 0 ? "M" : "L"}${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  }
  return `${d}Z`;
};

const LEAF = "M-120,0 C-60,-72 60,-72 120,0 C60,72 -60,72 -120,0Z";

// Stylised close-up "camera feeds" for each detection class.
const SCENE: Record<Cause, React.ReactNode> = {
  weeds: (
    <>
      <rect width={FW} height={FH} fill="#4A3826" />
      {[32, 82, 132].map((y) =>
        Array.from({ length: 10 }).map((_, i) => (
          <g key={`${y}-${i}`}>
            <circle cx={15 + i * 30} cy={y} r={9} fill="#3F8A46" />
            <circle cx={15 + i * 30} cy={y} r={4} fill="#5DB062" />
          </g>
        )),
      )}
      {[
        [188, 58, 0.2],
        [216, 60, 0.9],
        [198, 108, 0.5],
        [226, 104, 1.3],
      ].map(([x, y, rot]) => (
        <path key={`${x}-${y}`} d={star(x, y, 14, 5, 7, rot)} fill="#A6C93F" stroke="#7FA22E" strokeWidth={1.5} />
      ))}
    </>
  ),
  disease: (
    <>
      <rect width={FW} height={FH} fill="#17301D" />
      <g transform="translate(150 80) rotate(-14)">
        <path d={LEAF} fill="#4C8B3B" />
        <path d="M-120,0 L120,0" stroke="#6FAF55" strokeWidth={3} />
        {[-70, -30, 10, 50].map((x) => (
          <path key={x} d={`M${x},0 L${x + 30},-38 M${x},0 L${x + 30},38`} stroke="#5E9E48" strokeWidth={2} />
        ))}
      </g>
      {[
        [180, 66, 11],
        [204, 86, 8],
        [170, 96, 7],
        [210, 60, 6],
      ].map(([x, y, r]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={r + 5} fill="#C9B44A" opacity={0.7} />
          <circle cx={x} cy={y} r={r} fill="#6B4A22" />
        </g>
      ))}
    </>
  ),
  dehydration: (
    <>
      <rect width={FW} height={FH} fill="#7A5E3C" />
      {[
        "M0,40 L40,52 L70,44 L110,60",
        "M120,150 L150,120 L190,128 L230,110 L300,118",
        "M20,150 L50,118 L44,96",
        "M240,10 L250,40 L290,52",
        "M90,10 L100,30 L140,36 L160,22",
      ].map((d) => (
        <path key={d} d={d} stroke="#4A3722" strokeWidth={2.5} fill="none" />
      ))}
      {[50, 115, 185, 250].map((x) => (
        <g key={x}>
          <path d={`M${x},150 Q${x - 2},108 ${x + 20},92`} stroke="#8C8A3A" strokeWidth={4} fill="none" />
          <ellipse cx={x + 24} cy={100} rx={14} ry={6} fill="#B59B45" transform={`rotate(50 ${x + 24} 100)`} />
          <ellipse cx={x - 8} cy={122} rx={13} ry={5} fill="#9C8A3E" transform={`rotate(-40 ${x - 8} 122)`} />
        </g>
      ))}
    </>
  ),
  insects: (
    <>
      <rect width={FW} height={FH} fill="#17301D" />
      <g transform="translate(150 80) rotate(10)">
        <path d={LEAF} fill="#4F9A40" />
        <path d="M-120,0 L120,0" stroke="#72B85A" strokeWidth={3} />
      </g>
      {[
        [96, 70, 7],
        [120, 104, 5],
        [250, 92, 6],
      ].map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#17301D" />
      ))}
      {[
        [172, 72],
        [186, 80],
        [200, 70],
        [178, 92],
        [194, 96],
        [210, 86],
        [166, 84],
        [206, 102],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${i * 40})`}>
          <path d="M-6,-3 L-9,-6 M-6,3 L-9,6 M6,-3 L9,-6 M6,3 L9,6" stroke="#1C1C10" strokeWidth={1.2} />
          <ellipse rx={5} ry={3.5} fill="#2B2A18" />
        </g>
      ))}
    </>
  ),
};

const BOXES: Record<Cause, { x: number; y: number; w: number; h: number }> = {
  weeds: { x: 168, y: 38, w: 78, h: 90 },
  disease: { x: 154, y: 46, w: 72, h: 66 },
  dehydration: { x: 160, y: 80, w: 116, h: 74 },
  insects: { x: 156, y: 60, w: 66, h: 52 },
};

export const VisionCard: React.FC<{ cause: Cause; at: number; width: number }> = ({ cause, at, width }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (x: number) => Math.round(x * fps);

  const enter = pop(frame, fps, at);
  const scanP = tween(frame, [at + s(0.1), at + s(0.7)], [0, 1], theme.ease.inOut);
  const boxP = tween(frame, [at + s(0.5), at + s(1.0)], [0, 1]);
  const labelP = pop(frame, fps, at + s(0.9), theme.spring.snappy);
  const info = CAUSES[cause];
  const conf = Math.round(tween(frame, [at + s(0.9), at + s(1.6)], [0, info.confidence]));
  const rec = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frame / 6));

  const t = BOXES[cause];
  const box = {
    x: lerp(6, t.x, boxP),
    y: lerp(6, t.y, boxP),
    w: lerp(FW - 12, t.w, boxP),
    h: lerp(FH - 12, t.h, boxP),
  };
  const label = `${info.label.toUpperCase()} ${conf}%`;
  const labelW = label.length * 7.4 + 12;
  const zones = zonesFor(cause);

  return (
    <div
      style={{
        width,
        borderRadius: theme.card.borderRadius,
        border: theme.card.border,
        boxShadow: theme.card.boxShadow,
        background: theme.colors.bgAlt,
        overflow: "hidden",
        opacity: Math.min(1, enter),
        transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px) scale(${interpolate(enter, [0, 1], [0.94, 1])})`,
      }}
    >
      <svg width={width} height={(width * FH) / FW} viewBox={`0 0 ${FW} ${FH}`} style={{ display: "block" }}>
        <g style={{ filter: "saturate(1.1) contrast(1.08)" }}>{SCENE[cause]}</g>
        <rect width={FW} height={FH} fill="url(#scanlines)" />
        <defs>
          <pattern id="scanlines" width={4} height={4} patternUnits="userSpaceOnUse">
            <rect width={4} height={1} fill="rgba(0,0,0,0.18)" />
          </pattern>
        </defs>
        {scanP > 0 && scanP < 1 && (
          <rect x={0} y={scanP * FH - 1} width={FW} height={2} fill={theme.colors.accent} opacity={0.9} />
        )}
        <rect
          x={box.x}
          y={box.y}
          width={box.w}
          height={box.h}
          rx={4}
          fill={`${theme.colors.warn}14`}
          stroke={theme.colors.warn}
          strokeWidth={2.5}
          opacity={boxP}
        />
        <g transform={`translate(${box.x} ${box.y - 4})`} opacity={Math.min(1, labelP)}>
          <rect y={-18} width={labelW} height={18} rx={4} fill={theme.colors.warn} />
          <text x={6} y={-5} fontSize={11} fontFamily={theme.fonts.mono} fontWeight={600} fill={theme.colors.ink}>
            {label}
          </text>
        </g>
        <circle cx={FW - 16} cy={14} r={4} fill={theme.colors.danger} opacity={rec} />
        <text x={10} y={FH - 10} fontSize={10} fontFamily={theme.fonts.mono} fill="rgba(255,255,255,0.75)">
          CAM 01 · ZONE {zones.map((z) => z.id).join(" + ")}
        </text>
      </svg>
      <div style={{ padding: "12px 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 23, color: theme.colors.text }}>
          {info.label}
        </span>
        <span style={{ fontFamily: theme.fonts.mono, fontSize: 13, color: theme.colors.textDim }}>
          NDVI {Math.min(...zones.map((z) => z.ndvi)).toFixed(2)}
        </span>
      </div>
    </div>
  );
};
