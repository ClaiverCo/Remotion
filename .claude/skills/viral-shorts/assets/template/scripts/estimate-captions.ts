/**
 * Rascunho sem áudio: estima o tempo de cada palavra a partir do texto do roteiro.
 * Serve para montar e revisar as cenas antes de gerar a narração de verdade.
 *
 * Uso: npm run estimate -- <slug> [--wps 2.8]
 */
import { parseArgs } from "node:util";
import { estimateCaptions } from "../src/lib/captions.ts";
import { scriptWords } from "../src/lib/words.ts";
import { loadRoteiro, requireSlug, saveCaptionsAndTimeline } from "./lib/project.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { wps: { type: "string", default: "2.8" } },
});
const slug = requireSlug(positionals, "npm run estimate -- <slug> [--wps 2.8]");
const roteiro = loadRoteiro(slug);
const captions = estimateCaptions(scriptWords(roteiro), {
  wordsPerSecond: parseFloat(values.wps!),
});
saveCaptionsAndTimeline(slug, roteiro, captions, { audio: null, source: "estimada" });
console.log("ℹ Rascunho: sem narração. Gere a voz com npm run tts (ElevenLabs) ou npm run transcribe (sua voz).");
