import type { TtsMotor } from "./types.ts";

export const MOTORES: TtsMotor[] = ["piper", "kokoro", "google", "elevenlabs"];

export const isEnglish = (idioma: string | undefined) => (idioma ?? "").toLowerCase().startsWith("en");

/**
 * Escolhe o motor de narração: --motor > TTS_MOTOR > ElevenLabs (com chave) > Google (com chave) >
 * grátis local pelo idioma: inglês → Kokoro (vozes em inglês muito naturais), português → Piper (pt-BR).
 * Lança erro se o nome for desconhecido.
 */
export const chooseMotor = (
  flag: string | undefined,
  env: Record<string, string | undefined>,
  idioma = "pt-BR",
): TtsMotor => {
  const pick = (flag ?? env.TTS_MOTOR ?? "").trim().toLowerCase();
  if (pick) {
    if (!MOTORES.includes(pick as TtsMotor)) {
      throw new Error(`Motor "${pick}" desconhecido. Use: ${MOTORES.join(", ")}.`);
    }
    return pick as TtsMotor;
  }
  if (env.ELEVENLABS_API_KEY) return "elevenlabs";
  if (env.GOOGLE_TTS_API_KEY) return "google";
  return isEnglish(idioma) ? "kokoro" : "piper";
};

/** Código de idioma que o Kokoro/espeak espera (a voz "b*" é britânica). */
export const kokoroLang = (idioma: string, voz: string) =>
  isEnglish(idioma) ? (voz.startsWith("b") ? "en-gb" : "en-us") : "pt-br";
