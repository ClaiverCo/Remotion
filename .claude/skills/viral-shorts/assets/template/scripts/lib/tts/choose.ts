import type { TtsMotor } from "./types.ts";

export const MOTORES: TtsMotor[] = ["kokoro", "google", "elevenlabs"];

/**
 * Escolhe o motor de narração: --motor > TTS_MOTOR > ElevenLabs (com chave) > Google (com chave) > Kokoro (grátis).
 * Lança erro se o nome for desconhecido.
 */
export const chooseMotor = (flag: string | undefined, env: Record<string, string | undefined>): TtsMotor => {
  const pick = (flag ?? env.TTS_MOTOR ?? "").trim().toLowerCase();
  if (pick) {
    if (!MOTORES.includes(pick as TtsMotor)) {
      throw new Error(`Motor "${pick}" desconhecido. Use: ${MOTORES.join(", ")}.`);
    }
    return pick as TtsMotor;
  }
  if (env.ELEVENLABS_API_KEY) return "elevenlabs";
  if (env.GOOGLE_TTS_API_KEY) return "google";
  return "kokoro";
};
