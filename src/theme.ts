import { Easing } from "remotion";
import { color, ndvi } from "../ui/src";
import { body, display, mono } from "./fonts";

// Video theme: colour + NDVI tokens come from the shared @agrivision/ui design system
// (also synced to Claude Design); fonts are loaded for Remotion; motion is video-only.
export const theme = {
  colors: color,
  ndvi,
  fonts: { display, body, mono },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1), // easeOutExpo — entrances
    inOut: Easing.bezier(0.83, 0, 0.17, 1), // easeInOutQuint — moves
    in: Easing.bezier(0.7, 0, 0.84, 0), // exits only
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
  card: {
    borderRadius: 22,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 40px 80px -20px rgba(0, 0, 0, 0.6)",
  },
};
