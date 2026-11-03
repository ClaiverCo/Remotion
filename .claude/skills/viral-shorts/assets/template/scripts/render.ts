/**
 * Renderiza o vídeo 1080×1920 (H.264) para out/<slug>/.
 *
 * Uso: npm run render -- <slug> [--draft] [--frames 0-90]
 *   --draft   metade da resolução, mais rápido, para revisar o movimento → out/<slug>/rascunho.mp4
 *   --frames  renderiza só um trecho (ex.: 120-240)
 * Saída final: out/<slug>/bruto.mp4 (depois rode npm run finalize -- <slug>)
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { renderMedia } from "@remotion/renderer";
import { outDir, requireSlug } from "./lib/project.ts";
import { prepare } from "./lib/remotion.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    draft: { type: "boolean", default: false },
    frames: { type: "string" },
  },
});
const slug = requireSlug(positionals, "npm run render -- <slug> [--draft]");
const draft = values.draft!;
const out = path.join(outDir(slug), draft ? "rascunho.mp4" : "bruto.mp4");
fs.mkdirSync(outDir(slug), { recursive: true });

const { serveUrl, chromiumOptions, browser, composition, browserExecutable } = await prepare(slug);

let frameRange: [number, number] | null = null;
if (values.frames) {
  const [a, b] = values.frames.split("-").map((n) => parseInt(n, 10));
  frameRange = [a, Math.min(b, composition.durationInFrames - 1)];
}

const started = Date.now();
let lastPct = -1;
await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation: out,
  crf: draft ? 28 : 18,
  pixelFormat: "yuv420p",
  imageFormat: "jpeg",
  jpegQuality: draft ? 75 : 92,
  audioBitrate: "192k",
  scale: draft ? 0.5 : 1,
  frameRange,
  chromiumOptions,
  browserExecutable,
  puppeteerInstance: browser,
  overwrite: true,
  onProgress: ({ progress }) => {
    const pct = Math.floor(progress * 100);
    if (pct !== lastPct && pct % 5 === 0) {
      lastPct = pct;
      process.stdout.write(`\r→ renderizando ${pct}%   `);
    }
  },
});
await browser.close({ silent: true });
const secs = ((Date.now() - started) / 1000).toFixed(0);
console.log(`\n✔ ${path.relative(process.cwd(), out)} (${composition.durationInFrames} frames, ${secs}s)`);
console.log(draft ? "ℹ Rascunho pronto. Para o final: npm run render -- " + slug : `ℹ Próximo: npm run qa -- ${slug} e npm run finalize -- ${slug}`);
