import assert from "node:assert/strict";
import { test } from "node:test";
import { POSES, jointWorld, leftArm, mixPose, poseAt, solve, walkAlong, type PoseName } from "../../src/stickman/rig.ts";
import { LEAD, identityParagraph } from "../../src/stickman/bible.ts";

test("toda pose fica com o pé mais baixo exatamente no chão (exceto o pulo do celebrate)", () => {
  for (const name of Object.keys(POSES) as PoseName[]) {
    const sk = solve(POSES[name]);
    const lowest = Math.max(sk.legNear.foot.y, sk.legFar.foot.y);
    const lift = POSES[name].lift ?? 0;
    assert.ok(Math.abs(lowest + lift) < 1e-6, `${name}: pé em ${lowest}`);
    assert.ok(sk.head.y < sk.neck.y && sk.neck.y < sk.hip.y, `${name}: cabeça acima do pescoço acima do quadril`);
    assert.ok(sk.height > 150 && sk.height < 260, `${name}: altura ${sk.height}`);
  }
});

test("poseAt interpola entre keyframes e segura as pontas", () => {
  const keys = [
    { t: 1, pose: "stand" as const },
    { t: 2, pose: "point" as const },
  ];
  assert.deepEqual(poseAt(0, keys), POSES.stand);
  assert.deepEqual(poseAt(3, keys), POSES.point);
  const mid = poseAt(1.5, keys);
  assert.ok(mid.near[0] > POSES.stand.near[0] && mid.near[0] < POSES.point.near[0]);
  assert.deepEqual(mixPose("stand", "point", 0), POSES.stand);
});

test("walkAlong anda de A a B no intervalo e para nas pontas", () => {
  const o = { fromX: 100, toX: 500, start: 1, end: 3 };
  assert.equal(walkAlong(0, o).x, 100);
  assert.equal(walkAlong(0, o).walking, false);
  assert.equal(walkAlong(5, o).x, 500);
  const mid = walkAlong(2, o);
  assert.ok(mid.walking && mid.x > 100 && mid.x < 500);
});

test("parágrafo de identidade traz os traços imutáveis e as cores exatas", () => {
  const p = identityParagraph(LEAD);
  for (const must of ["FL-01", "halo", "Chrono-Band", "LEFT wrist", "#22D3EE", "#8B5CF6"]) assert.ok(p.includes(must), must);
});

test("a Chrono-Band fica sempre no pulso ESQUERDO dele, em qualquer vista", () => {
  // de perfil olhando para a direita, o braço do lado da câmera é o DIREITO
  assert.equal(leftArm("side", 1), "far");
  assert.equal(leftArm("side", -1), "near");
  assert.equal(leftArm("three-quarter", 1), "far");
  // de frente, o esquerdo dele aparece à direita do quadro (braço "near" com facing 1)
  assert.equal(leftArm("front", 1), "near");
  // de costas, o esquerdo dele aparece à esquerda do quadro
  assert.equal(leftArm("back", -1), "near");
  assert.equal(leftArm("back", 1), "far");
});

test("jointWorld devolve a mão na tela respeitando escala e facing", () => {
  const r = jointWorld({ x: 500, y: 1000, scale: 2, facing: 1, pose: "point" }, "nearHand");
  const l = jointWorld({ x: 500, y: 1000, scale: 2, facing: -1, pose: "point" }, "nearHand");
  assert.ok(r.x > 500 && l.x < 500, "aponta para o lado do facing");
  assert.ok(Math.abs(r.x - 500 - (500 - l.x)) < 1e-9 && r.y === l.y, "espelhado");
});
