import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clauseBreaks,
  findClausePauses,
  distributeWords,
  phrasesFromWords,
  ssmlWithMarks,
  timepointsToCaptions,
} from "../../src/lib/captions.ts";
import { spokenWords, tokenizeNarration, type ScriptWord } from "../../src/lib/words.ts";
import { chooseMotor } from "../lib/tts/choose.ts";
import { wordTime } from "../../src/lib/scene.ts";
import { chunkForGoogle } from "../lib/tts/google.ts";

const words: ScriptWord[] = [
  ...tokenizeNarration("Pra sumir com o cocô, bastava um *buraco*. Só que não!", 0),
  ...tokenizeNarration("A solução: uma *curva* & água.", 1),
];

test("phrasesFromWords quebra em fim de frase e troca de cena, mantendo vírgulas dentro", () => {
  const ph = phrasesFromWords(words, { sentencePauseMs: 250, scenePauseMs: 400 });
  assert.deepEqual(
    ph.map((p) => p.text),
    ["Pra sumir com o cocô, bastava um buraco.", "Só que não!", "A solução: uma curva & água."],
  );
  assert.deepEqual(ph.map((p) => p.first), [0, 8, 11]);
  assert.deepEqual(ph.map((p) => p.pauseAfterMs), [250, 400, 0]);
  assert.deepEqual(clauseBreaks(ph[0].words), [4]); // depois de "cocô,"
});

test("distributeWords usa as pausas reais do áudio quando batem com as vírgulas", () => {
  const ph = phrasesFromWords(words)[0];
  const caps = distributeWords(ph.words, 1000, 4000, 0, [{ startMs: 2000, endMs: 2300 }]);
  assert.equal(caps.length, 8);
  assert.equal(caps[0].text, "Pra");
  assert.equal(caps[0].startMs, 1000);
  assert.ok(Math.abs(caps[4].endMs - 2000) <= 1, `"cocô," termina na pausa: ${caps[4].endMs}`);
  assert.ok(Math.abs(caps[5].startMs - 2300) <= 1, `"bastava" começa depois da pausa: ${caps[5].startMs}`);
  assert.ok(caps.at(-1)!.endMs <= 4000 + 1);
  for (let i = 1; i < caps.length; i++) assert.ok(caps[i].startMs >= caps[i - 1].endMs - 1);
  assert.equal(caps[7].emphasis, true);
});

test("distributeWords sem pausas detectadas distribui por peso e reserva espaço na vírgula", () => {
  const ph = phrasesFromWords(words)[0];
  const caps = distributeWords(ph.words, 0, 3000, 5);
  assert.equal(caps[0].text, " Pra"); // não é a 1ª palavra global
  const gap = caps[5].startMs - caps[4].endMs;
  assert.ok(gap > 50, `pausa reservada após a vírgula: ${gap}`);
  assert.ok(Math.abs(caps.at(-1)!.endMs - 3000) <= 2);
});

test("ssmlWithMarks: uma marca por palavra, escape de XML e pausa entre cenas", () => {
  const ssml = ssmlWithMarks(words);
  assert.ok(ssml.startsWith("<speak><mark name=\"w0\"/>Pra"));
  assert.equal((ssml.match(/<mark /g) ?? []).length, words.length);
  assert.ok(ssml.includes("&amp;"));
  assert.ok(!/ & /.test(ssml));
  assert.ok(ssml.includes('<break time="300ms"/><mark name="w11"/>A'));
  assert.ok(ssmlWithMarks(words.slice(3), { firstIndex: 3 }).startsWith('<speak><mark name="w3"/>'));
});

test("timepointsToCaptions: tempos exatos, pausa de pontuação e interpolação de marcas faltando", () => {
  const tps = words.map((_, i) => ({ markName: `w${i}`, timeSeconds: 0.2 + i * 0.4 }));
  tps.splice(6, 1); // a API às vezes não devolve todas as marcas
  const caps = timepointsToCaptions(tps, words, 0.2 * 1000 + words.length * 400 + 300);
  assert.equal(caps.length, words.length);
  assert.equal(caps[0].startMs, 200);
  assert.equal(caps[5].startMs, 2200);
  assert.ok(caps[6].startMs > caps[5].startMs && caps[6].startMs < caps[7].startMs, "w6 interpolada");
  assert.equal(caps[7].startMs, 3000);
  for (let i = 1; i < caps.length; i++) assert.ok(caps[i].startMs >= caps[i - 1].endMs - 1);
  assert.throws(() => timepointsToCaptions([], words, 5000), /nenhuma marca/);
});

test("chunkForGoogle mantém tudo num pedido quando cabe e divide por frase/cena quando não cabe", () => {
  assert.equal(chunkForGoogle(words).length, 1);
  const long = Array.from({ length: 12 }, (_, s) =>
    tokenizeNarration(Array.from({ length: 40 }, (_, k) => `palavra${k}`).join(" ") + ".", s),
  ).flat();
  const chunks = chunkForGoogle(long);
  assert.ok(chunks.length > 1);
  assert.equal(chunks.reduce((a, c) => a + c.words.length, 0), long.length);
  for (const c of chunks) assert.ok(Buffer.byteLength(c.ssml) <= 4500);
  assert.equal(chunks[1].firstIndex, chunks[0].words.length);
});

test("chooseMotor: flag > TTS_MOTOR > chaves > piper grátis (pt-BR)", () => {
  assert.equal(chooseMotor(undefined, {}), "piper");
  assert.equal(chooseMotor(undefined, { GOOGLE_TTS_API_KEY: "x" }), "google");
  assert.equal(chooseMotor(undefined, { GOOGLE_TTS_API_KEY: "x", ELEVENLABS_API_KEY: "y" }), "elevenlabs");
  assert.equal(chooseMotor(undefined, { TTS_MOTOR: "Kokoro", ELEVENLABS_API_KEY: "y" }), "kokoro");
  assert.equal(chooseMotor("google", { TTS_MOTOR: "kokoro" }), "google");
  assert.throws(() => chooseMotor("edge", {}), /desconhecido/);
});

test("findClausePauses acha o vale de energia de cada vírgula (mesmo sem silêncio total)", () => {
  const ph = phrasesFromWords(tokenizeNarration("Ela enche a curva e, ao descer, puxa tudo.", 0))[0];
  // 3 s de fala a partir de 1000 ms; vales (energia 0.02, não zero) em ~1900 ms e ~2600 ms
  const env = Array.from({ length: 300 }, (_, f) => {
    const ms = 1000 + f * 10;
    if (ms >= 1880 && ms < 1950) return 0.02;
    if (ms >= 2580 && ms < 2640) return 0.025;
    return 0.2 + 0.05 * Math.sin(f);
  });
  const pauses = findClausePauses(ph.words, 1000, 4000, env, 1000, 10);
  assert.equal(pauses.length, 2);
  assert.ok(pauses[0].startMs >= 1860 && pauses[0].endMs <= 1980, JSON.stringify(pauses[0]));
  assert.ok(pauses[1].startMs >= 2560 && pauses[1].endMs <= 2670, JSON.stringify(pauses[1]));
  // sem vale claro → [] (cai na distribuição por peso)
  const flat = Array.from({ length: 300 }, () => 0.2);
  assert.deepEqual(findClausePauses(ph.words, 1000, 4000, flat, 1000, 10), []);
});

test("spokenWords troca só o que a voz fala, mantendo pontuação, cena e ênfase", () => {
  const w = tokenizeNarration("O *fecho* volta, e a NBR manda: fecho.", 2);
  const s = spokenWords(w, { fecho: "fêcho", nbr: "ene bê erre" });
  assert.deepEqual(s.map((x) => x.text), ["O", "fêcho", "volta,", "e", "a", "ene bê erre", "manda:", "fêcho."]);
  assert.equal(s[1].emphasis, true);
  assert.equal(s[1].scene, 2);
  assert.equal(spokenWords(w, {}), w);
});

test("wordTime acha a palavra falada na cena (sem acento/pontuação, por prefixo, n-ésima, fim)", () => {
  const words = [
    { text: "Apertou", start: 0.1, end: 0.5 },
    { text: "o", start: 0.5, end: 0.6 },
    { text: "botão,", start: 0.6, end: 1.0 },
    { text: "levanta", start: 2.0, end: 2.4 },
    { text: "botão.", start: 3.0, end: 3.3 },
  ];
  assert.equal(wordTime(words, "botao", 9), 0.6);
  assert.equal(wordTime(words, "Botão", 9, { edge: "end" }), 1.0);
  assert.equal(wordTime(words, "botao", 9, { nth: 2 }), 3.0);
  assert.equal(wordTime(words, "levant", 9), 2.0);
  assert.equal(wordTime(words, "despenca", 9), 9);
});
