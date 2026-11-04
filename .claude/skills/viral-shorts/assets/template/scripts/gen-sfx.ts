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
  // Clique de botão de plástico (ventilador).
  click: [
    "-f", "lavfi", "-i", "aevalsrc=0.7*sin(2*PI*2400*t)*exp(-160*t)+0.5*(2*random(0)-1)*exp(-220*t)+0.4*sin(2*PI*700*t)*exp(-60*t):s=44100:d=0.12",
  ],
  // Zumbido contínuo de ventilador (loop) e as três velocidades da comédia "Ventilador no 3".
  "fan-hum": fan(1400, 18, 0.35, 150, 1.0, 4),
  fan1: fan(500, 6, 0.5, 95, 0.9, 6),
  fan2: fan(1400, 18, 0.35, 150, 1.1, 6),
  fan3: fan(5000, 42, 0.25, 230, 1.5, 12),
  // Pancada na parede.
  splat: [
    "-f", "lavfi", "-i", "aevalsrc=0.9*sin(2*PI*(110-80*t)*t)*exp(-8*t)+0.7*(2*random(0)-1)*exp(-28*t):s=44100:d=0.7",
    "-af", "lowpass=f=2500",
  ],
  // Dentes batendo de frio.
  frio: [
    "-f", "lavfi", "-i", "aevalsrc=0.5*(2*random(0)-1)*exp(-mod(t\\,0.07)*90)*lt(mod(t\\,0.07)\\,0.03):s=44100:d=2.5",
    "-af", "highpass=f=1500,lowpass=f=7000",
  ],
  // Cigarras de verão (ambiente de calor).
  cigarra: [
    "-f", "lavfi", "-i", "aevalsrc=0.3*sin(2*PI*4300*t)*(0.5+0.5*sin(2*PI*38*t))*(0.65+0.35*sin(2*PI*0.8*t))+0.15*sin(2*PI*5100*t)*(0.5+0.5*sin(2*PI*41*t+1)):s=44100:d=6",
    "-af", "highpass=f=2000,afade=t=in:d=0.6,afade=t=out:st=5.2:d=0.8",
  ],
};

/** Motor + vento: ruído rosa filtrado com tremolo na frequência das pás e zumbido do motor. */
function fan(lp: number, trem: number, depth: number, hum: number, vol: number, d: number): string[] {
  return [
    "-f", "lavfi", "-i", `anoisesrc=color=pink:amplitude=0.6:d=${d}:seed=7`,
    "-f", "lavfi", "-i", `sine=f=${hum}:d=${d}`,
    "-filter_complex",
    `[0]highpass=f=80,lowpass=f=${lp},tremolo=f=${trem}:d=${depth}[w];[1]volume=0.25,tremolo=f=${trem / 2}:d=0.3[h];[w][h]amix=inputs=2:normalize=0,volume=${vol}`,
  ];
}

for (const [name, args] of Object.entries(sfx)) {
  const out = path.join(dir, `${name}.mp3`);
  run("ffmpeg", ["-y", "-v", "error", ...args, "-ac", "1", "-c:a", "libmp3lame", "-b:a", "96k", out]);
  console.log(`✔ public/sfx/${name}.mp3`);
}
