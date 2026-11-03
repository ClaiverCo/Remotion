import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE, SPRING } from "../theme";

/**
 * Helpers de animação. Todo tempo é em SEGUNDOS relativos ao início da cena
 * (convertidos com o fps), nunca números de frame fixos.
 */

export type SpringName = keyof typeof SPRING;

/** 0→1 com spring, começando em `delay` segundos. */
export const useAppear = (delay = 0, preset: SpringName = "smooth") => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay * fps, fps, config: SPRING[preset] });
};

/** 0→1 entre `from` e `to` segundos (com easing; padrão: out). */
export const useProgress = (from: number, to: number, ease: keyof typeof EASE = "inOut") => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return interpolate(frame / fps, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE[ease],
  });
};

/** Oscilação senoidal para elementos "parados" não ficarem mortos. */
export const useIdle = (amplitude = 1, periodSec = 3, phase = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return Math.sin(((frame / fps) / periodSec) * Math.PI * 2 + phase) * amplitude;
};

export const useTime = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/**
 * Tempo da cena: t (s desde o início), dur (duração em s, vinda da narração) e p (0→1).
 * Anime em FRAÇÕES de `dur` para a cena se adaptar ao tamanho real da fala.
 */
export const useSceneTime = (durationInFrames: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { t: frame / fps, dur: durationInFrames / fps, p: frame / durationInFrames };
};

/** 0→1 entre `from` e `to` (mesma unidade de t), com clamp e easing. */
export const ramp = (t: number, from: number, to: number, ease: keyof typeof EASE = "inOut") =>
  interpolate(t, [from, Math.max(to, from + 0.0001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE[ease],
  });

/** Interpola keyframes { t (s), ...valores } com easing entre cada par. */
export const keyframes = <K extends string>(
  t: number,
  keys: ({ t: number } & Record<K, number>)[],
  fields: K[],
  ease: keyof typeof EASE = "inOut",
): Record<K, number> => {
  const out = {} as Record<K, number>;
  if (keys.length === 0) return out;
  const sorted = [...keys].sort((a, b) => a.t - b.t);
  for (const f of fields) {
    if (sorted.length === 1) {
      out[f] = sorted[0][f];
      continue;
    }
    out[f] = interpolate(
      t,
      sorted.map((k) => k.t),
      sorted.map((k) => k[f]),
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE[ease] },
    );
  }
  return out;
};

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/** Clareia/escurece uma cor #rrggbb (amount entre -1 e 1). */
export const shade = (hex: string, amount: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const f = (c: number) =>
    Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
  return `#${[f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
};
