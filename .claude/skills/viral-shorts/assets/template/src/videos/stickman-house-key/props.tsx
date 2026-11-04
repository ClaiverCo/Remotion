import React, { useId } from "react";
import { FONT } from "../../theme";
import { ERAS, LEAD } from "../../stickman";
import { BRASS, RIGHT_BITTING } from "./LockCutaway";

const OUT = LEAD.colors.outline;
const [CYAN, VIOLET] = ERAS.future.accents;

/**
 * Porta da frente de hoje (dobradiça à DIREITA, fechadura à esquerda). `open` 0→1 gira a folha
 * para dentro (fica estreita, mostrando o escuro da casa). `keyIn` mostra a cabeça da chave na
 * fechadura e `keyTurn` 0→1 gira essa cabeça 90°.
 */
export const FrontDoor: React.FC<{
  x: number;
  groundY: number;
  w: number;
  h: number;
  open?: number;
  keyIn?: number;
  keyTurn?: number;
  lockFrac?: number;
}> = ({ x, groundY, w, h, open = 0, keyIn = 0, keyTurn = 0, lockFrac = 0.5 }) => {
  const top = groundY - h;
  const leaf = w * (1 - open * 0.82);
  const lx = x + 30;
  const ly = groundY - h * lockFrac;
  return (
    <g>
      {/* batente e interior */}
      <rect x={x - 16} y={top - 16} width={w + 32} height={h + 16} rx={6} fill="#EBDDCB" stroke="#CDB9A0" strokeWidth={4} />
      <rect x={x} y={top} width={w} height={h} fill="#4A3426" />
      {/* folha (gira na dobradiça da direita) */}
      <g>
        <polygon
          points={`${x + w - leaf},${top + open * 26} ${x + w},${top} ${x + w},${groundY} ${x + w - leaf},${groundY - open * 26}`}
          fill="#A87452"
          stroke={OUT}
          strokeWidth={4}
          strokeLinejoin="round"
        />
        {open < 0.35 && (
          <g opacity={1 - open / 0.35}>
            <rect x={x + 30} y={top + 30} width={w - 60} height={h * 0.38} rx={6} fill="none" stroke="#8D5F42" strokeWidth={5} />
            <rect x={x + 30} y={top + h * 0.5 + 20} width={w - 60} height={h * 0.42} rx={6} fill="none" stroke="#8D5F42" strokeWidth={5} />
            {/* maçaneta + fechadura */}
            <circle cx={lx} cy={ly - 44} r={15} fill="#D9B44A" stroke="#7A5A2A" strokeWidth={4} />
            <rect x={lx - 13} y={ly - 22} width={26} height={44} rx={10} fill="#D9B44A" stroke="#7A5A2A" strokeWidth={4} />
            <rect x={lx - 3} y={ly - 12} width={6} height={22} rx={3} fill={OUT} />
            {keyIn > 0 && (
              <g opacity={keyIn} transform={`translate(${lx} ${ly}) rotate(${keyTurn * 90})`}>
                <rect x={-4} y={-30} width={8} height={30} fill={BRASS} stroke={OUT} strokeWidth={2.5} />
                <ellipse cx={0} cy={-42} rx={15} ry={15 * (1 - keyTurn * 0.8)} fill={BRASS} stroke={OUT} strokeWidth={3} />
              </g>
            )}
          </g>
        )}
      </g>
      <rect x={x - 40} y={groundY - 10} width={w + 80} height={20} fill="#CDB9A0" />
    </g>
  );
};

/** Porta de Lumen: arco que reconhece quem chega (anel ciano) e se abre sozinha para cima. */
export const FutureDoor: React.FC<{ x: number; groundY: number; w: number; h: number; scan?: number; open?: number }> = ({
  x,
  groundY,
  w,
  h,
  scan = 0,
  open = 0,
}) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const top = groundY - h;
  const r = w / 2;
  const arch = `M${x} ${groundY} L${x} ${top + r} Q${x} ${top} ${x + r} ${top} Q${x + w} ${top} ${x + w} ${top + r} L${x + w} ${groundY} Z`;
  return (
    <g>
      <path d={arch} fill="#CFE3EE" stroke={ERAS.future.line} strokeWidth={4} />
      <clipPath id={`fdoor${id}`}>
        <path d={arch} />
      </clipPath>
      <g clipPath={`url(#fdoor${id})`}>
        <rect x={x} y={top - open * h} width={w} height={h} fill="#E6EEF4" stroke={ERAS.future.line} strokeWidth={4} />
        <rect x={x + w / 2 - 3} y={top + 30 - open * h} width={6} height={h - 60} rx={3} fill={CYAN} opacity={0.45} />
      </g>
      <circle cx={x + w / 2} cy={top + h * 0.35} r={22 + scan * 10} fill="none" stroke={CYAN} strokeWidth={5} opacity={0.35 + scan * 0.65} />
      {scan > 0 && <circle cx={x + w / 2} cy={top + h * 0.35} r={50 * scan} fill={CYAN} opacity={0.18 * (1 - open)} />}
    </g>
  );
};

/** Escavação nas "Camadas Antigas" (ficção): corte do chão com faixas e o molde da chave. */
export const DigSite: React.FC<{ x: number; groundY: number; w: number; depth: number; glow?: number }> = ({ x, groundY, w, depth, glow = 0 }) => {
  const bands = ["#C3D2DE", "#AFC1CF", "#9BAFC0", "#8599AC"];
  const bh = depth / bands.length;
  return (
    <g>
      <rect x={x} y={groundY} width={w} height={depth} fill="#DCE7EF" />
      {bands.map((c, i) => (
        <path
          key={i}
          d={`M${x} ${groundY + i * bh + 6} Q${x + w * 0.3} ${groundY + i * bh - 6} ${x + w * 0.6} ${groundY + i * bh + 4} T${x + w} ${groundY + i * bh} L${x + w} ${groundY + (i + 1) * bh} L${x} ${groundY + (i + 1) * bh} Z`}
          fill={c}
        />
      ))}
      <rect x={x} y={groundY} width={w} height={depth} fill="none" stroke={ERAS.future.line} strokeWidth={4} />
      {/* molde da chave na camada mais funda */}
      <g transform={`translate(${x + w * 0.42} ${groundY + depth - bh * 0.55}) rotate(-8) scale(1.1)`}>
        {glow > 0 && <ellipse cx={40} rx={80} ry={36} fill="#F5C542" opacity={0.25 * glow} />}
        <circle r={20} fill="none" stroke={glow > 0 ? "#F5C542" : "#5E7183"} strokeWidth={5} strokeDasharray="8 5" />
        <rect x={18} y={-8} width={76} height={16} rx={3} fill="none" stroke={glow > 0 ? "#F5C542" : "#5E7183"} strokeWidth={5} strokeDasharray="8 5" />
      </g>
      {/* estacas e corda de luz */}
      {[x + 10, x + w - 10].map((sx) => (
        <g key={sx}>
          <line x1={sx} y1={groundY} x2={sx} y2={groundY - 70} stroke={ERAS.future.line} strokeWidth={6} />
          <circle cx={sx} cy={groundY - 74} r={7} fill={CYAN} />
        </g>
      ))}
      <path d={`M${x + 10} ${groundY - 70} Q${x + w / 2} ${groundY - 40} ${x + w - 10} ${groundY - 70}`} fill="none" stroke={CYAN} strokeWidth={4} opacity={0.6} />
    </g>
  );
};

/** Lupa: círculo com o conteúdo ampliado e uma linha até o ponto de origem. */
export const Magnifier: React.FC<{ cx: number; cy: number; r: number; fromX: number; fromY: number; show: number; children: React.ReactNode }> = ({
  cx,
  cy,
  r,
  fromX,
  fromY,
  show,
  children,
}) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (show <= 0) return null;
  const s = 0.6 + 0.4 * show;
  return (
    <g opacity={Math.min(1, show * 1.4)}>
      <line x1={fromX} y1={fromY} x2={cx} y2={cy} stroke={OUT} strokeWidth={4} strokeDasharray="10 8" />
      <g transform={`translate(${cx} ${cy}) scale(${s})`}>
        <clipPath id={`mag${id}`}>
          <circle r={r} />
        </clipPath>
        <circle r={r} fill="#ffffff" />
        <g clipPath={`url(#mag${id})`}>{children}</g>
        <circle r={r} fill="none" stroke={OUT} strokeWidth={8} />
      </g>
    </g>
  );
};

/** Painel de luz flutuante de Lumen com o perfil dos cortes e o "código" (um dígito por corte). */
export const CodePanel: React.FC<{ x: number; y: number; show: number; digits: number; trace: number }> = ({ x, y, show, digits, trace }) => {
  if (show <= 0) return null;
  const w = 760;
  const h = 300;
  const xs = RIGHT_BITTING.map((_, i) => -260 + i * 130);
  // perfil dos dentes (borda de cima da lâmina vista de lado)
  const pts: string[] = [`${-330},-10`];
  RIGHT_BITTING.forEach((d, i) => {
    const cx = xs[i];
    pts.push(`${cx - 45},-10`, `${cx - 14},${-10 + d * 14}`, `${cx + 14},${-10 + d * 14}`, `${cx + 45},-10`);
  });
  pts.push(`${330},-10`);
  const len = 1500;
  return (
    <g transform={`translate(${x} ${y}) scale(${0.85 + 0.15 * show})`} opacity={show}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={34} fill={CYAN} opacity={0.12} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={34} fill="none" stroke={CYAN} strokeWidth={4} />
      <g transform="translate(0 -40)">
        <polyline points={pts.join(" ")} fill="none" stroke={ERAS.future.line} strokeWidth={8} strokeLinejoin="round" />
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke={CYAN}
          strokeWidth={9}
          strokeLinejoin="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - trace)}
        />
      </g>
      {RIGHT_BITTING.map((d, i) => {
        const o = Math.max(0, Math.min(1, digits * RIGHT_BITTING.length - i));
        return (
          <g key={i} opacity={o} transform={`translate(${xs[i]} 95) scale(${0.7 + 0.3 * o})`}>
            <rect x={-44} y={-44} width={88} height={88} rx={20} fill="#ffffff" stroke={VIOLET} strokeWidth={5} />
            <text y={20} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={60} fill={OUT}>
              {d}
            </text>
          </g>
        );
      })}
    </g>
  );
};

/** Chegada pela Chrono-Band: anel violeta encolhendo + clarão (método fixo da bíblia). */
export const ArrivalRing: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) => {
  if (p <= 0 || p >= 1) return null;
  const r = 230 * (1 - p);
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse rx={r * 0.8} ry={r * 1.25} fill="none" stroke={VIOLET} strokeWidth={10} opacity={1 - p * 0.5} />
      <ellipse rx={r * 0.55} ry={r * 0.9} fill="none" stroke={CYAN} strokeWidth={6} opacity={1 - p * 0.5} />
      {p > 0.7 && <circle r={160 * (p - 0.7) * 3} fill="#ffffff" opacity={1 - (p - 0.7) / 0.3} />}
    </g>
  );
};
