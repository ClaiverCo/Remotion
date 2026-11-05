/**
 * Confere uma versão traduzida de episódio (pacote de idioma, src/stickman/lang.ts):
 * para cada cena C0N do Scenes.tsx ORIGINAL, procura cada palavra-gatilho at("…") no lang.json da versão
 * traduzida e confirma que a palavra mapeada existe na fala daquela cena (captions.json), na ocorrência pedida.
 * Uma palavra que não existe cai na fração-reserva e a animação sai fora do tempo.
 *
 * Uso: npm run check-lang -- <slug-traduzido> <slug-original>
 *   ex.: npm run check-lang -- stickman-stuck-01-crystal-pt stickman-stuck-01-crystal
 */
import fs from "node:fs";
import path from "node:path";
import type { VideoCaption } from "../src/lib/types.ts";
import type { SceneLang } from "../src/stickman/lang.ts";
import { normalizeWord } from "../src/lib/words.ts";
import { fail, readJson, videoDir } from "./lib/project.ts";

const [slug, original] = process.argv.slice(2).filter((a) => !a.startsWith("-"));
if (!slug || !original) fail("Uso: npm run check-lang -- <slug-traduzido> <slug-original>");
const lang = readJson<SceneLang>(path.join(videoDir(slug), "lang.json"));
const captions = readJson<VideoCaption[]>(path.join(videoDir(slug), "captions.json"));
const scenesSrc = fs.readFileSync(path.join(videoDir(original), "Scenes.tsx"), "utf8");

const blocks = scenesSrc.split(/\n\s*const C0(\d): React\.FC<SceneProps>/);
let problems = 0;
let checked = 0;
for (let i = 1; i < blocks.length; i += 2) {
  const n = Number(blocks[i]);
  const body = blocks[i + 1];
  const scene = `c0${n}`;
  const words = captions.filter((c) => c.scene === n - 1).map((c) => normalizeWord(c.text));
  for (const m of body.matchAll(/\bat\("([^"]+)"(?:,\s*[\d.]+)?(?:,\s*\{\s*([^}]*)\})?\)/g)) {
    const key = m[1];
    const nth = /nth:\s*(\d)/.exec(m[2] ?? "")?.[1];
    const k = nth ? [`${key}#${nth}`, key] : [key];
    const hit = [...k.map((x) => `${scene}:${x}`), ...k].find((x) => lang.words?.[x] !== undefined);
    checked++;
    if (!hit) {
      console.log(`✖ ${scene}: "${key}${nth ? `#${nth}` : ""}" sem tradução em lang.json`);
      problems++;
      continue;
    }
    const v = lang.words![hit];
    const [q, want] = typeof v === "string" ? [v, 1] : [v.q, v.nth ?? 1];
    const found = words.filter((w) => w.startsWith(normalizeWord(q))).length;
    if (found < want) {
      console.log(`✖ ${scene}: "${key}" → "${q}" (${want}ª vez) não aparece na fala da cena (achei ${found})`);
      problems++;
    }
  }
}
if (problems) fail(`${problems} de ${checked} gatilhos com problema em ${slug}.`);
console.log(`✔ ${checked} gatilhos conferidos em ${slug}: todos existem na fala da cena certa.`);
