/**
 * Pacote de prompts para o Google Flow / Higgsfield (universo Stickman do Futuro).
 *
 * Lê src/stickman/bible.ts + src/videos/<slug>/{roteiro.json, clips.json, pesquisa.md}
 * (e, se a narração já foi gerada, captions.json + o áudio) e grava em out/<slug>/prompt-pack/:
 *   prompt-pack.md            todas as entregas do documento, na ordem pedida
 *   C01_voice.mp3 …           a narração cortada por clipe (para montar os clipes de 10 s)
 *   captions-editorial.srt    legendas no tempo da montagem de 10 s por clipe
 *   FL-01_character-sheet.png folha do Kip desenhada pelo código (se já rodou npm run stickman-sheet)
 *
 * Uso: npm run prompt-pack -- <slug>
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { serializeSrt, type Caption } from "@remotion/captions";
import { parseClips } from "../src/stickman/clips.ts";
import type { Timeline, VideoCaption } from "../src/lib/types.ts";
import { buildPromptPack, clipCode, editorialCaptions, type VoiceClip } from "./lib/prompt-pack.ts";
import { fail, hasBinary, loadRoteiro, outDir, readJson, requireSlug, ROOT, run, videoDir } from "./lib/project.ts";

const { positionals } = parseArgs({ allowPositionals: true });
const slug = requireSlug(positionals, "npm run prompt-pack -- <slug>");
const vdir = videoDir(slug);
const roteiro = loadRoteiro(slug);
const clipsFile = path.join(vdir, "clips.json");
if (!fs.existsSync(clipsFile)) fail(`Falta src/videos/${slug}/clips.json (direção dos clipes). Veja references/prompt-pack.md da skill stickman-do-futuro.`);
const clips = parseClips(readJson(clipsFile));
const pesquisaFile = path.join(vdir, "pesquisa.md");
if (!fs.existsSync(pesquisaFile)) fail(`Falta src/videos/${slug}/pesquisa.md (dossiê de fatos com fontes).`);
const pesquisa = fs.readFileSync(pesquisaFile, "utf8");

const dir = path.join(outDir(slug), "prompt-pack");
fs.mkdirSync(dir, { recursive: true });

// narração medida (só se for voz de verdade, não estimativa)
const timeline = fs.existsSync(path.join(vdir, "timeline.json")) ? readJson<Timeline>(path.join(vdir, "timeline.json")) : null;
const real = timeline && timeline.audio && timeline.source !== "estimada";
const captions = real ? readJson<VideoCaption[]>(path.join(vdir, "captions.json")) : null;

// voz por clipe
let voice: (VoiceClip | null)[] | null = null;
const audio = real ? path.join(ROOT, "public", timeline!.audio!) : null;
if (captions && audio && fs.existsSync(audio) && hasBinary("ffmpeg")) {
  voice = roteiro.cenas.map((_, i) => {
    const w = captions.filter((c) => c.scene === i);
    if (!w.length) return null;
    const from = Math.max(0, w[0].startMs - 150);
    const to = w[w.length - 1].endMs + 300;
    const file = `${clipCode(i)}_voice.mp3`;
    run("ffmpeg", ["-y", "-v", "error", "-ss", (from / 1000).toFixed(3), "-to", (to / 1000).toFixed(3), "-i", audio, "-c:a", "libmp3lame", "-q:a", "2", path.join(dir, file)]);
    return { file, durationMs: to - from };
  });
} else if (!real) {
  console.log("ℹ Sem narração gerada ainda: o pacote sai sem tempos medidos e sem os arquivos de voz (rode npm run tts antes para incluí-los).");
}

// legendas no tempo da montagem
if (captions) {
  const lines: Caption[][] = editorialCaptions(captions, roteiro.cenas.length).map((l) => [
    { text: l.text, startMs: l.startMs, endMs: l.endMs, timestampMs: l.startMs, confidence: null },
  ]);
  fs.writeFileSync(path.join(dir, "captions-editorial.srt"), serializeSrt({ lines }));
}

// folha de personagem do Kip feita pelo código
const sheetSrc = path.join(ROOT, "out", "stickman", "character-sheet.png");
let leadSheetFile: string | null = null;
if (fs.existsSync(sheetSrc)) {
  leadSheetFile = "FL-01_character-sheet.png";
  fs.copyFileSync(sheetSrc, path.join(dir, leadSheetFile));
} else {
  console.log("ℹ Para incluir a folha do Kip como imagem de referência, rode antes: npm run stickman-sheet");
}

const pack = buildPromptPack({ roteiro, clips, pesquisa, captions, voice, leadSheetFile });
fs.writeFileSync(path.join(dir, "prompt-pack.md"), pack.markdown);

console.log("\nclipe  narração   imagem (direção)   animação (direção)");
for (const c of pack.clips) {
  const t = c.measuredMs !== null ? `${(c.measuredMs / 1000).toFixed(1)}s` : "  —  ";
  console.log(
    `${c.code}   ${String(c.narrationWords).padStart(2)} pal ${t.padStart(5)}   ${String(c.imageWords).padStart(3)} (${String(c.imageDirectionWords).padStart(3)})          ${String(c.animationWords).padStart(3)} (${String(c.animationDirectionWords).padStart(3)})`,
  );
}
for (const w of pack.warnings) console.log(`⚠ ${w}`);
console.log(`\n✔ ${path.relative(ROOT, dir)}/`);
for (const f of fs.readdirSync(dir).sort()) console.log(`   · ${f}`);
