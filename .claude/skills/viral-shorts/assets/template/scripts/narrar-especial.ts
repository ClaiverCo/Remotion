/**
 * Narração do especial "kip-ventilador-no-3" (comédia sem roteiro.json): uma fala curta por legenda,
 * com a voz grátis e local do Piper (pt-BR). Cada fala vira public/kip-ventilador-no-3/fala-XX.mp3,
 * e a duração de cada uma é gravada em src/especiais/kip-ventilador-no-3/falas.json.
 *
 * Uso: npm run narrar-especial [-- --voz faber|cadu|jeff] [--velocidade 1.1]
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fail, hasBinary, ROOT, run } from "./lib/project.ts";
import { ensureVenv, TTS_DIR } from "./lib/tts/local.ts";
import { ensureVoice, PIPER_VOICES } from "./lib/tts/piper.ts";

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

/** Texto falado (números por extenso para a voz). A ordem segue as legendas do vídeo. */
export const FALAS = [
  "Quarenta graus na sombra.",
  "E o ventilador ali, só me olhando.",
  "Velocidade um.",
  "Só faz barulho.",
  "Velocidade dois.",
  "Agora sim.",
  "Mas e se... eu colocar no três?",
  "Velocidade três!",
  "Modo turbo!",
  "Pelo menos...",
  "parou de suar.",
  "E você? Usa no um, no dois, ou no três?",
];

if (!hasBinary("ffmpeg")) fail("Instale o ffmpeg.");
const voz = arg("voz", "faber");
const id = PIPER_VOICES[voz];
if (!id) fail(`Voz desconhecida: ${voz}`);
const velocidade = arg("velocidade", "1.05");

const python = ensureVenv(["piper-tts==1.8.0", "soundfile==0.14.0"], "import piper, soundfile");
const { onnx, json } = await ensureVoice(python, id);

const work = path.join(TTS_DIR, "cache", "kip-ventilador-no-3");
const pub = path.join(ROOT, "public", "kip-ventilador-no-3");
fs.mkdirSync(work, { recursive: true });
fs.mkdirSync(pub, { recursive: true });

const duracoes: { texto: string; arquivo: string; segundos: number }[] = [];
for (const [i, texto] of FALAS.entries()) {
  const n = String(i + 1).padStart(2, "0");
  const entrada = path.join(work, `fala-${n}.json`);
  const wav = path.join(work, `fala-${n}.wav`);
  fs.writeFileSync(entrada, JSON.stringify([{ text: texto, pauseAfterMs: 0 }]));
  const r = spawnSync(
    python,
    ["-I", path.join(ROOT, "scripts", "py", "tts_local.py"), "--motor", "piper", "--entrada", entrada, "--saida", wav, "--cache", path.join(work, "frases"), "--modelo", onnx, "--config", json, "--velocidade", velocidade],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  if (r.status !== 0) fail(`Piper falhou na fala ${n}.`);
  const mp3 = path.join(pub, `fala-${n}.mp3`);
  run("ffmpeg", ["-y", "-v", "error", "-i", wav, "-af", "loudnorm=I=-16:TP=-1.5", "-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "128k", mp3]);
  const out = JSON.parse(r.stdout) as { durationMs: number };
  duracoes.push({ texto, arquivo: `kip-ventilador-no-3/fala-${n}.mp3`, segundos: Math.round(out.durationMs) / 1000 });
  console.log(`✔ fala ${n} (${(out.durationMs / 1000).toFixed(2)} s): ${texto}`);
}
fs.writeFileSync(path.join(ROOT, "src", "especiais", "kip-ventilador-no-3", "falas.json"), JSON.stringify({ voz, velocidade: Number(velocidade), falas: duracoes }, null, 2) + "\n");
console.log("✔ src/especiais/kip-ventilador-no-3/falas.json");
