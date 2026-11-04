/**
 * Sua própria voz → legendas sincronizadas.
 * 1) converte o áudio para WAV 16 kHz mono (ffmpeg)
 * 2) transcreve com whisper.cpp (instalado automaticamente em .whisper/ na 1ª vez)
 * 3) alinha as palavras transcritas com o roteiro: o TEXTO da legenda é sempre o do roteiro,
 *    o Whisper só fornece os tempos (corrige erros como "arquíferos" → "aquíferos").
 *
 * Uso: npm run transcribe -- <slug> --audio caminho/da/gravacao.m4a [--model medium]
 * .env: WHISPER_MODEL (padrão medium), WHISPER_CPP_VERSION (padrão 1.7.6)
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
  type WhisperModel,
} from "@remotion/install-whisper-cpp";
import { alignTimedWordsToScript, mergeWhisperTokens } from "../src/lib/captions.ts";
import { scriptWords } from "../src/lib/words.ts";
import {
  cacheDir,
  fail,
  ffprobeDurationMs,
  hasBinary,
  loadRoteiro,
  publicDir,
  requireSlug,
  run,
  saveCaptionsAndTimeline,
  writeJson,
} from "./lib/project.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    audio: { type: "string" },
    model: { type: "string" },
  },
});
const slug = requireSlug(positionals, "npm run transcribe -- <slug> --audio <arquivo>");
if (!values.audio) fail("Passe o arquivo da sua gravação: --audio caminho/arquivo.(mp3|wav|m4a)");
if (!fs.existsSync(values.audio!)) fail(`Arquivo não encontrado: ${values.audio}`);
if (!hasBinary("ffmpeg")) fail("Instale o ffmpeg (https://ffmpeg.org) e tente de novo.");

const roteiro = loadRoteiro(slug);
const model = (values.model ?? process.env.WHISPER_MODEL ?? "medium") as WhisperModel;
const version = process.env.WHISPER_CPP_VERSION ?? "1.7.6";
const whisperPath = path.join(process.cwd(), ".whisper");

// 1) Copia a gravação para public/<slug>/ (o Remotion só lê arquivos de public/)
fs.mkdirSync(publicDir(slug), { recursive: true });
const audioRel = `${slug}/narracao.mp3`;
const audioAbs = path.join(publicDir(slug), "narracao.mp3");
run("ffmpeg", ["-y", "-v", "error", "-i", values.audio!, "-ac", "1", "-ar", "44100", "-b:a", "192k", audioAbs]);

const wav = path.join(cacheDir(), `${slug}-16k.wav`);
fs.mkdirSync(cacheDir(), { recursive: true });
run("ffmpeg", ["-y", "-v", "error", "-i", audioAbs, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav]);

// 2) Whisper
console.log(`→ whisper.cpp ${version}, modelo ${model} (a 1ª execução baixa e compila; pode demorar)`);
await installWhisperCpp({ to: whisperPath, version, printOutput: false });
await downloadWhisperModel({ model, folder: whisperPath, printOutput: true });
const output = await transcribe({
  inputPath: wav,
  whisperPath,
  whisperCppVersion: version,
  model,
  tokenLevelTimestamps: true,
  splitOnWord: true,
  language: "Portuguese",
  printOutput: false,
});
writeJson(path.join(cacheDir(), `${slug}-whisper.json`), output);
const { captions: raw } = toCaptions({ whisperCppOutput: output });

// 3) Alinha com o roteiro
const timed = mergeWhisperTokens(raw.map((c) => ({ text: c.text, startMs: c.startMs, endMs: c.endMs })));
const words = scriptWords(roteiro);
const captions = alignTimedWordsToScript(timed, words);
console.log(`ℹ Whisper ouviu ${timed.length} palavras; o roteiro tem ${words.length}.`);
if (Math.abs(timed.length - words.length) > words.length * 0.15) {
  console.log("⚠ Diferença grande: confira se a gravação segue o roteiro aprovado (frases puladas/trocadas).");
}

saveCaptionsAndTimeline(slug, roteiro, captions, {
  audio: audioRel,
  source: "whisper",
  audioDurationMs: ffprobeDurationMs(audioAbs),
});
