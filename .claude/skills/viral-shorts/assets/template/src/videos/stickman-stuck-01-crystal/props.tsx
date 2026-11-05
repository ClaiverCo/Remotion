import React, { useId } from "react";
import { FONT } from "../../theme";
import { ERAS, LEAD } from "../../stickman";

/**
 * Peças do episódio 1 de "Stuck in 2026" (o relógio de quartzo).
 * Tudo em coordenadas locais; o centro do mostrador / da peça fica em (0, 0).
 */

const OUT = LEAD.colors.outline;
const CYAN = LEAD.colors.halo;
const VIOLET = LEAD.colors.chronoBand;
const RED = "#E05A47";
const STEEL = "#C9D1D9";
const QUARTZ = "#DDF6FB";
const YELLOW = "#F5C542";
const uid = (id: string) => id.replace(/[^a-zA-Z0-9]/g, "");

/** Pílula de texto curto (rótulos ditos na narração). */
export const Pill: React.FC<{ x: number; y: number; text: string; show: number; color?: string; size?: number; fill?: string }> = ({
  x,
  y,
  text,
  show,
  color = "#9AA5B1",
  size = 40,
  fill = "#ffffff",
}) =>
  show > 0 ? (
    <g transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * show})`} opacity={Math.min(1, show)}>
      <rect x={-text.length * size * 0.33 - 24} y={-size * 0.95} width={text.length * size * 0.66 + 48} height={size * 1.7} rx={size * 0.85} fill={fill} stroke={color} strokeWidth={5} />
      <text y={size * 0.33} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={OUT}>
        {text}
      </text>
    </g>
  ) : null;

/**
 * O diapasão de quartzo (o cristal). Base em (0, 0), dentes para cima.
 * `vib` 0..1 = amplitude da vibração; `glow` 0..1 = brilho ciano.
 */
export const TuningFork: React.FC<{ x?: number; y?: number; s?: number; vib?: number; t?: number; glow?: number; dim?: number }> = ({
  x = 0,
  y = 0,
  s = 1,
  vib = 0,
  t = 0,
  glow = 0,
  dim = 0,
}) => {
  const w = Math.sin(t * 95) * 5 * vib;
  const prong = (side: -1 | 1) => `M${side * 9} -6 Q${side * 10} -34 ${side * 9 + side * w} -58`;
  const body = `M-9 -6 Q-9 8 0 8 Q9 8 9 -6`;
  const fill = dim > 0 ? "#B8C2CC" : QUARTZ;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {glow > 0 && <ellipse cy={-24} rx={34} ry={46} fill={CYAN} opacity={0.35 * glow} />}
      {vib > 0 &&
        [-1, 1].map((side) => (
          <path key={side} d={`M${side * 22} -50 q${side * 6} 10 0 20 q${-side * 6} 10 0 20`} fill="none" stroke={CYAN} strokeWidth={2.5} opacity={0.8 * vib} />
        ))}
      {[prong(-1), prong(1), body, "M0 8 L0 26"].map((d, i) => (
        <path key={i} d={d} fill="none" stroke={OUT} strokeWidth={11} strokeLinecap="round" />
      ))}
      {[prong(-1), prong(1), body, "M0 8 L0 26"].map((d, i) => (
        <path key={`f${i}`} d={d} fill="none" stroke={fill} strokeWidth={6} strokeLinecap="round" />
      ))}
    </g>
  );
};

/**
 * Relógio de pulso analógico de quartzo (WATCH-01). Centro do mostrador em (0, 0), raio 30.
 * `sec` = segundos mostrados (o ponteiro vermelho anda 6° por segundo, em passos).
 * `open` 0..1 = tampa de trás aberta, mostrando bateria e cristal; `dusty` = relíquia parada e empoeirada.
 */
export const Watch: React.FC<{
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  dusty?: boolean;
  sec?: number;
  open?: number;
  crystalGlow?: number;
  strap?: boolean;
}> = ({ x = 0, y = 0, scale = 1, rotate = 0, dusty = false, sec = 0, open = 0, crystalGlow = 0, strap = true }) => {
  const R = 30;
  const secA = dusty ? 205 : Math.floor(sec) * 6;
  const strapC = dusty ? "#6B6F76" : "#374151";
  const hand = (deg: number, len: number, w: number, c: string) => (
    <line x1={0} y1={len * 0.18} x2={0} y2={-len} stroke={c} strokeWidth={w} strokeLinecap="round" transform={`rotate(${deg})`} />
  );
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {strap && (
        <>
          <rect x={-13} y={-R - 44} width={26} height={50} rx={6} fill={strapC} stroke={OUT} strokeWidth={4} />
          <rect x={-13} y={R - 6} width={26} height={50} rx={6} fill={strapC} stroke={OUT} strokeWidth={4} />
        </>
      )}
      <circle r={R + 5} fill={dusty ? "#AEB5BD" : STEEL} stroke={OUT} strokeWidth={5} />
      {open < 0.5 ? (
        <>
          <circle r={R - 2} fill={dusty ? "#E7E2D6" : "#ffffff"} stroke={OUT} strokeWidth={2.5} />
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1={0} y1={-R + 4} x2={0} y2={-R + (i % 3 === 0 ? 11 : 8)} stroke={OUT} strokeWidth={i % 3 === 0 ? 3 : 1.6} transform={`rotate(${i * 30})`} />
          ))}
          {hand(300, 15, 4.5, OUT)}
          {hand(62, 22, 3.5, OUT)}
          {hand(secA, 24, 2, RED)}
          <circle r={3} fill={OUT} />
          {dusty && (
            <g opacity={0.9}>
              <path d="M-18 -8 L4 14" stroke="#9A8F7E" strokeWidth={1.6} />
              {[
                [-12, 10],
                [10, -14],
                [16, 8],
                [-4, -20],
                [-20, -4],
              ].map(([a, b], i) => (
                <circle key={i} cx={a} cy={b} r={2.2} fill="#B9AE98" />
              ))}
            </g>
          )}
        </>
      ) : (
        <>
          {/* por dentro: bateria-botão e o cristal */}
          <circle r={R - 2} fill="#E5E9EE" stroke={OUT} strokeWidth={2.5} />
          <circle cx={-9} cy={7} r={12} fill={STEEL} stroke={OUT} strokeWidth={2.5} />
          <rect x={4} y={-20} width={14} height={28} rx={7} fill="#F3F6F8" stroke={OUT} strokeWidth={2} />
          <TuningFork x={11} y={2} s={0.32} glow={crystalGlow} />
        </>
      )}
      {open > 0 && open < 1 && (
        <circle cx={open * 46} cy={-open * 30} r={R + 2} fill={dusty ? "#AEB5BD" : STEEL} stroke={OUT} strokeWidth={4} opacity={1 - Math.max(0, open - 0.6) / 0.4} />
      )}
      {open >= 1 && <ellipse cx={52} cy={-34} rx={R} ry={R * 0.55} fill={dusty ? "#AEB5BD" : STEEL} stroke={OUT} strokeWidth={4} transform="rotate(-30 52 -34)" />}
    </g>
  );
};

/**
 * O Relógio Central de Lumen (CLOCK-01, ficção): um anel flutuante com 12 pontos de luz,
 * um ponteiro de luz ciano e, no centro, uma janela com o mesmo cristal de quartzo.
 * `lag` 0..1 = ponteiro tremendo/atrasando; `stopped` 0..1 = luz apagando.
 */
export const CentralClock: React.FC<{
  x: number;
  y: number;
  r?: number;
  t: number;
  hand?: number;
  lag?: number;
  stopped?: number;
  crystalGlow?: number;
}> = ({ x, y, r = 120, t, hand = 0, lag = 0, stopped = 0, crystalGlow = 0.6 }) => {
  const bob = Math.sin(t * 1.3) * 8 * (1 - stopped);
  const light = 1 - 0.85 * stopped;
  const jitter = lag > 0 ? Math.sin(t * 23) * 4 * lag : 0;
  const dot = (i: number) => {
    const a = (i * 30 * Math.PI) / 180;
    return { x: Math.sin(a) * r * 0.8, y: -Math.cos(a) * r * 0.8 };
  };
  return (
    <g transform={`translate(${x} ${y + bob})`}>
      <ellipse cy={r + 34} rx={r * 0.6} ry={12} fill={CYAN} opacity={0.22 * light} />
      <circle r={r + 18} fill="none" stroke={CYAN} strokeWidth={10} opacity={0.18 * light} />
      <circle r={r} fill="#F4F8FA" stroke={ERAS.future.line} strokeWidth={6} />
      <circle r={r} fill="none" stroke={VIOLET} strokeWidth={3} opacity={0.5 * light} strokeDasharray="6 14" />
      {Array.from({ length: 12 }, (_, i) => {
        const p = dot(i);
        return <circle key={i} cx={p.x} cy={p.y} r={i % 3 === 0 ? 9 : 6} fill={i % 3 === 0 ? VIOLET : CYAN} opacity={0.35 + 0.6 * light} />;
      })}
      <g transform={`rotate(${hand + jitter})`}>
        <line x1={0} y1={0} x2={0} y2={-r * 0.7} stroke={CYAN} strokeWidth={14} strokeLinecap="round" opacity={0.3 * light} />
        <line x1={0} y1={0} x2={0} y2={-r * 0.7} stroke={light > 0.5 ? CYAN : "#9AA5B1"} strokeWidth={6} strokeLinecap="round" />
      </g>
      {/* janela central com o cristal */}
      <circle r={r * 0.32} fill="#ffffff" stroke={ERAS.future.line} strokeWidth={4} />
      <TuningFork y={r * 0.12} s={r / 260} glow={crystalGlow * light} dim={stopped > 0.6 ? 1 : 0} />
    </g>
  );
};

/** Pedestal flutuante de luz (Lumen) onde a relíquia fica. Topo em (x, y). */
export const LightPedestal: React.FC<{ x: number; y: number; t: number; lit?: number }> = ({ x, y, t, lit = 1 }) => {
  const b = Math.sin(t * 1.6) * 5;
  return (
    <g transform={`translate(${x} ${y + b})`}>
      <path d="M-70 0 L70 0 L44 34 L-44 34 Z" fill="#E3ECF2" stroke={ERAS.future.line} strokeWidth={4} strokeLinejoin="round" />
      <ellipse rx={70} ry={12} fill="#F4F8FA" stroke={ERAS.future.line} strokeWidth={4} />
      <ellipse cy={60} rx={40} ry={8} fill={CYAN} opacity={0.3 * lit} />
      <path d="M-50 0 L-30 -150 L30 -150 L50 0 Z" fill={CYAN} opacity={0.08 * lit} />
    </g>
  );
};

/** Faíscas saindo de um ponto (p 0..1). */
export const Sparks: React.FC<{ x: number; y: number; p: number; r?: number; color?: string; n?: number }> = ({ x, y, p, r = 70, color = YELLOW, n = 9 }) => {
  if (p <= 0 || p >= 1) return null;
  return (
    <g transform={`translate(${x} ${y})`} opacity={1 - p}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + i * 0.7;
        const r0 = r * 0.25 + r * p * 0.6;
        const r1 = r0 + r * 0.35;
        return (
          <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1} stroke={i % 3 === 0 ? VIOLET : color} strokeWidth={7} strokeLinecap="round" />
        );
      })}
    </g>
  );
};

/** Fio com pulsos de energia correndo (p 0..1 = quanto do fio já está energizado). */
const Wire: React.FC<{ d: string; p: number; t: number; color?: string }> = ({ d, p, t, color = YELLOW }) => (
  <g>
    <path d={d} fill="none" stroke={OUT} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke="#9AA5B1" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    {p > 0 && (
      <>
        <path d={d} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} />
        <path d={d} fill="none" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray="0.03 0.09" strokeDashoffset={-t * 0.6} opacity={0.9 * Math.min(1, p * 3)} />
      </>
    )}
  </g>
);

/**
 * Corte do relógio (clipe 4): bateria-botão → chip → cápsula do cristal → motor de passo.
 * Centro em (x, y), raio 330.
 */
export const WatchCutaway: React.FC<{
  x: number;
  y: number;
  t: number;
  power: number;
  flow: number;
  vib: number;
  zoomFork: number;
  show?: { battery: number; voltage: number; quartz: number };
  /** tradutor dos rótulos (pacote de idioma) */
  tr?: (s: string) => string;
}> = ({ x, y, t, power, flow, vib, zoomFork, show = { battery: 0, voltage: 0, quartz: 0 }, tr = (s) => s }) => {
  const id = uid(useId());
  const R = 330;
  const bat = { x: -150, y: 110 };
  const chip = { x: 40, y: 80 };
  const cap = { x: 170, y: -110 };
  const motor = { x: -120, y: -150 };
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={R + 22} fill={STEEL} stroke={OUT} strokeWidth={8} />
      <circle r={R} fill="#EEF1F4" stroke={OUT} strokeWidth={4} />
      <clipPath id={`wc${id}`}>
        <circle r={R} />
      </clipPath>
      <g clipPath={`url(#wc${id})`}>
        {/* placa */}
        <path d={`M${-R} 40 Q0 0 ${R} 30 L${R} ${R} L${-R} ${R} Z`} fill="#D7E6D9" opacity={0.6} />
        <Wire d={`M${bat.x + 70} ${bat.y - 20} L${chip.x - 60} ${chip.y - 10}`} p={ramp01(flow * 3)} t={t} />
        <Wire d={`M${chip.x + 50} ${chip.y - 50} L${cap.x} ${cap.y + 100}`} p={ramp01(flow * 3 - 1)} t={t} />
        <Wire d={`M${chip.x - 30} ${chip.y - 60} Q${chip.x - 60} ${motor.y + 20} ${motor.x + 60} ${motor.y + 10}`} p={0} t={t} />
        {/* bateria-botão */}
        <g transform={`translate(${bat.x} ${bat.y})`}>
          {power > 0 && <circle r={110} fill={YELLOW} opacity={0.25 * power} />}
          <circle r={88} fill={STEEL} stroke={OUT} strokeWidth={6} />
          <circle r={66} fill="#E5E9EE" stroke={OUT} strokeWidth={3} />
          <path d="M-18 0 L18 0 M0 -18 L0 18" stroke={OUT} strokeWidth={7} strokeLinecap="round" />
        </g>
        {/* chip */}
        <g transform={`translate(${chip.x} ${chip.y})`}>
          {Array.from({ length: 5 }, (_, i) => (
            <g key={i}>
              <rect x={-58} y={-40 + i * 18} width={12} height={6} fill="#9AA5B1" />
              <rect x={46} y={-40 + i * 18} width={12} height={6} fill="#9AA5B1" />
            </g>
          ))}
          <rect x={-48} y={-50} width={96} height={100} rx={10} fill="#1F2937" stroke={OUT} strokeWidth={4} />
          <circle cx={-30} cy={-32} r={5} fill="#4B5563" />
        </g>
        {/* motor de passo + engrenagem */}
        <g transform={`translate(${motor.x} ${motor.y})`}>
          <rect x={-70} y={-26} width={120} height={52} rx={12} fill="#D9825B" stroke={OUT} strokeWidth={4} />
          {Array.from({ length: 9 }, (_, i) => (
            <line key={i} x1={-58 + i * 13} y1={-24} x2={-58 + i * 13} y2={24} stroke="#A85A36" strokeWidth={4} />
          ))}
          <g transform={`translate(110 -40)`}>
            {Array.from({ length: 10 }, (_, i) => (
              <rect key={i} x={-7} y={-54} width={14} height={20} fill="#BFC7CF" stroke={OUT} strokeWidth={3} transform={`rotate(${i * 36})`} />
            ))}
            <circle r={40} fill="#BFC7CF" stroke={OUT} strokeWidth={4} />
            <circle r={9} fill={OUT} />
          </g>
        </g>
        {/* cápsula do cristal */}
        <g transform={`translate(${cap.x} ${cap.y})`}>
          <rect x={-46} y={-130} width={92} height={240} rx={46} fill="#F7FAFB" stroke={OUT} strokeWidth={5} />
          <TuningFork y={60} s={2.6} vib={vib} t={t} glow={Math.max(vib, show.quartz)} />
        </g>
      </g>
      {/* lupa no diapasão */}
      {zoomFork > 0 && (
        <g transform={`translate(${cap.x} ${cap.y - 40})`} opacity={Math.min(1, zoomFork * 1.5)}>
          <circle r={50 + 30 * zoomFork} fill="none" stroke={CYAN} strokeWidth={6} strokeDasharray="14 10" />
        </g>
      )}
      <Pill x={bat.x} y={bat.y + 140} text={tr("battery")} show={show.battery} color={YELLOW} size={38} />
      <Pill x={-10} y={-20} text={tr("voltage")} show={show.voltage} color={YELLOW} size={34} />
      <Pill x={cap.x - 10} y={cap.y - 170} text={tr("quartz")} show={show.quartz} color={CYAN} size={38} />
    </g>
  );
};

const ramp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Valores da cadeia de divisão: 32 768 → 1 (16 caixas, 15 divisões). */
export const HALVES = Array.from({ length: 16 }, (_, i) => 2 ** (15 - i));
const fmt = (n: number, locale = "en-US") => n.toLocaleString(locale);

/**
 * Cadeia de 16 caixas em zigue-zague (4 × 4): cada uma é a metade da anterior.
 * `lit` 0..16 = quantas caixas já acenderam (fracionário = a próxima está entrando).
 */
export const HalvingChain: React.FC<{ x: number; y: number; lit: number; final: number; locale?: string }> = ({ x, y, lit, final, locale }) => {
  const W = 196;
  const H = 92;
  const GX = 34;
  const GY = 48;
  const pos = (i: number) => {
    const row = Math.floor(i / 4);
    const k = i % 4;
    const col = row % 2 === 0 ? k : 3 - k;
    return { x: col * (W + GX), y: row * (H + GY) };
  };
  return (
    <g transform={`translate(${x} ${y})`}>
      {HALVES.map((v, i) => {
        const p = ramp01(lit - i);
        if (p <= 0) return null;
        const a = pos(i);
        const last = i === HALVES.length - 1;
        const next = i < HALVES.length - 1 ? pos(i + 1) : null;
        const pNext = ramp01(lit - i - 1);
        return (
          <g key={i}>
            {next && pNext > 0 && (
              <g opacity={pNext}>
                {next.y === a.y ? (
                  <path
                    d={next.x > a.x ? `M${a.x + W + 6} ${a.y + H / 2} l${GX - 12} 0 m-10 -10 l10 10 l-10 10` : `M${a.x - 6} ${a.y + H / 2} l${-(GX - 12)} 0 m10 -10 l-10 10 l10 10`}
                    fill="none"
                    stroke="#9AA5B1"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path d={`M${a.x + W / 2} ${a.y + H + 6} l0 ${GY - 12} m-10 -10 l10 10 l10 -10`} fill="none" stroke="#9AA5B1" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
                )}
              </g>
            )}
            <g transform={`translate(${a.x + W / 2} ${a.y + H / 2}) scale(${0.6 + 0.4 * p + (last ? 0.12 * final : 0)})`} opacity={p}>
              {last && final > 0 && <rect x={-W / 2 - 16} y={-H / 2 - 16} width={W + 32} height={H + 32} rx={30} fill={YELLOW} opacity={0.35 * final} />}
              <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={20} fill={last ? (final > 0 ? "#FFF4CC" : "#ffffff") : i === 0 ? "#E0F7FA" : "#ffffff"} stroke={last ? YELLOW : i === 0 ? CYAN : "#9AA5B1"} strokeWidth={5} />
              <text y={15} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={v >= 10000 ? 40 : 46} fill={OUT}>
                {fmt(v, locale)}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};

/** Motor de passo pequeno com o pulso chegando (clipe 5). Centro em (x, y). */
export const StepMotor: React.FC<{ x: number; y: number; pulse: number }> = ({ x, y, pulse }) => (
  <g transform={`translate(${x} ${y})`}>
    {pulse > 0 && <rect x={-96} y={-52} width={192} height={104} rx={30} fill={YELLOW} opacity={0.35 * pulse} />}
    <rect x={-80} y={-36} width={160} height={72} rx={16} fill="#D9825B" stroke={OUT} strokeWidth={5} />
    {Array.from({ length: 11 }, (_, i) => (
      <line key={i} x1={-66 + i * 13} y1={-34} x2={-66 + i * 13} y2={34} stroke="#A85A36" strokeWidth={4} />
    ))}
  </g>
);
