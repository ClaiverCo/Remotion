import { z } from "zod";

/**
 * metadata.json de cada vídeo (src/videos/<slug>/metadata.json):
 * título, descrição e hashtags para YouTube Shorts, TikTok e Instagram Reels.
 */
export const metadataSchema = z.object({
  youtube: z.object({
    titulo: z.string().min(1),
    descricao: z.string().min(1),
    hashtags: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    categoria: z.string().default("27"),
    privacidade: z.enum(["private", "unlisted", "public"]).default("private"),
    /** ISO 8601 com fuso (ex.: 2026-11-10T12:00:00-03:00). Exige privacidade "private" no upload. */
    publicarEm: z.string().nullable().default(null),
    /** true quando a voz/imagens são geradas por IA de forma realista (exigência do YouTube). */
    midiaSintetica: z.boolean().default(true),
  }),
  tiktok: z.object({
    legenda: z.string().min(1),
    hashtags: z.array(z.string()).default([]),
  }),
  reels: z.object({
    legenda: z.string().min(1),
    hashtags: z.array(z.string()).default([]),
  }),
});

export type Metadata = z.infer<typeof metadataSchema>;

export type Issue = { level: "erro" | "aviso"; where: string; msg: string };

const HASHTAG_RE = /^#[\p{L}\p{N}_]+$/u;

/** Palavras que costumam derrubar alcance/monetização ou acionar moderação. */
export const PALAVRAS_SENSIVEIS = [
  "suicídio",
  "suicidio",
  "matar",
  "assassinato",
  "sangue",
  "arma",
  "tiro",
  "droga",
  "cocaína",
  "maconha",
  "nudez",
  "sexo",
  "aposta",
  "apostas",
  "bet",
  "cassino",
  "golpe",
  "pirâmide",
  "dinheiro fácil",
  "renda extra garantida",
  // inglês
  "suicide",
  "kill",
  "murder",
  "blood",
  "gun",
  "drugs",
  "cocaine",
  "nude",
  "gambling",
  "casino",
  "scam",
  "get rich quick",
];

const checkHashtags = (
  where: string,
  tags: string[],
  { min, max, hard }: { min: number; max: number; hard?: number },
  issues: Issue[],
) => {
  const seen = new Set<string>();
  for (const t of tags) {
    if (!HASHTAG_RE.test(t)) {
      issues.push({
        level: "erro",
        where,
        msg: `hashtag inválida "${t}" (use # + letras/números/_ sem espaço nem pontuação)`,
      });
    }
    const k = t.toLowerCase();
    if (seen.has(k)) issues.push({ level: "erro", where, msg: `hashtag repetida "${t}"` });
    seen.add(k);
  }
  if (hard !== undefined && tags.length > hard) {
    issues.push({
      level: "erro",
      where,
      msg: `${tags.length} hashtags: o limite da plataforma é ${hard}`,
    });
  } else if (tags.length > max) {
    issues.push({
      level: "aviso",
      where,
      msg: `${tags.length} hashtags: o recomendado é ${min}–${max} (excesso parece spam e dilui o alcance)`,
    });
  }
  if (tags.length < min) {
    issues.push({
      level: "aviso",
      where,
      msg: `só ${tags.length} hashtag(s): use ${min}–${max} (1 ampla + 2 de nicho + 1–2 específicas)`,
    });
  }
};

const checkSensitive = (where: string, text: string, issues: Issue[]) => {
  const low = text.toLowerCase();
  for (const p of PALAVRAS_SENSIVEIS) {
    const re = new RegExp(`(^|[^\\p{L}])${p}($|[^\\p{L}])`, "u");
    if (re.test(low)) {
      issues.push({
        level: "aviso",
        where,
        msg: `contém "${p}": pode reduzir alcance/monetização. Reescreva se possível.`,
      });
    }
  }
};

export const validateMetadata = (raw: unknown): { data?: Metadata; issues: Issue[] } => {
  const issues: Issue[] = [];
  const parsed = metadataSchema.safeParse(raw);
  if (!parsed.success) {
    for (const i of parsed.error.issues) {
      issues.push({ level: "erro", where: i.path.join("."), msg: i.message });
    }
    return { issues };
  }
  const m = parsed.data;

  // --- YouTube Shorts ---
  const yt = m.youtube;
  if (yt.titulo.length > 100)
    issues.push({ level: "erro", where: "youtube.titulo", msg: `${yt.titulo.length} caracteres (máx. 100)` });
  else if (yt.titulo.length > 60)
    issues.push({ level: "aviso", where: "youtube.titulo", msg: `${yt.titulo.length} caracteres: no celular aparece só o começo; ideal ≤ 60` });
  if (/[<>]/.test(yt.titulo + yt.descricao))
    issues.push({ level: "erro", where: "youtube", msg: "a API do YouTube rejeita os caracteres < e >" });
  const ytDesc = youtubeDescription(m);
  if (ytDesc.length > 5000)
    issues.push({ level: "erro", where: "youtube.descricao", msg: `${ytDesc.length} caracteres com hashtags (máx. 5000)` });
  checkHashtags("youtube.hashtags", yt.hashtags, { min: 3, max: 5, hard: 60 }, issues);
  if (!yt.hashtags.some((h) => h.toLowerCase() === "#shorts"))
    issues.push({ level: "aviso", where: "youtube.hashtags", msg: "inclua #shorts (ajuda a classificar o vídeo como Short)" });
  const tagsLen = yt.tags.reduce((a, t) => a + t.length + (t.includes(" ") ? 2 : 0), 0) + Math.max(0, yt.tags.length - 1);
  if (tagsLen > 500)
    issues.push({ level: "erro", where: "youtube.tags", msg: `${tagsLen} caracteres no total (máx. 500)` });
  if (yt.publicarEm) {
    const d = new Date(yt.publicarEm);
    if (Number.isNaN(d.getTime()))
      issues.push({ level: "erro", where: "youtube.publicarEm", msg: "data inválida (use ISO 8601, ex.: 2026-11-10T12:00:00-03:00)" });
    else if (d.getTime() < Date.now())
      issues.push({ level: "erro", where: "youtube.publicarEm", msg: "a data de publicação já passou" });
    if (!/(Z|[+-]\d{2}:\d{2})$/.test(yt.publicarEm))
      issues.push({ level: "aviso", where: "youtube.publicarEm", msg: "sem fuso horário: informe -03:00 (Brasília) para não errar o horário" });
  }
  checkSensitive("youtube", `${yt.titulo} ${yt.descricao}`, issues);

  // --- TikTok ---
  const tk = tiktokCaption(m);
  if (tk.length > 4000)
    issues.push({ level: "erro", where: "tiktok", msg: `${tk.length} caracteres (máx. 4000)` });
  checkHashtags("tiktok.hashtags", m.tiktok.hashtags, { min: 3, max: 5 }, issues);
  checkSensitive("tiktok", m.tiktok.legenda, issues);

  // --- Instagram Reels ---
  const rl = reelsCaption(m);
  if (rl.length > 2200)
    issues.push({ level: "erro", where: "reels", msg: `${rl.length} caracteres (máx. 2200)` });
  checkHashtags("reels.hashtags", m.reels.hashtags, { min: 3, max: 5, hard: 5 }, issues);
  checkSensitive("reels", m.reels.legenda, issues);

  return { data: m, issues };
};

export const youtubeDescription = (m: Metadata) =>
  [m.youtube.descricao.trim(), m.youtube.hashtags.join(" ")].filter(Boolean).join("\n\n");

export const tiktokCaption = (m: Metadata) =>
  [m.tiktok.legenda.trim(), m.tiktok.hashtags.join(" ")].filter(Boolean).join("\n\n");

export const reelsCaption = (m: Metadata) =>
  [m.reels.legenda.trim(), m.reels.hashtags.join(" ")].filter(Boolean).join("\n\n");

export const formatIssues = (issues: Issue[]) =>
  issues.length === 0
    ? "✔ metadados OK"
    : issues.map((i) => `${i.level === "erro" ? "✖" : "⚠"} [${i.where}] ${i.msg}`).join("\n");
