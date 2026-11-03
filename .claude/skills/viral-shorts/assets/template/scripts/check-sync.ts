/**
 * Confere OBJETIVAMENTE se a legenda está sincronizada com a narração (sem precisar ouvir):
 * detecta os silêncios reais do áudio (ffmpeg silencedetect) e mede
 *   - palavras "faladas no silêncio" (legenda adiantada/atrasada)  → deve ser ~0
 *   - silêncios longos que caem entre palavras/frases (onde deveriam) → deve ser alto
 *
 * Uso: npm run check-sync -- <slug> [--ruido -35] [--min 0.15]
 */
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import type { Timeline, VideoCaption } from "../src/lib/types.ts";
import { fail, readJson, requireSlug, videoDir } from "./lib/project.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { ruido: { type: "string", default: "-35" }, min: { type: "string", default: "0.15" } },
});
const slug = requireSlug(positionals, "npm run check-sync -- <slug>");
const dir = videoDir(slug);
const timeline = readJson<Timeline>(path.join(dir, "timeline.json"));
const captions = readJson<VideoCaption[]>(path.join(dir, "captions.json"));
if (!timeline.audio) fail("Este vídeo não tem narração (timeline.audio = null).");
const audio = path.join(process.cwd(), "public", timeline.audio!);

const r = spawnSync(
  "ffmpeg",
  ["-hide_banner", "-i", audio, "-af", `silencedetect=noise=${values.ruido}dB:d=${values.min}`, "-f", "null", "-"],
  { encoding: "utf8" },
);
const silences: { s: number; e: number }[] = [];
let open: number | null = null;
for (const line of r.stderr.split("\n")) {
  const a = /silence_start: ([\d.]+)/.exec(line);
  const b = /silence_end: ([\d.]+)/.exec(line);
  if (a) open = parseFloat(a[1]) * 1000;
  if (b && open !== null) {
    silences.push({ s: open, e: parseFloat(b[1]) * 1000 });
    open = null;
  }
}
const inner = silences.filter((x) => x.s > 50 && x.e < timeline.durationMs - 50);

// 1) palavras com mais de 60% do tempo dentro de silêncio
const overlap = (a0: number, a1: number, b0: number, b1: number) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
const bad = captions.filter((c) => {
  const d = c.endMs - c.startMs;
  const sil = inner.reduce((acc, x) => acc + overlap(c.startMs, c.endMs, x.s, x.e), 0);
  return d > 0 && sil / d > 0.6;
});
// 2) silêncios que caem entre palavras (centro do silêncio não está "dentro" de nenhuma palavra)
const between = inner.filter((x) => {
  const mid = (x.s + x.e) / 2;
  return !captions.some((c) => mid > c.startMs + 40 && mid < c.endMs - 40);
});

const pctBad = (bad.length / captions.length) * 100;
const pctBetween = inner.length ? (between.length / inner.length) * 100 : 100;
console.log(`Narração: ${(timeline.durationMs / 1000).toFixed(1)} s · ${captions.length} palavras · ${inner.length} pausas detectadas no áudio`);
console.log(`${pctBad <= 3 ? "✔" : "⚠"} palavras exibidas durante silêncio: ${bad.length} (${pctBad.toFixed(1)}%)`);
console.log(`${pctBetween >= 85 ? "✔" : "⚠"} pausas do áudio que caem entre palavras: ${between.length}/${inner.length} (${pctBetween.toFixed(0)}%)`);
if (bad.length) console.log("   palavras suspeitas:", bad.slice(0, 8).map((c) => `"${c.text.trim()}"@${(c.startMs / 1000).toFixed(2)}s`).join(", "));
if (pctBad > 3 || pctBetween < 85) {
  console.log("ℹ Sincronia duvidosa: regere a narração ou ajuste --ruido (áudio com música/ruído de fundo).");
  process.exit(1);
}
