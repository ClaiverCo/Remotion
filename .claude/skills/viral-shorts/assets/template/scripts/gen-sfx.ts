/**
 * Gera efeitos sonoros simples (sem direitos autorais) com o ffmpeg em public/sfx/.
 * Uso: npm run sfx
 */
import fs from "node:fs";
import path from "node:path";
import { fail, hasBinary, ROOT, run } from "./lib/project.ts";

if (!hasBinary("ffmpeg")) fail("Instale o ffmpeg para gerar os efeitos.");
const dir = path.join(ROOT, "public", "sfx");
fs.mkdirSync(dir, { recursive: true });

const sfx: Record<string, string[]> = {
  // Ruído rosa filtrado com subida/descida: "whoosh" de transição.
  whoosh: [
    "-f", "lavfi", "-i", "anoisesrc=d=0.5:c=pink:a=0.6:r=44100",
    "-af", "bandpass=f=900:width_type=h:w=1400,afade=t=in:st=0:d=0.22:curve=exp,afade=t=out:st=0.22:d=0.28:curve=exp,volume=2.2",
  ],
  // Bolha curta subindo de tom: entrada de selo/legenda.
  pop: [
    "-f", "lavfi", "-i", "aevalsrc=0.8*sin(2*PI*(500+2600*t)*t)*exp(-38*t):s=44100:d=0.14",
  ],
  // Sino: revelação / final.
  ding: [
    "-f", "lavfi", "-i", "aevalsrc=0.5*sin(2*PI*1318*t)*exp(-4.5*t)+0.25*sin(2*PI*2636*t)*exp(-7*t)+0.1*sin(2*PI*3954*t)*exp(-9*t):s=44100:d=1.1",
  ],
};

for (const [name, args] of Object.entries(sfx)) {
  const out = path.join(dir, `${name}.mp3`);
  run("ffmpeg", ["-y", "-v", "error", ...args, "-ac", "1", "-c:a", "libmp3lame", "-b:a", "96k", out]);
  console.log(`✔ public/sfx/${name}.mp3`);
}
