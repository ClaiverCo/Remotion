import React, { useId } from "react";
import { getLength, getPointAtLength, getTangentAtLength } from "@remotion/paths";
import { interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { shade, useIdle, useTime } from "../../lib/anim";
import { COLORS, FONT, SPRING } from "../../theme";

/**
 * Primitivas 2.5D em SVG (espaço 1080×1920). Tudo tem "profundidade falsa":
 * faces de topo/lado sombreadas na direção DEPTH, como uma maquete 3D vista de lado.
 */

/** Direção da profundidade (para cima e para a direita). */
export const DEPTH = { x: 0.62, y: -0.5 };

const uid = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "");

/** Palco SVG em tela cheia. Coloque as primitivas dentro dele. */
export const Stage: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg
    width={1080}
    height={1920}
    viewBox="0 0 1080 1920"
    style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}
  >
    {children}
  </svg>
);

/** Fundo de maquete: parede com painéis, piso e (opcional) corte do solo. */
export const Backdrop: React.FC<{
  floorY?: number;
  soilTo?: number;
  wall?: string;
  panels?: boolean;
}> = ({ floorY = 1080, soilTo = 1920, wall = COLORS.wall, panels = true }) => {
  const id = uid(useId());
  return (
    <g>
      <defs>
        <linearGradient id={`wall${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(wall, 0.25)} />
          <stop offset="1" stopColor={wall} />
        </linearGradient>
        <linearGradient id={`soil${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.soil} />
          <stop offset="1" stopColor={COLORS.soilDark} />
        </linearGradient>
      </defs>
      <rect x={-600} y={-600} width={2280} height={floorY + 600} fill={`url(#wall${id})`} />
      {panels &&
        Array.from({ length: 16 }).map((_, i) => (
          <rect key={i} x={-600 + i * 150} y={-600} width={4} height={floorY + 600} fill={COLORS.wallLine} />
        ))}
      {/* piso: laje com espessura */}
      <rect x={-600} y={floorY - 40} width={2280} height={40} fill={COLORS.floor} />
      <rect x={-600} y={floorY} width={2280} height={14} fill={shade(COLORS.floor, -0.12)} />
      <rect x={-600} y={floorY + 14} width={2280} height={soilTo - floorY + 600} fill={`url(#soil${id})`} />
    </g>
  );
};

/** Bloco (caixa) com topo e lateral sombreados. */
export const Block: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  depth?: number;
  color?: string;
  stroke?: boolean;
  opacity?: number;
}> = ({ x, y, w, h, depth = 50, color = COLORS.sand, stroke = true, opacity = 1 }) => {
  const dx = DEPTH.x * depth;
  const dy = DEPTH.y * depth;
  const edge = stroke ? shade(color, -0.3) : "none";
  return (
    <g opacity={opacity} strokeLinejoin="round" strokeWidth={2} stroke={edge}>
      <polygon points={`${x},${y} ${x + dx},${y + dy} ${x + w + dx},${y + dy} ${x + w},${y}`} fill={shade(color, 0.14)} />
      <polygon points={`${x + w},${y} ${x + w + dx},${y + dy} ${x + w + dx},${y + h + dy} ${x + w},${y + h}`} fill={shade(color, -0.18)} />
      <rect x={x} y={y} width={w} height={h} fill={color} />
    </g>
  );
};

/** Extrusão de qualquer forma SVG (path `d`): empilha cópias escuras atrás da face. */
export const Extrude: React.FC<{
  d: string;
  depth?: number;
  color?: string;
  steps?: number;
  stroke?: boolean;
}> = ({ d, depth = 40, color = COLORS.sand, steps = 14, stroke = true }) => {
  const dx = DEPTH.x * depth;
  const dy = DEPTH.y * depth;
  const side = shade(color, -0.2);
  return (
    <g strokeLinejoin="round">
      {Array.from({ length: steps }).map((_, i) => {
        const k = 1 - i / steps;
        return <path key={i} d={d} transform={`translate(${dx * k} ${dy * k})`} fill={side} />;
      })}
      <path d={d} fill={color} stroke={stroke ? shade(color, -0.3) : "none"} strokeWidth={2} />
    </g>
  );
};

/** Cano com contorno, parede e "miolo", que pode encher de líquido e mostrar fluxo. */
export const Pipe: React.FC<{
  d: string;
  width?: number;
  color?: string;
  outline?: string;
  /** trecho com líquido, de 0 a 1 ao longo do cano */
  fill?: { from?: number; to: number; color?: string };
  /** velocidade do fluxo (comprimentos de cano por segundo); 0 = parado */
  flow?: number;
  /** traço dos "pedacinhos" que correm no fluxo */
  flowColor?: string;
  /** cor do miolo (interior vazio) */
  innerColor?: string;
  opacity?: number;
}> = ({ d, width = 56, color = COLORS.pipe, outline = COLORS.pipeOutline, fill, flow = 0, flowColor = COLORS.waterFoam, innerColor = COLORS.pipeDark, opacity = 1 }) => {
  const t = useTime();
  const inner = width - 16;
  const from = fill?.from ?? 0;
  const to = fill?.to ?? 0;
  const common = { fill: "none", strokeLinejoin: "round" as const, strokeLinecap: "butt" as const };
  return (
    <g opacity={opacity}>
      <path d={d} {...common} stroke={outline} strokeWidth={width + 16} />
      <path d={d} {...common} stroke={color} strokeWidth={width} />
      <path d={d} {...common} stroke={innerColor} strokeWidth={inner} />
      {fill && to > from && (
        <path
          d={d}
          {...common}
          pathLength={1}
          stroke={fill.color ?? COLORS.water}
          strokeWidth={inner}
          strokeDasharray={`${to - from} 2`}
          strokeDashoffset={-from}
        />
      )}
      {fill && flow !== 0 && to > from && (
        <path
          d={d}
          {...common}
          pathLength={1}
          stroke={flowColor}
          strokeOpacity={0.7}
          strokeWidth={inner * 0.28}
          strokeLinecap="round"
          strokeDasharray="0.02 0.07"
          strokeDashoffset={-t * flow}
        />
      )}
    </g>
  );
};

/** Coloca um elemento num ponto de um path (0 a 1), opcionalmente girado na direção do path. */
export const AlongPath: React.FC<{
  d: string;
  progress: number;
  rotate?: boolean;
  children: React.ReactNode;
}> = ({ d, progress, rotate = false, children }) => {
  const len = getLength(d);
  const at = Math.max(0, Math.min(1, progress)) * len;
  const p = getPointAtLength(d, at) ?? { x: 0, y: 0 };
  const tan = getTangentAtLength(d, at) ?? { x: 1, y: 0 };
  const angle = (Math.atan2(tan.y, tan.x) * 180) / Math.PI;
  return <g transform={`translate(${p.x} ${p.y})${rotate ? ` rotate(${angle})` : ""}`}>{children}</g>;
};

/** Líquido dentro de uma forma (clip), com superfície ondulando no nível `level` (y). */
export const Liquid: React.FC<{
  clip: string;
  level: number;
  x0?: number;
  x1?: number;
  color?: string;
  wave?: number;
  bottom?: number;
}> = ({ clip, level, x0 = -200, x1 = 1280, color = COLORS.water, wave = 8, bottom = 2400 }) => {
  const id = uid(useId());
  const t = useTime();
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += 20) {
    const y = level + Math.sin(x / 60 + t * 4) * wave + Math.sin(x / 23 - t * 6) * wave * 0.35;
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return (
    <g>
      <defs>
        <clipPath id={`lq${id}`}>
          <path d={clip} />
        </clipPath>
        <linearGradient id={`lg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(color, 0.25)} />
          <stop offset="0.25" stopColor={color} />
          <stop offset="1" stopColor={shade(color, -0.25)} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#lq${id})`}>
        <polygon points={`${x0},${bottom} ${pts.join(" ")} ${x1},${bottom}`} fill={`url(#lg${id})`} />
        <polyline points={pts.join(" ")} fill="none" stroke={COLORS.waterFoam} strokeWidth={5} strokeOpacity={0.8} />
      </g>
    </g>
  );
};

/** Partículas determinísticas (gás, bolhas, poeira, gotas) que nascem numa área e se movem. */
export const Particles: React.FC<{
  seed: string;
  count?: number;
  area: { x: number; y: number; w: number; h: number };
  velocity?: { x: number; y: number };
  life?: number;
  size?: [number, number];
  color?: string;
  opacity?: number;
  wobble?: number;
  blur?: number;
  /** 0 a 1: quantidade visível (anime para "ligar/desligar") */
  intensity?: number;
}> = ({
  seed,
  count = 24,
  area,
  velocity = { x: 0, y: -120 },
  life = 2.4,
  size = [10, 30],
  color = COLORS.gas,
  opacity = 0.6,
  wobble = 18,
  blur = 0,
  intensity = 1,
}) => {
  const id = uid(useId());
  const t = useTime();
  return (
    <g filter={blur ? `url(#pb${id})` : undefined}>
      {blur > 0 && (
        <defs>
          <filter id={`pb${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={blur} />
          </filter>
        </defs>
      )}
      {Array.from({ length: count }).map((_, i) => {
        if (i / count > intensity) return null;
        const r0 = random(`${seed}-${i}-a`);
        const r1 = random(`${seed}-${i}-b`);
        const r2 = random(`${seed}-${i}-c`);
        const age = (t + r0 * life) % life;
        const p = age / life;
        const x = area.x + r1 * area.w + velocity.x * age + Math.sin(age * 3 + r2 * 6) * wobble;
        const y = area.y + r2 * area.h + velocity.y * age;
        const s = size[0] + (size[1] - size[0]) * (0.4 + 0.6 * p) * (0.6 + r0 * 0.4);
        const o = opacity * interpolate(p, [0, 0.15, 0.75, 1], [0, 1, 0.8, 0]);
        return <circle key={i} cx={x} cy={y} r={s} fill={color} opacity={o} />;
      })}
    </g>
  );
};

/** Seta desenhada ao longo de um path (progress 0→1), com ponta. */
export const Arrow: React.FC<{
  d: string;
  progress: number;
  color?: string;
  width?: number;
  head?: number;
  dashed?: boolean;
}> = ({ d, progress, color = COLORS.danger, width = 14, head = 34, dashed = false }) => {
  const t = useTime();
  const p = Math.max(0.001, Math.min(1, progress));
  const len = getLength(d);
  const end = getPointAtLength(d, p * len) ?? { x: 0, y: 0 };
  const tan = getTangentAtLength(d, p * len) ?? { x: 1, y: 0 };
  const ang = Math.atan2(tan.y, tan.x);
  const hx = (a: number, r: number) => end.x + Math.cos(ang + a) * r;
  const hy = (a: number, r: number) => end.y + Math.sin(ang + a) * r;
  return (
    <g opacity={progress <= 0 ? 0 : 1}>
      <path
        d={d}
        fill="none"
        stroke={COLORS.white}
        strokeWidth={width + 10}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={`${p} 2`}
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={dashed ? undefined : `${p} 2`}
        style={dashed ? { strokeDasharray: "18 16", strokeDashoffset: -t * 60 } : undefined}
      />
      <polygon
        points={`${hx(0, head * 0.35)},${hy(0, head * 0.35)} ${hx(2.5, head)},${hy(2.5, head)} ${hx(-2.5, head)},${hy(-2.5, head)}`}
        fill={color}
        stroke={COLORS.white}
        strokeWidth={5}
        strokeLinejoin="round"
      />
    </g>
  );
};

/** Rótulo (pílula) com linha guia até um ponto. Entra com pop após `delay` segundos. */
export const Label: React.FC<{
  x: number;
  y: number;
  text: string;
  to?: { x: number; y: number };
  delay?: number;
  color?: string;
  textColor?: string;
  size?: number;
}> = ({ x, y, text, to, delay = 0, color = COLORS.white, textColor = COLORS.ink, size = 44 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay * fps, fps, config: SPRING.pop });
  const w = text.length * size * 0.66 + size * 1.1;
  const h = size * 1.55;
  return (
    <g opacity={Math.min(1, s * 2)}>
      {to && (
        <>
          <line
            x1={x}
            y1={y}
            x2={interpolate(s, [0, 1], [x, to.x])}
            y2={interpolate(s, [0, 1], [y, to.y])}
            stroke={COLORS.ink}
            strokeWidth={5}
            strokeLinecap="round"
          />
          <circle cx={to.x} cy={to.y} r={11 * s} fill={COLORS.ink} stroke={COLORS.white} strokeWidth={4} />
        </>
      )}
      <g transform={`translate(${x} ${y}) scale(${interpolate(s, [0, 1], [0.4, 1])})`}>
        <rect x={-w / 2} y={-h / 2 + 7} width={w} height={h} rx={h / 2} fill={shade(color, -0.35)} />
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={color} stroke={COLORS.ink} strokeWidth={5} />
        <text
          x={0}
          y={size * 0.36}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={900}
          fontSize={size}
          fill={textColor}
          style={{ textTransform: "uppercase" }}
        >
          {text.toUpperCase()}
        </text>
      </g>
    </g>
  );
};

/** Número que conta de `from` até `to` entre `start` e `end` segundos. */
export const Counter: React.FC<{
  x: number;
  y: number;
  from?: number;
  to: number;
  start?: number;
  end?: number;
  decimals?: number;
  suffix?: string;
  size?: number;
  color?: string;
}> = ({ x, y, from = 0, to, start = 0, end = 1, decimals = 0, suffix = "", size = 120, color = COLORS.ink }) => {
  const t = useTime();
  const v = interpolate(t, [start, end], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily={FONT}
      fontWeight={900}
      fontSize={size}
      fill={color}
      stroke={COLORS.white}
      strokeWidth={size * 0.12}
      paintOrder="stroke"
    >
      {v.toFixed(decimals).replace(".", ",")}
      {suffix}
    </text>
  );
};

/**
 * Mascote original (não copie personagens de terceiros!).
 * Corpo em cápsula, olhos grandes que piscam, humor muda a boca/sobrancelha.
 */
export const Character: React.FC<{
  x: number;
  y: number;
  scale?: number;
  mood?: "neutro" | "feliz" | "surpreso" | "nojo" | "pensando";
  shirt?: string;
  skin?: string;
  look?: number;
  flip?: boolean;
}> = ({ x, y, scale = 1, mood = "neutro", shirt = "#3d7bd9", skin = "#f1c7a0", look = 0, flip = false }) => {
  const t = useTime();
  const bob = useIdle(6, 1.8);
  const blinkPhase = (t + 0.7) % 3.2;
  const eyeH = blinkPhase < 0.12 ? 2 : 22;
  const mouth = {
    neutro: <path d="M-18 40 Q0 48 18 40" stroke={COLORS.ink} strokeWidth={6} fill="none" strokeLinecap="round" />,
    feliz: <path d="M-24 34 Q0 62 24 34 Z" fill={COLORS.ink} />,
    surpreso: <ellipse cx={0} cy={44} rx={12} ry={16} fill={COLORS.ink} />,
    nojo: <path d="M-22 46 Q-10 34 0 44 Q10 54 22 40" stroke={COLORS.ink} strokeWidth={6} fill="none" strokeLinecap="round" />,
    pensando: <path d="M-14 44 L16 40" stroke={COLORS.ink} strokeWidth={6} strokeLinecap="round" />,
  }[mood];
  const brow = mood === "surpreso" ? -14 : mood === "nojo" ? 6 : 0;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${flip ? -scale : scale} ${scale})`}>
      <ellipse cx={0} cy={250} rx={90} ry={16} fill="#000" opacity={0.15} />
      {/* corpo */}
      <rect x={-70} y={60} width={140} height={180} rx={60} fill={shirt} stroke={COLORS.ink} strokeWidth={6} />
      <circle cx={-78} cy={150} r={22} fill={skin} stroke={COLORS.ink} strokeWidth={6} />
      <circle cx={78} cy={150} r={22} fill={skin} stroke={COLORS.ink} strokeWidth={6} />
      {/* cabeça */}
      <circle cx={0} cy={0} r={86} fill={skin} stroke={COLORS.ink} strokeWidth={6} />
      <path d="M-80 -20 Q-70 -96 0 -92 Q72 -96 82 -24 Q40 -58 -80 -20 Z" fill="#3b2a20" />
      {/* olhos */}
      {[-30, 30].map((ex) => (
        <g key={ex}>
          <ellipse cx={ex} cy={-4} rx={18} ry={eyeH} fill={COLORS.white} stroke={COLORS.ink} strokeWidth={5} />
          {eyeH > 4 && <circle cx={ex + look * 7} cy={-2} r={8} fill={COLORS.ink} />}
          <path d={`M${ex - 18} ${-34 + brow} L${ex + 18} ${-34 - (ex > 0 ? 1 : -1) * (mood === "nojo" ? 6 : 0)}`} stroke={COLORS.ink} strokeWidth={6} strokeLinecap="round" />
        </g>
      ))}
      {mouth}
    </g>
  );
};
