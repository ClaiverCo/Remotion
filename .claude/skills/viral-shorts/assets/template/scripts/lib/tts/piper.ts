/**
 * Piper (GRÁTIS, local, offline): vozes de PORTUGUÊS BRASILEIRO gravadas por brasileiros
 * (datasets CC0, uso comercial liberado). Motor padrão da skill.
 * Vozes: faber (masculina, padrão), cadu (masculina), jeff (masculina), edresson (masculina, qualidade baixa).
 * Na 1ª vez: cria .tts/venv (Python 3.10+), instala piper-tts e baixa a voz (~60 MB).
 * .env: PIPER_VOZ, PIPER_VELOCIDADE (0,5–2; padrão 1,0)
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fail } from "../project.ts";
import { download, dryRunLocal, ensureVenv, synthesizeLocal, TTS_DIR } from "./local.ts";
import type { TtsEngine } from "./types.ts";

export const PIPER_VOICES: Record<string, string> = {
  faber: "pt_BR-faber-medium",
  cadu: "pt_BR-cadu-medium",
  jeff: "pt_BR-jeff-medium",
  edresson: "pt_BR-edresson-low",
};

/** Baixa a voz: 1º do repositório oficial (Hugging Face); se falhar, do pacote no GitHub (sherpa-onnx). */
const ensureVoice = async (python: string, id: string) => {
  const dir = path.join(TTS_DIR, "piper");
  const onnx = path.join(dir, `${id}.onnx`);
  const json = `${onnx}.json`;
  if (fs.existsSync(onnx) && fs.existsSync(json)) return { onnx, json };
  fs.mkdirSync(dir, { recursive: true });
  const [lang, name, quality] = [id.slice(0, 5), id.split("-")[1], id.split("-")[2]];
  const hf = `https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/${lang}/${name}/${quality}/${id}`;
  console.log(`→ Piper: baixando a voz ${id} (1ª vez)…`);
  if ((await download(`${hf}.onnx`, onnx)) && (await download(`${hf}.onnx.json`, json))) return { onnx, json };

  console.log("  (Hugging Face indisponível; tentando o pacote do GitHub)");
  const tar = path.join(dir, `${id}.tar.bz2`);
  const gh = `https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-${id}.tar.bz2`;
  if (!(await download(gh, tar))) fail(`Não consegui baixar a voz ${id} (nem do Hugging Face, nem do GitHub).`);
  // extrai só os 2 arquivos que interessam, pelo nome (sem confiar nos caminhos do pacote)
  const extract = [
    "import sys, tarfile, os",
    "tar, onnx, js, ident = sys.argv[1:5]",
    "with tarfile.open(tar, 'r:bz2') as t:",
    "    for m in t.getmembers():",
    "        base = os.path.basename(m.name)",
    "        if m.isfile() and base in (ident + '.onnx', ident + '.onnx.json'):",
    "            dst = onnx if base.endswith('.onnx') else js",
    "            with t.extractfile(m) as src, open(dst, 'wb') as out: out.write(src.read())",
  ].join("\n");
  const r = spawnSync(python, ["-I", "-c", extract, tar, onnx, json, id], { stdio: "inherit" });
  fs.rmSync(tar, { force: true });
  if (r.status !== 0 || !fs.existsSync(onnx) || !fs.existsSync(json)) fail(`Falha ao extrair a voz ${id}.`);
  return { onnx, json };
};

export const piper: TtsEngine = async (slug, roteiro, opts) => {
  const voz = (opts.voz ?? process.env.PIPER_VOZ ?? "faber").toLowerCase();
  const id = PIPER_VOICES[voz] ?? (voz.startsWith("pt_BR-") ? voz : null);
  if (!id) fail(`Voz Piper "${voz}" desconhecida. Use: ${Object.keys(PIPER_VOICES).join(", ")}.`);
  const velocidade = opts.velocidade ?? parseFloat(process.env.PIPER_VELOCIDADE ?? "1.0");
  const label = `Piper pt-BR (grátis, local) · voz ${voz} · velocidade ${velocidade}`;
  if (opts.dryRun) {
    dryRunLocal(roteiro, label);
    return null;
  }
  const python = ensureVenv(["piper-tts==1.8.0", "soundfile==0.14.0"], "import piper, soundfile");
  const { onnx, json } = await ensureVoice(python, id!);
  return synthesizeLocal({
    slug,
    roteiro,
    motor: "piper",
    python,
    label,
    args: ["--modelo", onnx, "--config", json, "--velocidade", String(velocidade)],
  });
};
