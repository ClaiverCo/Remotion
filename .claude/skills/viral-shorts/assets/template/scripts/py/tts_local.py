#!/usr/bin/env python3
"""
Narração GRATUITA e local: Piper (vozes pt-BR gravadas por brasileiros) ou Kokoro.

Chamado por scripts/lib/tts/local.ts — não precisa rodar à mão.
  --motor piper  : --modelo <voz.onnx> [--config <voz.onnx.json>]
  --motor kokoro : --modelo <kokoro.onnx> --vozes <voices.bin> --voz pm_alex

Entrada (--entrada): JSON [{"text": "...", "pauseAfterMs": 260}, ...]  (uma frase por item)
Saída:
  --saida <arquivo.wav>  narração inteira (frases + pausas)
  stdout: JSON {"sampleRate", "durationMs", "frameMs",
                "phrases": [{"startMs","endMs","pauses":[...],"envStartMs","envelope":[...]}]}
    startMs/endMs = trecho COM VOZ da frase; pauses = silêncios internos claros;
    envelope = energia (RMS) a cada frameMs desde envStartMs (usada para achar as vírgulas)
"""
import argparse
import hashlib
import json
import os
import sys

import numpy as np
import soundfile as sf

LEAD_MS = 150  # silêncio no começo do áudio
TAIL_MS = 350  # silêncio no fim
PAD_MS = 25  # respiro mantido em volta de cada frase
WIN_MS = 10  # janela de análise de energia
SILENCE_DB = -38  # abaixo disto (relativo ao pico) é silêncio
MIN_PAUSE_MS = 90  # pausa interna mínima (vírgula)


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def rms_frames(x: np.ndarray, sr: int) -> np.ndarray:
    win = max(1, int(sr * WIN_MS / 1000))
    n = len(x) // win
    if n == 0:
        return np.array([0.0])
    frames = x[: n * win].reshape(n, win)
    return np.sqrt(np.mean(frames.astype(np.float64) ** 2, axis=1))


def analyse(x: np.ndarray, sr: int):
    """Retorna (início, fim) do trecho com voz e pausas internas, em amostras."""
    rms = rms_frames(x, sr)
    peak = float(rms.max()) if rms.size else 0.0
    thr = max(peak * (10 ** (SILENCE_DB / 20)), 1e-4)
    voiced = rms > thr
    win = max(1, int(sr * WIN_MS / 1000))
    if not voiced.any():
        return 0, len(x), []
    idx = np.flatnonzero(voiced)
    first, last = int(idx[0]), int(idx[-1])
    pauses = []
    run_start = None
    min_frames = int(MIN_PAUSE_MS / WIN_MS)
    for i in range(first, last + 1):
        if not voiced[i]:
            if run_start is None:
                run_start = i
        elif run_start is not None:
            if i - run_start >= min_frames:
                pauses.append((run_start * win, i * win))
            run_start = None
    return first * win, (last + 1) * win, pauses


def make_synth(args):
    """Retorna (função texto -> (áudio float32, taxa), taxa de amostragem)."""
    if args.motor == "kokoro":
        from kokoro_onnx import Kokoro

        kokoro = Kokoro(args.modelo, args.vozes)
        if args.voz not in kokoro.get_voices():
            pt = [v for v in kokoro.get_voices() if v.startswith(("pf_", "pm_"))]
            log(f"Voz '{args.voz}' não existe. Vozes em português: {', '.join(pt)}")
            sys.exit(2)

        def synth(text):
            audio, sr = kokoro.create(text, voice=args.voz, speed=args.velocidade, lang=args.idioma)
            return audio.astype(np.float32), sr

        return synth, 24000

    if args.motor == "piper":
        from piper import PiperVoice, SynthesisConfig

        voice = PiperVoice.load(args.modelo, config_path=args.config or f"{args.modelo}.json")
        cfg = SynthesisConfig(length_scale=1.0 / max(0.5, min(2.0, args.velocidade)))

        def synth(text):
            chunks = list(voice.synthesize(text, syn_config=cfg))
            if not chunks:
                return np.zeros(1, dtype=np.float32), voice.config.sample_rate
            audio = np.concatenate([c.audio_int16_array for c in chunks]).astype(np.float32) / 32768.0
            return audio, chunks[0].sample_rate

        return synth, voice.config.sample_rate

    log(f"Motor desconhecido: {args.motor}")
    sys.exit(2)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--motor", default="piper", choices=["piper", "kokoro"])
    ap.add_argument("--entrada", required=True)
    ap.add_argument("--saida", required=True)
    ap.add_argument("--modelo", required=True)
    ap.add_argument("--config", default=None)
    ap.add_argument("--vozes", default=None)
    ap.add_argument("--voz", default="")
    ap.add_argument("--velocidade", type=float, default=1.0)
    ap.add_argument("--idioma", default="pt-br")
    ap.add_argument("--cache", default=None)
    args = ap.parse_args()

    with open(args.entrada, encoding="utf-8") as f:
        phrases = json.load(f)

    synth, sr = make_synth(args)
    pad = int(sr * PAD_MS / 1000)
    parts = [np.zeros(int(sr * LEAD_MS / 1000), dtype=np.float32)]
    cursor = len(parts[0])
    out = []

    for i, p in enumerate(phrases):
        text = p["text"].strip()
        key = hashlib.sha1(
            f"{args.motor}|{os.path.basename(args.modelo)}|{args.voz}|{args.velocidade}|{args.idioma}|{text}".encode("utf-8")
        ).hexdigest()[:16]
        cached = os.path.join(args.cache, f"{key}.wav") if args.cache else None
        if cached and os.path.exists(cached):
            audio, sr = sf.read(cached, dtype="float32")
        else:
            audio, sr = synth(text)
            if cached:
                os.makedirs(args.cache, exist_ok=True)
                sf.write(cached, audio, sr, subtype="PCM_16")
        log(f"  [{i + 1}/{len(phrases)}] {len(audio) / sr:.2f}s  {text[:60]}")

        s, e, pauses = analyse(audio, sr)
        a = max(0, s - pad)
        b = min(len(audio), e + pad)
        seg = audio[a:b]
        out.append(
            {
                "startMs": round((cursor + (s - a)) / sr * 1000),
                "endMs": round((cursor + (e - a)) / sr * 1000),
                "pauses": [
                    {"startMs": round((cursor + ps - a) / sr * 1000), "endMs": round((cursor + pe - a) / sr * 1000)}
                    for ps, pe in pauses
                ],
                "envStartMs": round(cursor / sr * 1000),
                "envelope": [round(float(v), 5) for v in rms_frames(seg, sr)],
            }
        )
        parts.append(seg)
        cursor += len(seg)
        silence = np.zeros(int(sr * int(p.get("pauseAfterMs", 0)) / 1000), dtype=np.float32)
        parts.append(silence)
        cursor += len(silence)

    parts.append(np.zeros(int(sr * TAIL_MS / 1000), dtype=np.float32))
    full = np.concatenate(parts)
    peak = float(np.abs(full).max()) or 1.0
    full = full * min(1.0, 0.95 / peak)
    sf.write(args.saida, full, sr, subtype="PCM_16")
    json.dump({"sampleRate": sr, "durationMs": round(len(full) / sr * 1000), "frameMs": WIN_MS, "phrases": out}, sys.stdout)


if __name__ == "__main__":
    main()
