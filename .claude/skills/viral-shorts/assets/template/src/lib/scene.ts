import type { SceneWord } from "./types";
import { normalizeWord } from "./words";

/**
 * Momento (s, desde o início da cena) em que uma palavra é falada.
 * Compara sem acento/pontuação pelo começo da palavra ("levant" acha "levanta").
 * `nth` escolhe a ocorrência (1 = primeira); `edge` "end" devolve quando a palavra termina.
 * Se não achar, usa `fallback` (s).
 */
export const wordTime = (
  words: SceneWord[],
  query: string,
  fallback: number,
  opts: { nth?: number; edge?: "start" | "end" } = {},
): number => {
  const q = normalizeWord(query.split(/\s+/)[0] ?? "");
  if (!q) return fallback;
  const hits = words.filter((w) => normalizeWord(w.text).startsWith(q));
  const hit = hits[(opts.nth ?? 1) - 1];
  if (!hit) return fallback;
  return opts.edge === "end" ? hit.end : hit.start;
};
