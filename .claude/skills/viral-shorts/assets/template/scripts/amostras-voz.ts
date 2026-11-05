/**
 * Amostras de voz para o usuário ESCOLHER antes da narração final (Google Cloud TTS).
 * Gera, para cada voz, as frases de algumas cenas do roteiro (com as pronúncias dele) num mp3 só.
 *
 * Uso: npm run amostras-voz -- <slug> [--vozes pt-BR-Chirp3-HD-Charon,pt-BR-Neural2-B] [--cenas 1,5]
 *                                     [--quantas 4] [--genero MALE|FEMALE] [--velocidade 1.0] [--listar]
 * Sem --vozes: pega até `--quantas` vozes Chirp 3 HD do gênero pedido (padrão MALE) + a Neural2-B.
 * Saída: out/<slug>/amostras-voz/voz-<nome>.mp3. Precisa de GOOGLE_TTS_API_KEY no ambiente ou no .env.
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { cacheDir, fail, loadRoteiro, requireSlug, ROOT, run } from "./lib/project.ts";
import { isEnglish } from "./lib/tts/choose.ts";
import { googlePhraseWav, googleVoices } from "./lib/tts/google.ts";
import { spokenPhrases } from "./lib/tts/local.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    vozes: { type: "string" },
    cenas: { type: "string", default: "1,5" },
    quantas: { type: "string", default: "4" },
    genero: { type: "string", default: "MALE" },
    velocidade: { type: "string", default: "1.0" },
    listar: { type: "boolean", default: false },
  },
});

const slug = requireSlug(positionals, "npm run amostras-voz -- <slug> [--vozes a,b] [--cenas 1,5]");
const roteiro = loadRoteiro(slug);
const languageCode = isEnglish(roteiro.idioma) ? "en-US" : "pt-BR";
const velocidade = parseFloat(values.velocidade!.replace(",", "."));

const all = await googleVoices(languageCode);
if (values.listar) {
  for (const v of all) console.log(`${v.name.padEnd(34)} ${v.ssmlGender}`);
  process.exit(0);
}

let vozes: string[];
if (values.vozes) {
  vozes = values.vozes.split(",").map((v) => v.trim()).filter(Boolean);
} else {
  const chirp = all.filter((v) => /Chirp3-HD/i.test(v.name) && v.ssmlGender === values.genero!.toUpperCase());
  vozes = chirp.slice(0, parseInt(values.quantas!, 10)).map((v) => v.name);
  const neural = `${languageCode}-Neural2-${values.genero!.toUpperCase() === "MALE" ? "B" : "C"}`;
  if (all.some((v) => v.name === neural)) vozes.push(neural);
  if (!vozes.length) fail(`Não achei vozes Chirp 3 HD (${values.genero}) para ${languageCode}. Rode com --listar.`);
}
const unknown = vozes.filter((v) => !all.some((x) => x.name === v));
if (unknown.length) fail(`Vozes que o Google não lista para ${languageCode}: ${unknown.join(", ")}. Rode com --listar.`);

const cenas = values.cenas!.split(",").map((c) => parseInt(c, 10) - 1);
const frases = spokenPhrases(roteiro).filter((p) => cenas.includes(p.scene));
if (!frases.length) fail(`O roteiro não tem frases nas cenas ${values.cenas}.`);
const chars = frases.reduce((a, p) => a + p.text.length, 0);
console.log(`ℹ ${vozes.length} vozes × ${frases.length} frases (~${chars} caracteres por voz, ~${chars * vozes.length} no total).`);

const outDir = path.join(ROOT, "out", slug, "amostras-voz");
fs.mkdirSync(outDir, { recursive: true });
const work = path.join(cacheDir(), "google-frases");
const silence = path.join(work, "pausa-450ms-24k.wav");
fs.mkdirSync(work, { recursive: true });
if (!fs.existsSync(silence)) {
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "0.45", "-c:a", "pcm_s16le", silence]);
}

for (const voz of vozes) {
  const files: string[] = [];
  for (const p of frases) {
    files.push(await googlePhraseWav({ text: p.text, voz, velocidade, languageCode, dir: work }));
  }
  const list = path.join(work, `lista-${voz}.txt`);
  fs.writeFileSync(list, files.flatMap((f, i) => [`file '${f}'`, ...(i < files.length - 1 ? [`file '${silence}'`] : [])]).join("\n"));
  const nome = voz.replace(new RegExp(`^${languageCode}-`), "");
  const out = path.join(outDir, `voz-${nome}.mp3`);
  run("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-ac", "1", "-ar", "44100", "-b:a", "160k", out]);
  console.log(`✔ ${path.relative(ROOT, out)}`);
}
console.log(`ℹ Ouça e escolha; depois: "vozId": "<voz>" e "voz": "google" no roteiro.json e npm run tts:google -- ${slug}`);
