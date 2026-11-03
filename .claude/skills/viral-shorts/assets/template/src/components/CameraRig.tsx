import React from "react";
import { AbsoluteFill } from "remotion";
import { keyframes, useTime } from "../lib/anim";
import { EASE } from "../theme";

export type CameraKey = {
  /** segundos desde o início da cena */
  t: number;
  /** ponto (no espaço 1080×1920) que fica no centro da tela */
  x: number;
  y: number;
  /** 1 = sem zoom */
  zoom: number;
  /** rotação em graus (use pouco: ±2) */
  rot?: number;
};

/**
 * Câmera 2D: enquadra um ponto da cena e anima zoom/pan/rotação entre keyframes.
 * Mesmo com um único keyframe há um "drift" leve para a imagem nunca ficar parada.
 */
export const CameraRig: React.FC<{
  keys: CameraKey[];
  drift?: boolean;
  ease?: keyof typeof EASE;
  children: React.ReactNode;
}> = ({ keys, drift = true, ease = "inOut", children }) => {
  const t = useTime();
  const k = keyframes(
    t,
    keys.map((c) => ({ ...c, rot: c.rot ?? 0 })),
    ["x", "y", "zoom", "rot"],
    ease,
  );
  const d = drift ? 1 + t * 0.006 : 1;
  const zoom = k.zoom * d;
  const tx = 540 - k.x * zoom;
  const ty = 960 - k.y * zoom;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1080,
          height: 1920,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${zoom}) rotate(${k.rot}deg)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
