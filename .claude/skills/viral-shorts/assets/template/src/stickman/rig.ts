/**
 * Esqueleto do stickman (puro, sem React): poses em ângulos + cinemática direta.
 *
 * Convenções (personagem olhando para a DIREITA; o componente espelha quando facing = -1):
 * - ângulos em graus, medidos a partir da vertical para BAIXO; positivo = gira para a FRENTE;
 * - braço: [ombro, cotovelo] — o antebraço fica em (ombro + cotovelo);
 * - perna: [quadril, joelho] — a canela fica em (quadril − joelho) (joelho dobra para trás);
 * - "near" = membro do lado da câmera, "far" = do lado de trás.
 * Os pés são apoiados no chão (y = 0) automaticamente; `lift` tira do chão (pulo).
 */

export type Pose = {
  lean: number;
  head: number;
  near: [number, number];
  far: [number, number];
  legNear: [number, number];
  legFar: [number, number];
  lift?: number;
};

export const BONES = {
  headR: 26,
  neck: 10,
  torso: 72,
  upperArm: 38,
  foreArm: 36,
  thigh: 46,
  shin: 46,
  shoulderDrop: 9,
} as const;

const P = (lean: number, head: number, near: [number, number], far: [number, number], legNear: [number, number], legFar: [number, number], lift = 0): Pose => ({
  lean, head, near, far, legNear, legFar, lift,
});

/** Biblioteca de poses (olhando para a direita). */
export const POSES = {
  stand: P(0, 0, [22, 10], [-22, -6], [6, 0], [-6, 0]),
  point: P(0, -4, [88, 0], [-10, 12], [6, 0], [-6, 0]),
  holdUp: P(-3, -14, [150, -20], [-12, 10], [6, 0], [-6, 0]),
  think: P(4, 10, [28, 128], [8, 70], [4, 0], [-4, 0]),
  shrug: P(0, -4, [55, -115], [-55, 115], [6, 0], [-6, 0]),
  surprised: P(-6, -6, [155, 15], [-155, -15], [12, 14], [-12, 14]),
  explain: P(2, 0, [62, -40], [-12, 12], [6, 0], [-6, 0]),
  wave: P(0, 0, [160, 30], [-10, 8], [5, 0], [-5, 0]),
  tapWrist: P(6, 12, [45, 88], [55, 70], [4, 0], [-4, 0]),
  crouch: P(26, -10, [70, -10], [52, 0], [58, 98], [22, 86]),
  celebrate: P(-4, -10, [170, -15], [-170, 15], [16, 30], [-10, 10], 26),
  sad: P(10, 18, [2, 4], [-2, 4], [3, 0], [-3, 0]),
} satisfies Record<string, Pose>;

export type PoseName = keyof typeof POSES;

export const resolvePose = (p: Pose | PoseName): Pose => (typeof p === "string" ? POSES[p] : p);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const pair = (a: [number, number], b: [number, number], t: number): [number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

export const mixPose = (a: Pose | PoseName, b: Pose | PoseName, t: number): Pose => {
  const A = resolvePose(a);
  const B = resolvePose(b);
  const k = Math.max(0, Math.min(1, t));
  return {
    lean: lerp(A.lean, B.lean, k),
    head: lerp(A.head, B.head, k),
    near: pair(A.near, B.near, k),
    far: pair(A.far, B.far, k),
    legNear: pair(A.legNear, B.legNear, k),
    legFar: pair(A.legFar, B.legFar, k),
    lift: lerp(A.lift ?? 0, B.lift ?? 0, k),
  };
};

const smooth = (x: number) => x * x * (3 - 2 * x);

/** Pose em t (s) a partir de keyframes {t, pose}; transição suave (smoothstep) entre eles. */
export const poseAt = (t: number, keys: { t: number; pose: Pose | PoseName }[]): Pose => {
  if (keys.length === 0) return POSES.stand;
  const ks = [...keys].sort((a, b) => a.t - b.t);
  if (t <= ks[0].t) return resolvePose(ks[0].pose);
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i];
    const b = ks[i + 1];
    if (t <= b.t) return mixPose(a.pose, b.pose, smooth((t - a.t) / Math.max(1e-6, b.t - a.t)));
  }
  return resolvePose(ks[ks.length - 1].pose);
};

/** Ciclo de caminhada (fase em ciclos; 1 ciclo = 2 passos). */
export const walkPose = (phase: number, intensity = 1): Pose => {
  const a = phase * Math.PI * 2;
  const s = Math.sin(a);
  const k = intensity;
  return {
    lean: 4 * k,
    head: -2,
    near: [-22 * s * k + 6, 10 + 8 * Math.max(0, s) * k],
    far: [22 * s * k - 6, 10 + 8 * Math.max(0, -s) * k],
    legNear: [26 * s * k, Math.max(0, 38 * Math.cos(a) * k)],
    legFar: [-26 * s * k, Math.max(0, -38 * Math.cos(a) * k)],
    lift: Math.abs(Math.sin(a)) * 4 * k,
  };
};

/**
 * Anda de fromX até toX entre start e end (s). Fora do intervalo fica parado em `rest`.
 * Retorna posição x e a pose (caminhada misturada com a pose de repouso nas pontas).
 */
export const walkAlong = (
  t: number,
  o: { fromX: number; toX: number; start: number; end: number; stepsPerSec?: number; rest?: Pose | PoseName },
): { x: number; pose: Pose; walking: boolean } => {
  const rest = o.rest ?? "stand";
  const dur = Math.max(1e-6, o.end - o.start);
  const p = Math.max(0, Math.min(1, (t - o.start) / dur));
  const x = lerp(o.fromX, o.toX, smooth(p));
  const walking = t > o.start && t < o.end;
  if (!walking) return { x, pose: resolvePose(rest), walking };
  const steps = o.stepsPerSec ?? 1.8;
  const blend = Math.min(1, Math.min(t - o.start, o.end - t) / 0.25);
  return { x, pose: mixPose(rest, walkPose((t - o.start) * (steps / 2)), blend), walking };
};

type Pt = { x: number; y: number };
const rad = (d: number) => (d * Math.PI) / 180;
/** Ponto a `len` de `o` na direção do ângulo (0 = para baixo, + = para a frente/direita). */
const step = (o: Pt, angleDeg: number, len: number): Pt => ({
  x: o.x + Math.sin(rad(angleDeg)) * len,
  y: o.y + Math.cos(rad(angleDeg)) * len,
});

export type Skeleton = {
  hip: Pt;
  neck: Pt;
  shoulder: Pt;
  head: Pt;
  near: { elbow: Pt; hand: Pt; foreAngle: number };
  far: { elbow: Pt; hand: Pt; foreAngle: number };
  legNear: { knee: Pt; foot: Pt };
  legFar: { knee: Pt; foot: Pt };
  /** altura total do topo da cabeça até o chão (px, escala 1) */
  height: number;
};

/** Cinemática direta com o personagem apoiado no chão (y = 0 nos pés), olhando para a direita. */
export const solve = (pose: Pose): Skeleton => {
  const B = BONES;
  const legs = (h: [number, number]) => {
    const hip = { x: 0, y: 0 };
    const knee = step(hip, h[0], B.thigh);
    const foot = step(knee, h[0] - h[1], B.shin);
    return { knee, foot };
  };
  const ln = legs(pose.legNear);
  const lf = legs(pose.legFar);
  // quadril numa altura que deixa o pé mais baixo exatamente no chão
  const hipY = -Math.max(ln.foot.y, lf.foot.y) - (pose.lift ?? 0);
  const shift = (p: Pt): Pt => ({ x: p.x, y: p.y + hipY });
  const hip = { x: 0, y: hipY };
  const neck = { x: hip.x + Math.sin(rad(pose.lean)) * B.torso, y: hip.y - Math.cos(rad(pose.lean)) * B.torso };
  const shoulder = { x: neck.x - Math.sin(rad(pose.lean)) * B.shoulderDrop, y: neck.y + Math.cos(rad(pose.lean)) * B.shoulderDrop };
  const headAngle = rad(pose.lean + pose.head);
  const head = {
    x: neck.x + Math.sin(headAngle) * (B.neck + B.headR),
    y: neck.y - Math.cos(headAngle) * (B.neck + B.headR),
  };
  const arm = (a: [number, number]) => {
    const elbow = step(shoulder, a[0], B.upperArm);
    const foreAngle = a[0] + a[1];
    const hand = step(elbow, foreAngle, B.foreArm);
    return { elbow, hand, foreAngle };
  };
  return {
    hip,
    neck,
    shoulder,
    head,
    near: arm(pose.near),
    far: arm(pose.far),
    legNear: { knee: shift(ln.knee), foot: shift(ln.foot) },
    legFar: { knee: shift(lf.knee), foot: shift(lf.foot) },
    height: -(head.y - B.headR),
  };
};
