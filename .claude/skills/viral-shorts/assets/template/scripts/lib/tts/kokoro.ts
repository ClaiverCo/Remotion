/**
 * Kokoro (GRÁTIS, local, offline, Apache 2.0).
 * ⚠ As vozes de português do Kokoro (pm_alex, pm_santa, pf_dora) têm sotaque que puxa para Portugal.
 *   Para português BRASILEIRO, prefira o motor "piper" (padrão).
 * .env: KOKORO_VOZ, KOKORO_VELOCIDADE (0,5–2; padrão 1,05), KOKORO_MODELO
 */
import fs from "node:fs";
import path from "node:path";
import { fail } from "../project.ts";
import { download, dryRunLocal, ensureVenv, synthesizeLocal, TTS_DIR } from "./local.ts";
import type { TtsEngine } from "./types.ts";

const RELEASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0";

export const kokoro: TtsEngine = async (slug, roteiro, opts) => {
  const voz = opts.voz ?? process.env.KOKORO_VOZ ?? "pm_alex";
  const velocidade = opts.velocidade ?? parseFloat(process.env.KOKORO_VELOCIDADE ?? "1.05");
  const modelo = opts.modelo ?? process.env.KOKORO_MODELO ?? "kokoro-v1.0.onnx";
  const label = `Kokoro (grátis, local) · voz ${voz} · velocidade ${velocidade}`;
  if (opts.dryRun) {
    dryRunLocal(roteiro, label);
    return null;
  }
  console.log("⚠ Kokoro: o sotaque das vozes em português puxa para Portugal. Para pt-BR use --motor piper.");

  const python = ensureVenv(["kokoro-onnx==0.6.1", "soundfile==0.14.0"], "import kokoro_onnx, soundfile");
  const modelPath = path.join(TTS_DIR, modelo);
  const voicesPath = path.join(TTS_DIR, "voices-v1.0.bin");
  for (const [file, dest] of [[modelo, modelPath], ["voices-v1.0.bin", voicesPath]] as const) {
    if (!fs.existsSync(dest)) {
      console.log(`→ Kokoro: baixando ${file} (1ª vez)…`);
      if (!(await download(`${RELEASE}/${file}`, dest))) fail(`Falha ao baixar ${RELEASE}/${file}`);
    }
  }
  return synthesizeLocal({
    slug,
    roteiro,
    motor: "kokoro",
    python,
    label,
    args: ["--modelo", modelPath, "--vozes", voicesPath, "--voz", voz, "--velocidade", String(velocidade)],
  });
};
