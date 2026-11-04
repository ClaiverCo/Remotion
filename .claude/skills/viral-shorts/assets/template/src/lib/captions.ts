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

  const starts: number[] = new Array(n).fill(NaN);
  const ends: number[] = new Array(n).fill(NaN);
  match.forEach((t, k) => {
    if (t) {
      starts[k] = t.startMs;
      ends[k] = t.endMs;
    }
  });
  fillMissingTimes(script, starts, ends);
  return sanitizeCaptions(
    script.map((w, idx) => makeCaption(w, starts[idx], ends[idx], idx === 0)),
  );
};

/** Preenche (no lugar) tempos NaN interpolando entre as palavras vizinhas, com peso pelo tamanho. */
const fillMissingTimes = (script: ScriptWord[], starts: number[], ends: number[]) => {
  const n = script.length;
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
};

// ---------------------------------------------------------------------------
// TTS por frases (Kokoro local): início de cada frase é exato; palavras distribuídas
// ---------------------------------------------------------------------------

const SENTENCE_END = /[.!?…]["”')]?$/;
const CLAUSE_END = /[,;:]["”')]?$/;

export type Phrase = {
  /** Índice global da primeira palavra da frase. */
  first: number;
  words: ScriptWord[];
  text: string;
  scene: number;
  /** Silêncio a inserir depois desta frase (ms). */
  pauseAfterMs: number;
};

export type PhraseOptions = {
  sentencePauseMs?: number;
  scenePauseMs?: number;
};

/**
 * Divide a narração em frases para sintetizar uma a uma: quebra no fim de frase (. ! ? …)
 * e na troca de cena. Vírgulas ficam DENTRO da frase (preserva a entonação natural).
 */
export const phrasesFromWords = (words: ScriptWord[], opts: PhraseOptions = {}): Phrase[] => {
  const sentencePause = opts.sentencePauseMs ?? 260;
  const scenePause = opts.scenePauseMs ?? 380;
  const phrases: Phrase[] = [];
  let cur: ScriptWord[] = [];
  let first = 0;
  words.forEach((w, i) => {
    if (cur.length === 0) first = i;
    cur.push(w);
    const next = words[i + 1];
    const sceneChange = !!next && next.scene !== w.scene;
    if (!next || sceneChange || SENTENCE_END.test(w.text)) {
      phrases.push({
        first,
        words: cur,
        text: cur.map((x) => x.text).join(" "),
        scene: w.scene,
        pauseAfterMs: !next ? 0 : sceneChange ? scenePause : sentencePause,
      });
      cur = [];
    }
  });
  return phrases;
};

/**
 * Acha no envelope de energia do áudio a pausa de cada vírgula da frase:
 * para cada vírgula, procura o vale mais fundo perto de onde ela "deveria" cair
 * (estimativa por peso) e expande enquanto a energia continua baixa.
 * Retorna [] se não houver vírgulas ou se algum vale não for claro (aí distribui por peso).
 */
export const findClausePauses = (
  words: ScriptWord[],
  startMs: number,
  endMs: number,
  envelope: number[],
  envStartMs: number,
  frameMs = 10,
): { startMs: number; endMs: number }[] => {
  const breaks = clauseBreaks(words);
  if (breaks.length === 0 || envelope.length < 10) return [];
  const smooth = envelope.map((_, i) => {
    const a = envelope.slice(Math.max(0, i - 1), i + 2);
    return a.reduce((x, y) => x + y, 0) / a.length;
  });
  const toFrame = (ms: number) => Math.max(0, Math.min(smooth.length - 1, Math.round((ms - envStartMs) / frameMs)));
  const toMs = (f: number) => envStartMs + f * frameMs;
  const voiced = smooth.slice(toFrame(startMs), toFrame(endMs) + 1);
  const sorted = [...voiced].sort((x, y) => x - y);
  const median = sorted[Math.floor(sorted.length / 2)] || 1e-6;

  // posição esperada de cada vírgula (mesmos pesos de distributeWords)
  const weights = words.map((w) => 1 + normalizeWord(w.text).length);
  const gapUnits = 3;
  const total = weights.reduce((a, b) => a + b, 0) + breaks.length * gapUnits;
  const dur = endMs - startMs;
  const expected: number[] = [];
  let acc = 0;
  for (let i = 0, b = 0; i < words.length && b < breaks.length; i++) {
    acc += weights[i];
    if (i !== breaks[b]) continue;
    expected.push(startMs + ((acc + gapUnits / 2) / total) * dur);
    acc += gapUnits;
    b++;
  }

  // 1) todos os vales: trechos ≥ 30 ms com energia < 35% da mediana da fala
  const thr = median * 0.35;
  const minLen = Math.max(1, Math.round(30 / frameMs));
  const lo = toFrame(startMs + 120);
  const hi = toFrame(endMs - 120);
  const valleys: { startMs: number; endMs: number; center: number }[] = [];
  let runStart = -1;
  for (let f = lo; f <= hi + 1; f++) {
    const low = f <= hi && smooth[f] < thr;
    if (low && runStart < 0) runStart = f;
    if (!low && runStart >= 0) {
      if (f - runStart >= minLen) {
        valleys.push({ startMs: toMs(runStart), endMs: toMs(f), center: toMs((runStart + f) / 2) });
      }
      runStart = -1;
    }
  }
  if (valleys.length < breaks.length) return [];

  // 2) escolhe, em ordem, os vales mais próximos das posições esperadas (programação dinâmica)
  const n = valleys.length;
  const k = breaks.length;
  const INF = Number.POSITIVE_INFINITY;
  const cost: number[][] = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(INF));
  const take: boolean[][] = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(false));
  for (let j = 0; j <= n; j++) cost[0][j] = 0;
  for (let b = 1; b <= k; b++) {
    for (let j = b; j <= n; j++) {
      const skip = cost[b][j - 1];
      const use = cost[b - 1][j - 1] + Math.abs(valleys[j - 1].center - expected[b - 1]);
      if (use <= skip) {
        cost[b][j] = use;
        take[b][j] = true;
      } else cost[b][j] = skip;
    }
  }
  const chosen: { startMs: number; endMs: number }[] = [];
  for (let b = k, j = n; b > 0 && j > 0; ) {
    if (take[b][j]) {
      chosen.unshift({ startMs: valleys[j - 1].startMs, endMs: valleys[j - 1].endMs });
      b--;
    }
    j--;
  }
  return chosen.length === k ? chosen : [];
};

/** Quantas pausas internas (vírgula, ponto e vírgula, dois-pontos) a frase deve ter. */
export const clauseBreaks = (words: ScriptWord[]): number[] =>
  words.slice(0, -1).flatMap((w, i) => (CLAUSE_END.test(w.text) ? [i] : []));

/**
 * Distribui as palavras de uma frase no trecho com voz [startMs, endMs].
 * Se `pauses` (silêncios internos detectados no áudio) bater com o nº de vírgulas,
 * cada trecho entre vírgulas usa o seu intervalo real; senão, distribui por peso.
 */
export const distributeWords = (
  words: ScriptWord[],
  startMs: number,
  endMs: number,
  firstGlobalIndex: number,
  pauses: { startMs: number; endMs: number }[] = [],
): VideoCaption[] => {
  const breaks = clauseBreaks(words);
  const groups: { words: ScriptWord[]; from: number; to: number }[] = [];
  if (breaks.length > 0 && pauses.length === breaks.length) {
    let prevIdx = 0;
    let prevTime = startMs;
    breaks.forEach((b, i) => {
      groups.push({ words: words.slice(prevIdx, b + 1), from: prevTime, to: pauses[i].startMs });
      prevIdx = b + 1;
      prevTime = pauses[i].endMs;
    });
    groups.push({ words: words.slice(prevIdx), from: prevTime, to: endMs });
  } else {
    groups.push({ words, from: startMs, to: endMs });
  }

  const out: VideoCaption[] = [];
  let idx = firstGlobalIndex;
  for (const g of groups) {
    // peso: 1 + letras; vírgula interna (sem pausa detectada) ganha uma pausa equivalente a 3 letras
    const weights = g.words.map((w) => 1 + normalizeWord(w.text).length);
    const gaps: number[] = g.words.map((w, i) => (i < g.words.length - 1 && CLAUSE_END.test(w.text) ? 3 : 0));
    const total = weights.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0);
    const span = Math.max(g.to - g.from, MIN_WORD_MS * g.words.length);
    let t = g.from;
    g.words.forEach((w, i) => {
      const d = (weights[i] / total) * span;
      out.push(makeCaption(w, t, t + d, idx === 0));
      t += d + (gaps[i] / total) * span;
      idx++;
    });
  }
  return out;
};

/**
 * Encaixa as pausas do áudio que NÃO têm vírgula no texto (o TTS respirou no meio da frase, ex.:
 * "Nobody on Lumen ‖ can tell me"). Para cada silêncio interno, acha a fronteira entre palavras mais
 * próxima (até `maxShiftMs`) e re-mapeia linearmente os trechos vizinhos: a fala termina no início do
 * silêncio e recomeça no fim dele. Lacunas que já existem (vírgulas encaixadas) ficam fixas.
 * Se algum trecho ficaria curto demais, devolve as legendas como vieram.
 */
export const snapToSilences = (
  caps: VideoCaption[],
  silences: { startMs: number; endMs: number }[],
  maxShiftMs = 350,
): VideoCaption[] => {
  if (caps.length < 2 || silences.length === 0) return caps;
  type Anchor = { k: number; s: number; e: number };
  // lacunas já presentes (≥ 100 ms) são âncoras fixas
  const anchors: Anchor[] = [];
  for (let k = 0; k < caps.length - 1; k++) {
    if (caps[k + 1].startMs - caps[k].endMs >= 100) anchors.push({ k, s: caps[k].endMs, e: caps[k + 1].startMs });
  }
  const fixed = new Set(anchors.map((a) => a.k));
  let added = 0;
  for (const sil of [...silences].sort((a, b) => a.startMs - b.startMs)) {
    const c = (sil.startMs + sil.endMs) / 2;
    let best = -1;
    let bestD = Number.POSITIVE_INFINITY;
    for (let k = 0; k < caps.length - 1; k++) {
      const d = Math.abs((caps[k].endMs + caps[k + 1].startMs) / 2 - c);
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    }
    if (best < 0 || bestD > maxShiftMs || fixed.has(best) || anchors.some((a) => a.k === best)) continue;
    anchors.push({ k: best, s: sil.startMs, e: sil.endMs });
    added++;
  }
  if (added === 0) return caps;
  anchors.sort((a, b) => a.k - b.k);
  for (let i = 1; i < anchors.length; i++) if (anchors[i].s < anchors[i - 1].e) return caps;

  const out = caps.map((c) => ({ ...c }));
  let i0 = 0;
  let newFrom = caps[0].startMs;
  const bounds = [...anchors, { k: caps.length - 1, s: caps[caps.length - 1].endMs, e: Number.NaN }];
  for (const b of bounds) {
    const i1 = b.k;
    const oldFrom = caps[i0].startMs;
    const oldTo = caps[i1].endMs;
    const newTo = b.s;
    if (newTo - newFrom < MIN_WORD_MS * (i1 - i0 + 1)) return caps;
    const map = (t: number) => newFrom + ((t - oldFrom) / Math.max(1, oldTo - oldFrom)) * (newTo - newFrom);
    for (let i = i0; i <= i1; i++) {
      out[i].startMs = Math.round(map(caps[i].startMs));
      out[i].endMs = Math.round(map(caps[i].endMs));
      out[i].timestampMs = Math.round((out[i].startMs + out[i].endMs) / 2);
    }
    i0 = i1 + 1;
    newFrom = b.e;
  }
  return out;
};

// ---------------------------------------------------------------------------
// Google Cloud TTS: SSML com <mark> antes de cada palavra -> tempos exatos
// ---------------------------------------------------------------------------

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** SSML com uma marca por palavra (nome = "w" + índice global) e pausa curta entre cenas. */
export const ssmlWithMarks = (
  words: ScriptWord[],
  opts: { firstIndex?: number; scenePauseMs?: number } = {},
): string => {
  const first = opts.firstIndex ?? 0;
  const scenePause = opts.scenePauseMs ?? 300;
  const parts = words.map((w, i) => {
    const prev = words[i - 1];
    const br = prev && prev.scene !== w.scene ? `<break time="${scenePause}ms"/>` : "";
    return `${br}<mark name="w${first + i}"/>${escapeXml(w.text)}`;
  });
  return `<speak>${parts.join(" ")}</speak>`;
};

export type Timepoint = { markName: string; timeSeconds: number };

/**
 * Converte os timepoints do Google (início de cada palavra) em legendas.
 * Fim de cada palavra = início da próxima (menos parte da pausa, se houver pontuação);
 * marcas que não voltaram (bug conhecido da API) são interpoladas.
 */
export const timepointsToCaptions = (
  timepoints: Timepoint[],
  words: ScriptWord[],
  audioDurationMs: number,
): VideoCaption[] => {
  const n = words.length;
  const starts: number[] = new Array(n).fill(NaN);
  for (const tp of timepoints) {
    const m = /^w(\d+)$/.exec(tp.markName);
    if (m && +m[1] < n) starts[+m[1]] = tp.timeSeconds * 1000;
  }
  const ends: number[] = new Array(n).fill(NaN);
  const weight = (w: ScriptWord) => 1 + normalizeWord(w.text).length;
  for (let i = 0; i < n; i++) {
    if (Number.isNaN(starts[i])) continue;
    let j = i + 1;
    while (j < n && Number.isNaN(starts[j])) j++;
    const limit = j < n ? starts[j] : Math.max(starts[i] + 200, audioDurationMs - 120);
    // se há palavras sem marca logo depois, esta palavra divide o intervalo com elas
    const missing = words.slice(i + 1, j).reduce((a, w) => a + weight(w), 0);
    const gap = (limit - starts[i]) * (weight(words[i]) / (weight(words[i]) + missing));
    const punct = SENTENCE_END.test(words[i].text) || CLAUSE_END.test(words[i].text);
    // palavra com pontuação não "ocupa" a pausa que vem depois dela
    const maxDur = 120 + normalizeWord(words[i].text).length * 95;
    ends[i] = starts[i] + (punct ? Math.min(gap, maxDur) : gap);
  }
  // palavras sem marca: limpa o fim também, para a interpolação tratar o bloco todo
  for (let i = 0; i < n; i++) if (Number.isNaN(starts[i])) ends[i] = NaN;
  if (starts.every((s) => Number.isNaN(s))) throw new Error("O Google não devolveu nenhuma marca de tempo (timepoints).");
  fillMissingTimes(words, starts, ends);
  return sanitizeCaptions(words.map((w, i) => makeCaption(w, starts[i], ends[i], i === 0)));
};
