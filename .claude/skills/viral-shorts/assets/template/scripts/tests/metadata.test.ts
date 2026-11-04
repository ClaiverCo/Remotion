import assert from "node:assert/strict";
import { test } from "node:test";
import { validateMetadata, youtubeDescription } from "../lib/metadata.ts";

const base = () => ({
  youtube: {
    titulo: "Por que o banheiro não fede a esgoto?",
    descricao: "A resposta está numa curva escondida no vaso.",
    hashtags: ["#shorts", "#curiosidades", "#comofunciona"],
    tags: ["vaso sanitário", "sifão"],
    categoria: "27",
    privacidade: "private",
    publicarEm: null,
    midiaSintetica: true,
  },
  tiktok: { legenda: "Você sabia disso?", hashtags: ["#curiosidades", "#ciencia", "#aprendanotiktok"] },
  reels: { legenda: "Salve para mostrar a alguém", hashtags: ["#curiosidades", "#ciencia", "#engenharia"] },
});

test("metadados corretos não têm erros", () => {
  const { issues } = validateMetadata(base());
  assert.deepEqual(issues.filter((i) => i.level === "erro"), []);
});

test("Reels com mais de 5 hashtags é erro (limite da plataforma)", () => {
  const m = base();
  m.reels.hashtags = ["#a", "#b", "#c", "#d", "#e", "#f"];
  const { issues } = validateMetadata(m);
  assert.ok(issues.some((i) => i.level === "erro" && i.where === "reels.hashtags"));
});

test("hashtag com espaço ou pontuação é erro; repetida também", () => {
  const m = base();
  m.tiktok.hashtags = ["#como funciona", "#ciência!", "#ok", "#OK"];
  const { issues } = validateMetadata(m);
  const errs = issues.filter((i) => i.level === "erro" && i.where === "tiktok.hashtags");
  assert.equal(errs.length, 3);
});

test("título > 100 é erro, > 60 é aviso, e < > são proibidos", () => {
  const m = base();
  m.youtube.titulo = "x".repeat(70);
  assert.ok(validateMetadata(m).issues.some((i) => i.level === "aviso" && i.where === "youtube.titulo"));
  m.youtube.titulo = "x".repeat(101);
  assert.ok(validateMetadata(m).issues.some((i) => i.level === "erro" && i.where === "youtube.titulo"));
  m.youtube.titulo = "a <b>";
  assert.ok(validateMetadata(m).issues.some((i) => i.level === "erro" && i.msg.includes("<")));
});

test("data de publicação no passado é erro; sem fuso é aviso", () => {
  const m = base();
  m.youtube.publicarEm = "2020-01-01T10:00:00-03:00" as unknown as null;
  assert.ok(validateMetadata(m).issues.some((i) => i.where === "youtube.publicarEm" && i.level === "erro"));
  m.youtube.publicarEm = "2999-01-01T10:00:00" as unknown as null;
  assert.ok(validateMetadata(m).issues.some((i) => i.where === "youtube.publicarEm" && i.level === "aviso"));
});

test("sem #shorts gera aviso; palavras sensíveis geram aviso", () => {
  const m = base();
  m.youtube.hashtags = ["#curiosidades", "#ciencia", "#engenharia"];
  m.tiktok.legenda = "Isso pode matar você";
  const { issues } = validateMetadata(m);
  assert.ok(issues.some((i) => i.msg.includes("#shorts")));
  assert.ok(issues.some((i) => i.where === "tiktok" && i.msg.includes("matar")));
});

test("descrição do YouTube termina com as hashtags", () => {
  const parsed = validateMetadata(base()).data!;
  assert.ok(youtubeDescription(parsed).endsWith("#shorts #curiosidades #comofunciona"));
});
