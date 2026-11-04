import React, { useId } from "react";
import { random } from "remotion";
import { FONT } from "../../theme";
import { LEAD } from "../../stickman";

const INK = LEAD.colors.outline;
const CYAN = LEAD.colors.halo;
const VIOLET = LEAD.colors.chronoBand;

type P = [number, number];

// Pá do ventilador em coordenadas do círculo (apontando para cima, raio ~70)
const BLADE: P[] = [
  [0, -12],
  [22, -22],
  [34, -64],
  [8, -70],
  [-10, -73],
  [-21, -54],
  [-9, -17],
];

/**
 * Ventilador de coluna em 3/4 (relíquia do episódio). Origem = centro do pé da base, no chão.
 * `dir` = para onde ele sopra (1 = direita, -1 = esquerda). `spin` em graus (acumulado), `speed` em graus/s
 * (acima de ~600 as pás viram um borrão). `grip` desloca a origem para o meio do poste (para segurar na mão).
 */
export const Fan: React.FC<{
  x?: number;
  y?: number;
  scale?: number;
  dir?: 1 | -1;
  spin?: number;
  speed?: number;
  dusty?: boolean;
  /** 0..1: brilho na grade (palavra "cage") */
  cageGlow?: number;
  /** altura (unidades locais) do painel de botões no poste; o botão aceso indica a velocidade */
  panelH?: number;
  on?: number;
  grip?: boolean;
}> = ({ x = 0, y = 0, scale = 1, dir = 1, spin = 0, speed = 0, dusty = false, cageGlow = 0, panelH = 120, on = 0, grip = false }) => {
  const cy = -232;
  const r = 74;
  const k = 0.55;
  const map = (u: number, v: number, a: number): P => {
    const c = Math.cos((a * Math.PI) / 180);
    const s = Math.sin((a * Math.PI) / 180);
    return [k * (u * c - v * s), cy + (u * s + v * c)];
  };
  const blade = (a: number) => {
    const p = BLADE.map(([u, v]) => map(u, v, a));
    const f = (q: P) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
    return `M${f(p[0])}C${f(p[1])} ${f(p[2])} ${f(p[3])}C${f(p[4])} ${f(p[5])} ${f(p[6])}Z`;
  };
  const ghosts = speed > 200 ? Math.min(4, Math.floor(speed / 200)) : 0;
  const blur = speed > 600;
  const blades: React.ReactNode[] = [];
  for (let g = ghosts; g >= 0; g--) {
    for (let i = 0; i < 3; i++) {
      blades.push(
        <path
          key={`${g}-${i}`}
          d={blade(spin + i * 120 - g * speed * 0.012)}
          fill={dusty ? "#B9C7CF" : "#8FD3F5"}
          stroke={g === 0 ? (dusty ? "#7D8C95" : "#3B8FC2") : "none"}
          strokeWidth={2}
          opacity={g === 0 ? (blur ? 0.35 : 0.95) : 0.25 * (1 - g / (ghosts + 1))}
        />,
      );
    }
  }
  const spokes = Array.from({ length: 14 }, (_, i) => {
    const [x1, y1] = map(0, -16, (i / 14) * 360);
    const [x2, y2] = map(0, -r, (i / 14) * 360);
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={1.6} opacity={0.5} />;
  });
  const body = dusty ? "#E4E1D8" : "#F7F7F5";
  const oy = grip ? 150 : 0; // segura pelo poste, ~150 acima do pé
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * dir} ${scale}) translate(0 ${oy})`}>
      {!grip && <ellipse cx={0} cy={4} rx={80} ry={10} fill="#000" opacity={0.12} />}
      {/* base e poste */}
      <ellipse cx={0} cy={-6} rx={62} ry={12} fill={body} stroke={INK} strokeWidth={5} />
      <rect x={-6} y={-200} width={12} height={196} rx={4} fill={body} stroke={INK} strokeWidth={4} />
      {/* painel de botões no poste, do lado da frente (para onde ele sopra) */}
      <g transform={`translate(16 ${-panelH})`}>
        <rect x={-12} y={-34} width={22} height={68} rx={6} fill={body} stroke={INK} strokeWidth={3.5} />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={-1} cy={-20 + i * 20} r={6} fill={on > 0 && i === 2 ? "#7ED957" : "#D5D5D0"} stroke={INK} strokeWidth={2} />
        ))}
      </g>
      {/* motor atrás da grade */}
      <ellipse cx={-30} cy={cy} rx={26} ry={40} fill={body} stroke={INK} strokeWidth={5} />
      <path d={`M-24 ${cy + 34} L-2 ${-196}`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d={`M-24 ${cy + 34} L-2 ${-196}`} stroke={body} strokeWidth={7} strokeLinecap="round" />
      {/* pás + grade */}
      {blur && <ellipse cx={0} cy={cy} rx={r * k * 0.95} ry={r * 0.95} fill="#BFE6FA" opacity={0.55} />}
      {blades}
      {spokes}
      <ellipse cx={0} cy={cy} rx={r * k * 0.55} ry={r * 0.55} fill="none" stroke={INK} strokeWidth={1.8} opacity={0.5} />
      {cageGlow > 0 && <ellipse cx={0} cy={cy} rx={r * k + 6} ry={r + 6} fill="none" stroke="#F5C542" strokeWidth={12} opacity={0.7 * cageGlow} />}
      <ellipse cx={0} cy={cy} rx={r * k} ry={r} fill="none" stroke={INK} strokeWidth={6} />
      <ellipse cx={0} cy={cy} rx={8} ry={15} fill={body} stroke={INK} strokeWidth={3.5} />
      {dusty &&
        Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx={(random(`dx${i}`) - 0.5) * 70} cy={cy + (random(`dy${i}`) - 0.5) * 150 + (i > 6 ? 170 : 0)} r={2 + random(`dr${i}`) * 4} fill="#A08B6B" opacity={0.55} />
        ))}
    </g>
  );
};

/** Termômetro de parede. `value` em °C; o rótulo aparece ao lado, em pixels de tela. */
export const Thermometer: React.FC<{ x: number; y: number; value: number; scale?: number; label?: number; hot?: boolean }> = ({ x, y, value, scale = 1, label = 1, hot = true }) => {
  const top = -110;
  const bottom = 40;
  const level = bottom - ((value + 10) / 55) * (bottom - top);
  const color = hot ? "#E0533D" : "#3A8FE0";
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-26} y={-130} width={52} height={210} rx={26} fill="#FFFDF8" stroke={INK} strokeWidth={4} />
      <rect x={-8} y={top - 6} width={16} height={bottom - top + 16} rx={8} fill="#fff" stroke={INK} strokeWidth={3} />
      <rect x={-4.5} y={level} width={9} height={bottom - level + 10} fill={color} />
      <circle cx={0} cy={56} r={16} fill={color} stroke={INK} strokeWidth={3} />
      {label > 0 && (
        <text x={38} y={-20} fontFamily={FONT} fontWeight={900} fontSize={40} fill={color} stroke="#fff" strokeWidth={7} paintOrder="stroke" opacity={label}>
          {Math.round(value)}°C
        </text>
      )}
    </g>
  );
};

/** Cadeira simples de perfil (assento na altura `seat` px acima do chão). */
export const Chair: React.FC<{ x: number; groundY: number; seat?: number; scale?: number; facing?: 1 | -1 }> = ({ x, groundY, seat = 72, scale = 1, facing = 1 }) => (
  <g transform={`translate(${x} ${groundY}) scale(${scale * facing} ${scale})`} stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
    <line x1={-34} y1={0} x2={-34} y2={-seat} />
    <line x1={34} y1={0} x2={34} y2={-seat} />
    <line x1={-38} y1={-seat - 60} x2={-34} y2={-seat} />
    <rect x={-44} y={-seat - 8} width={88} height={12} rx={5} fill="#C9A98B" />
    <rect x={-50} y={-seat - 74} width={14} height={66} rx={6} fill="#C9A98B" />
  </g>
);

/**
 * Linhas de brisa saindo de (x, y) na direção `dir`, espalhando num leque de altura `spread`.
 * `t` em segundos; `power` 0..1 controla quantidade, velocidade e opacidade.
 */
export const Breeze: React.FC<{ x: number; y: number; dir?: 1 | -1; length?: number; spread?: number; power: number; t: number; color?: string; n?: number }> = ({
  x,
  y,
  dir = -1,
  length = 560,
  spread = 220,
  power,
  t,
  color = "#7CC8F0",
  n = 14,
}) => {
  if (power <= 0.001) return null;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const vis = Math.min(1, Math.max(0, (power - (i / n) * 0.9) * 5));
        if (vis <= 0) return null;
        const speed = 260 + 520 * power;
        const s = (t * speed * (0.8 + random(`bv${i}`) * 0.4) + random(`bf${i}`) * length) % length;
        const lane = (random(`by${i}`) - 0.5) * 2;
        const yy = y + lane * (spread * 0.25 + (spread * 0.75 * s) / length) + Math.sin(s * 0.02 + i) * 8;
        const xx = x + dir * s;
        const len = 40 + random(`bl${i}`) * 60;
        const edge = Math.min(1, s / 60, (length - s) / 120);
        return (
          <path
            key={i}
            d={`M${xx} ${yy} q${dir * len * 0.5} -6 ${dir * len} 0`}
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
            opacity={vis * edge * (0.35 + power * 0.5)}
          />
        );
      })}
    </g>
  );
};

/** Gotas de suor em volta de uma cabeça (cx, cy, raio da cabeça em px). */
export const Sweat: React.FC<{ cx: number; cy: number; r: number; t: number; amount: number }> = ({ cx, cy, r, t, amount }) => {
  if (amount <= 0.01) return null;
  return (
    <g opacity={amount}>
      {[0, 1, 2].map((i) => {
        const p = ((t * 0.9 + i * 0.33) % 1 + 1) % 1;
        const side = i === 1 ? 1 : -1;
        const gx = cx + side * (r * 0.95 + p * 14);
        const gy = cy - r * 0.35 + i * 8 + p * p * 60;
        return (
          <path
            key={i}
            d={`M${gx} ${gy - 12} Q${gx + 8} ${gy} ${gx} ${gy + 4} Q${gx - 8} ${gy} ${gx} ${gy - 12} Z`}
            fill="#5CB8F0"
            stroke="#2A7FB8"
            strokeWidth={2}
            opacity={1 - p * 0.6}
          />
        );
      })}
    </g>
  );
};

/** Ondas de calor subindo (presente quente). */
export const HeatShimmer: React.FC<{ x: number; y: number; w: number; t: number; amount: number }> = ({ x, y, w, t, amount }) => {
  if (amount <= 0) return null;
  return (
    <g opacity={amount * 0.6}>
      {Array.from({ length: 6 }, (_, i) => {
        const rise = (t * 70 + i * 55) % 260;
        const xx = x + (i / 5) * w;
        return (
          <path
            key={i}
            d={`M${xx} ${y - rise} q10 -18 0 -36 t0 -36 t0 -36`}
            stroke="#E8913A"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
            opacity={1 - rise / 260}
          />
        );
      })}
    </g>
  );
};

/**
 * Corte da pele (clipe 4). Uma faixa de pele com gotas de suor; em cima, a camada de ar morno.
 * `sweep` 0..1: a brisa varre a camada morna; `evap` 0..1: as gotas viram vapor; `heat` 0..1: setas de calor saem.
 * Coordenadas: caixa de 860×520 com canto em (x, y).
 */
export const SkinCutaway: React.FC<{ x: number; y: number; t: number; sweep: number; evap: number; heat: number; labels: { warm: number; sweat: number; heat: number } }> = ({
  x,
  y,
  t,
  sweep,
  evap,
  heat,
  labels,
}) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const W = 860;
  const H = 520;
  const skinY = 360;
  const label = (text: string, lx: number, ly: number, op: number, color = INK) =>
    op > 0 ? (
      <g opacity={op} transform={`translate(${lx} ${ly})`}>
        <rect x={-text.length * 12 - 18} y={-30} width={text.length * 24 + 36} height={54} rx={27} fill="#ffffff" stroke={color} strokeWidth={4} />
        <text y={10} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={32} fill={INK}>
          {text}
        </text>
      </g>
    ) : null;
  const drops = [140, 300, 470, 640, 760];
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={`sk${id}`}>
          <rect width={W} height={H} rx={36} />
        </clipPath>
        <linearGradient id={`warm${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#F59E5B" stopOpacity={0.75} />
          <stop offset="1" stopColor="#F59E5B" stopOpacity={0} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#sk${id})`}>
        <rect width={W} height={H} fill="#EAF6FD" />
        {/* camada de ar morno grudada na pele, varrida para a esquerda pela brisa */}
        <rect x={-W * 1.2 * sweep} y={skinY - 150} width={W} height={150} fill={`url(#warm${id})`} />
        {/* brisa */}
        {sweep > 0 &&
          Array.from({ length: 7 }, (_, i) => {
            const s = (t * 520 + i * 140) % (W + 200);
            const yy = skinY - 40 - i * 38;
            return <path key={i} d={`M${W + 60 - s} ${yy} q-40 -8 -90 0`} stroke="#3B9BD8" strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.75 * Math.min(1, sweep * 2)} />;
          })}
        {/* pele */}
        <path d={`M0 ${skinY} Q${W * 0.25} ${skinY - 14} ${W * 0.5} ${skinY} T${W} ${skinY} L${W} ${H} L0 ${H} Z`} fill="#F3C9A8" stroke={INK} strokeWidth={5} />
        <path d={`M0 ${skinY + 70} Q${W * 0.3} ${skinY + 58} ${W * 0.6} ${skinY + 72} T${W} ${skinY + 66}`} stroke="#D9A07E" strokeWidth={4} fill="none" />
        {/* gotas de suor que evaporam */}
        {drops.map((dx, i) => {
          const k = Math.max(0, Math.min(1, evap * 1.6 - i * 0.12));
          const s = 1 - k;
          return (
            <g key={i}>
              {s > 0.02 && (
                <path
                  transform={`translate(${dx} ${skinY - 4}) scale(${s})`}
                  d="M0 -30 Q20 -2 0 6 Q-20 -2 0 -30 Z"
                  fill="#5CB8F0"
                  stroke="#2A7FB8"
                  strokeWidth={3}
                />
              )}
              {k > 0 && (
                <path
                  d={`M${dx} ${skinY - 30 - k * 120} q12 -14 0 -28 t0 -28`}
                  stroke="#9CC9E6"
                  strokeWidth={6}
                  fill="none"
                  strokeLinecap="round"
                  opacity={k * (1 - Math.max(0, k - 0.7) / 0.3)}
                  transform={`translate(${-k * 90} 0)`}
                />
              )}
            </g>
          );
        })}
        {/* setas de calor saindo da pele */}
        {heat > 0 &&
          [210, 420, 620].map((hx, i) => {
            const p = Math.min(1, heat * 1.4 - i * 0.15);
            if (p <= 0) return null;
            return (
              <g key={i} opacity={p} transform={`translate(${hx - p * 60} ${skinY - 40 - p * 150})`}>
                <path d="M0 60 L0 0" stroke="#E0533D" strokeWidth={12} strokeLinecap="round" />
                <path d="M-18 18 L0 -4 L18 18" stroke="#E0533D" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </g>
            );
          })}
      </g>
      <rect width={W} height={H} rx={36} fill="none" stroke={INK} strokeWidth={7} />
      {label("warm air", 230, 150, labels.warm * (1 - sweep * 0.8), "#E8913A")}
      {label("sweat", 640, 470, labels.sweat, "#2A7FB8")}
      {label("heat", 650, 110, labels.heat, "#E0533D")}
    </g>
  );
};

/** Brisa fresca que segue o Kip em Lumen (ficção; registrada em ADDITIONS). */
export const LumenBreeze: React.FC<{ x: number; y: number; t: number; show: number }> = ({ x, y, t, show }) => {
  if (show <= 0) return null;
  return (
    <g transform={`translate(${x} ${y + Math.sin(t * 3) * 8}) scale(${0.6 + 0.4 * show})`} opacity={show}>
      <circle r={46} fill={CYAN} opacity={0.12} />
      {[0, 1, 2].map((i) => {
        const a = t * 4 + (i * Math.PI * 2) / 3;
        return (
          <path
            key={i}
            d={`M${Math.cos(a) * 30} ${Math.sin(a) * 18} A30 18 0 0 1 ${Math.cos(a + 1.6) * 30} ${Math.sin(a + 1.6) * 18}`}
            stroke={i === 1 ? VIOLET : CYAN}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
          />
        );
      })}
      <circle r={6} fill="#fff" />
    </g>
  );
};

/** Painel de luz do museu (clipe 6): `mode` 0 = termômetro do ar parado; 1 = brisa no bonequinho. */
export const InsightPanel: React.FC<{ x: number; y: number; show: number; mode: number; t: number }> = ({ x, y, show, mode, t }) => {
  if (show <= 0) return null;
  const W = 640;
  const H = 360;
  return (
    <g transform={`translate(${x} ${y}) scale(${0.85 + 0.15 * show})`} opacity={show}>
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={34} fill="#ffffff" opacity={0.85} stroke={CYAN} strokeWidth={6} />
      <g opacity={1 - mode}>
        <text x={-W / 2 + 40} y={-H / 2 + 70} fontFamily={FONT} fontWeight={900} fontSize={40} fill={INK}>
          AIR
        </text>
        <Thermometer x={-60} y={40} value={34} scale={0.9} label={1} />
        <text x={120} y={70} fontFamily={FONT} fontWeight={900} fontSize={120} fill="#9AA5B1">
          =
        </text>
      </g>
      <g opacity={mode}>
        <text x={-W / 2 + 40} y={-H / 2 + 70} fontFamily={FONT} fontWeight={900} fontSize={40} fill={INK}>
          PEOPLE
        </text>
        <Breeze x={W / 2 - 40} y={10} dir={-1} length={W - 80} spread={140} power={mode} t={t} n={10} />
        {/* bonequinho sorrindo na brisa */}
        <g transform="translate(-40 120)" stroke={INK} strokeWidth={7} strokeLinecap="round" fill="none">
          <circle cx={0} cy={-150} r={30} fill="#fff" />
          <path d="M-12 -142 Q0 -132 12 -142" strokeWidth={5} />
          <line x1={0} y1={-120} x2={0} y2={-40} />
          <path d="M0 -100 L-34 -70 M0 -100 L34 -70 M0 -40 L-26 10 M0 -40 L26 10" />
        </g>
      </g>
    </g>
  );
};
