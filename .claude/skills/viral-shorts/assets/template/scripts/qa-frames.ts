/**
 * QA visual: gera um PNG por cena (no meio dela) + uma prancha com todas,
 * para o Claude (ou você) OLHAR antes de entregar. Não entregue vídeo sem ver os frames.
 *
 * Uso: npm run qa -- <slug> [--at 0.45] [--extra 3.2,10.5]
 *   --at     posição dentro de cada cena (0 a 1), padrão 0.45
 *   --extra  segundos adicionais para capturar (ex.: momentos de animação crítica)
 * Saída: out/<slug>/qa/cena-01.png ... e out/<slug>/qa/prancha.png
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { renderStill } from "@remotion/renderer";
import type { Timeline } from "../src/lib/types.ts";
import { outDir, readJson, requireSlug, run, videoDir } from "./lib/project.ts";
import { prepare } from "./lib/remotion.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    at: { type: "string", default: "0.45" },
    extra: { type: "string" },
  },
});
const slug = requireSlug(positionals, "npm run qa -- <slug>");
const timeline = readJson<Timeline>(path.join(videoDir(slug), "timeline.json"));
const qaDir = path.join(outDir(slug), "qa");
fs.rmSync(qaDir, { recursive: true, force: true });
fs.mkdirSync(qaDir, { recursive: true });

const at = parseFloat(values.at!);
const shots: { name: string; ms: number }[] = timeline.scenes.map((s, i) => ({
  name: `cena-${String(i + 1).padStart(2, "0")}-${s.id}`,
  ms: s.startMs + (s.endMs - s.startMs) * at,
}));
for (const sec of (values.extra ?? "").split(",").filter(Boolean)) {
  shots.push({ name: `extra-${sec.replace(".", "_")}s`, ms: parseFloat(sec) * 1000 });
}

const { serveUrl, chromiumOptions, browser, composition, browserExecutable } = await prepare(slug);
const files: string[] = [];
for (const [i, shot] of shots.entries()) {
  const frame = Math.min(
    composition.durationInFrames - 1,
    Math.round((shot.ms / 1000) * composition.fps),
  );
  const file = path.join(qaDir, `${shot.name}.png`);
  await renderStill({
    composition,
    serveUrl,
    output: file,
    frame,
    scale: 0.5,
    imageFormat: "png",
    chromiumOptions,
    browserExecutable,
    puppeteerInstance: browser,
    overwrite: true,
  });
  // cópia numerada para montar a prancha
  fs.copyFileSync(file, path.join(qaDir, `_${String(i).padStart(3, "0")}.png`));
  files.push(file);
  console.log(`✔ ${path.relative(process.cwd(), file)} (frame ${frame})`);
}
await browser.close({ silent: true });

const cols = Math.min(4, files.length);
const rows = Math.ceil(files.length / cols);
run(
  "ffmpeg",
  [
    "-y", "-v", "error",
    "-framerate", "1",
    "-i", path.join(qaDir, "_%03d.png"),
    "-vf", `scale=270:-1,tile=${cols}x${rows}:padding=8:margin=8:color=white`,
    "-frames:v", "1",
    path.join(qaDir, "prancha.png"),
  ],
  { quiet: true },
);
for (const f of fs.readdirSync(qaDir)) if (f.startsWith("_")) fs.rmSync(path.join(qaDir, f));
console.log(`✔ prancha: ${path.relative(process.cwd(), path.join(qaDir, "prancha.png"))}`);
console.log("ℹ Olhe cada frame: legenda legível e dentro da área segura? selo visível? cena mostra o que a narração diz?");
