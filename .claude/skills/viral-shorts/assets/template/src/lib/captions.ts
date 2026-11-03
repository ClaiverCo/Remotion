import type { ScriptWord } from "./words";
import { normalizeWord } from "./words";
import type { VideoCaption } from "./types";

/** Palavra com tempo, vinda de TTS (ElevenLabs), Whisper ou estimativa. */
export type TimedWord = { text: string; startMs: number; endMs: number };

const MIN_WORD_MS = 60;

export const makeCaption = (
  word: ScriptWord,
  startMs: number,
  endMs: number,
  first: boolean,
): VideoCaption => {
  const s = Math.round(startMs);
  const e = Math.max(Math.round(endMs), s + MIN_WORD_MS);
  return {
    text: (first ? "" : " ") + word.text,
    startMs: s,
    endMs: e,
    timestampMs: Math.round((s + e) / 2),
    confidence: null,
    emphasis: word.emphasis || undefined,
    scene: word.scene,
  };
};

/** Garante ordem crescente e sem sobreposição. */
export const sanitizeCaptions = (captions: VideoCaption[]): VideoCaption[] => {
  const out = captions.map((c) => ({ ...c }));
  for (let i = 0; i < out.length; i++) {
    const prev = out[i - 1];
    if (prev && out[i].startMs < prev.startMs) out[i].startMs = prev.startMs;
    if (out[i].endMs < out[i].startMs + MIN_WORD_MS)
      out[i].endMs = out[i].startMs + MIN_WORD_MS;
    const next = out[i + 1];
    if (next && out[i].endMs > next.startMs && next.startMs > out[i].startMs) {
      out[i].endMs = next.startMs;
    }
    out[i].timestampMs = Math.round((out[i].startMs + out[i].endMs) / 2);
  }
  return out;
};

// ---------------------------------------------------------------------------
// Estimativa (rascunho sem áudio)
// ---------------------------------------------------------------------------

export type EstimateOptions = {
  /** Palavras por segundo da narração. pt-BR em Shorts: 2,6 a 3,0. */
  wordsPerSecond?: number;
  startOffsetMs?: number;
  commaPauseMs?: number;
  sentencePauseMs?: number;
  scenePauseMs?: number;
};

export const estimateCaptions = (
  words: ScriptWord[],
  opts: EstimateOptions = {},
): VideoCaption[] => {
  const wps = opts.wordsPerSecond ?? 2.8;
  const start = opts.startOffsetMs ?? 150;
  const comma = opts.commaPauseMs ?? 160;
  const sentence = opts.sentencePauseMs ?? 360;
  const scenePause = opts.scenePauseMs ?? 180;

  const weights = words.map((w) => 1 + 0.12 * normalizeWord(w.text).length);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const speechMs = (words.length / wps) * 1000;

  const captions: VideoCaption[] = [];
  let t = start;
  words.forEach((w, i) => {
    const dur = (weights[i] / totalWeight) * speechMs;
    captions.push(makeCaption(w, t, t + dur, i === 0));
    t += dur;
    if (/[.!?…]["”']?$/.test(w.text)) t += sentence;
    else if (/[,;:]$/.test(w.text)) t += comma;
    const next = words[i + 1];
    if (next && next.scene !== w.scene) t += scenePause;
  });
  return captions;
};

// ---------------------------------------------------------------------------
// ElevenLabs /with-timestamps: alinhamento por caractere -> palavras
// ---------------------------------------------------------------------------

export type ElevenLabsAlignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

export const alignmentToTimedWords = (a: ElevenLabsAlignment): TimedWord[] => {
  const out: TimedWord[] = [];
  let cur: TimedWord | null = null;
  a.characters.forEach((ch, i) => {
    const s = a.character_start_times_seconds[i] * 1000;
    const e = a.character_end_times_seconds[i] * 1000;
    if (/\s/.test(ch)) {
      if (cur) out.push(cur);
      cur = null;
      return;
    }
    if (!cur) cur = { text: ch, startMs: s, endMs: e };
    else {
      cur.text += ch;
      cur.endMs = e;
    }
  });
  if (cur) out.push(cur);
  return out;
};

export const elevenLabsToCaptions = (
  alignment: ElevenLabsAlignment,
  script: ScriptWord[],
): VideoCaption[] => {
  const timed = alignmentToTimedWords(alignment);
  if (timed.length === script.length) {
    return sanitizeCaptions(
      script.map((w, i) =>
        makeCaption(w, timed[i].startMs, timed[i].endMs, i === 0),
      ),
    );
  }
  // Contagem diferente (ex.: o TTS normalizou algo): usa o alinhamento robusto.
  return alignTimedWordsToScript(timed, script);
};

// ---------------------------------------------------------------------------
// Whisper: tokens -> palavras -> alinhamento com o roteiro
// ---------------------------------------------------------------------------

/** Junta tokens do whisper em palavras (token sem espaço inicial continua a palavra anterior). */
export const mergeWhisperTokens = (tokens: TimedWord[]): TimedWord[] => {
  const out: TimedWord[] = [];
  for (const t of tokens) {
    if (/^\s*\[.*\]\s*$/.test(t.text)) continue; // [_BEG_], [Música] etc.
    if (t.text.trim().length === 0) continue;
    const startsWord = /^\s/.test(t.text) || out.length === 0;
    if (startsWord) {
      out.push({ text: t.text.trim(), startMs: t.startMs, endMs: t.endMs });
    } else {
      const last = out[out.length - 1];
      last.text += t.text;
      last.endMs = Math.max(last.endMs, t.endMs);
    }
  }
  return out;
};

const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diag = tmp;
    }
  }
  return prev[b.length];
};

export const similarity = (a: string, b: string): number => {
  const na = normalizeWord(a);
  const nb = normalizeWord(b);
  if (!na.length && !nb.length) return 1;
  return 1 - levenshtein(na, nb) / Math.max(na.length, nb.length);
};

/**
 * Alinha palavras transcritas (com tempo) às palavras do roteiro (Needleman–Wunsch).
 * O texto final é SEMPRE o do roteiro; do áudio só aproveitamos os tempos.
 * Palavras do roteiro sem par recebem tempo interpolado entre as vizinhas.
 */
export const alignTimedWordsToScript = (
  timed: TimedWord[],
  script: ScriptWord[],
  gapCost = 0.75,
): VideoCaption[] => {
  const n = script.length;
  const m = timed.length;
  if (m === 0) throw new Error("Nenhuma palavra transcrita para alinhar.");

  const cost: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0),
  );
  const move: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0),
  ); // 0 diag, 1 up (gap no áudio), 2 left (palavra extra no áudio)
  for (let i = 1; i <= n; i++) {
    cost[i][0] = i * gapCost;
    move[i][0] = 1;
  }
  for (let j = 1; j <= m; j++) {
    cost[0][j] = j * gapCost;
    move[0][j] = 2;
  }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sub =
        cost[i - 1][j - 1] + (1 - similarity(script[i - 1].text, timed[j - 1].text));
      const up = cost[i - 1][j] + gapCost;
      const left = cost[i][j - 1] + gapCost;
      if (sub <= up && sub <= left) {
        cost[i][j] = sub;
        move[i][j] = 0;
      } else if (up <= left) {
        cost[i][j] = up;
        move[i][j] = 1;
      } else {
        cost[i][j] = left;
        move[i][j] = 2;
      }
    }
  }

  const match: (TimedWord | null)[] = new Array(n).fill(null);
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const mv = move[i][j];
    if (i > 0 && j > 0 && mv === 0) {
      match[i - 1] = timed[j - 1];
      i--;
      j--;
    } else if (i > 0 && (j === 0 || mv === 1)) {
      i--;
    } else {
      j--;
    }
  }

  // Interpola tempos das palavras sem par.
  const starts: number[] = new Array(n).fill(NaN);
  const ends: number[] = new Array(n).fill(NaN);
  match.forEach((t, k) => {
    if (t) {
      starts[k] = t.startMs;
      ends[k] = t.endMs;
    }
  });
  let k = 0;
  while (k < n) {
    if (!Number.isNaN(starts[k])) {
      k++;
      continue;
    }
    let r = k;
    while (r < n && Number.isNaN(starts[r])) r++;
    const left = k > 0 ? ends[k - 1] : Math.max(0, (starts[r] ?? 0) - 400);
    const right = r < n ? starts[r] : left + 350 * (r - k);
    const span = Math.max(right - left, MIN_WORD_MS * (r - k));
    const w = script.slice(k, r).map((s) => 1 + normalizeWord(s.text).length);
    const total = w.reduce((a, b) => a + b, 0);
    let t = left;
    for (let q = k; q < r; q++) {
      const d = (w[q - k] / total) * span;
      starts[q] = t;
      ends[q] = t + d;
      t += d;
    }
    k = r;
  }

  return sanitizeCaptions(
    script.map((w, idx) => makeCaption(w, starts[idx], ends[idx], idx === 0)),
  );
};
