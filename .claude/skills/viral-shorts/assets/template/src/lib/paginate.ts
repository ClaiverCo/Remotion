import type { VideoCaption } from "./types";

export type CaptionPage = {
  startMs: number;
  endMs: number;
  words: VideoCaption[];
};

export type PaginateOptions = {
  /** Máximo de palavras por "página" de legenda. Viral: 1 a 3. */
  maxWords?: number;
  /** Máximo de caracteres por página (sem espaços extras). */
  maxChars?: number;
  /** Pausa (ms) entre palavras que força nova página. */
  pauseMs?: number;
  /** Quanto a última página de uma frase fica na tela depois da última palavra. */
  holdMs?: number;
};

const ENDS_PHRASE = /[.,!?;:…]["”')]?$/;

/**
 * Agrupa as palavras em páginas curtas (estilo TikTok/Shorts): quebra em pontuação,
 * pausas, troca de cena, limite de palavras e de caracteres.
 */
export const paginateCaptions = (
  captions: VideoCaption[],
  opts: PaginateOptions = {},
): CaptionPage[] => {
  const maxWords = opts.maxWords ?? 3;
  const maxChars = opts.maxChars ?? 15;
  const pauseMs = opts.pauseMs ?? 350;
  const holdMs = opts.holdMs ?? 500;

  const pages: CaptionPage[] = [];
  let cur: VideoCaption[] = [];

  const flush = () => {
    if (cur.length === 0) return;
    pages.push({
      startMs: cur[0].startMs,
      endMs: cur[cur.length - 1].endMs,
      words: cur,
    });
    cur = [];
  };

  captions.forEach((c, i) => {
    const text = c.text.trim();
    const curChars = cur.reduce((a, w) => a + w.text.trim().length + 1, 0);
    if (cur.length > 0 && curChars + text.length > maxChars) flush();
    cur.push(c);
    const next = captions[i + 1];
    const breakHere =
      !next ||
      c.pageBreakAfter ||
      ENDS_PHRASE.test(text) ||
      cur.length >= maxWords ||
      next.startMs - c.endMs > pauseMs ||
      (next.scene !== undefined && next.scene !== c.scene);
    if (breakHere) flush();
  });

  // Cada página fica até a próxima começar (sem buracos curtos), com limite de holdMs.
  for (let i = 0; i < pages.length; i++) {
    const next = pages[i + 1];
    const hold = pages[i].endMs + holdMs;
    pages[i].endMs = next ? Math.min(next.startMs, hold) : hold;
    if (next && next.startMs - pages[i].endMs < 120) pages[i].endMs = next.startMs;
  }
  return pages;
};
