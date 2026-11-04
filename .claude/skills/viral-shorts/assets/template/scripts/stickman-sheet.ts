/**
 * Renderiza a folha de referência do protagonista do universo Stickman do Futuro (Kip, FL-01):
 * frente, 3/4, perfil, costas, 7 expressões e a paleta da bíblia.
 * Use como QA do desenho e como IMAGEM DE REFERÊNCIA no Google Flow / Higgsfield.
 *
 * Uso: npm run stickman-sheet  →  out/stickman/character-sheet.png
 */
import fs from "node:fs";
import path from "node:path";
import { renderStill } from "@remotion/renderer";
import { ROOT } from "./lib/project.ts";
import { prepare } from "./lib/remotion.ts";

const out = path.join(ROOT, "out", "stickman", "character-sheet.png");
fs.mkdirSync(path.dirname(out), { recursive: true });
const { serveUrl, browser, composition, chromiumOptions, browserExecutable } = await prepare("StickmanSheet", {});
await renderStill({ composition, serveUrl, output: out, frame: 0, imageFormat: "png", chromiumOptions, browserExecutable, puppeteerInstance: browser, overwrite: true });
await browser.close({ silent: true });
console.log(`✔ ${path.relative(ROOT, out)}`);
