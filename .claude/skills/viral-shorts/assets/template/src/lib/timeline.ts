import type { Roteiro } from "./schema";
import type { Timeline, VideoCaption } from "./types";

export type BuildTimelineOptions = {
  fps?: number;
  audio: string | null;
  source: Timeline["source"];
  /** A cena entra um pouco antes da primeira palavra dela (corte "no tempo"). */
  leadMs?: number;
  /** Tempo extra depois da última palavra antes do vídeo acabar. */
  tailMs?: number;
  /** Duração real do áudio, se conhecida (o vídeo nunca corta o áudio). */
  audioDurationMs?: number;
};

/** Calcula início/fim de cada cena a partir das palavras (cada caption sabe sua cena). */
export const buildTimeline = (
  roteiro: Roteiro,
  captions: VideoCaption[],
  opts: BuildTimelineOptions,
): Timeline => {
  const fps = opts.fps ?? 30;
  const lead = opts.leadMs ?? 120;
  const tail = opts.tailMs ?? 900;

  const firstStart: number[] = roteiro.cenas.map((cena, i) => {
    const w = captions.find((c) => c.scene === i);
    if (!w) {
      throw new Error(
        `A cena "${cena.id}" não tem nenhuma palavra nas legendas. Regere as legendas (npm run tts / transcribe / estimate).`,
      );
    }
    return w.startMs;
  });

  const starts = firstStart.map((s, i) => (i === 0 ? 0 : Math.max(0, s - lead)));
  for (let i = 1; i < starts.length; i++) {
    if (starts[i] <= starts[i - 1] + 300) starts[i] = starts[i - 1] + 300;
  }

  const lastWordEnd = captions.reduce((a, c) => Math.max(a, c.endMs), 0);
  const durationMs = Math.round(
    Math.max(lastWordEnd + tail, opts.audioDurationMs ?? 0),
  );

  return {
    fps,
    durationMs,
    audio: opts.audio,
    source: opts.source,
    scenes: roteiro.cenas.map((cena, i) => ({
      id: cena.id,
      startMs: Math.round(starts[i]),
      endMs: Math.round(i + 1 < starts.length ? starts[i + 1] : durationMs),
    })),
  };
};

export const msToFrame = (ms: number, fps: number) => Math.round((ms / 1000) * fps);

export const timelineDurationInFrames = (t: Timeline) =>
  Math.max(1, Math.ceil((t.durationMs / 1000) * t.fps));
