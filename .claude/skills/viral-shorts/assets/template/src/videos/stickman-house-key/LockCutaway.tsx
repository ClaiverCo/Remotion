import React from "react";
import { FONT } from "../../theme";
import { LEAD } from "../../stickman";

/**
 * A relíquia (chave de casa) e o corte da fechadura de pinos (pin tumbler).
 * Fatos (pesquisa.md): mola + pino motor + pino de chave em cada furo; sem chave os pinos motores
 * cruzam a linha de corte e travam o cilindro; a chave certa leva cada separação de pinos até a
 * linha de corte e o cilindro gira; com a chave errada um pino continua atravessando a linha.
 */

const OUT = LEAD.colors.outline;
export const BRASS = "#D4A64A";
const BRASS_DARK = "#B98A2E";
const STEEL = "#9AA9B8";
const OK = "#3BB273";
const BAD = "#E05A47";
const SHEAR = "#F5C542";

/** Profundidade de cada corte da chave certa (1 = raso … 5 = fundo). Também é o "código" do painel final. */
export const RIGHT_BITTING = [3, 5, 2, 4, 4] as const;
/** Chave errada: o 3º corte é fundo demais (o 3º pino não chega à linha). */
export const WRONG_BITTING = [3, 5, 4, 4, 4] as const;

// ---------------------------------------------------------------------------
// A relíquia na mão (pequena): cabeça redonda com furo + lâmina com 5 dentes embaixo
// ---------------------------------------------------------------------------

/** Chave de casa, desenhada com a cabeça na origem e a lâmina apontando para +x (~80 px de comprimento). */
export const HouseKey: React.FC<{
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  bitting?: readonly number[];
  dusty?: boolean;
}> = ({ x = 0, y = 0, scale = 1, rotate = 0, bitting = RIGHT_BITTING, dusty = false }) => {
  // dentes na borda de baixo da lâmina
  const pts: string[] = ["14,-6", "78,-6", "84,0", "84,4"];
  const xs = [70, 59, 48, 37, 26];
  bitting
    .slice()
    .reverse()
    .forEach((d, i) => {
      const cx = xs[i];
      pts.push(`${cx + 5},4`, `${cx + 2},${4 + d * 1.6}`, `${cx - 2},${4 + d * 1.6}`, `${cx - 5},4`);
    });
  pts.push("14,4");
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <polygon points={pts.join(" ")} fill={BRASS} stroke={OUT} strokeWidth={3} strokeLinejoin="round" />
      <line x1={18} y1={-1} x2={76} y2={-1} stroke={BRASS_DARK} strokeWidth={2} />
      <circle r={17} fill={BRASS} stroke={OUT} strokeWidth={3.5} />
      <circle cx={-5} r={5} fill="#fff" stroke={OUT} strokeWidth={3} />
      {dusty && (
        <g fill="#8C7D6E" opacity={0.45}>
          <circle cx={8} cy={7} r={3} />
          <circle cx={40} cy={-3} r={2} />
          <circle cx={62} cy={2} r={2.5} />
        </g>
      )}
    </g>
  );
};

/** Chaveiro: argola com 3 chaves balançando (gente de hoje). */
export const Keyring: React.FC<{ x?: number; y?: number; scale?: number; swing?: number }> = ({ x = 0, y = 0, scale = 1, swing = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <circle r={13} fill="none" stroke="#7B8794" strokeWidth={4} />
    {[-28, 4, 34].map((a, i) => (
      <g key={i} transform={`translate(0 12) rotate(${90 + a + swing * (1 + i * 0.3)})`}>
        <HouseKey x={18} scale={0.62} bitting={i === 1 ? RIGHT_BITTING : [2 + i, 4, 3, 5 - i, 2]} />
      </g>
    ))}
  </g>
);

// ---------------------------------------------------------------------------
// Corte lateral do cilindro
// ---------------------------------------------------------------------------

// coordenadas locais: linha de corte em y = 0; cilindro (plug) de x = 0 a 300
const PLUG_W = 300;
const PLUG_H = 112;
const SHELL_TOP = -150;
const STEP = 9;
const RIDGE = 30;
const REST = RIDGE + 6 * STEP; // sem chave, o pé dos pinos desce até aqui
const BLADE_BOTTOM = REST + 16;
const PIN_U = [50, 100, 150, 200, 250];
const PIN_W = 24;
const DRIVER = 46;
const KEY_PIN = (d: number) => RIDGE + d * STEP;

/** Altura (y) da borda de cima da lâmina na posição u (0 = ombro da chave) para um segredo. */
export const bladeTop = (u: number, bitting: readonly number[]): number => {
  const L = PLUG_W - 8;
  if (u < 0 || u > L) return Number.POSITIVE_INFINITY;
  if (u > L - 22) return RIDGE + ((u - (L - 22)) / 22) * 6 * STEP; // rampa da ponta
  for (let i = 0; i < PIN_U.length; i++) {
    const du = Math.abs(u - PIN_U[i]);
    const valley = RIDGE + bitting[i] * STEP;
    if (du <= 5) return valley;
    if (du <= 18) return valley + ((du - 5) / 13) * (RIDGE - valley);
  }
  return RIDGE;
};

/** Onde fica o pé de cada pilha de pinos com a chave inserida `k` (0 = fora, 1 = até o fim). */
export const pinBottoms = (k: number, bitting: readonly number[] | null): number[] =>
  PIN_U.map((u) => {
    if (!bitting) return REST;
    const local = u + (1 - k) * (PLUG_W + 40);
    return Math.min(REST, bladeTop(local, bitting));
  });

/** Separação entre pino de chave e pino motor de cada furo (y; 0 = na linha de corte). */
export const pinGaps = (k: number, bitting: readonly number[] | null) =>
  pinBottoms(k, bitting).map((b, i) => b - KEY_PIN(RIGHT_BITTING[i]));

const Spring: React.FC<{ x: number; top: number; bottom: number }> = ({ x, top, bottom }) => {
  const n = 7;
  const h = (bottom - top) / n;
  const d = [`M${x} ${top}`];
  for (let i = 0; i < n; i++) d.push(`L${x + (i % 2 ? -9 : 9)} ${top + h * (i + 0.5)}`);
  d.push(`L${x} ${bottom}`);
  return <path d={d.join(" ")} fill="none" stroke="#6B7785" strokeWidth={3.5} strokeLinejoin="round" />;
};

export type LockCutawayProps = {
  /** posição do canto da linha de corte na tela e escala */
  x: number;
  y: number;
  scale?: number;
  /** 0→1: quanto a chave entrou */
  insert: number;
  bitting?: readonly number[] | null;
  /** destaca a linha de corte (0→1) */
  shear?: number;
  /** destaca molas/pinos (0→1) */
  springs?: number;
  /** cor dos pinos quando a chave está toda dentro: certo (verde) / bloqueado (vermelho) */
  verdict?: number;
  /** sacudida do cilindro tentando girar (px) */
  jiggle?: number;
  labels?: { pins?: number; shear?: number };
  /** opacidade da chave (para ela entrar em cena só quando é citada) */
  keyOpacity?: number;
};

export const LockCutaway: React.FC<LockCutawayProps> = ({
  x,
  y,
  scale = 2.2,
  insert,
  bitting = RIGHT_BITTING,
  shear = 0,
  springs = 0,
  verdict = 0,
  jiggle = 0,
  labels = {},
  keyOpacity = 1,
}) => {
  const bottoms = pinBottoms(insert, bitting);
  const gaps = bottoms.map((b, i) => b - KEY_PIN(RIGHT_BITTING[i]));
  const shoulder = -(1 - insert) * (PLUG_W + 40);
  const bladePts: string[] = [];
  for (let u = 0; u <= PLUG_W - 8; u += 3) bladePts.push(`${shoulder + u},${Math.min(bladeTop(u, bitting ?? RIGHT_BITTING), BLADE_BOTTOM)}`);
  bladePts.push(`${shoulder + PLUG_W - 8},${BLADE_BOTTOM}`, `${shoulder},${BLADE_BOTTOM}`);
  // etiquetas em pixels de tela (não escalam com o corte)
  const label = (text: string, lx: number, ly: number, o: number, anchor: "middle" | "end", color = OUT) => {
    if (o <= 0) return null;
    const w = text.length * 19 + 36;
    const bx = anchor === "end" ? -w : -w / 2;
    return (
      <g opacity={o} transform={`translate(${lx} ${ly}) scale(${1 / scale})`}>
        <rect x={bx} y={-26} width={w} height={52} rx={26} fill="#fff" stroke={color} strokeWidth={5} />
        <text x={bx + w / 2} y={11} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={OUT}>
          {text}
        </text>
      </g>
    );
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* carcaça (housing) */}
      <rect x={-34} y={SHELL_TOP} width={PLUG_W + 68} height={-SHELL_TOP + PLUG_H + 28} rx={22} fill="#E2D3BC" stroke={OUT} strokeWidth={4} />
      {/* cilindro (plug) */}
      <g transform={`translate(${jiggle} 0)`}>
        <rect x={0} y={0} width={PLUG_W} height={PLUG_H} rx={10} fill="#EBC870" stroke={OUT} strokeWidth={4} />
        <rect x={0} y={RIDGE - 6} width={PLUG_W - 4} height={BLADE_BOTTOM - RIDGE + 12} fill="#C9A24F" opacity={0.45} />
      </g>
      {/* furos */}
      {PIN_U.map((u) => (
        <rect key={u} x={u - PIN_W / 2 - 3} y={SHELL_TOP + 10} width={PIN_W + 6} height={REST - SHELL_TOP - 10} fill="#F7F0E6" stroke="#B9A28C" strokeWidth={2} />
      ))}
      {/* chave */}
      {bitting && keyOpacity > 0 && (
        <g opacity={keyOpacity}>
          <polygon points={bladePts.join(" ")} fill={BRASS} stroke={OUT} strokeWidth={3.5} strokeLinejoin="round" />
          <rect x={shoulder - 30} y={RIDGE - 14} width={34} height={BLADE_BOTTOM - RIDGE + 28} rx={6} fill={BRASS} stroke={OUT} strokeWidth={3.5} />
          <circle cx={shoulder - 78} cy={(RIDGE + BLADE_BOTTOM) / 2} r={52} fill={BRASS} stroke={OUT} strokeWidth={4} />
          <circle cx={shoulder - 92} cy={(RIDGE + BLADE_BOTTOM) / 2} r={14} fill="#fff" stroke={OUT} strokeWidth={3.5} />
        </g>
      )}
      {/* pilhas de pinos: mola, pino motor, pino de chave */}
      {PIN_U.map((u, i) => {
        const b = bottoms[i];
        const kp = KEY_PIN(RIGHT_BITTING[i]);
        const top = b - kp;
        const aligned = Math.abs(gaps[i]) < 1.5;
        const pinColor = verdict > 0 ? (aligned ? OK : BAD) : null;
        return (
          <g key={u}>
            <Spring x={u} top={SHELL_TOP + 12} bottom={top - DRIVER} />
            <rect x={u - PIN_W / 2} y={top - DRIVER} width={PIN_W} height={DRIVER} rx={6} fill={pinColor && !aligned ? BAD : STEEL} stroke={OUT} strokeWidth={3} />
            <rect x={u - PIN_W / 2} y={top} width={PIN_W} height={kp} rx={6} fill={pinColor && aligned ? OK : BRASS} stroke={OUT} strokeWidth={3} />
            {springs > 0 && <circle cx={u} cy={SHELL_TOP + 40} r={26} fill="none" stroke={SHEAR} strokeWidth={4} opacity={springs * 0.8} />}
          </g>
        );
      })}
      {/* linha de corte */}
      <line x1={-34} y1={0} x2={PLUG_W + 34} y2={0} stroke={SHEAR} strokeWidth={3 + shear * 5} strokeDasharray="14 8" opacity={0.35 + shear * 0.65} />
      {label("SPRING PINS", PLUG_W / 2, SHELL_TOP - 24, labels.pins ?? 0, "middle")}
      {label("SHEAR LINE", -40, -32, labels.shear ?? 0, "end", SHEAR)}
    </g>
  );
};

/** Vista de frente do cilindro: o miolo gira (0→1 = 90°) e a lingueta recolhe. */
export const LockFront: React.FC<{ x: number; y: number; r?: number; turn: number; blocked?: number }> = ({ x, y, r = 90, turn, blocked = 0 }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r + 16} fill="#fff" stroke={OUT} strokeWidth={4} />
    <circle r={r} fill="#E2D3BC" stroke={OUT} strokeWidth={4} />
    <g transform={`rotate(${turn * 90 + blocked})`}>
      <circle r={r * 0.62} fill="#EBC870" stroke={OUT} strokeWidth={4} />
      <rect x={-6} y={-r * 0.45} width={12} height={r * 0.9} rx={5} fill={OUT} />
    </g>
    {/* lingueta (bolt) */}
    <rect x={r + 24 - turn * 40} y={-14} width={70} height={28} rx={6} fill={STEEL} stroke={OUT} strokeWidth={4} />
  </g>
);
