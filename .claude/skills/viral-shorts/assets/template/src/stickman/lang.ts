import { useScene } from "../lib/anim";
import type { SceneWord } from "../lib/types";

/**
 * Pacote de idioma das cenas Stickman: o MESMO Scenes.tsx serve a vários idiomas.
 * - `words`: palavra-gatilho do roteiro original (inglês) → palavra no idioma do vídeo.
 *   Chave "again#2" = 2ª ocorrência de "again"; o valor pode ter `nth` e `edge` próprios.
 * - `text`: texto da tela no original → texto traduzido.
 * Sem pacote (ou com `EN`), tudo fica como no original.
 */
export type WordMap = Record<string, string | { q: string; nth?: number; edge?: "start" | "end" }>;
export type SceneLang = {
  words?: WordMap;
  text?: Record<string, string>;
  /** etiquetas de era (EraTag) */
  tagPresent?: string;
  tagFuture?: string;
  /** formato dos números (ex.: "pt-BR" → 32.768) */
  locale?: string;
};

export const EN: SceneLang = {};

type At = (query: string, fallbackFrac?: number, opts?: { nth?: number; edge?: "start" | "end" }) => number;

/**
 * Troca a palavra-gatilho pela do idioma antes de procurar o tempo dela na fala.
 * Ordem de busca: "c01:again#2", "c01:again", "again#2", "again" (a cena vem primeiro,
 * porque a mesma palavra em inglês pode virar palavras diferentes em cada clipe).
 */
export const mapAt = (L: SceneLang, at: At, scene?: string): At => (key, frac = 0, opts = {}) => {
  const k = opts.nth ? [`${key}#${opts.nth}`, key] : [key];
  const keys = scene ? [...k.map((x) => `${scene}:${x}`), ...k] : k;
  const hit = keys.find((x) => L.words?.[x] !== undefined);
  const m = hit ? L.words![hit] : undefined;
  if (m === undefined) return at(key, frac, opts);
  if (typeof m === "string") return at(m, frac, { edge: opts.edge });
  return at(m.q, frac, { nth: m.nth, edge: m.edge ?? opts.edge });
};

/** `useScene` com o pacote de idioma: `at("door")` vira `at("porta")` no vídeo em português. `scene` = id curto do clipe ("c01"). */
export const useLangScene = (props: { durationInFrames: number; words?: SceneWord[] }, L: SceneLang, scene?: string) => {
  const s = useScene(props);
  return { ...s, at: mapAt(L, s.at, scene) };
};

/** Tradutor dos textos da tela. */
export const translator = (L: SceneLang) => (s: string) => L.text?.[s] ?? s;
