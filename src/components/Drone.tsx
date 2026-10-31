import React from "react";
import { theme } from "../theme";

const ARMS: [number, number][] = [
  [-34, -34],
  [34, -34],
  [-34, 34],
  [34, 34],
];

// Top-down quadcopter, drawn in theme colors (no emoji / raster assets).
export const Drone: React.FC<{ size?: number; spin: number }> = ({ size = 120, spin }) => (
  <svg width={size} height={size} viewBox="-60 -60 120 120" style={{ overflow: "visible" }}>
    {ARMS.map(([x, y], i) => (
      <line key={`a${i}`} x1={0} y1={0} x2={x} y2={y} stroke="#C9D3CC" strokeWidth={7} strokeLinecap="round" />
    ))}
    {ARMS.map(([x, y], i) => (
      <g key={`r${i}`} transform={`translate(${x} ${y})`}>
        <circle r={22} fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
        <g transform={`rotate(${spin * (i % 2 === 0 ? 1 : -1)})`}>
          <ellipse rx={20} ry={3} fill="rgba(240,245,240,0.6)" />
          <ellipse rx={3} ry={20} fill="rgba(240,245,240,0.22)" />
        </g>
        <circle r={3.5} fill="#E9EFEA" />
      </g>
    ))}
    <rect x={-18} y={-22} width={36} height={44} rx={12} fill="#E9EFEA" />
    <rect x={-12} y={-14} width={24} height={18} rx={6} fill="#1A2620" />
    <circle cx={0} cy={13} r={5} fill={theme.colors.accent} />
    <circle cx={-10} cy={-18} r={2.5} fill={theme.colors.primary} />
    <circle cx={10} cy={-18} r={2.5} fill={theme.colors.danger} />
  </svg>
);
