import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { parseRoteiro, type Roteiro } from "../../src/lib/schema.ts";
import { buildTimeline } from "../../src/lib/timeline.ts";
import type { Timeline, VideoCaption } from "../../src/lib/types.ts";

dotenv.config({ quiet: true });

export const ROOT = process.cwd();
export const videoDir = (slug: string) => path.join(ROOT, "src", "videos", slug);
export const publicDir = (slug: string) => path.join(ROOT, "public", slug);
export const outDir = (slug: string) => path.join(ROOT, "out", slug);
export const cacheDir = () => path.join(ROOT, ".cache");

export const readJson = <T = unknown>(file: string): T =>
  JSON.parse(fs.readFileSync(file, "utf8")) as T;

export const writeJson = (file: string, data: unknown) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
};

export const fail = (msg: string): never => {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
};

export const requireSlug = (positionals: string[], usage: string): string => {
  const slug = positionals[0];
  if (!slug) fail(`Informe o slug do vídeo.\nUso: ${usage}`);
  if (!fs.existsSync(videoDir(slug!))) {
    fail(`Não achei src/videos/${slug}. Crie com: npm run new -- ${slug}`);
  }
  return slug!;
};

export const loadRoteiro = (slug: string): Roteiro =>
  parseRoteiro(readJson(path.join(videoDir(slug), "roteiro.json")));

export const run = (cmd: string, args: string[], opts: { quiet?: boolean } = {}) => {
  const r = spawnSync(cmd, args, {
    stdio: opts.quiet ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(
      `Falhou: ${cmd} ${args.join(" ")}\n${opts.quiet ? (r.stderr ?? "").slice(-2000) : ""}`,
    );
  }
  return r.stdout ?? "";
};

export const hasBinary = (bin: string) =>
  spawnSync(bin, ["-version"], { stdio: "ignore" }).status === 0;

export const ffprobeDurationMs = (file: string): number => {
  const out = run(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { quiet: true },
  );
  return Math.round(parseFloat(out.trim()) * 1000);
};

export const hasAudioStream = (file: string): boolean => {
  const out = run(
    "ffprobe",
    ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", file],
    { quiet: true },
  );
  return out.trim().length > 0;
};

/** Grava captions.json e timeline.json do vídeo (o que o Remotion lê). */
export const saveCaptionsAndTimeline = (
  slug: string,
  roteiro: Roteiro,
  captions: VideoCaption[],
  opts: { audio: string | null; source: Timeline["source"]; audioDurationMs?: number },
): Timeline => {
  const timeline = buildTimeline(roteiro, captions, opts);
  writeJson(path.join(videoDir(slug), "captions.json"), captions);
  writeJson(path.join(videoDir(slug), "timeline.json"), timeline);
  const secs = (timeline.durationMs / 1000).toFixed(1);
  console.log(
    `✔ ${captions.length} palavras · ${timeline.scenes.length} cenas · ${secs}s (${opts.source}) → src/videos/${slug}/captions.json + timeline.json`,
  );
  const alvo = roteiro.duracaoAlvoSeg;
  if (timeline.durationMs / 1000 > alvo * 1.25) {
    console.log(`⚠ Ficou ${secs}s, bem acima do alvo de ${alvo}s. Considere enxugar o roteiro.`);
  }
  return timeline;
};
