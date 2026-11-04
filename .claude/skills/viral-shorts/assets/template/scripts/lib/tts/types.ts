import type { Roteiro } from "../../../src/lib/schema.ts";
import type { Timeline, VideoCaption } from "../../../src/lib/types.ts";

export type TtsMotor = "piper" | "kokoro" | "google" | "elevenlabs";

export type TtsOptions = {
  /** Voz do motor (ex.: pm_alex, pt-BR-Neural2-B, ID do ElevenLabs). */
  voz?: string;
  velocidade?: number;
  /** Reaproveita a última resposta salva em .cache/ (não gasta créditos/tempo). */
  fromCache?: boolean;
  /** Só mostra o que seria enviado/sintetizado. */
  dryRun?: boolean;
  /** Modelo (ElevenLabs: model_id; Kokoro: arquivo .onnx). */
  modelo?: string;
};

export type TtsResult = {
  /** Caminho relativo a public/ */
  audioRel: string;
  audioAbs: string;
  captions: VideoCaption[];
  source: Timeline["source"];
  /** Resumo para mostrar ao usuário (voz, modelo). */
  info: string;
};

export type TtsEngine = (slug: string, roteiro: Roteiro, opts: TtsOptions) => Promise<TtsResult | null>;
