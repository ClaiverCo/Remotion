/**
 * Finaliza o vídeo para postar:
 *  - normaliza o volume para -14 LUFS (padrão de YouTube/TikTok/Reels), sem recodificar a imagem
 *  - liga o "faststart" (o vídeo começa a tocar mais rápido)
 *  - gera legendas.srt (para subir como legenda oficial/acessibilidade)
 *
 * Uso: npm run finalize -- <slug>
 * Entrada: out/<slug>/bruto.mp4 → Saída: out/<slug>/video.mp4 + out/<slug>/legendas.srt
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { serializeSrt, type Caption } from "@remotion/captions";
import { paginateCaptions } from "../src/lib/paginate.ts";
import type { VideoCaption } from "../src/lib/types.ts";
import { fail, hasAudioStream, outDir, readJson, requireSlug, run, videoDir } from "./lib/project.ts";

const { positionals } = parseArgs({ allowPositionals: true });
const slug = requireSlug(positionals, "npm run finalize -- <slug>");
const raw = path.join(outDir(slug), "bruto.mp4");
const final = path.join(outDir(slug), "video.mp4");
if (!fs.existsSync(raw)) fail(`Não achei ${raw}. Rode antes: npm run render -- ${slug}`);

if (hasAudioStream(raw)) {
  run("ffmpeg", [
    "-y", "-v", "error", "-i", raw,
    "-c:v", "copy",
    "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-movflags", "+faststart",
    final,
  ]);
  console.log("✔ áudio normalizado em -14 LUFS");
} else {
  run("ffmpeg", ["-y", "-v", "error", "-i", raw, "-c", "copy", "-movflags", "+faststart", final]);
  console.log("⚠ o vídeo não tem áudio (rascunho com legendas estimadas?)");
}

const captions = readJson<VideoCaption[]>(path.join(videoDir(slug), "captions.json"));
const pages = paginateCaptions(captions, { maxWords: 7, maxChars: 42, holdMs: 400 });
const lines: Caption[][] = pages.map((p) =>
  p.words.map((w, i) => ({
    text: i === 0 ? w.text.trimStart() : w.text,
    startMs: w.startMs,
    endMs: i === p.words.length - 1 ? p.endMs : w.endMs,
    timestampMs: w.timestampMs,
    confidence: null,
  })),
);
fs.writeFileSync(path.join(outDir(slug), "legendas.srt"), serializeSrt({ lines }));
console.log(`✔ ${path.relative(process.cwd(), final)} + legendas.srt`);
