/**
 * Recalcula a timeline (início/fim de cada cena) a partir do captions.json atual.
 * Use depois de mexer na divisão das cenas ou corrigir um erro de digitação no roteiro
 * SEM regravar a narração: se o número de palavras for o mesmo, o texto, as ênfases e a
 * cena de cada palavra são atualizados a partir do roteiro, mantendo os tempos.
 *
 * Uso: npm run sync -- <slug>
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { makeCaption } from "../src/lib/captions.ts";
import type { Timeline, VideoCaption } from "../src/lib/types.ts";
import { scriptWords } from "../src/lib/words.ts";
import {
  fail,
  ffprobeDurationMs,
  loadRoteiro,
  readJson,
  requireSlug,
  saveCaptionsAndTimeline,
  videoDir,
} from "./lib/project.ts";

const { positionals } = parseArgs({ allowPositionals: true });
const slug = requireSlug(positionals, "npm run sync -- <slug>");
const roteiro = loadRoteiro(slug);
const dir = videoDir(slug);
const captions = readJson<VideoCaption[]>(path.join(dir, "captions.json"));
const old = readJson<Timeline>(path.join(dir, "timeline.json"));
const words = scriptWords(roteiro);

if (captions.length === 0) fail("captions.json está vazio. Rode npm run estimate / tts / transcribe.");

let updated = captions;
if (captions.length === words.length) {
  updated = words.map((w, i) => makeCaption(w, captions[i].startMs, captions[i].endMs, i === 0));
} else {
  console.log(
    `⚠ O roteiro tem ${words.length} palavras e as legendas ${captions.length}. ` +
      "O texto mudou: regere a narração (tts/transcribe) ou o rascunho (estimate).",
  );
}

const audioAbs = old.audio ? path.join(process.cwd(), "public", old.audio) : null;
saveCaptionsAndTimeline(slug, roteiro, updated, {
  audio: old.audio,
  source: old.source,
  audioDurationMs: audioAbs && fs.existsSync(audioAbs) ? ffprobeDurationMs(audioAbs) : undefined,
});
