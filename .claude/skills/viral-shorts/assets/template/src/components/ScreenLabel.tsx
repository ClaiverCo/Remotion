import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { shade } from "../lib/anim";
import { COLORS, FONT, SPRING } from "../theme";

/**
 * Rótulo em coordenadas de TELA (px em 1080×1920), por cima de qualquer cena (2.5D ou 3D).
 * Útil em cenas 3D, onde texto dentro do WebGL dá trabalho.
 */
export const ScreenLabel: React.FC<{
  x: number;
  y: number;
  text: string;
  delay?: number;
  color?: string;
  textColor?: string;
  size?: number;
}> = ({ x, y, text, delay = 0, color = COLORS.white, textColor = COLORS.ink, size = 46 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay * fps, fps, config: SPRING.pop });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(-50%, -50%) scale(${interpolate(s, [0, 1], [0.4, 1])})`,
          opacity: Math.min(1, s * 2),
          padding: `${size * 0.2}px ${size * 0.55}px`,
          borderRadius: 999,
          background: color,
          border: `5px solid ${COLORS.ink}`,
          boxShadow: `0 7px 0 ${shade(color, -0.35)}`,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: size,
          color: textColor,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
