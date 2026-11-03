/**
 * Narração + legendas sincronizadas, com o motor que você escolher.
 *
 * Uso: npm run tts -- <slug> [--motor kokoro|google|elevenlabs] [--voz X] [--velocidade 1.05]
 *                            [--from-cache] [--dry-run] [--listar-vozes]
 *
 * Motores:
 *   kokoro      GRÁTIS, local e offline (Python 3.10+; 1º uso baixa ~350 MB). Vozes: pm_alex, pm_santa, pf_dora
 *   google      Google Cloud TTS (cota grátis mensal; precisa GOOGLE_TTS_API_KEY). Legenda com tempo exato
 *   elevenlabs  ElevenLabs (mais expressivo; plano pago/limite grátis). Legenda com tempo exato
 *
 * Sem --motor: usa TTS_MOTOR do .env; senão ElevenLabs (se houver chave), Google (se houver chave) ou Kokoro.
 * Atalhos: npm run tts:kokoro -- <slug> · npm run tts:google -- <slug> · npm run tts:elevenlabs -- <slug>
 */
import { parseArgs } from "node:util";
import { ffprobeDurationMs, fail, loadRoteiro, requireSlug, saveCaptionsAndTimeline } from "./lib/project.ts";
import { chooseMotor } from "./lib/tts/choose.ts";
import { elevenlabs } from "./lib/tts/elevenlabs.ts";
import { google, listGoogleVoices } from "./lib/tts/google.ts";
import { kokoro } from "./lib/tts/kokoro.ts";
import type { TtsEngine, TtsMotor } from "./lib/tts/types.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    motor: { type: "string" },
    voz: { type: "string" },
    voice: { type: "string" }, // compatibilidade
    velocidade: { type: "string" },
    modelo: { type: "string" },
    model: { type: "string" }, // compatibilidade
    "from-cache": { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    "listar-vozes": { type: "boolean", default: false },
  },
});

const ENGINES: Record<TtsMotor, TtsEngine> = { kokoro, google, elevenlabs };

let motor: TtsMotor = "kokoro";
try {
  motor = chooseMotor(values.motor, process.env);
} catch (e) {
  fail((e as Error).message);
}

if (values["listar-vozes"]) {
  if (motor === "google") await listGoogleVoices();
  else if (motor === "kokoro") console.log("Kokoro pt-BR: pm_alex (masculina, padrão) · pm_santa (masculina) · pf_dora (feminina)");
  else console.log("ElevenLabs: veja as vozes em elevenlabs.io → Voices (copie o Voice ID).");
  process.exit(0);
}

const slug = requireSlug(positionals, "npm run tts -- <slug> [--motor kokoro|google|elevenlabs] [--voz X]");
const roteiro = loadRoteiro(slug);
const result = await ENGINES[motor](slug, roteiro, {
  voz: values.voz ?? values.voice,
  velocidade: values.velocidade ? parseFloat(values.velocidade.replace(",", ".")) : undefined,
  modelo: values.modelo ?? values.model,
  fromCache: values["from-cache"],
  dryRun: values["dry-run"],
});
if (!result) process.exit(0); // dry-run

saveCaptionsAndTimeline(slug, roteiro, result.captions, {
  audio: result.audioRel,
  source: result.source,
  audioDurationMs: ffprobeDurationMs(result.audioAbs),
});
console.log(`✔ ${result.info}`);
console.log(`✔ Narração salva em public/${result.audioRel}`);
if (roteiro.voz !== motor) {
  console.log(`ℹ O roteiro diz voz "${roteiro.voz}"; atualize para "${motor}" no roteiro.json para registrar o que foi usado.`);
}
