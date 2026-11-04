import React, { useId } from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useTime } from "../lib/anim";
import { FONT, SPRING } from "../theme";
import { ERAS, LEAD } from "./bible";

/** Linha do chão das cenas Stickman (deixa a faixa da legenda, y≈1250–1420, livre). */
export const GROUND_Y = 1180;

const uid = (id: string) => id.replace(/[^a-zA-Z0-9]/g, "");
const F = ERAS.future;
const N = ERAS.present;

// ---------------------------------------------------------------------------
// FUTURO (planeta Lumen) — off-white frio, curvas limpas, luz ciano/violeta
// ---------------------------------------------------------------------------

export const FutureBackdrop: React.FC<{ variant?: "city" | "home" | "museum"; groundY?: number }> = ({
  variant = "city",
  groundY = GROUND_Y,
}) => {
  const id = uid(useId());
  const t = useTime();
  const [c1, c2] = F.accents;
  return (
    <g>
      <defs>
        <linearGradient id={`fsky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6F9FB" />
          <stop offset="1" stopColor={F.background} />
        </linearGradient>
        <linearGradient id={`fground${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={F.backgroundDeep} />
          <stop offset="1" stopColor="#CFDCE6" />
        </linearGradient>
      </defs>
      <rect x={-800} y={-800} width={2680} height={groundY + 800} fill={`url(#fsky${id})`} />
      {variant === "city" && (
        <g>
          {[
            [60, 520, 120, 900],
            [210, 380, 150, 1040],
            [400, 600, 110, 820],
            [560, 300, 170, 1120],
            [760, 480, 130, 940],
            [920, 360, 150, 1060],
          ].map(([x, top, w], i) => (
            <g key={i}>
              <rect x={x} y={top} width={w} height={groundY - top} rx={w / 2} fill="#E3ECF2" stroke={F.line} strokeWidth={3} />
              <rect x={x + w / 2 - 4} y={top + 60} width={8} height={groundY - top - 120} rx={4} fill={i % 2 ? c1 : c2} opacity={0.35} />
            </g>
          ))}
          {/* plataformas flutuantes */}
          {[
            [180, 760, 0],
            [740, 680, 1.3],
          ].map(([x, y, ph], i) => (
            <g key={i} transform={`translate(${x} ${y + Math.sin(t * 1.2 + ph) * 8})`}>
              <ellipse rx={90} ry={14} fill="#F4F8FA" stroke={F.line} strokeWidth={3} />
              <ellipse cy={22} rx={50} ry={6} fill={c1} opacity={0.25} />
            </g>
          ))}
          {/* trilhos de luz */}
          <path d={`M-100 ${groundY - 260} Q540 ${groundY - 360} 1180 ${groundY - 240}`} fill="none" stroke={c1} strokeWidth={4} opacity={0.5} strokeDasharray="30 22" strokeDashoffset={-t * 80} />
        </g>
      )}
      {variant === "home" && (
        <g>
          <rect x={60} y={260} width={960} height={groundY - 260} rx={60} fill="#F2F6F9" stroke={F.line} strokeWidth={3} />
          {/* painel de luz flutuante (sem texto) */}
          <g transform={`translate(640 ${560 + Math.sin(t * 1.5) * 6})`}>
            <rect x={-170} y={-110} width={340} height={220} rx={26} fill={c1} opacity={0.14} stroke={c1} strokeWidth={3} />
            <rect x={-130} y={-70} width={170} height={12} rx={6} fill={c1} opacity={0.5} />
            <rect x={-130} y={-40} width={240} height={12} rx={6} fill={c1} opacity={0.3} />
            <circle cx={90} cy={50} r={34} fill="none" stroke={c2} strokeWidth={5} opacity={0.6} />
          </g>
          {/* porta que reconhece quem chega: arco + anel scanner */}
          <path d={`M120 ${groundY} L120 620 Q120 520 220 520 Q320 520 320 620 L320 ${groundY} Z`} fill="#E6EEF4" stroke={F.line} strokeWidth={3} />
          <circle cx={220} cy={600} r={22} fill="none" stroke={c1} strokeWidth={5} opacity={0.4 + 0.3 * Math.sin(t * 3)} />
        </g>
      )}
      {variant === "museum" && (
        <g>
          <rect x={40} y={240} width={1000} height={groundY - 240} rx={40} fill="#F1F5F8" stroke={F.line} strokeWidth={3} />
          {[220, 860].map((x) => (
            <g key={x}>
              <rect x={x - 70} y={groundY - 220} width={140} height={220} rx={12} fill="#E4ECF2" stroke={F.line} strokeWidth={3} />
              <path d={`M${x - 70} ${groundY - 220} Q${x} ${groundY - 400} ${x + 70} ${groundY - 220}`} fill={c1} opacity={0.08} stroke={c1} strokeWidth={3} />
            </g>
          ))}
        </g>
      )}
      {/* chão */}
      <rect x={-800} y={groundY} width={2680} height={1600} fill={`url(#fground${id})`} />
      <line x1={-800} y1={groundY} x2={1880} y2={groundY} stroke={F.line} strokeWidth={4} />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={-800} y1={groundY + 40 + i * i * 30} x2={1880} y2={groundY + 40 + i * i * 30} stroke={F.line} strokeWidth={2} opacity={0.5} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// PRESENTE ("os velhos tempos", anos 2020) — off-white quente, formas familiares
// ---------------------------------------------------------------------------

const House: React.FC<{ x: number; w: number; h: number; groundY: number; color: string; door?: boolean }> = ({ x, w, h, groundY, color, door = true }) => (
  <g stroke={N.line} strokeWidth={3} strokeLinejoin="round">
    <rect x={x} y={groundY - h} width={w} height={h} fill={color} />
    <polygon points={`${x - 14},${groundY - h} ${x + w / 2},${groundY - h - w * 0.45} ${x + w + 14},${groundY - h}`} fill="#C98F72" />
    <rect x={x + w * 0.15} y={groundY - h + 40} width={w * 0.28} height={w * 0.24} fill="#F9F3E8" />
    <rect x={x + w * 0.57} y={groundY - h + 40} width={w * 0.28} height={w * 0.24} fill="#F9F3E8" />
    {door && <rect x={x + w * 0.38} y={groundY - h * 0.45} width={w * 0.24} height={h * 0.45} fill="#A87452" />}
  </g>
);

export const PresentBackdrop: React.FC<{
  variant?: "street" | "doorstep" | "home" | "shop";
  groundY?: number;
  /** doorstep: desenha a porta fixa (false = a cena desenha a sua, ex.: uma porta que abre) */
  door?: boolean;
}> = ({ variant = "street", groundY = GROUND_Y, door = true }) => {
  const id = uid(useId());
  return (
    <g>
      <defs>
        <linearGradient id={`psky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBF6EE" />
          <stop offset="1" stopColor={N.background} />
        </linearGradient>
      </defs>
      <rect x={-800} y={-800} width={2680} height={groundY + 800} fill={`url(#psky${id})`} />
      {variant === "street" && (
        <g>
          <House x={40} w={260} h={360} groundY={groundY} color="#EBD9C2" />
          <House x={380} w={300} h={420} groundY={groundY} color="#E7CDB4" />
          <House x={760} w={260} h={340} groundY={groundY} color="#EADFCB" />
          {/* poste e árvore */}
          <g stroke={N.line} strokeWidth={4}>
            <line x1={330} y1={groundY} x2={330} y2={groundY - 330} />
            <path d={`M330 ${groundY - 330} Q360 ${groundY - 350} 380 ${groundY - 320}`} fill="none" />
          </g>
          <circle cx={720} cy={groundY - 300} r={70} fill="#B7C29C" stroke={N.line} strokeWidth={3} opacity={0.9} />
          <rect x={712} y={groundY - 240} width={16} height={240} fill="#B08E6E" />
        </g>
      )}
      {variant === "doorstep" && (
        <g stroke={N.line} strokeWidth={3}>
          <rect x={-100} y={200} width={1280} height={groundY - 200} fill="#EAD8C1" />
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={i} x1={-100} y1={260 + i * 70} x2={1180} y2={260 + i * 70} opacity={0.35} />
          ))}
          {/* porta da frente com maçaneta e fechadura */}
          {door && (
            <>
              <rect x={560} y={groundY - 640} width={330} height={640} rx={8} fill="#A87452" />
              <rect x={590} y={groundY - 610} width={270} height={250} rx={6} fill="none" stroke="#8D5F42" strokeWidth={5} />
              <rect x={590} y={groundY - 330} width={270} height={300} rx={6} fill="none" stroke="#8D5F42" strokeWidth={5} />
              <circle cx={600} cy={groundY - 330} r={14} fill="#D9B44A" stroke="#7A5A2A" strokeWidth={4} />
              <rect x={590} y={groundY - 300} width={22} height={40} rx={8} fill="#D9B44A" stroke="#7A5A2A" strokeWidth={3} />
              <rect x={520} y={groundY - 12} width={410} height={24} fill="#CDB9A0" />
            </>
          )}
        </g>
      )}
      {variant === "home" && (
        <g stroke={N.line} strokeWidth={3}>
          <rect x={-100} y={220} width={1280} height={groundY - 220} fill="#F1E4D2" />
          <rect x={120} y={360} width={260} height={200} fill="#F9F3E8" />
          <rect x={560} y={groundY - 220} width={420} height={140} rx={30} fill="#C9A98B" />
          <rect x={540} y={groundY - 300} width={460} height={110} rx={36} fill="#D6B99B" />
        </g>
      )}
      {variant === "shop" && (
        <g stroke={N.line} strokeWidth={3}>
          <rect x={-100} y={220} width={1280} height={groundY - 220} fill="#F3E7D6" />
          {[420, 600, 780].map((y) => (
            <g key={y}>
              <rect x={60} y={y} width={560} height={14} fill="#C9A98B" />
              {Array.from({ length: 6 }).map((_, i) => (
                <rect key={i} x={80 + i * 90} y={y - 70} width={60} height={70} rx={6} fill={["#E6B87A", "#D9825B", "#9DB08A"][(i + y) % 3]} />
              ))}
            </g>
          ))}
          <rect x={680} y={groundY - 260} width={360} height={260} fill="#D6B99B" />
        </g>
      )}
      <rect x={-800} y={groundY} width={2680} height={1600} fill={N.backgroundDeep} />
      <line x1={-800} y1={groundY} x2={1880} y2={groundY} stroke={N.line} strokeWidth={4} />
    </g>
  );
};

/** Etiqueta da era no canto (ficção do universo). */
export const EraTag: React.FC<{ era: "future" | "present"; top?: number }> = ({ era, top = 250 }) => {
  const e = ERAS[era];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 3, fps, config: SPRING.pop });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 60,
          top,
          opacity: Math.min(1, s * 1.5),
          transform: `translateX(${interpolate(s, [0, 1], [-30, 0])}px)`,
          padding: "10px 22px",
          borderRadius: 999,
          background: "#ffffffcc",
          border: `4px solid ${e.accents[0]}`,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 30,
          letterSpacing: 1,
          color: LEAD.colors.outline,
        }}
      >
        {e.label}
      </div>
    </AbsoluteFill>
  );
};

/** Portal da Chrono-Band (método FIXO de viagem no tempo da bíblia). open 0→1 abre; collapse 0→1 fecha num ponto. */
export const TimePortal: React.FC<{ x: number; y: number; open: number; collapse?: number; size?: number }> = ({
  x,
  y,
  open,
  collapse = 0,
  size = 230,
}) => {
  const t = useTime();
  const [c1, c2] = [LEAD.colors.halo, LEAD.colors.chronoBand];
  const r = size * open * (1 - collapse);
  if (open <= 0 || collapse >= 1) {
    return collapse >= 1 ? null : null;
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse rx={r * 1.25} ry={r * 1.6} fill={c2} opacity={0.08} />
      {[1, 0.78, 0.56, 0.34].map((k, i) => (
        <ellipse
          key={i}
          rx={r * k * 0.8}
          ry={r * k * 1.25}
          fill="none"
          stroke={i % 2 ? c1 : c2}
          strokeWidth={8 - i}
          strokeDasharray={`${40 + i * 10} ${18 + i * 6}`}
          strokeDashoffset={(i % 2 ? 1 : -1) * t * 160}
          opacity={0.9 - i * 0.12}
        />
      ))}
      <ellipse rx={r * 0.25} ry={r * 0.4} fill="#ffffff" opacity={0.85} />
      {Array.from({ length: 14 }).map((_, i) => {
        const a = random(`pa${i}`) * Math.PI * 2 + t * (1 + random(`pb${i}`));
        const d = r * (0.6 + 0.5 * random(`pc${i}`));
        return <circle key={i} cx={Math.cos(a) * d * 0.8} cy={Math.sin(a) * d * 1.25} r={4 + 4 * random(`pd${i}`)} fill={i % 2 ? c1 : c2} opacity={0.8} />;
      })}
      {collapse > 0.85 && <circle r={40 * (1 - collapse) * 6} fill="#ffffff" opacity={0.9} />}
    </g>
  );
};

/** Brilho pulsante + faíscas em volta da relíquia. */
export const RelicGlow: React.FC<{ x: number; y: number; r?: number; strength?: number; children?: React.ReactNode }> = ({
  x,
  y,
  r = 70,
  strength = 1,
  children,
}) => {
  const t = useTime();
  const id = uid(useId());
  const pulse = 1 + Math.sin(t * 4) * 0.08;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`rg${id}`}>
          <stop offset="0" stopColor="#FFF4C2" stopOpacity={0.9 * strength} />
          <stop offset="1" stopColor="#FFF4C2" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle r={r * pulse} fill={`url(#rg${id})`} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + t * 1.2;
        const s = 8 + 4 * Math.sin(t * 5 + i);
        const px = Math.cos(a) * r * 0.85;
        const py = Math.sin(a) * r * 0.85;
        return <path key={i} d={`M${px} ${py - s} L${px + s * 0.3} ${py} L${px} ${py + s} L${px - s * 0.3} ${py} Z`} fill="#F5C542" opacity={strength} />;
      })}
      {children}
    </g>
  );
};

/** Tela dividida: OLD DAYS (em cima, quente) × MY TIME (embaixo, frio). Conteúdo em coordenadas da tela inteira. */
export const SplitCompare: React.FC<{
  top: React.ReactNode;
  bottom: React.ReactNode;
  topLabel?: string;
  bottomLabel?: string;
  reveal?: number;
  /** y da divisão (padrão 960). Suba (ex.: 880) quando o personagem de baixo precisa de espaço acima da legenda. */
  mid?: number;
}> = ({ top, bottom, topLabel = "THE OLD DAYS", bottomLabel = "MY TIME", reveal = 1, mid = 960 }) => {
  const id = uid(useId());
  const label = (text: string, y: number, color: string) => (
    <g transform={`translate(540 ${y})`}>
      <rect x={-190} y={-34} width={380} height={68} rx={34} fill="#ffffff" stroke={color} strokeWidth={5} />
      <text y={14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={36} fill={LEAD.colors.outline}>
        {text}
      </text>
    </g>
  );
  return (
    <g>
      <defs>
        <clipPath id={`ct${id}`}>
          <rect x={0} y={0} width={1080} height={mid} />
        </clipPath>
        <clipPath id={`cb${id}`}>
          <rect x={0} y={mid} width={1080} height={1920 - mid} />
        </clipPath>
      </defs>
      <g clipPath={`url(#ct${id})`}>{top}</g>
      <g clipPath={`url(#cb${id})`} opacity={reveal}>
        {bottom}
      </g>
      <rect x={0} y={mid - 6} width={1080} height={12} fill={LEAD.colors.outline} />
      {/* y ≥ 230: fora da faixa que o app cobre no topo */}
      {label(topLabel, 300, ERAS.present.accents[0])}
      {reveal > 0 && label(bottomLabel, mid + 60, ERAS.future.accents[0])}
    </g>
  );
};
