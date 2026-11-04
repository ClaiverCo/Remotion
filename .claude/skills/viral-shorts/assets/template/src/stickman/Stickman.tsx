import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { LEAD, PRESENT_PEOPLE } from "./bible";
import { BONES, resolvePose, solve, type Pose, type PoseName } from "./rig";

export type Expression = "neutral" | "happy" | "curious" | "worried" | "shocked" | "angry" | "determined";
export type View = "side" | "three-quarter" | "front" | "back";

export type StickmanProps = {
  /** posição dos pés no chão (espaço 1080×1920) */
  x: number;
  y: number;
  scale?: number;
  /** 1 = olha para a direita, -1 = para a esquerda */
  facing?: 1 | -1;
  pose?: Pose | PoseName;
  expression?: Expression;
  /** "lead" = Kip (bíblia FL-01); "person" = gente de hoje */
  kind?: "lead" | "person";
  shirt?: string;
  hair?: "none" | "short" | "long" | "bun";
  view?: View;
  /** -1..1: para onde as pupilas olham (além do facing) */
  look?: number;
  blink?: boolean;
  /** objeto na mão do lado da câmera / de trás, desenhado em coordenadas da mão (de pé, sem espelhar) */
  holdNear?: React.ReactNode;
  holdFar?: React.ReactNode;
  opacity?: number;
};

const C = LEAD.colors;
const OUT = C.outline;
const LIMB = 7;

const Brows: React.FC<{ e: Expression; ex: number[]; dir: number }> = ({ e, ex, dir }) => {
  const y = -11;
  const segs = ex.map((cx, i) => {
    const inner = (i === 0 ? 1 : -1) * dir; // lado interno (em direção ao centro do rosto)
    switch (e) {
      case "happy":
        return `M${cx - 6} ${y} Q${cx} ${y - 5} ${cx + 6} ${y}`;
      case "curious":
        return i === ex.length - 1 ? `M${cx - 6} ${y - 6} L${cx + 6} ${y - 8}` : `M${cx - 6} ${y} L${cx + 6} ${y}`;
      case "worried":
        return `M${cx - 6} ${y + (inner > 0 ? 2 : -3)} L${cx + 6} ${y + (inner > 0 ? -3 : 2)}`;
      case "shocked":
        return `M${cx - 6} ${y - 6} Q${cx} ${y - 10} ${cx + 6} ${y - 6}`;
      case "angry":
        return `M${cx - 6} ${y + (inner > 0 ? -3 : 3)} L${cx + 6} ${y + (inner > 0 ? 3 : -3)}`;
      case "determined":
        return `M${cx - 6} ${y + (inner > 0 ? -1 : 2)} L${cx + 6} ${y + (inner > 0 ? 2 : -1)}`;
      default:
        return `M${cx - 6} ${y - 1} L${cx + 6} ${y - 1}`;
    }
  });
  return <path d={segs.join(" ")} stroke={OUT} strokeWidth={4} strokeLinecap="round" fill="none" />;
};

const Mouth: React.FC<{ e: Expression; mx: number }> = ({ e, mx }) => {
  const y = 11;
  const s = { stroke: OUT, strokeWidth: 3.5, strokeLinecap: "round" as const, fill: "none" };
  switch (e) {
    case "happy":
      return <path d={`M${mx - 8} ${y - 2} Q${mx} ${y + 7} ${mx + 8} ${y - 2}`} {...s} />;
    case "curious":
      return <circle cx={mx + 2} cy={y + 1} r={3} fill={OUT} />;
    case "worried":
      return <path d={`M${mx - 7} ${y + 2} Q${mx - 3} ${y - 2} ${mx} ${y + 1} Q${mx + 3} ${y + 4} ${mx + 7} ${y}`} {...s} />;
    case "shocked":
      return <ellipse cx={mx} cy={y + 2} rx={5} ry={7} fill={OUT} />;
    case "angry":
      return <path d={`M${mx - 7} ${y + 4} Q${mx} ${y - 3} ${mx + 7} ${y + 4}`} {...s} />;
    case "determined":
      return <path d={`M${mx - 7} ${y + 1} L${mx + 7} ${y}`} {...s} />;
    default:
      return <path d={`M${mx - 6} ${y + 1} L${mx + 6} ${y + 1}`} {...s} />;
  }
};

const Face: React.FC<{ e: Expression; view: View; look: number; blinkNow: boolean }> = ({ e, view, look, blinkNow }) => {
  if (view === "back") return null;
  const shift = view === "three-quarter" ? 5 : 0;
  // perfil: um olho só, perto da frente do rosto
  const ex = view === "side" ? [12] : [-9 + shift, 9 + shift];
  const mx = view === "side" ? 13 : shift;
  const pupil = look * 2.5;
  return (
    <g>
      {ex.map((cx) =>
        blinkNow ? (
          <path key={cx} d={`M${cx - 3.5} -2 L${cx + 3.5} -2`} stroke={OUT} strokeWidth={3} strokeLinecap="round" />
        ) : (
          <circle key={cx} cx={cx + pupil} cy={-2} r={e === "shocked" ? 4.4 : 3.7} fill={OUT} />
        ),
      )}
      <Brows e={e} ex={ex} dir={1} />
      <Mouth e={e} mx={mx} />
    </g>
  );
};

const Limb: React.FC<{ pts: { x: number; y: number }[] }> = ({ pts }) => (
  <polyline
    points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
    fill="none"
    stroke={OUT}
    strokeWidth={LIMB}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

/** Stickman 2D (bíblia da série). Desenhado olhando para a direita e espelhado quando facing = -1. */
export const Stickman: React.FC<StickmanProps> = ({
  x,
  y,
  scale = 1.5,
  facing = 1,
  pose = "stand",
  expression = "neutral",
  kind = "lead",
  shirt = PRESENT_PEOPLE.shirts[0],
  hair = "none",
  view = "side",
  look = 0,
  blink = true,
  holdNear,
  holdFar,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sk = solve(resolvePose(pose));
  const t = frame / fps;
  const seed = (x * 13 + y * 7) % 3.1;
  const blinkNow = blink && (t + seed) % 3.4 < 0.12;
  const lead = kind === "lead";
  const R = BONES.headR;
  const hx = sk.head.x;
  const hy = sk.head.y;
  // Chrono-Band no pulso ESQUERDO do Kip: lado da câmera quando ele olha para a direita.
  const bandArm = facing === 1 ? sk.near : sk.far;

  // túnica / camiseta: trapézio do ombro ao quadril, ao longo do tronco
  const tx = sk.neck.x - sk.hip.x;
  const ty = sk.neck.y - sk.hip.y;
  const len = Math.hypot(tx, ty) || 1;
  const nx = -ty / len;
  const ny = tx / len;
  const top = { x: sk.shoulder.x, y: sk.shoulder.y };
  const bot = { x: sk.hip.x + (tx / len) * (lead ? -8 : 2), y: sk.hip.y + (ty / len) * (lead ? -8 : 2) };
  const wTop = lead ? 15 : 14;
  const wBot = lead ? 22 : 16;
  const tunic = [
    [top.x + nx * wTop, top.y + ny * wTop],
    [top.x - nx * wTop, top.y - ny * wTop],
    [bot.x - nx * wBot, bot.y - ny * wBot],
    [bot.x + nx * wBot, bot.y + ny * wBot],
  ]
    .map((p) => p.join(","))
    .join(" ");

  const Boot: React.FC<{ f: { x: number; y: number } }> = ({ f }) =>
    lead ? <rect x={f.x - 9} y={f.y - 12} width={24} height={14} rx={7} fill={C.boots} stroke={OUT} strokeWidth={4} /> : <ellipse cx={f.x + 4} cy={f.y - 2} rx={10} ry={5} fill={OUT} />;

  const halo = lead ? (
    <g transform={`translate(${hx} ${hy - R - 18}) rotate(-10)`}>
      <ellipse rx={26} ry={7} fill="none" stroke={C.halo} strokeWidth={10} opacity={0.25} />
      <ellipse rx={24} ry={6.5} fill="none" stroke={C.halo} strokeWidth={4.5} />
    </g>
  ) : null;

  const hairShape =
    !lead && hair !== "none" ? (
      hair === "short" ? (
        <path d={`M${hx - R} ${hy - 4} Q${hx - R + 2} ${hy - R - 8} ${hx + 4} ${hy - R - 4} Q${hx + R} ${hy - R + 2} ${hx + R - 2} ${hy - 10} Q${hx} ${hy - R + 6} ${hx - R} ${hy - 4} Z`} fill={OUT} />
      ) : hair === "long" ? (
        <path d={`M${hx - R - 4} ${hy + R} Q${hx - R - 8} ${hy - R} ${hx} ${hy - R - 4} Q${hx + R + 2} ${hy - R} ${hx + R - 6} ${hy - 6} Q${hx - 4} ${hy - R + 8} ${hx - R + 6} ${hy + 4} L${hx - R + 4} ${hy + R} Z`} fill="#4a3426" />
      ) : (
        <g fill="#4a3426">
          <circle cx={hx - R + 4} cy={hy - R + 2} r={10} />
          <path d={`M${hx - R} ${hy - 2} Q${hx - R} ${hy - R - 4} ${hx + 6} ${hy - R - 2} Q${hx + R} ${hy - R + 6} ${hx + R - 2} ${hy - 8} Q${hx} ${hy - R + 8} ${hx - R} ${hy - 2} Z`} />
        </g>
      )
    ) : null;

  const at = (p: { x: number; y: number }, node: React.ReactNode) =>
    node ? (
      <g transform={`translate(${p.x} ${p.y}) scale(${facing} 1)`}>{node}</g>
    ) : null;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`} opacity={opacity}>
      {/* sombra no chão */}
      <ellipse cx={0} cy={2} rx={46} ry={8} fill="#000" opacity={0.12} />
      {/* braço e perna de trás */}
      <Limb pts={[sk.shoulder, sk.far.elbow, sk.far.hand]} />
      <Limb pts={[sk.hip, sk.legFar.knee, sk.legFar.foot]} />
      <Boot f={sk.legFar.foot} />
      {/* tronco + roupa */}
      <Limb pts={[sk.hip, sk.neck]} />
      <polygon points={tunic} fill={lead ? C.tunic : shirt} stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
      {lead && (
        <>
          <line
            x1={bot.x - nx * wBot * 0.92}
            y1={bot.y - ny * wBot * 0.92 - 6}
            x2={bot.x + nx * wBot * 0.92}
            y2={bot.y + ny * wBot * 0.92 - 6}
            stroke={C.trim}
            strokeWidth={5}
            strokeLinecap="round"
          />
          {view !== "back" && (
            <path
              d={`M${top.x - nx * 9} ${top.y - ny * 9} L${sk.neck.x} ${sk.neck.y - 2} L${top.x + nx * 9} ${top.y + ny * 9}`}
              fill="none"
              stroke={C.trim}
              strokeWidth={4}
              strokeLinejoin="round"
            />
          )}
        </>
      )}
      {/* cabeça */}
      {hair === "long" && hairShape}
      <circle cx={hx} cy={hy} r={R} fill={C.skin} stroke={OUT} strokeWidth={5.5} />
      {hair !== "long" && hairShape}
      <g transform={`translate(${hx} ${hy})`}>
        <Face e={expression} view={view} look={look} blinkNow={blinkNow} />
      </g>
      {halo}
      {/* perna e braço da frente */}
      <Limb pts={[sk.hip, sk.legNear.knee, sk.legNear.foot]} />
      <Boot f={sk.legNear.foot} />
      {at(sk.far.hand, holdFar)}
      <Limb pts={[sk.shoulder, sk.near.elbow, sk.near.hand]} />
      <circle cx={sk.near.hand.x} cy={sk.near.hand.y} r={6} fill={C.skin} stroke={OUT} strokeWidth={4} />
      <circle cx={sk.far.hand.x} cy={sk.far.hand.y} r={6} fill={C.skin} stroke={OUT} strokeWidth={4} />
      {lead && (
        <g
          transform={`translate(${bandArm.elbow.x + (bandArm.hand.x - bandArm.elbow.x) * 0.72} ${
            bandArm.elbow.y + (bandArm.hand.y - bandArm.elbow.y) * 0.72
          }) rotate(${-bandArm.foreAngle})`}
        >
          <rect x={-8} y={-5} width={16} height={10} rx={4} fill={C.chronoBand} opacity={0.35} transform="scale(1.6)" />
          <rect x={-8} y={-5} width={16} height={10} rx={4} fill={C.chronoBand} stroke={OUT} strokeWidth={3} />
        </g>
      )}
      {at(sk.near.hand, holdNear)}
    </g>
  );
};
