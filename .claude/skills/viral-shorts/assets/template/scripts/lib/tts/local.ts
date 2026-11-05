/**
 * Base dos motores GRÁTIS e locais (Piper e Kokoro): ambiente Python em .tts/venv,
 * downloads de modelo, síntese frase por frase (scripts/py/tts_local.py) e legendas.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  clauseBreaks,
  distributeWords,
  findClausePauses,
  phrasesFromWords,
  sanitizeCaptions,
  snapToSilences,
} from "../../../src/lib/captions.ts";
import type { Roteiro } from "../../../src/lib/schema.ts";
import type { VideoCaption } from "../../../src/lib/types.ts";
import { scriptWords, spokenWords } from "../../../src/lib/words.ts";
import { cacheDir, fail, publicDir, ROOT, run, writeJson } from "../project.ts";
import type { TtsResult } from "./types.ts";

export const TTS_DIR = path.join(ROOT, ".tts");
const VENV = path.join(TTS_DIR, "venv");
const SCRIPT = path.join(ROOT, "scripts", "py", "tts_local.py");

export const venvPython = () =>
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

/** Cria .tts/venv (1ª vez) e instala os pacotes se o import falhar. */
export const ensureVenv = (packages: string[], importCheck: string) => {
  fs.mkdirSync(TTS_DIR, { recursive: true });
  if (!fs.existsSync(venvPython())) {
    const py = findSystemPython();
    console.log("→ criando ambiente Python em .tts/venv (1ª vez)…");
    run(py[0], [...py.slice(1), "-m", "venv", VENV]);
  }
  const check = spawnSync(venvPython(), ["-I", "-c", importCheck], { stdio: "ignore" });
  if (check.status !== 0) {
    console.log(`→ instalando ${packages.join(", ")}…`);
    run(venvPython(), ["-m", "pip", "install", "--disable-pip-version-check", "-q", ...packages]);
  }
  return venvPython();
};

/** Baixa um arquivo com barra de progresso (grava em .part e renomeia no fim). */
export const download = async (url: string, dest: string): Promise<boolean> => {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return false;
  }
  if (!res.ok || !res.body) return false;
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
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const tmp = `${dest}.part`;
  await pipeline(body, fs.createWriteStream(tmp));
  fs.renameSync(tmp, dest);
  process.stdout.write("\n");
  return true;
};

type Span = { startMs: number; endMs: number };
type LocalOut = {
  sampleRate: number;
  durationMs: number;
  frameMs: number;
  phrases: (Span & { pauses: Span[]; envStartMs: number; envelope: number[] })[];
};

/** Texto FALADO de cada frase (com as pronúncias do roteiro), na mesma ordem de `phrasesFromWords`. */
export const spokenPhrases = (roteiro: Roteiro) => {
  const words = scriptWords(roteiro);
  const spoken = spokenWords(words, roteiro.pronuncias);
  return phrasesFromWords(words).map((p) => ({
    scene: p.scene,
    text: spoken.slice(p.first, p.first + p.words.length).map((w) => w.text).join(" "),
  }));
};

/**
 * Sintetiza a narração frase por frase com o motor local e monta as legendas:
 * início de cada frase exato; vírgulas pelos silêncios/vales de energia do áudio.
 * Com `files` (um .wav por frase, já sintetizado por um motor online como o Google Chirp 3 HD),
 * o Python só junta e analisa os áudios, e a sincronia é a mesma das vozes locais.
 */
export const synthesizeLocal = (opts: {
  slug: string;
  roteiro: Roteiro;
  motor: "piper" | "kokoro" | "google";
  python: string;
  args: string[];
  label: string;
  files?: string[];
}): TtsResult => {
  const { slug, roteiro, motor, python, args, label, files } = opts;
  const words = scriptWords(roteiro);
  const spoken = spokenWords(words, roteiro.pronuncias);
  const phrases = phrasesFromWords(words);
  if (files && files.length !== phrases.length) fail(`Esperava ${phrases.length} áudios de frase, recebi ${files.length}.`);
  const work = path.join(cacheDir(), `${slug}-${motor}${files ? "-frases" : ""}`);
  fs.mkdirSync(work, { recursive: true });
  const inFile = path.join(work, "frases.json");
  const wav = path.join(work, "narracao.wav");
  // texto falado usa as pronúncias do roteiro; a legenda continua com o texto original
  writeJson(
    inFile,
    phrases.map((p, i) => ({
      text: spoken.slice(p.first, p.first + p.words.length).map((w) => w.text).join(" "),
      pauseAfterMs: p.pauseAfterMs,
      ...(files ? { file: files[i] } : {}),
    })),
  );

  console.log(`→ ${label}: ${files ? "juntando e analisando" : "sintetizando"} ${phrases.length} frases…`);
  const r = spawnSync(
    python,
    ["-I", SCRIPT, "--motor", files ? "arquivos" : motor, "--entrada", inFile, "--saida", wav, "--cache", path.join(work, "frases"), ...args],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], maxBuffer: 64 * 1024 * 1024 },
  );
  if (r.status !== 0) fail(`O motor ${motor} falhou (código ${r.status}). Veja a mensagem acima.`);
  const out = JSON.parse(r.stdout) as LocalOut;
  if (out.phrases.length !== phrases.length) fail(`O motor ${motor} devolveu um número de frases diferente do esperado.`);

  const audioRel = `${slug}/narracao.mp3`;
  const audioAbs = path.join(publicDir(slug), "narracao.mp3");
  fs.mkdirSync(publicDir(slug), { recursive: true });
  run("ffmpeg", ["-y", "-v", "error", "-i", wav, "-ac", "1", "-ar", "44100", "-b:a", "160k", audioAbs]);

  let captions: VideoCaption[] = [];
  let withCommas = 0;
  let synced = 0;
  let breaths = 0;
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
    const caps = distributeWords(p.words, t.startMs, t.endMs, p.first, pauses);
    // silêncios claros que sobraram (respiração sem vírgula): encaixa na fronteira de palavra mais próxima
    const used = (x: Span) => pauses.some((q) => q.startMs < x.endMs && q.endMs > x.startMs);
    const extra = silences.filter((x) => !used(x));
    const snapped = snapToSilences(caps, extra);
    if (snapped !== caps) breaths += extra.length;
    captions = captions.concat(snapped);
  });

  return {
    audioRel,
    audioAbs,
    captions: sanitizeCaptions(captions),
    source: motor,
    info: `${label} · ${phrases.length} frases · vírgulas sincronizadas pelo áudio em ${synced}/${withCommas} frases${breaths ? ` · ${breaths} pausas sem vírgula encaixadas` : ""}`,
  };
};

export const dryRunLocal = (roteiro: Roteiro, label: string) => {
  const words = scriptWords(roteiro);
  const spoken = spokenWords(words, roteiro.pronuncias);
  const phrases = phrasesFromWords(words);
  console.log(`ℹ ${label}: ${phrases.length} frases, ${words.length} palavras.`);
  phrases.forEach((p, i) => {
    const said = spoken.slice(p.first, p.first + p.words.length).map((w) => w.text).join(" ");
    console.log(`   ${String(i + 1).padStart(2)}. [cena ${p.scene + 1}] ${said}${said !== p.text ? "   (pronúncia ajustada)" : ""}`);
  });
};
