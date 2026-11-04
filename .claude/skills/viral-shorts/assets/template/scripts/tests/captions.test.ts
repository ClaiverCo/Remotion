import assert from "node:assert/strict";
import { test } from "node:test";
import {
  alignTimedWordsToScript,
  alignmentToTimedWords,
  elevenLabsToCaptions,
  estimateCaptions,
  mergeWhisperTokens,
  type ElevenLabsAlignment,
} from "../../src/lib/captions.ts";
import { paginateCaptions } from "../../src/lib/paginate.ts";
import { parseRoteiro } from "../../src/lib/schema.ts";
import { buildTimeline } from "../../src/lib/timeline.ts";
import { narrationText, scriptWords, tokenizeNarration } from "../../src/lib/words.ts";

const roteiro = parseRoteiro({
  slug: "teste",
  titulo: "Teste",
  tema: "Teste",
  modelo: "parece-facil",
  estilo: "2.5d",
  perguntaCentral: "Como?",
  duracaoAlvoSeg: 20,
  voz: "estimada",
  cenas: [
    { id: "a", narracao: "A curva é o *sifão*.", visual: "x" },
    { id: "b", narracao: "E essa água é o *selo hídrico*, viu?", visual: "y" },
  ],
});

const alignmentFor = (text: string, msPerChar = 60): ElevenLabsAlignment => {
  const characters = [...text];
  return {
    characters,
    character_start_times_seconds: characters.map((_, i) => (i * msPerChar) / 1000),
    character_end_times_seconds: characters.map((_, i) => ((i + 1) * msPerChar) / 1000),
  };
};

test("tokenizeNarration marca ênfase simples e de várias palavras", () => {
  const w = tokenizeNarration("o *selo hídrico* volta, e o *gás* não.");
  assert.deepEqual(
    w.map((x) => [x.text, x.emphasis]),
    [
      ["o", false],
      ["selo", true],
      ["hídrico", true],
      ["volta,", false],
      ["e", false],
      ["o", false],
      ["gás", true],
      ["não.", false],
    ],
  );
});

test("narrationText remove asteriscos", () => {
  assert.equal(narrationText(roteiro), "A curva é o sifão. E essa água é o selo hídrico, viu?");
});

test("alinhamento do ElevenLabs vira uma legenda por palavra, com cena e ênfase", () => {
  const caps = elevenLabsToCaptions(alignmentFor(narrationText(roteiro)), scriptWords(roteiro));
  assert.equal(caps.length, scriptWords(roteiro).length);
  assert.equal(caps[0].text, "A");
  assert.equal(caps[1].text, " curva");
  const sifao = caps.find((c) => c.text.includes("sifão"))!;
  assert.equal(sifao.emphasis, true);
  assert.equal(sifao.scene, 0);
  assert.equal(caps.at(-1)!.scene, 1);
  for (let i = 1; i < caps.length; i++) assert.ok(caps[i].startMs >= caps[i - 1].endMs - 1);
});

test("alignmentToTimedWords agrupa caracteres por espaço", () => {
  const t = alignmentToTimedWords(alignmentFor("oi tudo"));
  assert.deepEqual(t.map((x) => x.text), ["oi", "tudo"]);
  assert.equal(t[1].startMs, 180);
});

test("whisper: junta tokens, descarta marcadores e corrige texto pelo roteiro", () => {
  const tokens = mergeWhisperTokens([
    { text: "[_BEG_]", startMs: 0, endMs: 0 },
    { text: " A", startMs: 100, endMs: 200 },
    { text: " curva", startMs: 200, endMs: 500 },
    { text: " é", startMs: 500, endMs: 600 },
    { text: " o", startMs: 600, endMs: 650 },
    { text: " si", startMs: 650, endMs: 800 },
    { text: "fon.", startMs: 800, endMs: 1000 }, // erro de transcrição + token quebrado
    { text: " E", startMs: 1300, endMs: 1400 },
    { text: " essa", startMs: 1400, endMs: 1600 },
    // "água" não foi ouvida
    { text: " é", startMs: 1900, endMs: 2000 },
    { text: " o", startMs: 2000, endMs: 2050 },
    { text: " selo", startMs: 2050, endMs: 2300 },
    { text: " hídrico,", startMs: 2300, endMs: 2700 },
    { text: " viu?", startMs: 2800, endMs: 3100 },
  ]);
  assert.equal(tokens.length, 12);
  assert.equal(tokens[4].text, "sifon.");
  const caps = alignTimedWordsToScript(tokens, scriptWords(roteiro));
  assert.equal(caps.map((c) => c.text.trim()).join(" "), narrationText(roteiro));
  const sifao = caps[4];
  assert.equal(sifao.startMs, 650);
  assert.equal(sifao.endMs, 1000);
  const agua = caps[7];
  assert.equal(agua.text, " água");
  assert.ok(agua.startMs >= 1600 && agua.endMs <= 1900, `água interpolada: ${agua.startMs}-${agua.endMs}`);
});

test("estimativa respeita ordem, pausas e ~palavras por segundo", () => {
  const caps = estimateCaptions(scriptWords(roteiro), { wordsPerSecond: 3 });
  assert.equal(caps.length, 13);
  const gapAfterSentence = caps[5].startMs - caps[4].endMs;
  assert.ok(gapAfterSentence >= 300, `pausa após ponto: ${gapAfterSentence}`);
  const total = caps.at(-1)!.endMs - caps[0].startMs;
  assert.ok(total > 4000 && total < 6000, `total ${total}`);
});

test("paginação: no máximo 3 palavras e quebra em pontuação/cena", () => {
  const caps = estimateCaptions(scriptWords(roteiro));
  const pages = paginateCaptions(caps, { maxWords: 3, maxChars: 16 });
  for (const p of pages) assert.ok(p.words.length <= 3);
  const firstSceneB = pages.findIndex((p) => p.words[0].scene === 1);
  assert.ok(pages.slice(firstSceneB).every((p) => p.words.every((w) => w.scene === 1)));
  assert.ok(pages.some((p) => p.words.at(-1)!.text.endsWith("sifão.")));
  for (let i = 1; i < pages.length; i++) assert.ok(pages[i].startMs >= pages[i - 1].endMs);
});

test("timeline: cenas começam na 1ª palavra (com antecipação) e cobrem o vídeo todo", () => {
  const caps = estimateCaptions(scriptWords(roteiro));
  const t = buildTimeline(roteiro, caps, { audio: null, source: "estimada", leadMs: 100, tailMs: 800 });
  assert.equal(t.scenes[0].startMs, 0);
  const firstB = caps.find((c) => c.scene === 1)!;
  assert.equal(t.scenes[1].startMs, firstB.startMs - 100);
  assert.equal(t.scenes[0].endMs, t.scenes[1].startMs);
  assert.equal(t.scenes[1].endMs, t.durationMs);
  assert.equal(t.durationMs, caps.at(-1)!.endMs + 800);
});

test("roteiro inválido dá mensagem clara", () => {
  assert.throws(
    () => parseRoteiro({ ...roteiro, cenas: [{ id: "A B", narracao: "", visual: "" }] }),
    /roteiro.json inválido/,
  );
});
