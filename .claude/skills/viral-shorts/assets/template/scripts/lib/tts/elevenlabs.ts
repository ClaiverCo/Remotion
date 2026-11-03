/**
 * ElevenLabs (pago; tem plano grátis com limite mensal): endpoint /with-timestamps.
 * O alinhamento por caractere vira legenda palavra a palavra (tempos exatos).
 * .env: ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL_ID,
 *       ELEVENLABS_STABILITY / _SIMILARITY / _STYLE / _SPEED
 */
import fs from "node:fs";
import path from "node:path";
import { elevenLabsToCaptions, type ElevenLabsAlignment } from "../../../src/lib/captions.ts";
import { narrationText, scriptWords } from "../../../src/lib/words.ts";
import { cacheDir, fail, publicDir, readJson, writeJson } from "../project.ts";
import type { TtsEngine } from "./types.ts";

type TtsResponse = {
  audio_base64: string;
  alignment: ElevenLabsAlignment | null;
  normalized_alignment: ElevenLabsAlignment | null;
};

const num = (v: string | undefined, d: number) => (v ? parseFloat(v) : d);

export const elevenlabs: TtsEngine = async (slug, roteiro, opts) => {
  const words = scriptWords(roteiro);
  const text = narrationText(roteiro);
  const cacheFile = path.join(cacheDir(), `${slug}-elevenlabs.json`);
  const voice = opts.voz ?? process.env.ELEVENLABS_VOICE_ID;
  const model = opts.modelo ?? process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";

  if (opts.dryRun) {
    console.log(`ℹ ElevenLabs: ${text.length} caracteres seriam cobrados (voz ${voice ?? "?"}, modelo ${model}).`);
    return null;
  }

  let response: TtsResponse;
  if (opts.fromCache) {
    if (!fs.existsSync(cacheFile)) fail(`Não há cache em ${cacheFile}. Rode sem --from-cache.`);
    response = readJson<TtsResponse>(cacheFile);
  } else {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) fail("Defina ELEVENLABS_API_KEY no .env (veja .env.example).");
    if (!voice) fail("Defina ELEVENLABS_VOICE_ID no .env ou passe --voz <id>.");
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
            speed: opts.velocidade ?? num(process.env.ELEVENLABS_SPEED, 1.05),
            use_speaker_boost: true,
          },
        }),
      },
    );
    if (!res.ok) fail(`ElevenLabs respondeu ${res.status}: ${(await res.text()).slice(0, 800)}`);
    response = (await res.json()) as TtsResponse;
    writeJson(cacheFile, response);
  }

  const alignment = response.alignment ?? response.normalized_alignment;
  if (!alignment) fail("A resposta do ElevenLabs veio sem alinhamento (alignment).");

  const audioRel = `${slug}/narracao.mp3`;
  const audioAbs = path.join(publicDir(slug), "narracao.mp3");
  fs.mkdirSync(publicDir(slug), { recursive: true });
  fs.writeFileSync(audioAbs, Buffer.from(response.audio_base64, "base64"));

  return {
    audioRel,
    audioAbs,
    captions: elevenLabsToCaptions(alignment!, words),
    source: "elevenlabs",
    info: `ElevenLabs · voz ${voice ?? "(cache)"} · ${model}`,
  };
};
