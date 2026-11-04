import React, { useMemo } from "react";
import { measureText } from "@remotion/layout-utils";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { paginateCaptions, type PaginateOptions } from "../lib/paginate";
import type { VideoCaption } from "../lib/types";
import { COLORS, FONT, SAFE, SPRING } from "../theme";

export type ViralCaptionsProps = {
  captions: VideoCaption[];
  /**
   * "page" (padrão): a página inteira aparece e a palavra falada dá um "pop".
   * "reveal": cada palavra só aparece quando é falada (as próximas reservam espaço).
   */
  mode?: "reveal" | "page";
  /** Centro vertical da legenda (px na tela 1080×1920). */
  y?: number;
  maxWidth?: number;
  highlight?: string;
  /** Cor da palavra que está sendo falada (modo "page"). */
  activeColor?: string;
  paginate?: PaginateOptions;
};

const STROKE = 9;
/** Espaço entre palavras, em "em" (precisa vencer o contorno grosso). */
const GAP_EM = 0.42;

/** Contorno grosso + sombra (funciona com qualquer fonte, sem depender de paint-order). */
const outline = (color: string, w: number) => {
  const s: string[] = [];
  for (let a = 0; a < 360; a += 30) {
    const r = (a * Math.PI) / 180;
    s.push(`${(Math.cos(r) * w).toFixed(1)}px ${(Math.sin(r) * w).toFixed(1)}px 0 ${color}`);
  }
  s.push(`0 ${w + 6}px ${w + 4}px rgba(0,0,0,0.45)`);
  return s.join(", ");
};

/**
 * Legenda estilo Shorts/TikTok: 1–3 palavras em CAIXA ALTA, contorno escuro,
 * palavra *enfatizada* em cor de destaque e "pop" na palavra que está sendo falada.
 */
export const ViralCaptions: React.FC<ViralCaptionsProps> = ({
  captions,
  mode = "page",
  y = SAFE.captionY,
  maxWidth = 900,
  highlight = COLORS.captionHighlight,
  activeColor = COLORS.captionHighlight2,
  paginate,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pages = useMemo(() => paginateCaptions(captions, paginate), [captions, paginate]);
  const page = pages.find((p) => ms >= p.startMs && ms < p.endMs);
  if (!page) return null;

  const pageFrame = ((ms - page.startMs) / 1000) * fps;
  const pageIn = spring({ frame: pageFrame, fps, config: SPRING.pop });
  // Tamanho adaptativo: mede a página com a fonte real para caber numa linha só.
  const REF = 100;
  const gaps = Math.max(0, page.words.length - 1);
  const widthAtRef =
    page.words.reduce(
      (a, w) =>
        a +
        measureText({ text: w.text.trim().toUpperCase(), fontFamily: FONT, fontSize: REF, fontWeight: 900, letterSpacing: "-0.5px" }).width,
      0,
    ) +
    gaps * REF * GAP_EM +
    STROKE * 2;
  // 1.1 = folga para o "pop" (escala) da palavra ativa
  const fontSize = Math.min(124, Math.max(60, (maxWidth / (widthAtRef * 1.1)) * REF));

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: (1080 - maxWidth) / 2,
          width: maxWidth,
          top: y,
          transform: `translateY(-50%) scale(${interpolate(pageIn, [0, 1], [0.82, 1])})`,
          opacity: interpolate(pageIn, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          columnGap: fontSize * GAP_EM,
          rowGap: fontSize * 0.02,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize,
          lineHeight: 1.08,
          letterSpacing: -0.5,
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        {page.words.map((w, i) => {
          const spoken = ms >= w.startMs - 40;
          const active = ms >= w.startMs - 40 && ms < w.endMs;
          const wf = ((ms - w.startMs) / 1000) * fps;
          const pop = spring({ frame: wf, fps, config: SPRING.pop });
          const visible = mode === "page" || spoken || i === 0;
          // palavra sendo falada ganha cor (karaokê): deixa a sincronia visível; ênfase continua ciano
          const color = w.emphasis ? highlight : active && mode === "page" ? activeColor : COLORS.captionText;
          const scale =
            mode === "reveal"
              ? interpolate(pop, [0, 1], [0.6, 1])
              : active
                ? 1 + 0.07 * Math.min(1, pop)
                : 1;
          return (
            <span
              key={`${w.startMs}-${i}`}
              style={{
                display: "inline-block",
                transformOrigin: "50% 60%",
                color,
                opacity: visible ? 1 : 0,
                transform: `scale(${scale}) translateY(${active ? -6 : 0}px)`,
                textShadow: outline(COLORS.captionStroke, STROKE),
              }}
            >
              {w.text.trim()}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
