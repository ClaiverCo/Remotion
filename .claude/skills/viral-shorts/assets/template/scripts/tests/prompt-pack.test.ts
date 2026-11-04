import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { parseRoteiro } from "../../src/lib/schema.ts";
import { identityParagraph, LEAD } from "../../src/stickman/bible.ts";
import { parseClips, type ClipsFile } from "../../src/stickman/clips.ts";
import {
  buildPromptPack,
  clipRange,
  editorialCaptions,
  PLACEHOLDER_RE,
  REQUIRED_AGENT_OPENING,
  validateInputs,
} from "../lib/prompt-pack.ts";

// Usa o episódio de exemplo como fixture (é o caso real que o pacote precisa atender).
const dir = path.join(import.meta.dirname, "../../src/videos/stickman-house-key");
const roteiro = parseRoteiro(JSON.parse(fs.readFileSync(path.join(dir, "roteiro.json"), "utf8")));
const clips = parseClips(JSON.parse(fs.readFileSync(path.join(dir, "clips.json"), "utf8")));
const pesquisa = fs.readFileSync(path.join(dir, "pesquisa.md"), "utf8");
const captions = JSON.parse(fs.readFileSync(path.join(dir, "captions.json"), "utf8"));

test("o pacote tem todas as entregas do documento, na ordem", () => {
  const { markdown } = buildPromptPack({ roteiro, clips, pesquisa, captions });
  const order = [
    "## 0. Project lock",
    "## 1. Present-day fact brief and sources",
    "## 2. Series bible",
    "## 3. Story and narration by clip",
    "## 4. Visual style and character designs",
    "## 5. Character reference sheet prompts",
    "## 6. Character consistency agent instructions",
    "## 7. Clip packages",
    "## 8. Assembly guide and continuity checklist",
  ];
  let last = -1;
  for (const h of order) {
    const i = markdown.indexOf(h);
    assert.ok(i > last, `fora de ordem ou ausente: ${h}`);
    last = i;
  }
  assert.ok(markdown.includes(REQUIRED_AGENT_OPENING), "abertura obrigatória do agente");
  assert.equal((markdown.match(/CHARACTER REFERENCE SHEET PROMPT/g) ?? []).length, 1 + clips.cast.length);
  assert.ok(!PLACEHOLDER_RE.test(markdown), "sem placeholders");
});

test("todo clipe tem prompt de imagem e de animação completos, com a identidade literal", () => {
  const { markdown, clips: prompts } = buildPromptPack({ roteiro, clips, pesquisa, captions });
  assert.equal(prompts.length, roteiro.cenas.length);
  const id = identityParagraph(LEAD);
  prompts.forEach((p, i) => {
    assert.ok(markdown.includes(`### ${p.code} · ${clipRange(i)}`), p.code);
    assert.ok(p.image.includes(id) && p.animation.includes(id), `${p.code}: identidade do Kip literal`);
    assert.ok(p.image.includes(clips.relicDescription), `${p.code}: relíquia literal`);
    for (const t of ["0.0–2.0 s:", "2.0–5.0 s:", "5.0–8.0 s:", "8.0–10.0 s:"]) assert.ok(p.animation.includes(t), `${p.code}: ${t}`);
    assert.ok(p.image.startsWith("Vertical 9:16"), `${p.code}: proporção`);
    assert.ok(p.measuredMs !== null && p.measuredMs < 9500, `${p.code}: narração medida cabe em 10 s`);
  });
});

test("personagem que entra no meio do clipe fica fora do prompt de imagem, mas no de animação", () => {
  const { clips: prompts } = buildPromptPack({ roteiro, clips, pesquisa, captions });
  const c02 = prompts[1];
  assert.ok(!c02.image.includes("Sam (PP-01):"), "Sam não está no quadro inicial do C02");
  assert.ok(c02.animation.includes("Sam (PP-01):"), "Sam aparece na animação do C02");
});

test("validateInputs pega clipe fora de ordem e personagem inexistente", () => {
  const bad: ClipsFile = structuredClone(clips);
  bad.clips[0].cena = "outra";
  bad.clips[1].characters.push({ ...bad.clips[1].characters[0], id: "XX-99" });
  const errs = validateInputs(roteiro, bad);
  assert.ok(errs.some((e) => e.includes("outra")));
  assert.ok(errs.some((e) => e.includes("XX-99")));
});

test("legendas da montagem começam no início de cada clipe de 10 s", () => {
  const lines = editorialCaptions(captions, roteiro.cenas.length);
  for (let i = 0; i < roteiro.cenas.length; i++) {
    const first = lines.find((l) => l.startMs >= i * 10000 && l.startMs < (i + 1) * 10000);
    assert.ok(first, `clipe ${i + 1} sem legenda`);
    assert.equal(first!.startMs, i * 10000 + 150);
  }
  assert.ok(lines.every((l) => l.endMs > l.startMs));
});
