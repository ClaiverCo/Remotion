import type { Roteiro } from "./schema";

export type ScriptWord = {
  /** Palavra como aparece na legenda (com pontuação, sem asteriscos). */
  text: string;
  emphasis: boolean;
  scene: number;
};

/**
 * Quebra a narração em palavras e marca as que estão entre *asteriscos*.
 * "Essa curva é o *sifão*." -> [{Essa}, {curva}, {é}, {o}, {sifão., emphasis}]
 * Ênfase pode cobrir várias palavras: "*selo hídrico*".
 */
export const tokenizeNarration = (
  narracao: string,
  scene = 0,
): ScriptWord[] => {
  const words: ScriptWord[] = [];
  let inEmphasis = false;
  for (const raw of narracao.trim().split(/\s+/)) {
    let text = "";
    let emphasis = false;
    for (const ch of raw) {
      if (ch === "*") {
        inEmphasis = !inEmphasis;
        continue;
      }
      if (inEmphasis && /[\p{L}\p{N}]/u.test(ch)) emphasis = true;
      text += ch;
    }
    if (text.length === 0) continue;
    words.push({ text, emphasis, scene });
  }
  return words;
};

export const scriptWords = (roteiro: Roteiro): ScriptWord[] =>
  roteiro.cenas.flatMap((cena, i) => tokenizeNarration(cena.narracao, i));

/**
 * Versão "falada" das palavras: aplica o dicionário de pronúncias do roteiro
 * (ex.: { "fecho": "fêcho", "NBR": "ene bê erre" }) só no que vai para a voz.
 * A legenda continua mostrando o texto original. A chave é comparada sem acento/pontuação
 * e a pontuação da palavra original é mantida.
 */
export const spokenWords = (words: ScriptWord[], pronuncias: Record<string, string> = {}): ScriptWord[] => {
  const map = new Map(Object.entries(pronuncias).map(([k, v]) => [normalizeWord(k), v]));
  if (map.size === 0) return words;
  return words.map((w) => {
    const rep = map.get(normalizeWord(w.text));
    if (!rep) return w;
    const m = /^([^\p{L}\p{N}]*)[\s\S]*?([^\p{L}\p{N}]*)$/u.exec(w.text);
    return { ...w, text: `${m?.[1] ?? ""}${rep}${m?.[2] ?? ""}` };
  });
};

/** Texto limpo (sem asteriscos) para mandar ao TTS. */
export const narrationText = (roteiro: Roteiro): string =>
  scriptWords(roteiro)
    .map((w) => w.text)
    .join(" ");

/** Normaliza para comparar palavras: minúsculas, sem acento e sem pontuação. */
export const normalizeWord = (w: string): string =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");

export const countWords = (roteiro: Roteiro): number =>
  scriptWords(roteiro).length;
