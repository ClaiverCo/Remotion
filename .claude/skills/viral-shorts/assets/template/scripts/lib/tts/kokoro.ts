/**
 * Kokoro (GRÁTIS, local, offline, Apache 2.0).
 * Em INGLÊS é o padrão grátis (vozes muito naturais; am_michael é a padrão).
 * ⚠ As vozes de português do Kokoro (pm_alex, pm_santa, pf_dora) têm sotaque que puxa para Portugal.
 *   Para português BRASILEIRO, prefira o motor "piper" (padrão em pt-BR).
 * .env: KOKORO_VOZ, KOKORO_VELOCIDADE (0,5–2; padrão 1,0 em inglês e 1,05 em português), KOKORO_MODELO
 */
import fs from "node:fs";
import path from "node:path";
import { fail } from "../project.ts";
import { download, dryRunLocal, ensureVenv, synthesizeLocal, TTS_DIR } from "./local.ts";
import { isEnglish, kokoroLang } from "./choose.ts";
import type { TtsEngine } from "./types.ts";

const RELEASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0";

export const kokoro: TtsEngine = async (slug, roteiro, opts) => {
  const en = isEnglish(roteiro.idioma);
  const voz = opts.voz || process.env.KOKORO_VOZ || (en ? "am_michael" : "pm_alex");
  const velocidade = opts.velocidade ?? parseFloat(process.env.KOKORO_VELOCIDADE || (en ? "1.0" : "1.05"));
  const lang = kokoroLang(roteiro.idioma, voz);
  const modelo = opts.modelo || process.env.KOKORO_MODELO || "kokoro-v1.0.onnx";
  const label = `Kokoro (grátis, local) · voz ${voz} · velocidade ${velocidade}`;
  if (opts.dryRun) {
    dryRunLocal(roteiro, label);
    return null;
  }
  if (!en) console.log("⚠ Kokoro: o sotaque das vozes em português puxa para Portugal. Para pt-BR use --motor piper.");

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
    args: ["--modelo", modelPath, "--vozes", voicesPath, "--voz", voz, "--velocidade", String(velocidade), "--idioma", lang],
  });
};
