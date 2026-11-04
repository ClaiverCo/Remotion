import { z } from "zod";

/**
 * clips.json — direção de cada clipe do episódio (universo Stickman do Futuro), em INGLÊS.
 * Fica em src/videos/<slug>/clips.json, ao lado do roteiro.json. Uma entrada por cena do roteiro,
 * na mesma ordem. É daqui (mais a bíblia e o roteiro) que `npm run prompt-pack` monta os prompts
 * de imagem e de animação para o Google Flow / Higgsfield.
 *
 * Arquivo puro (sem React): é lido pelos scripts e pelos testes.
 */

/** Personagem recorrente além do Kip (ex.: PP-01). Mesmos campos da bíblia. */
export const castMemberSchema = z.object({
  id: z.string().regex(/^[A-Z]{2}-\d{2}$/, "use o formato XX-00 (ex.: PP-01)"),
  name: z.string().min(1),
  role: z.string().min(1),
  era: z.string().min(1),
  age: z.string().min(1),
  headShape: z.string().min(1),
  heightHeads: z.number().positive(),
  proportions: z.string().min(1),
  face: z.string().min(1),
  hairOrHeadwear: z.string().min(1),
  clothing: z.string().min(1),
  footwear: z.string().min(1),
  colors: z.record(z.string(), z.string().regex(/^#[0-9A-Fa-f]{6}$/)),
  signatureProp: z.string().min(1),
  distinguishing: z.string().min(1),
  immutable: z.array(z.string()).min(1),
  changeable: z.array(z.string()).min(1),
});

/** Onde e como cada personagem está no INÍCIO do clipe. */
export const placementSchema = z.object({
  /** FL-01, um id do elenco (PP-01…) ou "crowd" para figurantes genéricos */
  id: z.string().min(1),
  position: z.string().min(1),
  facing: z.string().min(1),
  pose: z.string().min(1),
  expression: z.string().min(1),
  holding: z.string().default("nothing"),
  costume: z.string().default("default design, unchanged"),
  /** false = não está no quadro inicial (entra durante o clipe): fica fora do prompt de imagem */
  inStartFrame: z.boolean().default(true),
});

export const clipSchema = z.object({
  /** id da cena correspondente no roteiro.json */
  cena: z.string().min(1),
  purpose: z.string().min(1),
  location: z.string().min(1),
  timeOfDay: z.string().min(1),
  /** enquadramento do quadro inicial, ex.: "medium-wide shot, eye level" */
  framing: z.string().min(1),
  layout: z.object({
    foreground: z.string().min(1),
    middleground: z.string().min(1),
    background: z.string().min(1),
  }),
  characters: z.array(placementSchema).min(1),
  /** o que o quadro inicial mostra, ANTES da ação principal */
  opening: z.string().min(1),
  /** 0–2 s, 2–5 s, 5–8 s, 8–10 s */
  beats: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1), z.string().min(1)]),
  /** no máximo um movimento de câmera motivado */
  camera: z.string().min(1),
  motionLimits: z.string().optional(),
  /** estado exato no fim (10 s) */
  finalState: z.string().min(1),
  /** como entra o próximo clipe: casa com o último quadro, ou corte intencional (diga o que muda) */
  transition: z.string().min(1),
  sound: z.object({
    sfx: z.array(z.string().min(1)).min(1),
    music: z.string().min(1),
  }),
  /** restrições extras desta cena */
  avoid: z.array(z.string()).default([]),
  /** estado de saída (registro de continuidade) */
  outgoing: z.object({
    positions: z.string().min(1),
    direction: z.string().min(1),
    propOwner: z.string().min(1),
    propHand: z.string().min(1),
    emotion: z.string().min(1),
    changes: z.string().default("none"),
    /** true = o próximo clipe começa exatamente deste quadro; false = corte intencional */
    nextMatches: z.boolean(),
  }),
});

export const clipsFileSchema = z.object({
  project: z.object({
    /** onde e quando a explicação do presente vale (ex.: "homes in the US and Europe, 2020s") */
    scope: z.string().min(1),
    /** como a mesma tarefa é feita no futuro (ficção) */
    futureWay: z.string().min(1),
    /** o insight final do episódio */
    insight: z.string().min(1),
    tone: z.string().min(1),
  }),
  /** formato, cores, estado e tamanho relativo ao Kip (reusado literalmente em todo prompt) */
  relicDescription: z.string().min(1),
  /** personagens recorrentes além do Kip */
  cast: z.array(castMemberSchema).default([]),
  clips: z.array(clipSchema).min(1),
});

export type CastMember = z.infer<typeof castMemberSchema>;
export type Placement = z.infer<typeof placementSchema>;
export type Clip = z.infer<typeof clipSchema>;
export type ClipsFile = z.infer<typeof clipsFileSchema>;

export const parseClips = (data: unknown): ClipsFile => {
  const r = clipsFileSchema.safeParse(data);
  if (!r.success) {
    const issues = r.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`clips.json inválido:\n${issues}`);
  }
  return r.data;
};
