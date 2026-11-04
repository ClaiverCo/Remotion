import React from "react";
import { FONT } from "../../theme";
import { CRACKED_BAND, ERAS, LEAD } from "../../stickman";
import { Watch } from "../stickman-stuck-01-crystal/props";
import { PowerBank } from "../stickman-stuck-02-battery/props";

/**
 * Peças do episódio 3 de "Stuck in 2026" (o chip de silício) e a máquina do tempo física (MACHINE-01, eps. 3–6).
 */

const OUT = LEAD.colors.outline;
const CYAN = LEAD.colors.halo;
const VIOLET = LEAD.colors.chronoBand;
const YELLOW = "#F5C542";
const N = ERAS.present;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Placa de circuito de um celular velho (PCB-01): verde, trilhas de cobre e um chip preto no meio. Centro em (0, 0), 150 × 96. */
export const CircuitBoard: React.FC<{ x?: number; y?: number; scale?: number; rotate?: number; chipGlow?: number }> = ({ x = 0, y = 0, scale = 1, rotate = 0, chipGlow = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
    <rect x={-75} y={-48} width={150} height={96} rx={10} fill="#3F8F5A" stroke={OUT} strokeWidth={5} />
    <g stroke="#D9A54A" strokeWidth={3} fill="none" strokeLinecap="round">
      <path d="M-62 -30 L-34 -30 L-24 -20" />
      <path d="M-62 30 L-34 30 L-24 20" />
      <path d="M62 -30 L34 -30 L24 -20" />
      <path d="M62 30 L34 30 L24 20" />
      <path d="M-62 0 L-26 0" />
      <path d="M62 0 L26 0" />
    </g>
    <rect x={-60} y={-40} width={14} height={10} rx={2} fill="#C9D1D9" stroke={OUT} strokeWidth={2} />
    <rect x={46} y={28} width={14} height={10} rx={2} fill="#C9D1D9" stroke={OUT} strokeWidth={2} />
    {chipGlow > 0 && <rect x={-38} y={-38} width={76} height={76} rx={12} fill={CYAN} opacity={0.4 * chipGlow} />}
    <rect x={-24} y={-24} width={48} height={48} rx={6} fill="#1F2937" stroke={OUT} strokeWidth={3} />
    <circle cx={-14} cy={-14} r={3} fill="#4B5563" />
  </g>
);

/**
 * A Chrono-Band aberta (para a lupa): a tampa vira para cima e aparece o "cérebro" dela.
 * `open` 0..1; `burned` = chip preto e soltando fumaça.
 */
export const OpenBand: React.FC<{ open: number; burned: number; t: number }> = ({ open, burned, t }) => {
  const chipColor = burned > 0.5 ? "#111111" : "#1F2937";
  return (
    <g>
      <rect x={-160} y={-22} width={320} height={44} rx={22} fill="#FFFFFF" stroke={OUT} strokeWidth={6} />
      <rect x={-70} y={-46} width={140} height={92} rx={28} fill={CRACKED_BAND} stroke={OUT} strokeWidth={7} />
      {/* por dentro */}
      <rect x={-50} y={-30} width={100} height={60} rx={14} fill="#2E2450" stroke={OUT} strokeWidth={4} opacity={open} />
      <g opacity={open}>
        <rect x={-18} y={-18} width={36} height={36} rx={5} fill={chipColor} stroke={OUT} strokeWidth={3} />
        {burned > 0 && <circle cx={4} cy={2} r={12} fill="#3B2F2F" opacity={burned} />}
        {burned > 0 &&
          [0, 1, 2].map((k) => {
            const ph = (t * 0.7 + k / 3) % 1;
            return (
              <path
                key={k}
                d={`M${-6 + k * 6} ${-16 - ph * 70} q 10 -10 0 -20 q -10 -10 0 -20`}
                fill="none"
                stroke="#9AA5B1"
                strokeWidth={6}
                strokeLinecap="round"
                opacity={burned * (1 - ph) * 0.9}
              />
            );
          })}
      </g>
      {/* a tampa, com a rachadura, gira para cima */}
      <g transform={`translate(0 -46) rotate(${-110 * open} -70 0) translate(0 46)`}>
        <rect x={-50} y={-30} width={100} height={60} rx={14} fill="#2E2450" stroke={OUT} strokeWidth={4} />
        <path d="M-30 -24 L-6 -4 L-20 8 L6 26 M-6 -4 L24 -18" fill="none" stroke="#E5E7EB" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
};

/** Gaveta sob a bancada (abre para a direita). `open` 0..1. */
export const Drawer: React.FC<{ x: number; y: number; open: number }> = ({ x, y, open }) => {
  const dx = open * 90;
  return (
    <g>
      <rect x={x} y={y} width={180} height={70} fill="#A9865F" stroke={N.line} strokeWidth={3} />
      <g transform={`translate(${dx} 0)`}>
        <rect x={x + 6} y={y + 6} width={168} height={58} rx={4} fill="#C9A77F" stroke={OUT} strokeWidth={3} />
        <rect x={x + 70} y={y + 28} width={40} height={10} rx={5} fill="#7A5A3A" />
      </g>
    </g>
  );
};

/**
 * A máquina do tempo física (MACHINE-01, ficção): um anel em pé sobre uma base, com 6 encaixes em volta
 * (mesma ordem da planta: 0 = topo, depois no sentido horário) e uma telinha na base.
 * Encaixes: 0 relógio/cristal (ep. 1), 1 power bank (ep. 2), 2 placa com chip (ep. 3); 3–5 vazios.
 * `parts` = quantos encaixes estão cheios; `glow` = índice do encaixe que brilha; `screen` = o que a tela mostra.
 */
export const MachineFrame: React.FC<{
  x: number;
  groundY: number;
  t: number;
  parts: number;
  R?: number;
  glow?: { slot: number; p: number };
  hum?: number;
  screen?: { q?: number; pin?: number; clock?: number };
}> = ({ x, groundY, t, parts, R = 150, glow, hum = 0, screen = {} }) => {
  const baseH = 120;
  const cy = groundY - baseH - R - 14;
  const slot = (i: number) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return { x: x + Math.cos(a) * R, y: cy + Math.sin(a) * R };
  };
  const jitter = hum > 0 ? Math.sin(t * 50) * 1.5 * hum : 0;
  return (
    <g transform={`translate(${jitter} 0)`}>
      {/* base com a telinha */}
      <rect x={x - 180} y={groundY - baseH} width={360} height={baseH} rx={18} fill="#C9D1D9" stroke={OUT} strokeWidth={5} />
      <rect x={x - 150} y={groundY - baseH + 14} width={300} height={70} rx={12} fill="#0B2530" stroke={OUT} strokeWidth={4} />
      <g transform={`translate(${x} ${groundY - baseH + 49})`}>
        {(screen.q ?? 0) > 0 && (
          <text x={-90} y={20} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={56} fill={CYAN} opacity={screen.q}>
            ?
          </text>
        )}
        {(screen.pin ?? 0) > 0 && (
          <g transform="translate(0 0)" opacity={screen.pin}>
            <path d="M0 26 C-20 0 -20 -24 0 -24 C20 -24 20 0 0 26 Z" fill="#E05A47" stroke={OUT} strokeWidth={3} />
            <circle cy={-8} r={7} fill="#ffffff" />
          </g>
        )}
        {(screen.clock ?? 0) > 0 && (
          <g transform="translate(90 0)" opacity={screen.clock}>
            <circle r={24} fill="#ffffff" stroke={OUT} strokeWidth={3} />
            <path d="M0 0 L0 -15 M0 0 L11 6" stroke={OUT} strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
      </g>
      {/* pés do anel */}
      <path d={`M${x - 70} ${groundY - baseH} L${x - 40} ${cy + R - 10} M${x + 70} ${groundY - baseH} L${x + 40} ${cy + R - 10}`} stroke={OUT} strokeWidth={10} strokeLinecap="round" />
      <path d={`M${x - 70} ${groundY - baseH} L${x - 40} ${cy + R - 10} M${x + 70} ${groundY - baseH} L${x + 40} ${cy + R - 10}`} stroke="#9AA5B1" strokeWidth={5} strokeLinecap="round" />
      {/* o anel */}
      <circle cx={x} cy={cy} r={R + 14} fill="none" stroke={OUT} strokeWidth={34} />
      <circle cx={x} cy={cy} r={R + 14} fill="none" stroke="#9AA5B1" strokeWidth={26} />
      <circle cx={x} cy={cy} r={R + 14} fill="none" stroke="#C9D1D9" strokeWidth={10} strokeDasharray="20 16" />
      {hum > 0 && (
        <>
          <ellipse cx={x} cy={cy} rx={(R - 30) * 0.75} ry={R - 30} fill="none" stroke={VIOLET} strokeWidth={5} opacity={0.35 * hum} />
          <ellipse cx={x} cy={cy} rx={(R - 60) * 0.75} ry={R - 60} fill="none" stroke={CYAN} strokeWidth={4} opacity={0.35 * hum} strokeDasharray="12 10" strokeDashoffset={-t * 40} />
        </>
      )}
      {/* encaixes */}
      {Array.from({ length: 6 }, (_, i) => {
        const p = slot(i);
        const has = i < parts;
        const g = glow && glow.slot === i ? glow.p : 0;
        return (
          <g key={i} transform={`translate(${p.x} ${p.y})`}>
            {g > 0 && <circle r={64} fill={CYAN} opacity={0.35 * g} />}
            <circle r={44} fill={has ? "#E5E9EE" : "#B8C2CC"} stroke={OUT} strokeWidth={5} />
            {!has && <circle r={30} fill="none" stroke="#7B8FA6" strokeWidth={4} strokeDasharray="8 7" />}
            {has && i === 0 && <Watch scale={0.62} sec={t + 50} strap={false} />}
            {has && i === 1 && <PowerBank scale={0.5} leds={4} />}
            {has && i === 2 && <CircuitBoard scale={0.42} chipGlow={g} />}
          </g>
        );
      })}
    </g>
  );
};
/** Centro de um encaixe da máquina na tela (para alinhar a mão do Kip). */
export const machineSlot = (x: number, groundY: number, i: number, R = 150) => {
  const cy = groundY - 120 - R - 14;
  const a = ((-90 + i * 60) * Math.PI) / 180;
  return { x: x + Math.cos(a) * R, y: cy + Math.sin(a) * R };
};

/** Monte de areia (sílica). Base em (x, y). */
export const SandPile: React.FC<{ x: number; y: number; s?: number; show?: number }> = ({ x, y, s = 1, show = 1 }) =>
  show > 0 ? (
    <g transform={`translate(${x} ${y}) scale(${s * (0.7 + 0.3 * show)})`} opacity={show}>
      <path d="M-120 0 Q-60 -110 0 -120 Q60 -110 120 0 Z" fill="#E8CF94" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
      {[
        [-50, -40],
        [10, -70],
        [40, -30],
        [-20, -20],
        [70, -15],
        [-80, -12],
      ].map(([a, b], i) => (
        <circle key={i} cx={a} cy={b} r={4} fill="#C9AE70" />
      ))}
    </g>
  ) : null;

/** Pedaço de silício puro, cinza brilhante. Centro em (x, y). */
export const SiliconLump: React.FC<{ x: number; y: number; s?: number; show?: number }> = ({ x, y, s = 1, show = 1 }) =>
  show > 0 ? (
    <g transform={`translate(${x} ${y}) scale(${s * (0.7 + 0.3 * show)})`} opacity={show}>
      <path d="M-80 30 L-60 -40 L0 -70 L70 -30 L80 40 L10 70 Z" fill="#8E9AAA" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
      <path d="M-60 -40 L0 -10 L70 -30 M0 -10 L10 70" fill="none" stroke="#5E6B7B" strokeWidth={4} />
      <path d="M-40 -30 L-10 -45" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
    </g>
  ) : null;

/** Lingote: um cristal cilíndrico puxado de um pote de silício derretido. `grow` 0..1. Base do pote em (x, y). */
export const Ingot: React.FC<{ x: number; y: number; grow: number; show?: number; spin: number }> = ({ x, y, grow, show = 1, spin }) =>
  show > 0 ? (
    <g transform={`translate(${x} ${y})`} opacity={show}>
      {/* pote com silício derretido */}
      <path d="M-110 -80 L-90 0 L90 0 L110 -80 Z" fill="#B8C2CC" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
      <ellipse cy={-80} rx={110} ry={20} fill="#F59E5B" stroke={OUT} strokeWidth={4} />
      <ellipse cy={-80} rx={80} ry={12} fill="#FCD38A" opacity={0.8} />
      {/* o cristal crescendo para cima */}
      {grow > 0 && (
        <g>
          <rect x={-46} y={-80 - 300 * grow} width={92} height={300 * grow} rx={20} fill="#9AA5B4" stroke={OUT} strokeWidth={5} />
          {Array.from({ length: 4 }, (_, i) => (
            <path key={i} d={`M-46 ${-80 - 300 * grow + 40 + i * 60 * grow} q46 ${12 + 4 * Math.sin(spin + i)} 92 0`} fill="none" stroke="#6E7B8C" strokeWidth={3} opacity={grow} />
          ))}
          <rect x={-30} y={-80 - 300 * grow + 14} width={10} height={300 * grow - 40} rx={5} fill="#ffffff" opacity={0.55} />
          <line x1={0} y1={-80 - 300 * grow} x2={0} y2={-80 - 300 * grow - 60} stroke={OUT} strokeWidth={6} />
        </g>
      )}
    </g>
  ) : null;

/** Discos (wafers) finos e brilhantes, cortados do lingote. `n` 0..5 discos já cortados. Centro em (x, y). */
export const Wafers: React.FC<{ x: number; y: number; n: number; glint?: number }> = ({ x, y, n, glint = 0 }) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({ length: 5 }, (_, i) => {
      const p = clamp01(n - i);
      if (p <= 0) return null;
      return (
        <g key={i} transform={`translate(${-60 + i * 30} ${40 - i * 22 - (1 - p) * 30})`} opacity={p}>
          <ellipse rx={90} ry={30} fill="#7D8899" stroke={OUT} strokeWidth={4} />
          <ellipse rx={90} ry={26} cy={-5} fill="#B9C3D0" stroke={OUT} strokeWidth={4} />
          <path d="M-50 -14 L10 -22" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.6 + 0.4 * glint} />
        </g>
      );
    })}
  </g>
);

/** Seta grossa entre estações do diagrama. */
export const FlowArrow: React.FC<{ d: string; show: number }> = ({ d, show }) =>
  show > 0 ? (
    <g opacity={show}>
      <path d={d} fill="none" stroke="#9AA5B1" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${show} 1`} />
    </g>
  ) : null;

/**
 * Gravação com luz (clipe 5): lâmpada → máscara (estêncil) → disco. `light` 0..1, `print` 0..1 = padrão gravado,
 * `layers` 0..3 = camadas empilhadas. Centro do disco em (x, y).
 */
export const LithoRig: React.FC<{ x: number; y: number; t: number; light: number; print: number; layers: number }> = ({ x, y, t, light, print, layers }) => {
  const maskY = y - 260;
  const lampY = y - 440;
  const cols = 9;
  const rows = 4;
  return (
    <g>
      {/* luz */}
      {light > 0 && (
        <>
          <path d={`M${x - 70} ${lampY + 40} L${x - 230} ${maskY} L${x + 230} ${maskY} L${x + 70} ${lampY + 40} Z`} fill="#C4B5FD" opacity={0.35 * light} />
          <path d={`M${x - 210} ${maskY + 16} L${x - 280} ${y - 20} L${x + 280} ${y - 20} L${x + 210} ${maskY + 16} Z`} fill="#C4B5FD" opacity={0.22 * light * (0.85 + 0.15 * Math.sin(t * 12))} />
        </>
      )}
      {/* lâmpada */}
      <rect x={x - 90} y={lampY - 30} width={180} height={70} rx={18} fill="#E5E9EE" stroke={OUT} strokeWidth={5} />
      <ellipse cx={x} cy={lampY + 40} rx={70} ry={12} fill={light > 0 ? "#EDE9FE" : "#B8C2CC"} stroke={OUT} strokeWidth={4} />
      {/* máscara: um estêncil com o desenho do circuito */}
      <rect x={x - 230} y={maskY - 8} width={460} height={24} rx={6} fill="#F8FAFC" stroke={OUT} strokeWidth={4} />
      {Array.from({ length: 11 }, (_, i) => (
        <rect key={i} x={x - 200 + i * 38} y={maskY - 3} width={i % 3 === 0 ? 24 : 12} height={14} fill={OUT} />
      ))}
      {/* camadas do disco */}
      {Array.from({ length: 3 }, (_, i) => {
        const p = clamp01(layers - i);
        if (p <= 0 && i > 0) return null;
        const colors = ["#B9C3D0", "#93C5FD", "#FCD38A"];
        return (
          <g key={i} transform={`translate(${x} ${y - i * 18})`} opacity={i === 0 ? 1 : p}>
            <ellipse rx={300} ry={88} cy={10} fill="#7D8899" stroke={OUT} strokeWidth={4} />
            <ellipse rx={300} ry={84} fill={colors[i]} stroke={OUT} strokeWidth={4} />
          </g>
        );
      })}
      {/* o padrão gravado */}
      <g transform={`translate(${x} ${y - Math.min(2, Math.max(0, layers - 1)) * 18})`}>
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            const k = r * cols + c;
            const on = clamp01(print * (rows * cols) - k);
            if (on <= 0) return null;
            const px = (c - (cols - 1) / 2) * 50;
            const py = (r - (rows - 1) / 2) * 30;
            if (Math.abs(px / 270) ** 2 + Math.abs(py / 70) ** 2 > 1) return null;
            return <rect key={k} x={px - 18} y={py - 9} width={36} height={18} rx={4} fill="#4C1D95" opacity={0.75 * on} />;
          }),
        )}
      </g>
    </g>
  );
};

/** Grade de transistores ligando e desligando (para a lupa). */
export const SwitchGrid: React.FC<{ t: number; n?: number; size?: number }> = ({ t, n = 7, size = 34 }) => (
  <g>
    <rect x={-200} y={-200} width={400} height={400} fill="#EDE9FE" />
    {Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => {
        const on = Math.sin(t * 7 + r * 1.7 + c * 2.3 + r * c) > 0;
        const px = (c - (n - 1) / 2) * (size + 8);
        const py = (r - (n - 1) / 2) * (size + 8);
        return <rect key={`${r}-${c}`} x={px - size / 2} y={py - size / 2} width={size} height={size} rx={6} fill={on ? YELLOW : "#4C1D95"} stroke={OUT} strokeWidth={2} />;
      }),
    )}
  </g>
);

/** Interruptor liga/desliga (ícone). `on` 0..1. Centro em (x, y). */
export const ToggleIcon: React.FC<{ x: number; y: number; on: number; show: number }> = ({ x, y, on, show }) =>
  show > 0 ? (
    <g transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * show})`} opacity={show}>
      <rect x={-60} y={-30} width={120} height={60} rx={30} fill={on > 0.5 ? YELLOW : "#9AA5B1"} stroke={OUT} strokeWidth={5} />
      <circle cx={-30 + 60 * on} r={22} fill="#ffffff" stroke={OUT} strokeWidth={4} />
    </g>
  ) : null;

/** Cristal raro e brilhante de Lumen (ficção), para a comparação. Base em (x, y). */
export const RareCrystal: React.FC<{ x: number; y: number; t: number; show: number }> = ({ x, y, t, show }) =>
  show > 0 ? (
    <g transform={`translate(${x} ${y + Math.sin(t * 1.5) * 6})`} opacity={show}>
      <ellipse cy={-80} rx={90} ry={110} fill={VIOLET} opacity={0.18 + 0.08 * Math.sin(t * 3)} />
      <path d="M0 -190 L46 -110 L30 0 L-30 0 L-46 -110 Z" fill="#C4B5FD" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
      <path d="M0 -190 L0 0 M-46 -110 L46 -110" stroke="#8B5CF6" strokeWidth={3} />
      <path d="M-20 -150 L-10 -170" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" />
    </g>
  ) : null;
