import React from "react";
import { FONT } from "../../theme";
import { CRACKED_BAND, ERAS, LEAD } from "../../stickman";
import { TuningFork } from "../stickman-stuck-01-crystal/props";

/**
 * Peças do episódio 2 de "Stuck in 2026" (a bateria de lítio) e o cenário fixo do arco: a garagem do Ben.
 */

const OUT = LEAD.colors.outline;
const CYAN = LEAD.colors.halo;
const VIOLET = LEAD.colors.chronoBand;
const YELLOW = "#F5C542";
const N = ERAS.present;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * A garagem do Ben (base do Kip em 2026, eps. 2–6). Bancada à esquerda, porta de enrolar à direita.
 * Tudo em traço mais fino e claro que os personagens.
 */
export const Garage: React.FC<{ groundY: number; t: number; lamp?: number }> = ({ groundY, t, lamp = 1 }) => {
  const G = groundY;
  const benchTop = G - 190;
  return (
    <g>
      <rect x={-800} y={-800} width={2680} height={G + 800} fill="#F3E7D6" />
      {/* tábuas da parede */}
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={-40 + i * 100} y1={180} x2={-40 + i * 100} y2={G} stroke={N.line} strokeWidth={2} opacity={0.45} />
      ))}
      {/* porta de enrolar */}
      <rect x={690} y={420} width={360} height={G - 420} fill="#E9DCC8" stroke={N.line} strokeWidth={3} />
      {Array.from({ length: 11 }, (_, i) => (
        <line key={i} x1={690} y1={470 + i * 66} x2={1050} y2={470 + i * 66} stroke={N.line} strokeWidth={3} />
      ))}
      <rect x={840} y={G - 60} width={60} height={14} rx={7} fill="#CDB9A0" />
      {/* prateleira com caixas */}
      <line x1={70} y1={520} x2={560} y2={520} stroke={N.line} strokeWidth={6} strokeLinecap="round" />
      <rect x={100} y={440} width={110} height={80} rx={6} fill="#E3CDB0" stroke={N.line} strokeWidth={3} />
      <rect x={230} y={460} width={80} height={60} rx={6} fill="#D9C2A3" stroke={N.line} strokeWidth={3} />
      <rect x={440} y={430} width={90} height={90} rx={6} fill="#E3CDB0" stroke={N.line} strokeWidth={3} />
      {/* painel de ferramentas */}
      <rect x={90} y={600} width={480} height={240} rx={10} fill="#EAD9C1" stroke={N.line} strokeWidth={3} />
      {Array.from({ length: 6 }, (_, r) =>
        Array.from({ length: 14 }, (_, c) => <circle key={`${r}-${c}`} cx={115 + c * 33} cy={625 + r * 38} r={3} fill={N.line} opacity={0.6} />),
      )}
      <g stroke="#B79C7E" strokeWidth={8} strokeLinecap="round" fill="none">
        <path d="M150 660 L150 780 M130 660 L170 660" />
        <path d="M250 650 L250 790" />
        <circle cx={250} cy={650} r={16} />
        <path d="M350 660 L350 790 M335 660 L365 660 L365 690 L335 690 Z" />
        <path d="M460 650 Q500 700 460 790" />
      </g>
      {/* bancada */}
      <rect x={40} y={benchTop} width={560} height={26} rx={6} fill="#C9A77F" stroke={N.line} strokeWidth={4} />
      <rect x={70} y={benchTop + 26} width={20} height={G - benchTop - 26} fill="#B99570" />
      <rect x={550} y={benchTop + 26} width={20} height={G - benchTop - 26} fill="#B99570" />
      <rect x={70} y={G - 70} width={500} height={14} fill="#B99570" />
      {/* lâmpada pendurada */}
      <line x1={420} y1={160} x2={420} y2={300} stroke={N.line} strokeWidth={3} />
      <path d="M380 300 L460 300 L440 270 L400 270 Z" fill="#D9825B" stroke={N.line} strokeWidth={3} />
      <ellipse cx={420} cy={420} rx={230} ry={150} fill="#FFE9B0" opacity={0.18 * lamp * (0.95 + 0.05 * Math.sin(t * 2))} />
      {/* chão de cimento */}
      <rect x={-800} y={G} width={2680} height={900} fill="#DDD0BD" />
      <line x1={-800} y1={G} x2={1880} y2={G} stroke={N.line} strokeWidth={4} />
    </g>
  );
};
/** Altura do tampo da bancada da garagem. */
export const benchTopY = (groundY: number) => groundY - 190;

/**
 * Power bank (PB-01): retângulo cinza-escuro arredondado com 4 luzes de carga e uma porta embaixo.
 * Centro em (0, 0); 64 × 118 na escala 1. `leds` 0..4 = quantas luzes estão acesas.
 */
export const PowerBank: React.FC<{ x?: number; y?: number; scale?: number; rotate?: number; leds?: number; glow?: number }> = ({
  x = 0,
  y = 0,
  scale = 1,
  rotate = 0,
  leds = 0,
  glow = 0,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
    {glow > 0 && <rect x={-48} y={-76} width={96} height={152} rx={30} fill={YELLOW} opacity={0.3 * glow} />}
    <rect x={-32} y={-59} width={64} height={118} rx={16} fill="#3F4652" stroke={OUT} strokeWidth={5} />
    <rect x={-22} y={-48} width={44} height={10} rx={5} fill="#565E6B" />
    {[0, 1, 2, 3].map((i) => {
      const on = clamp01(leds - i);
      return <circle key={i} cx={-15 + i * 10} cy={30} r={3.6} fill={on > 0.5 ? "#7EE081" : "#2B313A"} stroke={OUT} strokeWidth={1.2} />;
    })}
    <rect x={-9} y={50} width={18} height={6} rx={2} fill="#1F2430" />
  </g>
);

/** Cabo branco de carga entre dois pontos, com energia correndo (`flow` 0..1 = brilho, `dir` 1 = do primeiro ao segundo ponto). */
export const ChargeCable: React.FC<{ from: { x: number; y: number }; to: { x: number; y: number }; sag?: number; flow?: number; t: number; dir?: 1 | -1 }> = ({
  from,
  to,
  sag = 90,
  flow = 0,
  t,
  dir = 1,
}) => {
  const d = `M${from.x} ${from.y} C${from.x} ${from.y + sag} ${to.x} ${to.y + sag} ${to.x} ${to.y}`;
  return (
    <g>
      <path d={d} fill="none" stroke={OUT} strokeWidth={10} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#F8FAFC" strokeWidth={5} strokeLinecap="round" />
      {flow > 0 && (
        <path d={d} fill="none" stroke={YELLOW} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray="0.05 0.1" strokeDashoffset={-dir * t * 0.8} opacity={flow} />
      )}
    </g>
  );
};

/** A Chrono-Band em close (para a lupa). Centro em (0, 0). `glow` 0..1 = acesa mesmo rachada. */
export const BandCloseup: React.FC<{ cracked?: boolean; glow?: number; port?: boolean }> = ({ cracked = true, glow = 0, port = true }) => (
  <g>
    {/* o pulso */}
    <rect x={-160} y={-22} width={320} height={44} rx={22} fill="#FFFFFF" stroke={OUT} strokeWidth={6} />
    {glow > 0 && <rect x={-92} y={-62} width={184} height={124} rx={40} fill={VIOLET} opacity={0.35 * glow} />}
    <rect x={-70} y={-46} width={140} height={92} rx={28} fill={glow > 0.5 ? VIOLET : CRACKED_BAND} stroke={OUT} strokeWidth={7} />
    <rect x={-46} y={-26} width={92} height={52} rx={14} fill={glow > 0.5 ? "#C4B5FD" : "#2E2450"} stroke={OUT} strokeWidth={4} />
    {cracked && <path d="M-34 -24 L-8 -4 L-24 8 L6 26 M-8 -4 L26 -18 M6 26 L20 10" fill="none" stroke="#E5E7EB" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />}
    {port && <rect x={62} y={-9} width={14} height={18} rx={4} fill="#1F2430" stroke={OUT} strokeWidth={2} />}
  </g>
);

/**
 * Corte de uma célula de lítio (clipes 4 e 5). Centro em (x, y), 800 × 500.
 * `ions` 0..1 = quanto os íons já atravessaram do grafite (esq.) para o óxido (dir.).
 * `electrons` 0..1 = fluxo de elétrons pelo fio de fora; `bounce` 0..1 = elétrons batendo no separador.
 * `charging` 0..1 = modo de recarga (setas e fluxo invertidos, tomada no lugar da pulseira).
 */
export const CellCutaway: React.FC<{
  x: number;
  y: number;
  t: number;
  ions: number;
  ionGlow?: number;
  electrons?: number;
  bounce?: number;
  wire?: number;
  bandLit?: number;
  charging?: number;
  labels?: { graphite?: number; oxide?: number; ions?: number; separator?: number; electrons?: number; charging?: number };
  /** tradutor dos rótulos (pacote de idioma) */
  tr?: (s: string) => string;
}> = ({ x, y, t, ions, ionGlow = 0, electrons = 0, bounce = 0, wire = 0, bandLit = 0, charging = 0, labels = {}, tr = (s) => s }) => {
  const W = 800;
  const H = 500;
  const L = -W / 2;
  const R = W / 2;
  const T = -H / 2;
  const B = H / 2;
  const anode = { x0: L + 30, x1: L + 250 };
  const cathode = { x0: R - 250, x1: R - 30 };
  const rows = 8;
  const rowY = (i: number) => T + 50 + i * ((H - 100) / (rows - 1));
  const wireTop = T - 150;
  const wireD = `M${(anode.x0 + anode.x1) / 2} ${T} L${(anode.x0 + anode.x1) / 2} ${wireTop} L${(cathode.x0 + cathode.x1) / 2} ${wireTop} L${(cathode.x0 + cathode.x1) / 2} ${T}`;
  const dir = charging > 0.5 ? -1 : 1;
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* fio de fora */}
      {wire > 0 && (
        <g opacity={wire}>
          <path d={wireD} fill="none" stroke={OUT} strokeWidth={14} strokeLinejoin="round" />
          <path d={wireD} fill="none" stroke="#9AA5B1" strokeWidth={7} strokeLinejoin="round" />
          {electrons > 0 && (
            <path
              d={wireD}
              fill="none"
              stroke={YELLOW}
              strokeWidth={12}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="0.012 0.05"
              strokeDashoffset={-dir * t * 0.25}
              opacity={electrons}
            />
          )}
          {/* no meio do fio: a Chrono-Band (descarga) ou a tomada (recarga) */}
          <g transform={`translate(0 ${wireTop})`}>
            <g opacity={1 - charging}>
              <g transform="scale(0.55)">
                <BandCloseup cracked glow={bandLit} port={false} />
              </g>
            </g>
            {charging > 0 && (
              <g opacity={charging}>
                <rect x={-50} y={-44} width={100} height={88} rx={18} fill="#ffffff" stroke={OUT} strokeWidth={5} />
                <rect x={-22} y={-62} width={10} height={22} rx={3} fill={OUT} />
                <rect x={12} y={-62} width={10} height={22} rx={3} fill={OUT} />
                <path d="M6 -20 L-12 4 L2 4 L-6 26 L14 -2 L0 -2 Z" fill={YELLOW} stroke={OUT} strokeWidth={3} strokeLinejoin="round" />
              </g>
            )}
          </g>
          {electrons > 0 &&
            [-210, 210].map((ax) => (
                <path
                  key={ax}
                  d={dir > 0 ? `M${ax - 22} ${wireTop - 34} l28 0 m-12 -12 l12 12 l-12 12` : `M${ax + 22} ${wireTop - 34} l-28 0 m12 -12 l-12 12 l12 12`}
                  fill="none"
                  stroke={YELLOW}
                  strokeWidth={7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={electrons}
                />
            ))}
        </g>
      )}
      {/* caixa da célula */}
      <rect x={L} y={T} width={W} height={H} rx={34} fill="#E0F2F7" stroke={OUT} strokeWidth={7} />
      {/* ânodo: camadas de grafite */}
      <rect x={anode.x0} y={T + 24} width={anode.x1 - anode.x0} height={H - 48} rx={14} fill="#D1D5DB" stroke={OUT} strokeWidth={4} />
      {Array.from({ length: rows }, (_, i) => (
        <line key={i} x1={anode.x0 + 14} y1={rowY(i)} x2={anode.x1 - 14} y2={rowY(i)} stroke="#4B5563" strokeWidth={7} strokeLinecap="round" />
      ))}
      {/* cátodo: óxido metálico (rede de bolinhas) */}
      <rect x={cathode.x0} y={T + 24} width={cathode.x1 - cathode.x0} height={H - 48} rx={14} fill="#F6D8CC" stroke={OUT} strokeWidth={4} />
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: 5 }, (_, c) => <circle key={`${r}-${c}`} cx={cathode.x0 + 32 + c * 42 + (r % 2) * 14} cy={rowY(r)} r={9} fill="#D9825B" opacity={0.7} />),
      )}
      {/* separador poroso */}
      <line x1={0} y1={T + 14} x2={0} y2={B - 14} stroke="#ffffff" strokeWidth={22} />
      <line x1={0} y1={T + 14} x2={0} y2={B - 14} stroke="#7B8FA6" strokeWidth={6} strokeDasharray="22 14" />
      {/* íons de lítio (+) */}
      {Array.from({ length: rows }, (_, i) => {
        const delay = (i % 4) * 0.08 + (i > 3 ? 0.04 : 0);
        const p = clamp01((ions - delay) / (1 - 0.32));
        const ease = p * p * (3 - 2 * p);
        const x0 = anode.x0 + 60 + (i % 3) * 50;
        const x1 = cathode.x0 + 60 + ((i + 1) % 3) * 50;
        const ix = x0 + (x1 - x0) * ease;
        const iy = rowY(i) - 18 + Math.sin(t * 3 + i) * 6 * (ease > 0 && ease < 1 ? 1 : 0.3);
        return (
          <g key={i} transform={`translate(${ix} ${iy})`}>
            {ionGlow > 0 && <circle r={24} fill={CYAN} opacity={0.35 * ionGlow} />}
            <circle r={15} fill={CYAN} stroke={OUT} strokeWidth={3} />
            <path d="M-6 0 L6 0 M0 -6 L0 6" stroke={OUT} strokeWidth={3} strokeLinecap="round" />
          </g>
        );
      })}
      {/* elétrons (−) batendo no separador */}
      {bounce > 0 &&
        [0, 1, 2].map((k) => {
          const ph = (t * 1.6 + k * 0.33) % 1;
          const bx = -120 + 100 * Math.sin(ph * Math.PI);
          const by = -110 + k * 110;
          return (
            <g key={k} opacity={bounce}>
              <circle cx={bx} cy={by} r={13} fill={YELLOW} stroke={OUT} strokeWidth={3} />
              <line x1={bx - 5} y1={by} x2={bx + 5} y2={by} stroke={OUT} strokeWidth={3} strokeLinecap="round" />
              {ph > 0.4 && ph < 0.6 && (
                <g transform={`translate(-14 ${by})`} stroke="#E05A47" strokeWidth={5} strokeLinecap="round">
                  <line x1={-9} y1={-9} x2={9} y2={9} />
                  <line x1={9} y1={-9} x2={-9} y2={9} />
                </g>
              )}
            </g>
          );
        })}
      <Tag x={(anode.x0 + anode.x1) / 2} y={B + 50} text={tr("graphite")} show={labels.graphite ?? 0} color="#4B5563" />
      <Tag x={(cathode.x0 + cathode.x1) / 2} y={B + 50} text={tr("metal oxide")} show={labels.oxide ?? 0} color="#D9825B" />
      <Tag x={(anode.x0 + anode.x1) / 2 + 40} y={T - 40} text={tr("lithium ions")} show={labels.ions ?? 0} color={CYAN} />
      <Tag x={0} y={B + 50} text={tr("separator")} show={labels.separator ?? 0} color="#7B8FA6" />
      <Tag x={(cathode.x0 + cathode.x1) / 2} y={wireTop + 78} text={tr("electrons")} show={labels.electrons ?? 0} color={YELLOW} />
      <Tag x={-170} y={wireTop + 78} text={tr("charging")} show={labels.charging ?? 0} color={YELLOW} />
    </g>
  );
};

const Tag: React.FC<{ x: number; y: number; text: string; show: number; color: string }> = ({ x, y, text, show, color }) =>
  show > 0 ? (
    <g transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * show})`} opacity={show}>
      <rect x={-text.length * 13 - 22} y={-32} width={text.length * 26 + 44} height={56} rx={28} fill="#ffffff" stroke={color} strokeWidth={5} />
      <text y={10} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={OUT}>
        {text}
      </text>
    </g>
  ) : null;

/**
 * Holograma da máquina do tempo (BLUEPRINT-01, ficção): um anel com um portal no meio e 6 encaixes.
 * Encaixe 1 = cristal (ep. 1), encaixe 2 = bateria (ep. 2); os outros 4 ficam vazios com "?".
 * `filled` = quantos encaixes já têm peça (2 no ep. 2).
 */
export const MachineBlueprint: React.FC<{ x: number; y: number; show: number; t: number; filled?: number; empties?: number }> = ({
  x,
  y,
  show,
  t,
  filled = 2,
  empties = 1,
}) => {
  if (show <= 0) return null;
  const R = 190;
  const flick = 0.85 + 0.15 * Math.sin(t * 40);
  const slot = (i: number) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return { x: Math.cos(a) * R, y: Math.sin(a) * R };
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * show})`} opacity={show * flick}>
      <circle r={R + 70} fill={CYAN} opacity={0.08} />
      <circle r={R} fill="none" stroke={CYAN} strokeWidth={6} />
      <circle r={R - 40} fill="none" stroke={CYAN} strokeWidth={2} strokeDasharray="10 10" />
      <ellipse rx={70} ry={100} fill="none" stroke={VIOLET} strokeWidth={6} opacity={0.8} />
      <ellipse rx={44} ry={66} fill="none" stroke={CYAN} strokeWidth={4} opacity={0.8} />
      {Array.from({ length: 6 }, (_, i) => {
        const p = slot(i);
        const has = i < filled;
        const e = clamp01(empties * 4 - (i - filled));
        return (
          <g key={i} transform={`translate(${p.x} ${p.y})`}>
            <circle r={52} fill="#0B2530" opacity={0.35} />
            <circle r={52} fill="none" stroke={CYAN} strokeWidth={5} strokeDasharray={has ? undefined : "12 9"} />
            {has && i === 0 && <TuningFork y={22} s={0.75} glow={0.4} />}
            {has && i === 1 && (
              <g transform="scale(0.55)">
                <PowerBank leds={4} />
              </g>
            )}
            {!has && e > 0 && (
              <text y={22} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={62} fill={CYAN} opacity={e}>
                ?
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};

/** Ondas de energia sem fio de Lumen (ficção): anéis ciano saindo de (x, y). */
export const PowerWaves: React.FC<{ x: number; y: number; t: number; show: number; r?: number }> = ({ x, y, t, show, r = 300 }) =>
  show > 0 ? (
    <g transform={`translate(${x} ${y})`} opacity={show}>
      {[0, 1, 2, 3].map((k) => {
        const ph = (t * 0.6 + k / 4) % 1;
        return <circle key={k} r={30 + ph * r} fill="none" stroke={CYAN} strokeWidth={6 * (1 - ph) + 1} opacity={0.8 * (1 - ph)} />;
      })}
      <circle r={22} fill={CYAN} stroke={OUT} strokeWidth={4} />
    </g>
  ) : null;

/** Tomada de parede simples (anos 2020). Centro em (x, y). */
export const WallSocket: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-44} y={-58} width={88} height={116} rx={14} fill="#FBF6EE" stroke={OUT} strokeWidth={5} />
    <circle cy={0} r={26} fill="#EEE5D8" stroke={OUT} strokeWidth={3} />
    <circle cx={-9} cy={0} r={4.5} fill={OUT} />
    <circle cx={9} cy={0} r={4.5} fill={OUT} />
  </g>
);

/** Cartão final da novela. */
export const EndCard: React.FC<{ show: number; next: string; y?: number; title?: string }> = ({ show, next, y = 520, title = "TO BE CONTINUED…" }) =>
  show > 0 ? (
    <g transform={`translate(540 ${y}) scale(${0.85 + 0.15 * show})`} opacity={show}>
      <rect x={-420} y={-110} width={840} height={220} rx={40} fill="#111827" opacity={0.92} />
      <text y={-12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={66} fill="#ffffff">
        {title}
      </text>
      <text y={60} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={Math.min(34, 740 / (next.length * 0.62))} fill={CYAN}>
        {next}
      </text>
    </g>
  ) : null;
