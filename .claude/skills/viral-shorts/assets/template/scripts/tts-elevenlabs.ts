/**
 * Narração com ElevenLabs + legendas exatas (endpoint /with-timestamps).
 * O texto vem do roteiro.json; o alinhamento por caractere vira legenda palavra a palavra,
 * então não há erro de transcrição.
 *
 * Uso: npm run tts -- <slug> [--from-cache] [--voice <id>] [--model <id>]
 *   --from-cache  reaproveita a última resposta salva em .cache/ (não gasta créditos)
 *
 * .env: ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL_ID (opcional),
 *       ELEVENLABS_STABILITY / _SIMILARITY / _STYLE / _SPEED (opcionais)
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { elevenLabsToCaptions, type ElevenLabsAlignment } from "../src/lib/captions.ts";
import { narrationText, scriptWords } from "../src/lib/words.ts";
import {
  cacheDir,
  fail,
  ffprobeDurationMs,
  loadRoteiro,
  publicDir,
  readJson,
  requireSlug,
  saveCaptionsAndTimeline,
  writeJson,
} from "./lib/project.ts";

type TtsResponse = {
  audio_base64: string;
  alignment: ElevenLabsAlignment | null;
  normalized_alignment: ElevenLabsAlignment | null;
};

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    "from-cache": { type: "boolean", default: false },
    voice: { type: "string" },
    model: { type: "string" },
  },
});
const slug = requireSlug(positionals, "npm run tts -- <slug> [--from-cache]");
const roteiro = loadRoteiro(slug);
const words = scriptWords(roteiro);
const text = narrationText(roteiro);
const cacheFile = path.join(cacheDir(), `${slug}-elevenlabs.json`);

let response: TtsResponse;
if (values["from-cache"]) {
  if (!fs.existsSync(cacheFile)) fail(`Não há cache em ${cacheFile}. Rode sem --from-cache.`);
  response = readJson<TtsResponse>(cacheFile);
} else {
  const key = process.env.ELEVENLABS_API_KEY;
  const voice = values.voice ?? process.env.ELEVENLABS_VOICE_ID;
  const model = values.model ?? process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";
  if (!key) fail("Defina ELEVENLABS_API_KEY no .env (veja .env.example).");
  if (!voice) fail("Defina ELEVENLABS_VOICE_ID no .env ou passe --voice <id>.");
  const num = (v: string | undefined, d: number) => (v ? parseFloat(v) : d);

  console.log(`→ ElevenLabs: ${text.length} caracteres, voz ${voice}, modelo ${model}`);
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key!, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability: num(process.env.ELEVENLABS_STABILITY, 0.4),
          similarity_boost: num(process.env.ELEVENLABS_SIMILARITY, 0.8),
          style: num(process.env.ELEVENLABS_STYLE, 0.35),
          speed: num(process.env.ELEVENLABS_SPEED, 1.05),
          use_speaker_boost: true,
        },
      }),
    },
  );
  if (!res.ok) {
    fail(`ElevenLabs respondeu ${res.status}: ${(await res.text()).slice(0, 800)}`);
  }
  response = (await res.json()) as TtsResponse;
  writeJson(cacheFile, response);
}

const alignment = response.alignment ?? response.normalized_alignment;
if (!alignment) fail("A resposta do ElevenLabs veio sem alinhamento (alignment).");

const audioRel = `${slug}/narracao.mp3`;
const audioAbs = path.join(publicDir(slug), "narracao.mp3");
fs.mkdirSync(publicDir(slug), { recursive: true });
fs.writeFileSync(audioAbs, Buffer.from(response.audio_base64, "base64"));

const captions = elevenLabsToCaptions(alignment!, words);
saveCaptionsAndTimeline(slug, roteiro, captions, {
  audio: audioRel,
  source: "elevenlabs",
  audioDurationMs: ffprobeDurationMs(audioAbs),
});
console.log(`✔ Narração salva em public/${audioRel}`);
