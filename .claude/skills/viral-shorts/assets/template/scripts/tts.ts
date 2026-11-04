/**
 * Narração + legendas sincronizadas, com o motor que você escolher.
 *
 * Uso: npm run tts -- <slug> [--motor kokoro|google|elevenlabs] [--voz X] [--velocidade 1.05]
 *                            [--from-cache] [--dry-run] [--listar-vozes]
 *
 * Motores:
 *   piper       GRÁTIS, local, offline, PORTUGUÊS BRASILEIRO (padrão). Vozes: faber, cadu, jeff
 *   kokoro      GRÁTIS, local e offline. Vozes pm_alex, pm_santa, pf_dora (sotaque puxa para Portugal)
 *   google      Google Cloud TTS (cota grátis mensal; precisa GOOGLE_TTS_API_KEY). Legenda com tempo exato
 *   elevenlabs  ElevenLabs (mais expressivo; plano pago/limite grátis). Legenda com tempo exato
 *
 * Sem --motor: usa TTS_MOTOR do .env; senão ElevenLabs (se houver chave), Google (se houver chave) ou Piper.
 * Atalhos: npm run tts:piper · tts:kokoro · tts:google · tts:elevenlabs -- <slug>
 */
import { parseArgs } from "node:util";
import { ffprobeDurationMs, fail, loadRoteiro, requireSlug, saveCaptionsAndTimeline } from "./lib/project.ts";
import { chooseMotor } from "./lib/tts/choose.ts";
import { elevenlabs } from "./lib/tts/elevenlabs.ts";
import { google, listGoogleVoices } from "./lib/tts/google.ts";
import { kokoro } from "./lib/tts/kokoro.ts";
import { piper, PIPER_VOICES } from "./lib/tts/piper.ts";
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

const ENGINES: Record<TtsMotor, TtsEngine> = { piper, kokoro, google, elevenlabs };

const pickMotor = (idioma?: string): TtsMotor => {
  try {
    return chooseMotor(values.motor, process.env, idioma);
  } catch (e) {
    return fail((e as Error).message);
  }
};

if (values["listar-vozes"]) {
  const motor = pickMotor(positionals[0] ? loadRoteiro(positionals[0]).idioma : undefined);
  if (motor === "google") await listGoogleVoices();
  else if (motor === "piper") console.log(`Piper: ${Object.keys(PIPER_VOICES).join(" · ")} (padrão pt-BR: faber · inglês: ryan)`);
  else if (motor === "kokoro") {
    console.log("Kokoro inglês (EUA): am_michael (padrão) · am_fenrir · am_puck · am_adam · af_heart · af_bella …");
    console.log("Kokoro inglês (UK): bm_george · bm_lewis · bf_emma …   Português: pm_alex · pf_dora (sotaque de Portugal)");
  }
  else console.log("ElevenLabs: veja as vozes em elevenlabs.io → Voices (copie o Voice ID).");
  process.exit(0);
}

const slug = requireSlug(positionals, "npm run tts -- <slug> [--motor piper|kokoro|google|elevenlabs] [--voz X]");
const roteiro = loadRoteiro(slug);
const motor = pickMotor(roteiro.idioma);
const result = await ENGINES[motor](slug, roteiro, {
  voz: values.voz ?? values.voice ?? roteiro.vozId,
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
