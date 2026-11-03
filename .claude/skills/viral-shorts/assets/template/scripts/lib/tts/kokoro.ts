/**
 * Kokoro (GRÁTIS, local, offline, Apache 2.0): voz neural rodando no seu PC.
 * Na 1ª vez: cria .tts/venv (Python 3.10+), instala kokoro-onnx e baixa o modelo (~350 MB).
 * Vozes pt-BR: pm_alex (masc., padrão), pm_santa (masc.), pf_dora (fem.).
 * .env: KOKORO_VOZ, KOKORO_VELOCIDADE (0,5–2; padrão 1,05), KOKORO_MODELO
 *       (kokoro-v1.0.onnx | kokoro-v1.0.fp16.onnx | kokoro-v1.0.int8.onnx — menor e mais rápido)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { clauseBreaks, distributeWords, findClausePauses, phrasesFromWords, sanitizeCaptions } from "../../../src/lib/captions.ts";
import type { VideoCaption } from "../../../src/lib/types.ts";
import { scriptWords } from "../../../src/lib/words.ts";
import { cacheDir, fail, publicDir, ROOT, run, writeJson } from "../project.ts";
import type { TtsEngine } from "./types.ts";

const TTS_DIR = path.join(ROOT, ".tts");
const VENV = path.join(TTS_DIR, "venv");
const RELEASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0";
const PIP_PACKAGES = ["kokoro-onnx==0.6.1", "soundfile==0.14.0"];
const SCRIPT = path.join(ROOT, "scripts", "py", "kokoro_tts.py");

const venvPython = () =>
  process.platform === "win32" ? path.join(VENV, "Scripts", "python.exe") : path.join(VENV, "bin", "python");

/** Encontra um Python 3.10+ no sistema. */
const findSystemPython = (): string[] => {
  const candidates: string[][] =
    process.platform === "win32" ? [["py", "-3"], ["python"], ["python3"]] : [["python3"], ["python"]];
  for (const c of candidates) {
    const r = spawnSync(c[0], [...c.slice(1), "-c", "import sys; print(sys.version_info[:2] >= (3, 10))"], {
      encoding: "utf8",
    });
    if (r.status === 0 && r.stdout.trim() === "True") return c;
  }
  return fail(
    "Python 3.10+ não encontrado. Instale em https://www.python.org/downloads/ (no Windows, marque \"Add to PATH\") e rode de novo.",
  );
};

const download = async (url: string, dest: string) => {
  const res = await fetch(url);
  if (!res.ok || !res.body) fail(`Falha ao baixar ${url} (${res.status}).`);
  const total = Number(res.headers.get("content-length") ?? 0);
  let got = 0;
  let last = -1;
  const body = Readable.fromWeb(res.body as never);
  body.on("data", (chunk: Buffer) => {
    got += chunk.length;
    const pct = total ? Math.floor((got / total) * 100) : 0;
    if (pct !== last && pct % 10 === 0) {
      last = pct;
      process.stdout.write(`\r  baixando ${path.basename(dest)} ${pct}% (${(got / 1e6).toFixed(0)} MB)   `);
    }
  });
  const tmp = `${dest}.part`;
  await pipeline(body, fs.createWriteStream(tmp));
  fs.renameSync(tmp, dest);
  process.stdout.write("\n");
};

/** Prepara Python + kokoro-onnx + modelo (só na 1ª vez). */
export const ensureKokoro = async (modelo: string) => {
  fs.mkdirSync(TTS_DIR, { recursive: true });
  if (!fs.existsSync(venvPython())) {
    const py = findSystemPython();
    console.log("→ Kokoro: criando ambiente Python em .tts/venv (1ª vez)…");
    run(py[0], [...py.slice(1), "-m", "venv", VENV]);
  }
  const check = spawnSync(venvPython(), ["-I", "-c", "import kokoro_onnx, soundfile"], { stdio: "ignore" });
  if (check.status !== 0) {
    console.log(`→ Kokoro: instalando ${PIP_PACKAGES.join(", ")}…`);
    run(venvPython(), ["-m", "pip", "install", "--disable-pip-version-check", "-q", ...PIP_PACKAGES]);
  }
  const modelPath = path.join(TTS_DIR, modelo);
  const voicesPath = path.join(TTS_DIR, "voices-v1.0.bin");
  if (!fs.existsSync(modelPath)) {
    console.log(`→ Kokoro: baixando o modelo ${modelo} (1ª vez)…`);
    await download(`${RELEASE}/${modelo}`, modelPath);
  }
  if (!fs.existsSync(voicesPath)) await download(`${RELEASE}/voices-v1.0.bin`, voicesPath);
  return { python: venvPython(), modelPath, voicesPath };
};

type Span = { startMs: number; endMs: number };
type KokoroOut = {
  sampleRate: number;
  durationMs: number;
  frameMs: number;
  phrases: (Span & { pauses: Span[]; envStartMs: number; envelope: number[] })[];
};

export const kokoro: TtsEngine = async (slug, roteiro, opts) => {
  const words = scriptWords(roteiro);
  const phrases = phrasesFromWords(words);
  const voz = opts.voz ?? process.env.KOKORO_VOZ ?? "pm_alex";
  const velocidade = opts.velocidade ?? parseFloat(process.env.KOKORO_VELOCIDADE ?? "1.05");
  const modelo = opts.modelo ?? process.env.KOKORO_MODELO ?? "kokoro-v1.0.onnx";

  if (opts.dryRun) {
    console.log(`ℹ Kokoro (grátis): ${phrases.length} frases, ${words.length} palavras, voz ${voz}, velocidade ${velocidade}.`);
    phrases.forEach((p, i) => console.log(`   ${String(i + 1).padStart(2)}. [cena ${p.scene + 1}] ${p.text}`));
    return null;
  }

  const { python, modelPath, voicesPath } = await ensureKokoro(modelo);
  const work = path.join(cacheDir(), `${slug}-kokoro`);
  fs.mkdirSync(work, { recursive: true });
  const inFile = path.join(work, "frases.json");
  const wav = path.join(work, "narracao.wav");
  writeJson(
    inFile,
    phrases.map((p) => ({ text: p.text, pauseAfterMs: p.pauseAfterMs })),
  );

  console.log(`→ Kokoro: sintetizando ${phrases.length} frases (voz ${voz}, velocidade ${velocidade})…`);
  const r = spawnSync(
    python,
    [
      "-I", SCRIPT,
      "--entrada", inFile,
      "--saida", wav,
      "--modelo", modelPath,
      "--vozes", voicesPath,
      "--voz", voz,
      "--velocidade", String(velocidade),
      "--cache", path.join(work, "frases"),
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], maxBuffer: 32 * 1024 * 1024 },
  );
  if (r.status !== 0) fail(`O Kokoro falhou (código ${r.status}). Veja a mensagem acima.`);
  const out = JSON.parse(r.stdout) as KokoroOut;
  if (out.phrases.length !== phrases.length) fail("O Kokoro devolveu um número de frases diferente do esperado.");

  const audioRel = `${slug}/narracao.mp3`;
  const audioAbs = path.join(publicDir(slug), "narracao.mp3");
  fs.mkdirSync(publicDir(slug), { recursive: true });
  run("ffmpeg", ["-y", "-v", "error", "-i", wav, "-ac", "1", "-ar", "44100", "-b:a", "160k", audioAbs]);

  let captions: VideoCaption[] = [];
  let withCommas = 0;
  let synced = 0;
  phrases.forEach((p, i) => {
    const t = out.phrases[i];
    const breaks = clauseBreaks(p.words).length;
    // 1º: silêncios claros, se baterem com as vírgulas; 2º: vales de energia perto de cada vírgula
    const silences = t.pauses.filter((x) => x.startMs > t.startMs && x.endMs < t.endMs);
    const pauses =
      silences.length === breaks
        ? silences
        : findClausePauses(p.words, t.startMs, t.endMs, t.envelope, t.envStartMs, out.frameMs);
    if (breaks > 0) {
      withCommas++;
      if (pauses.length === breaks) synced++;
    }
    captions = captions.concat(distributeWords(p.words, t.startMs, t.endMs, p.first, pauses));
  });
  return {
    audioRel,
    audioAbs,
    captions: sanitizeCaptions(captions),
    source: "kokoro",
    info: `Kokoro (grátis, local) · voz ${voz} · velocidade ${velocidade} · ${phrases.length} frases · vírgulas sincronizadas pelo áudio em ${synced}/${withCommas} frases`,
  };
};
