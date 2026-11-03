import type { Caption } from "@remotion/captions";
import type React from "react";
import type { Roteiro } from "./schema";

/** Caption do @remotion/captions + metadados da skill (ênfase e cena de origem). */
export type VideoCaption = Caption & {
  /** Palavra marcada com *asteriscos* no roteiro: aparece destacada na legenda. */
  emphasis?: boolean;
  /** Índice da cena do roteiro a que a palavra pertence. */
  scene?: number;
};

export type TimelineScene = {
  id: string;
  startMs: number;
  endMs: number;
};

export type Timeline = {
  fps: number;
  durationMs: number;
  /** Caminho relativo a public/ (ex.: "meu-video/narracao.mp3") ou null em rascunho sem áudio. */
  audio: string | null;
  source: "elevenlabs" | "whisper" | "estimada";
  scenes: TimelineScene[];
};

export type SceneProps = {
  /** Duração da cena em frames (já sincronizada com a narração). */
  durationInFrames: number;
  /** Índice da cena no roteiro. */
  index: number;
  id: string;
};

export type VideoDefinition = {
  spec: Roteiro;
  timeline: Timeline;
  captions: VideoCaption[];
  /** Um componente por id de cena do roteiro. */
  scenes: Record<string, React.FC<SceneProps>>;
  /** Fundo fixo opcional atrás de todas as cenas. */
  Background?: React.FC;
};
