/**
 * Google Cloud Text-to-Speech (cota GRÁTIS mensal; exige conta Google Cloud com faturamento ativo).
 * Usa SSML com <mark> antes de cada palavra + enableTimePointing → tempo EXATO de cada palavra.
 * .env: GOOGLE_TTS_API_KEY (chave restrita à "Cloud Text-to-Speech API"),
 *       GOOGLE_TTS_VOZ (padrão pt-BR-Neural2-B, masculina; pt-BR-Neural2-C feminina),
 *       GOOGLE_TTS_VELOCIDADE (0,25–4; padrão 1,05)
 */
import fs from "node:fs";
import path from "node:path";
import { ssmlWithMarks, timepointsToCaptions, type Timepoint } from "../../../src/lib/captions.ts";
import { scriptWords, spokenWords, type ScriptWord } from "../../../src/lib/words.ts";
import { cacheDir, fail, ffprobeDurationMs, publicDir, readJson, run, writeJson } from "../project.ts";
import type { TtsEngine } from "./types.ts";

const API = "https://texttospeech.googleapis.com";
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
    console.log(`${v.name.padEnd(28)} ${v.ssmlGender}`);
  }
  console.log("ℹ Use vozes Neural2 ou Wavenet (aceitam marcas SSML, necessárias para a legenda exata).");
};

export const google: TtsEngine = async (slug, roteiro, opts) => {
  const words = scriptWords(roteiro);
  // SSML com o texto "falado" (pronúncias do roteiro); as marcas usam os mesmos índices da legenda
  const chunks = chunkForGoogle(spokenWords(words, roteiro.pronuncias));
  const voz = opts.voz ?? process.env.GOOGLE_TTS_VOZ ?? "pt-BR-Neural2-B";
  const velocidade = opts.velocidade ?? parseFloat(process.env.GOOGLE_TTS_VELOCIDADE ?? "1.05");
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
  if (/Chirp|Studio|Journey/i.test(voz)) {
    console.log(`⚠ A voz ${voz} pode não aceitar marcas SSML; se as legendas saírem estranhas, use Neural2 ou Wavenet.`);
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
          voice: { languageCode: "pt-BR", name: voz },
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
