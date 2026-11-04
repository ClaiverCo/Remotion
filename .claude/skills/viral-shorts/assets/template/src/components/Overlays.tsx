import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

/** Vinheta suave: escurece as bordas e puxa o olho para o centro. */
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.28 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

/** Grão de filme animado (muito sutil): tira o aspecto "plástico" de vetor. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => {
  const frame = useCurrentFrame();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity }}>
      <svg width="100%" height="100%">
        <filter id={`g${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 60} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${id})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Barra de progresso fina no topo (opcional: roteiro.barraProgresso). */
export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, height: 10, width: `${(frame / durationInFrames) * 100}%`, background: COLORS.captionHighlight2 }} />
    </AbsoluteFill>
  );
};

/** Flash branco curto no corte entre cenas (dá "punch" na troca). */
export const CutFlash: React.FC<{ frames?: number }> = ({ frames = 4 }) => {
  const frame = useCurrentFrame();
  if (frame >= frames) return null;
  return <AbsoluteFill style={{ background: COLORS.white, opacity: 0.35 * (1 - frame / frames), pointerEvents: "none" }} />;
};
