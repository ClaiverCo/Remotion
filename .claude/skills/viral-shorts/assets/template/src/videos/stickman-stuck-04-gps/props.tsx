import React from "react";
import { FONT } from "../../theme";
import { LEAD } from "../../stickman";

/**
 * Peças do episódio 4 de "Preso em 2026" (o GPS). Coordenadas locais, centro em (0, 0).
 */

const OUT = LEAD.colors.outline;
const CYAN = LEAD.colors.halo;
const YELLOW = "#F5C542";
const BLUE = "#3B82F6";
const GREEN = "#22C55E";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Mapinha simples (ruas, quarteirões e a casa com garagem). Centro em (0, 0), 200 × 320. */
const MiniMap: React.FC<{ dot: number; lock: number; t: number }> = ({ dot, lock, t }) => (
  <g>
    <rect x={-100} y={-160} width={200} height={320} fill="#EAF2E3" />
    {[-60, 20, 100].map((y) => (
      <rect key={y} x={-100} y={y - 10} width={200} height={20} fill="#FFFFFF" />
    ))}
    {[-40, 50].map((x) => (
      <rect key={x} x={x - 10} y={-160} width={20} height={320} fill="#FFFFFF" />
    ))}
    {[
      [-90, -150, 40, 80],
      [-20, -150, 60, 80],
      [70, -150, 30, 80],
      [-90, -40, 40, 50],
      [70, -40, 30, 50],
      [-90, 40, 40, 50],
      [-20, 40, 60, 50],
    ].map(([x, y, w, h], i) => (
      <rect key={i} x={x} y={y} width={w} height={h} rx={6} fill="#D4E4C5" />
    ))}
    {/* a casa com garagem */}
    <g transform="translate(5 -18)">
      <rect x={-24} y={-14} width={48} height={30} fill="#F3D9B8" stroke={OUT} strokeWidth={2} />
      <path d="M-30 -14 L0 -36 L30 -14 Z" fill="#D9825B" stroke={OUT} strokeWidth={2} />
    </g>
    {dot > 0 && (
      <g transform="translate(5 -18)" opacity={dot}>
        <circle r={18 + 10 * Math.abs(Math.sin(t * 3))} fill={BLUE} opacity={0.25} />
        <circle r={11} fill={BLUE} stroke="#ffffff" strokeWidth={4} />
        {lock > 0 && <circle r={70 - 50 * lock} fill="none" stroke={BLUE} strokeWidth={4} opacity={lock} />}
      </g>
    )}
  </g>
);

/** Celular com o mapa aberto. Centro em (0, 0), 120 × 220 na escala 1 (a tela é o MiniMap reduzido). */
export const PhoneMap: React.FC<{ x?: number; y?: number; scale?: number; rotate?: number; dot?: number; lock?: number; t: number }> = ({
  x = 0,
  y = 0,
  scale = 1,
  rotate = 0,
  dot = 0,
  lock = 0,
  t,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
    <rect x={-60} y={-110} width={120} height={220} rx={18} fill="#1F2937" stroke={OUT} strokeWidth={5} />
    <clipPath id="phonemapclip">
      <rect x={-50} y={-96} width={100} height={182} rx={8} />
    </clipPath>
    <g clipPath="url(#phonemapclip)">
      <g transform="scale(0.55)">
        <MiniMap dot={dot} lock={lock} t={t} />
      </g>
    </g>
    <rect x={-16} y={94} width={32} height={6} rx={3} fill="#4B5563" />
  </g>
);

/** O mapa em close (para a lupa). */
export const MapCloseup: React.FC<{ dot: number; lock: number; t: number }> = ({ dot, lock, t }) => (
  <g transform="scale(1.1)">
    <MiniMap dot={dot} lock={lock} t={t} />
  </g>
);

/** GPS velho de carro (GPS-01): telinha preta com moldura cinza, mapa e ventosa. Centro em (0, 0), 150 × 100. */
export const CarGPS: React.FC<{ x?: number; y?: number; scale?: number; rotate?: number; on?: number }> = ({ x = 0, y = 0, scale = 1, rotate = 0, on = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
    <path d="M-10 50 L-18 78 L18 78 L10 50 Z" fill="#6B7280" stroke={OUT} strokeWidth={3} />
    <ellipse cy={80} rx={26} ry={8} fill="#9CA3AF" stroke={OUT} strokeWidth={3} />
    <rect x={-75} y={-50} width={150} height={100} rx={14} fill="#6B7280" stroke={OUT} strokeWidth={5} />
    <rect x={-62} y={-38} width={124} height={76} rx={6} fill={on > 0.5 ? "#DCEBD0" : "#111827"} stroke={OUT} strokeWidth={3} />
    {on > 0.5 && (
      <g>
        <path d="M-50 20 L-10 -6 L20 4 L52 -24" fill="none" stroke={BLUE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M44 -28 L58 -20 L46 -12 Z" fill={BLUE} />
      </g>
    )}
  </g>
);

/** Satélite com um reloginho no corpo. Centro em (0, 0). `glow` 0..1. */
export const Satellite: React.FC<{ x: number; y: number; s?: number; t: number; glow?: number; offset?: number; check?: number }> = ({ x, y, s = 1, t, glow = 0, offset = 0, check = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${Math.sin(t * 0.8 + x) * 4})`}>
    {glow > 0 && <circle r={70} fill={CYAN} opacity={0.25 * glow} />}
    {[-1, 1].map((d) => (
      <g key={d}>
        <line x1={d * 34} y1={0} x2={d * 50} y2={0} stroke={OUT} strokeWidth={5} />
        <rect x={d > 0 ? 50 : -112} y={-22} width={62} height={44} rx={4} fill="#2563EB" stroke={OUT} strokeWidth={4} />
        {[1, 2].map((k) => (
          <line key={k} x1={(d > 0 ? 50 : -112) + k * 20.6} y1={-22} x2={(d > 0 ? 50 : -112) + k * 20.6} y2={22} stroke="#93C5FD" strokeWidth={2} />
        ))}
      </g>
    ))}
    <rect x={-34} y={-30} width={68} height={60} rx={10} fill="#E5E7EB" stroke={OUT} strokeWidth={5} />
    <circle r={20} fill="#ffffff" stroke={OUT} strokeWidth={3} />
    <line x1={0} y1={0} x2={0} y2={-14} stroke={OUT} strokeWidth={3} strokeLinecap="round" transform={`rotate(${(t * 120 + offset) % 360})`} />
    <line x1={0} y1={0} x2={9} y2={0} stroke={OUT} strokeWidth={3} strokeLinecap="round" />
    {check > 0 && (
      <g transform="translate(38 -38)" opacity={check}>
        <circle r={18} fill={GREEN} stroke={OUT} strokeWidth={3} />
        <path d="M-8 0 L-2 6 L9 -6" fill="none" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    )}
  </g>
);

/** Onda de sinal saindo de (x0, y0) em direção a (x1, y1). `p` 0..1 = quanto já viajou. */
export const SignalPulse: React.FC<{ from: { x: number; y: number }; to: { x: number; y: number }; p: number; clock?: boolean }> = ({ from, to, p, clock = true }) => {
  if (p <= 0 || p >= 1) return null;
  const x = from.x + (to.x - from.x) * p;
  const y = from.y + (to.y - from.y) * p;
  const a = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  return (
    <g>
      <line x1={from.x} y1={from.y} x2={x} y2={y} stroke={YELLOW} strokeWidth={4} strokeDasharray="10 10" opacity={0.6} />
      <g transform={`translate(${x} ${y}) rotate(${a})`}>
        {[0, 1, 2].map((k) => (
          <path key={k} d={`M${-k * 12} -16 Q${8 - k * 12} 0 ${-k * 12} 16`} fill="none" stroke={YELLOW} strokeWidth={5} strokeLinecap="round" opacity={1 - k * 0.3} />
        ))}
      </g>
      {clock && (
        <g transform={`translate(${x + 26} ${y - 26})`}>
          <circle r={14} fill="#ffffff" stroke={OUT} strokeWidth={3} />
          <path d="M0 0 L0 -9 M0 0 L6 3" stroke={OUT} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

/** Receptor no chão (um ponto azul com um aparelhinho). */
export const Receiver: React.FC<{ x: number; y: number; glow: number; t: number }> = ({ x, y, glow, t }) => (
  <g transform={`translate(${x} ${y})`}>
    {glow > 0 && <circle r={30 + 14 * Math.abs(Math.sin(t * 3))} fill={BLUE} opacity={0.25 * glow} />}
    <rect x={-22} y={-40} width={44} height={70} rx={8} fill="#1F2937" stroke={OUT} strokeWidth={4} />
    <rect x={-15} y={-32} width={30} height={46} rx={4} fill="#DCEBD0" />
    <circle cy={-10} r={6} fill={BLUE} />
  </g>
);

/** Cronômetro (o atraso do sinal). */
export const Stopwatch: React.FC<{ x: number; y: number; t: number; show: number }> = ({ x, y, t, show }) =>
  show > 0 ? (
    <g transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * show})`} opacity={show}>
      <rect x={-8} y={-52} width={16} height={12} rx={3} fill={OUT} />
      <circle r={40} fill="#ffffff" stroke={OUT} strokeWidth={5} />
      <line x1={0} y1={0} x2={0} y2={-28} stroke="#E05A47" strokeWidth={5} strokeLinecap="round" transform={`rotate(${(t * 360) % 360})`} />
      <circle r={4} fill={OUT} />
    </g>
  ) : null;

/** Relógio grande de mostrador (clipe 5). `angle` = posição do ponteiro em graus. */
export const BigClock: React.FC<{ x: number; y: number; r?: number; angle: number; label: string; color?: string; wrench?: number }> = ({ x, y, r = 130, angle, label, color = "#E5E7EB", wrench = 0 }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r + 14} fill={color} stroke={OUT} strokeWidth={6} />
    <circle r={r} fill="#ffffff" stroke={OUT} strokeWidth={4} />
    {Array.from({ length: 12 }, (_, i) => (
      <line key={i} x1={0} y1={-r + 8} x2={0} y2={-r + (i % 3 === 0 ? 26 : 18)} stroke={OUT} strokeWidth={i % 3 === 0 ? 6 : 3} transform={`rotate(${i * 30})`} />
    ))}
    <line x1={0} y1={14} x2={0} y2={-r * 0.82} stroke="#E05A47" strokeWidth={6} strokeLinecap="round" transform={`rotate(${angle})`} />
    <circle r={9} fill={OUT} />
    <text y={r + 70} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={38} fill={OUT}>
      {label}
    </text>
    {wrench > 0 && (
      <g transform={`translate(${r * 0.8} ${-r * 0.8}) rotate(${-30 + 60 * Math.sin(wrench * Math.PI * 2)})`} opacity={Math.min(1, wrench * 3) * (1 - Math.max(0, wrench - 0.8) * 5)}>
        <path d="M-10 -60 L10 -60 L10 10 Q22 18 22 34 Q22 54 0 58 Q-22 54 -22 34 Q-22 18 -10 10 Z" fill="#9CA3AF" stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
        <circle cy={36} r={9} fill="#ffffff" stroke={OUT} strokeWidth={3} />
      </g>
    )}
  </g>
);

/** Foguete simples subindo. Centro da base em (x, y). */
export const Rocket: React.FC<{ x: number; y: number; show: number; t: number }> = ({ x, y, show, t }) =>
  show > 0 ? (
    <g transform={`translate(${x} ${y})`} opacity={Math.min(1, show * 3)}>
      <path d={`M-12 0 Q0 ${40 + 10 * Math.sin(t * 30)} 12 0 Z`} fill="#F59E0B" />
      <path d="M-20 0 L-20 -80 Q0 -130 20 -80 L20 0 Z" fill="#F8FAFC" stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
      <path d="M-20 -10 L-36 6 L-20 -30 Z M20 -10 L36 6 L20 -30 Z" fill="#E05A47" stroke={OUT} strokeWidth={3} strokeLinejoin="round" />
      <circle cy={-70} r={8} fill="#93C5FD" stroke={OUT} strokeWidth={3} />
    </g>
  ) : null;

/** Telinha da máquina mostrando a rota até Lumen (`route` 0..1) e depois o pedido de energia (`bolt` 0..1). */
export const RouteScreen: React.FC<{ route: number; bolt: number; t: number }> = ({ route, bolt, t }) => (
  <g>
    {bolt < 1 && (
      <g opacity={1 - bolt}>
        <circle cx={-110} r={10} fill="#E05A47" />
        <path d="M-100 0 Q-30 -30 40 0 T100 0" fill="none" stroke={CYAN} strokeWidth={5} strokeDasharray="10 8" pathLength={1} strokeDashoffset={0} opacity={route} />
        <circle cx={110} r={16} fill="#C4B5FD" stroke={CYAN} strokeWidth={3} opacity={route} />
        {route >= 1 && <path d="M100 -4 L108 4 L122 -10" fill="none" stroke={GREEN} strokeWidth={4} strokeLinecap="round" />}
      </g>
    )}
    {bolt > 0 && (
      <g opacity={bolt}>
        <path d="M-8 -28 L-30 6 L-6 6 L-16 30 L16 -6 L-6 -6 L6 -28 Z" fill={YELLOW} stroke={OUT} strokeWidth={3} strokeLinejoin="round" transform={`scale(${1 + 0.08 * Math.sin(t * 10)})`} />
        <text x={60} y={20} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={52} fill={CYAN}>
          ?
        </text>
      </g>
    )}
  </g>
);

/** Raio gigante holográfico acima da máquina (o pedido de energia). */
export const HoloBolt: React.FC<{ x: number; y: number; show: number; t: number }> = ({ x, y, show, t }) =>
  show > 0 ? (
    <g transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * show})`} opacity={show * (0.85 + 0.15 * Math.sin(t * 25))}>
      <circle r={120} fill={CYAN} opacity={0.1} />
      <path d="M-20 -110 L-80 20 L-10 20 L-40 120 L70 -20 L0 -20 L30 -110 Z" fill="none" stroke={CYAN} strokeWidth={8} strokeLinejoin="round" />
      <path d="M-20 -110 L-80 20 L-10 20 L-40 120 L70 -20 L0 -20 L30 -110 Z" fill={YELLOW} opacity={0.35} />
    </g>
  ) : null;

export { clamp01 };
