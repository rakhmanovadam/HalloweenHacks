import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { exitProgress, pop, tween } from "../anim";
import { PANEL } from "../layout";
import { theme } from "../theme";

export const Entrance: React.FC<{
  delay?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, y = 40, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, delay);
  return (
    <div
      style={{
        opacity: Math.min(1, p),
        transform: `translateY(${interpolate(p, [0, 1], [y, 0])}px) scale(${interpolate(p, [0, 1], [0.94, 1])})`,
        transformOrigin: "left center",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Right-hand narrative column with its own (fast) exit.
export const Panel: React.FC<{
  dur: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ dur, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = exitProgress(frame, dur, fps);
  return (
    <div
      style={{
        position: "absolute",
        left: PANEL.x,
        top: PANEL.y,
        width: PANEL.w,
        display: "flex",
        flexDirection: "column",
        opacity: 1 - e,
        transform: `translateY(${-42 * e}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const StepLabel: React.FC<{ text: string; delay?: number; color?: string }> = ({
  text,
  delay = 0,
  color = theme.colors.accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(frame, fps, delay, theme.spring.snappy);
  const line = tween(frame, [delay, delay + Math.round(fps * 0.5)], [0, 36]);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: Math.min(1, p),
        transform: `translateX(${interpolate(p, [0, 1], [-20, 0])}px)`,
        marginBottom: 22,
      }}
    >
      <div style={{ width: line, height: 2, background: color }} />
      <span
        style={{
          fontFamily: theme.fonts.mono,
          fontSize: 19,
          fontWeight: 600,
          letterSpacing: "0.18em",
          color,
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const Headline: React.FC<{
  text: string;
  highlight?: string[];
  delay?: number;
  size?: number;
  color?: string;
  center?: boolean;
}> = ({ text, highlight = [], delay = 0, size = 64, color = theme.colors.primary, center = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: center ? "center" : "flex-start",
        columnGap: Math.round(size * 0.26),
        fontFamily: theme.fonts.display,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: "-0.03em",
        color: theme.colors.text,
      }}
    >
      {words.map((w, i) => {
        const p = pop(frame, fps, delay + i * 3, theme.spring.snappy);
        const hot = highlight.includes(w);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: Math.min(1, p),
              transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)`,
              color: hot ? color : undefined,
              textShadow: hot ? `0 0 40px ${color}66` : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Body: React.FC<{ delay?: number; size?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay = 0,
  size = 25,
  children,
  style,
}) => (
  <Entrance delay={delay} y={24}>
    <div
      style={{
        fontFamily: theme.fonts.body,
        fontSize: size,
        lineHeight: 1.45,
        color: theme.colors.textDim,
        ...style,
      }}
    >
      {children}
    </div>
  </Entrance>
);

export const Counter: React.FC<{ value: number; final: number; suffix?: string }> = ({ value, final, suffix = "%" }) => (
  <span style={{ position: "relative", display: "inline-block", fontVariantNumeric: "tabular-nums" }}>
    <span style={{ visibility: "hidden" }}>
      {final}
      {suffix}
    </span>
    <span style={{ position: "absolute", right: 0, top: 0 }}>
      {value}
      {suffix}
    </span>
  </span>
);
