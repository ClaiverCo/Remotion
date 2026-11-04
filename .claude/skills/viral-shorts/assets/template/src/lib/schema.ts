import { z } from "zod";

/**
 * Esquema do roteiro.json de cada vídeo (src/videos/<slug>/roteiro.json).
 * É a fonte de verdade da narração, das cenas, dos selos e das palavras destacadas.
 * Marque palavras de ênfase na narração com *asteriscos* (pode cobrir várias palavras: *selo hídrico*).
 */

export const ICONES_SELO = ["?", "!", "check", "x", "raio"] as const;

export const seloSchema = z.object({
  texto: z.string().min(1).max(32),
  icone: z.enum(ICONES_SELO).default("?"),
  cor: z.enum(["amarelo", "vermelho", "verde", "azul"]).default("amarelo"),
});

export const cenaSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/, "use só letras minúsculas, números e hífen"),
  narracao: z.string().min(1),
  visual: z.string().min(1),
  selo: seloSchema.optional(),
  sfx: z.enum(["whoosh", "pop", "ding", "nenhum"]).default("whoosh"),
  fontes: z.array(z.number().int().positive()).default([]),
  // --- campos do universo Stickman do Futuro (opcionais) ---
  // A direção detalhada de cada clipe (lugar, personagens, câmera, tempos) fica em clips.json.
  /** era mostrada na cena */
  era: z.enum(["futuro", "presente", "viagem", "comparacao"]).optional(),
  /** ação visual principal, uma frase em inglês (vai para o storyboard do pacote de prompts) */
  acao: z.string().optional(),
});

export const roteiroSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  titulo: z.string().min(1),
  tema: z.string().min(1),
  modelo: z.enum(["pergunta-final", "por-etapas", "parece-facil"]),
  estilo: z.enum(["2.5d", "3d"]),
  idioma: z.string().default("pt-BR"),
  perguntaCentral: z.string().min(1),
  duracaoAlvoSeg: z.number().min(10).max(180),
  voz: z.enum(["piper", "kokoro", "google", "elevenlabs", "propria", "estimada"]),
  /** Voz fixa deste vídeo (ex.: "am_michael", "faber", "pt-BR-Neural2-B"); sobrepõe a do .env. */
  vozId: z.string().optional(),
  /** Como a VOZ deve falar certas palavras (a legenda mantém o original). Ex.: { "fecho": "fêcho" } */
  pronuncias: z.record(z.string(), z.string()).default({}),
  musica: z
    .object({
      arquivo: z.string(),
      volume: z.number().min(0).max(1).default(0.1),
    })
    .optional(),
  barraProgresso: z.boolean().default(false),
  /** Tempo (ms) que o vídeo continua depois da última palavra (padrão 900). Ex.: 2200 para um "to be continued". */
  caudaMs: z.number().int().min(0).max(6000).optional(),
  /** Universo Stickman: a relíquia do episódio (em inglês, para os prompts). */
  reliquia: z
    .object({
      nome: z.string(),
      descricao: z.string(),
    })
    .optional(),
  cenas: z.array(cenaSchema).min(2),
});

export type Selo = z.infer<typeof seloSchema>;
export type Cena = z.infer<typeof cenaSchema>;
export type Roteiro = z.infer<typeof roteiroSchema>;
export type RoteiroInput = z.input<typeof roteiroSchema>;

export const parseRoteiro = (data: unknown): Roteiro => {
  const result = roteiroSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`roteiro.json inválido:\n${issues}`);
  }
  const ids = new Set<string>();
  for (const cena of result.data.cenas) {
    if (ids.has(cena.id)) {
      throw new Error(`roteiro.json inválido: id de cena repetido "${cena.id}"`);
    }
    ids.add(cena.id);
  }
  return result.data;
};
