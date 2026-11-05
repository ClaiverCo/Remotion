/**
 * Google Cloud Text-to-Speech (cota GRÁTIS mensal; exige conta Google Cloud com faturamento ativo).
 * - Neural2 / Wavenet: SSML com <mark> antes de cada palavra + enableTimePointing → tempo EXATO de cada palavra.
 * - Chirp 3 HD (as vozes mais naturais), Studio e Journey não devolvem esses tempos: são sintetizadas FRASE POR FRASE
 *   (um .wav por frase, em cache) e sincronizadas pelas pausas do áudio, como as vozes locais (local.ts).
 * Ambiente/.env: GOOGLE_TTS_API_KEY (chave restrita à "Cloud Text-to-Speech API"),
 *       GOOGLE_TTS_VOZ (padrão pt-BR-Neural2-B; ex.: pt-BR-Chirp3-HD-Charon),
 *       GOOGLE_TTS_VELOCIDADE (0,25–4; padrão 1,05)
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ssmlWithMarks, timepointsToCaptions, type Timepoint } from "../../../src/lib/captions.ts";
import type { Roteiro } from "../../../src/lib/schema.ts";
import { scriptWords, spokenWords, type ScriptWord } from "../../../src/lib/words.ts";
import { cacheDir, fail, ffprobeDurationMs, publicDir, readJson, run, writeJson } from "../project.ts";
import { isEnglish } from "./choose.ts";
import { ensureVenv, spokenPhrases, synthesizeLocal } from "./local.ts";
import type { TtsEngine, TtsResult } from "./types.ts";

/** GOOGLE_TTS_API_BASE serve só para testes (servidor local que imita a API). */
const API = process.env.GOOGLE_TTS_API_BASE || "https://texttospeech.googleapis.com";

/** Vozes sem marcas SSML (sem tempo por palavra): sintetizadas frase por frase. */
export const isPhraseVoice = (voz: string) => /Chirp|Studio|Journey/i.test(voz);

/** Vozes que já recusaram `speakingRate` nesta execução (não tenta de novo a cada frase). */
const NO_RATE = new Set<string>();

/**
 * Sintetiza UMA frase em WAV (LINEAR16, 24 kHz) e guarda em cache (`dir/<hash>.wav`).
 * Se a voz não aceitar `speakingRate`, tenta de novo na velocidade normal e avisa.
 */
export const googlePhraseWav = async (o: {
  text: string;
  voz: string;
  velocidade: number;
  languageCode: string;
  dir: string;
  fromCache?: boolean;
}): Promise<string> => {
  const hash = crypto.createHash("sha1").update(`${o.voz}|${o.velocidade}|${o.text}`).digest("hex").slice(0, 16);
  const file = path.join(o.dir, `${hash}.wav`);
  if (fs.existsSync(file)) return file;
  if (o.fromCache) fail(`Falta no cache a frase "${o.text.slice(0, 50)}…" (voz ${o.voz}). Rode sem --from-cache.`);
  const key = keyOrFail();
  const call = (rate?: number) =>
    fetch(`${API}/v1/text:synthesize?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text: o.text },
        voice: { languageCode: o.languageCode, name: o.voz },
        audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000, ...(rate !== undefined ? { speakingRate: rate } : {}) },
      }),
    });
  const useRate = o.velocidade !== 1 && !NO_RATE.has(o.voz);
  let res = await call(useRate ? o.velocidade : undefined);
  if (!res.ok && res.status === 400 && useRate) {
    const msg = await res.text();
    if (!/speak|rate|velocidad/i.test(msg)) fail(`Google respondeu 400: ${msg.slice(0, 800)}`);
    NO_RATE.add(o.voz);
    console.log(`\n⚠ A voz ${o.voz} não aceitou a velocidade ${o.velocidade}; usando 1,0 nas frases dela.`);
    res = await call(undefined);
  }
  if (!res.ok) fail(`Google respondeu ${res.status}: ${(await res.text()).slice(0, 800)}`);
  const data = (await res.json()) as { audioContent?: string };
  if (!data.audioContent) fail(`O Google não devolveu áudio para "${o.text.slice(0, 50)}…".`);
  fs.mkdirSync(o.dir, { recursive: true });
  fs.writeFileSync(file, Buffer.from(data.audioContent!, "base64"));
  return file;
};

/** Narração com uma voz sem marcas (Chirp 3 HD…): frase por frase + sincronia pelas pausas do áudio. */
const googleByPhrase = async (
  slug: string,
  roteiro: Roteiro,
  o: { voz: string; velocidade: number; languageCode: string; fromCache?: boolean; dryRun?: boolean },
): Promise<TtsResult | null> => {
  const phrases = spokenPhrases(roteiro);
  const chars = phrases.reduce((a, p) => a + p.text.length, 0);
  const label = `Google Cloud TTS · voz ${o.voz} · velocidade ${o.velocidade} · frase por frase`;
  if (o.dryRun) {
    console.log(`ℹ ${label}: ${phrases.length} frases, ~${chars} caracteres.`);
    phrases.forEach((p, i) => console.log(`   ${String(i + 1).padStart(2)}. [cena ${p.scene + 1}] ${p.text}`));
    return null;
  }
  const dir = path.join(cacheDir(), "google-frases");
  const files: string[] = [];
  for (const [i, p] of phrases.entries()) {
    process.stdout.write(`\r→ Google TTS: frase ${i + 1}/${phrases.length} (voz ${o.voz})   `);
    files.push(await googlePhraseWav({ text: p.text, voz: o.voz, velocidade: o.velocidade, languageCode: o.languageCode, dir, fromCache: o.fromCache }));
  }
  process.stdout.write("\n");
  const python = ensureVenv(["soundfile==0.14.0"], "import numpy, soundfile");
  return synthesizeLocal({ slug, roteiro, motor: "google", python, args: [], label, files });
};
/** Limite da API é 5000 bytes de entrada; deixamos folga. */
const MAX_SSML_BYTES = 4500;

type Chunk = { firstIndex: number; words: ScriptWord[]; ssml: string };
type GoogleResponse = { audioContent: string; timepoints?: Timepoint[] };

/** Agrupa cenas inteiras em pedaços que cabem no limite da API (divide cena grande por frase). */
export const chunkForGoogle = (words: ScriptWord[]): Chunk[] => {
  const units: { first: number; words: ScriptWord[] }[] = [];
  let cur: ScriptWord[] = [];
  let first = 0;
  words.forEach((w, i) => {
    if (cur.length === 0) first = i;
    cur.push(w);
    const next = words[i + 1];
    if (!next || next.scene !== w.scene || /[.!?…]$/.test(w.text)) {
      units.push({ first, words: cur });
      cur = [];
    }
  });
  const chunks: Chunk[] = [];
  let acc: { first: number; words: ScriptWord[] } | null = null;
  for (const u of units) {
    if (acc) {
      const candidate = [...acc.words, ...u.words];
      if (Buffer.byteLength(ssmlWithMarks(candidate, { firstIndex: acc.first })) <= MAX_SSML_BYTES) {
        acc.words = candidate;
        continue;
      }
      chunks.push({ firstIndex: acc.first, words: acc.words, ssml: ssmlWithMarks(acc.words, { firstIndex: acc.first }) });
    }
    acc = { first: u.first, words: [...u.words] };
  }
  if (acc) chunks.push({ firstIndex: acc.first, words: acc.words, ssml: ssmlWithMarks(acc.words, { firstIndex: acc.first }) });
  for (const c of chunks) {
    if (Buffer.byteLength(c.ssml) > 5000) fail("Uma frase do roteiro é longa demais para o Google TTS (> 5000 bytes). Quebre-a.");
  }
  return chunks;
};

const keyOrFail = () => {
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!key) {
    fail(
      "Defina GOOGLE_TTS_API_KEY no .env.\n" +
        "Google Cloud Console → APIs e serviços → ative \"Cloud Text-to-Speech API\" → Credenciais → Criar chave de API (restrinja à Text-to-Speech).",
    );
  }
  return key!;
};

export const listGoogleVoices = async () => {
  const res = await fetch(`${API}/v1/voices?languageCode=pt-BR&key=${keyOrFail()}`);
  if (!res.ok) fail(`Google respondeu ${res.status}: ${(await res.text()).slice(0, 600)}`);
  const data = (await res.json()) as { voices: { name: string; ssmlGender: string; naturalSampleRateHertz: number }[] };
  for (const v of data.voices.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`${v.name.padEnd(32)} ${v.ssmlGender}`);
  }
  console.log("ℹ Neural2/Wavenet: legenda com tempo exato por palavra. Chirp 3 HD (mais naturais): frase por frase, sincronizadas pelas pausas.");
};

/** Vozes do Google para um idioma (para as amostras). */
export const googleVoices = async (languageCode: string) => {
  const res = await fetch(`${API}/v1/voices?languageCode=${languageCode}&key=${keyOrFail()}`);
  if (!res.ok) fail(`Google respondeu ${res.status}: ${(await res.text()).slice(0, 600)}`);
  const data = (await res.json()) as { voices?: { name: string; ssmlGender: string }[] };
  return (data.voices ?? []).sort((a, b) => a.name.localeCompare(b.name));
};

export const google: TtsEngine = async (slug, roteiro, opts) => {
  const words = scriptWords(roteiro);
  const en = isEnglish(roteiro.idioma);
  const languageCode = en ? "en-US" : "pt-BR";
  const envVoz = process.env.GOOGLE_TTS_VOZ;
  // a voz do roteiro (vozId) só vale se for uma voz do Google (ex.: "cadu" é do Piper)
  const opVoz = opts.voz && opts.voz.startsWith(languageCode) ? opts.voz : undefined;
  const voz = opVoz || (envVoz && envVoz.startsWith(languageCode) ? envVoz : en ? "en-US-Neural2-D" : "pt-BR-Neural2-B");
  const velocidade = opts.velocidade ?? parseFloat(process.env.GOOGLE_TTS_VELOCIDADE || "1.05");
  if (isPhraseVoice(voz)) {
    return googleByPhrase(slug, roteiro, { voz, velocidade, languageCode, fromCache: opts.fromCache, dryRun: opts.dryRun });
  }
  // SSML com o texto "falado" (pronúncias do roteiro); as marcas usam os mesmos índices da legenda
  const chunks = chunkForGoogle(spokenWords(words, roteiro.pronuncias));
  const cacheFile = path.join(cacheDir(), `${slug}-google.json`);
  const ssmlBytes = chunks.reduce((a, c) => a + Buffer.byteLength(c.ssml), 0);
  const textChars = words.reduce((a, w) => a + w.text.length + 1, 0);

  if (opts.dryRun) {
    console.log(
      `ℹ Google TTS: ${chunks.length} requisição(ões), SSML ${ssmlBytes} bytes, ~${textChars} caracteres de texto, voz ${voz}, velocidade ${velocidade}.`,
    );
    console.log(chunks[0].ssml.slice(0, 400) + (chunks[0].ssml.length > 400 ? "…" : ""));
    return null;
  }
  let responses: GoogleResponse[];
  if (opts.fromCache) {
    if (!fs.existsSync(cacheFile)) fail(`Não há cache em ${cacheFile}. Rode sem --from-cache.`);
    responses = readJson<GoogleResponse[]>(cacheFile);
    if (responses.length !== chunks.length) fail("O cache não corresponde ao roteiro atual. Rode sem --from-cache.");
  } else {
    const key = keyOrFail();
    responses = [];
    for (const [i, c] of chunks.entries()) {
      console.log(`→ Google TTS ${i + 1}/${chunks.length}: ${c.words.length} palavras, voz ${voz}`);
      const res = await fetch(`${API}/v1beta1/text:synthesize?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { ssml: c.ssml },
          voice: { languageCode, name: voz },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: velocidade,
            sampleRateHertz: 44100,
            effectsProfileId: ["headphone-class-device"],
          },
          enableTimePointing: ["SSML_MARK"],
        }),
      });
      if (!res.ok) fail(`Google respondeu ${res.status}: ${(await res.text()).slice(0, 800)}`);
      responses.push((await res.json()) as GoogleResponse);
    }
    writeJson(cacheFile, responses);
  }

  // Decodifica cada pedaço, mede a duração e desloca os timepoints.
  const work = path.join(cacheDir(), `${slug}-google`);
  fs.mkdirSync(work, { recursive: true });
  const parts: string[] = [];
  const timepoints: Timepoint[] = [];
  let offsetMs = 0;
  responses.forEach((r, i) => {
    const file = path.join(work, `parte-${i}.mp3`);
    fs.writeFileSync(file, Buffer.from(r.audioContent, "base64"));
    parts.push(file);
    for (const tp of r.timepoints ?? []) timepoints.push({ markName: tp.markName, timeSeconds: tp.timeSeconds + offsetMs / 1000 });
    offsetMs += ffprobeDurationMs(file);
  });

  const audioRel = `${slug}/narracao.mp3`;
  const audioAbs = path.join(publicDir(slug), "narracao.mp3");
  fs.mkdirSync(publicDir(slug), { recursive: true });
  if (parts.length === 1) {
    run("ffmpeg", ["-y", "-v", "error", "-i", parts[0], "-ac", "1", "-ar", "44100", "-b:a", "160k", audioAbs]);
  } else {
    const inputs = parts.flatMap((p) => ["-i", p]);
    const filter = `${parts.map((_, i) => `[${i}:a]`).join("")}concat=n=${parts.length}:v=0:a=1[a]`;
    run("ffmpeg", ["-y", "-v", "error", ...inputs, "-filter_complex", filter, "-map", "[a]", "-ac", "1", "-ar", "44100", "-b:a", "160k", audioAbs]);
  }

  const missing = words.length - timepoints.length;
  if (missing > 0) console.log(`⚠ O Google devolveu ${timepoints.length}/${words.length} marcas; as que faltaram foram interpoladas.`);

  return {
    audioRel,
    audioAbs,
    captions: timepointsToCaptions(timepoints, words, ffprobeDurationMs(audioAbs)),
    source: "google",
    info: `Google Cloud TTS · voz ${voz} · velocidade ${velocidade} · ${chunks.length} requisição(ões)`,
  };
};
