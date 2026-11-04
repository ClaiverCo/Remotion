/**
 * Monta o pacote de publicação em out/<slug>/:
 *   video.mp4 · legendas.srt · metadata.json · youtube.txt · tiktok.txt · reels.txt
 * Os .txt estão prontos para copiar e colar em cada app.
 *
 * Uso: npm run export -- <slug>
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  formatIssues,
  reelsCaption,
  tiktokCaption,
  validateMetadata,
  youtubeDescription,
} from "./lib/metadata.ts";
import { fail, outDir, readJson, requireSlug, videoDir, writeJson } from "./lib/project.ts";

const { positionals } = parseArgs({ allowPositionals: true });
const slug = requireSlug(positionals, "npm run export -- <slug>");
const { data, issues } = validateMetadata(readJson(path.join(videoDir(slug), "metadata.json")));
console.log(formatIssues(issues));
if (!data || issues.some((i) => i.level === "erro")) fail("Corrija os erros do metadata.json antes de exportar.");
const m = data!;
const dir = outDir(slug);
fs.mkdirSync(dir, { recursive: true });

writeJson(path.join(dir, "metadata.json"), m);
fs.writeFileSync(
  path.join(dir, "youtube.txt"),
  [
    "TÍTULO",
    m.youtube.titulo,
    "",
    "DESCRIÇÃO",
    youtubeDescription(m),
    "",
    "TAGS",
    m.youtube.tags.join(", "),
    "",
    `PUBLICAR EM: ${m.youtube.publicarEm ?? "agora"} · privacidade: ${m.youtube.privacidade}`,
    m.youtube.midiaSintetica ? "Marque: \"Conteúdo alterado ou sintético\" = SIM" : "",
  ].join("\n") + "\n",
);
fs.writeFileSync(path.join(dir, "tiktok.txt"), tiktokCaption(m) + "\n");
fs.writeFileSync(path.join(dir, "reels.txt"), reelsCaption(m) + "\n");

const missing = ["video.mp4", "legendas.srt"].filter((f) => !fs.existsSync(path.join(dir, f)));
if (missing.length) console.log(`⚠ Ainda faltam: ${missing.join(", ")} (rode npm run render e npm run finalize)`);
console.log(`✔ pacote em ${path.relative(process.cwd(), dir)}/`);
for (const f of fs.readdirSync(dir).filter((f) => !fs.statSync(path.join(dir, f)).isDirectory())) {
  console.log(`   · ${f}`);
}
