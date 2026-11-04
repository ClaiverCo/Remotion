import React from "react";
import { interpolate } from "remotion";
import { AlongPath, Block, Liquid, Particles, Pipe } from "../../components/two5d";
import { shade, useIdle } from "../../lib/anim";
import { COLORS } from "../../theme";

/**
 * Diagrama paramétrico do vaso sanitário em corte (espaço 1080×1920).
 * Cada cena só muda o "estado" abaixo; o desenho é sempre o mesmo, o que mantém
 * a continuidade visual entre os cortes.
 */

export const FLOOR_Y = 1150;

/** Cano reto ("só um buraco"). */
export const STRAIGHT = "M520 895 L520 1150 L520 1360 Q520 1440 600 1440 L1500 1440";
/** Sifão em U dentro da louça, crista em y=800, desce até o esgoto. */
export const TRAP =
  "M520 895 L520 990 Q520 1065 595 1065 Q670 1065 670 990 L670 865 Q670 800 735 800 Q800 800 800 865 L800 1360 Q800 1440 880 1440 L1500 1440";
/** Fração do TRAP ocupada pelo fecho hídrico (água parada). */
export const SEAL_TO = 0.255;

/** Cavidade da bacia (vista em corte). */
const BOWL = "M350 700 C350 800 440 880 495 895 L545 895 C590 880 650 800 660 700 Z";
const BOWL_BOTTOM = 895;
/** Nível normal da água na bacia (= crista interna do sifão). */
export const BOWL_LEVEL = 822;

export type ToiletState = {
  /** 0 = cano reto, 1 = sifão */
  trap?: number;
  /** 0..1 água parada no sifão */
  seal?: number;
  /** nível da água na bacia em y (px). BOWL_BOTTOM = seco */
  bowlY?: number;
  /** 0..1 fluxo forte (descarga) no cano */
  flush?: number;
  /** 0..1 intensidade dos gases; blocked = barrados pelo fecho */
  gas?: number;
  gasBlocked?: boolean;
  /** null = sem cocô; número = progresso ao longo do cano (0 = boiando na bacia) */
  poop?: number | null;
  /** 0..1 a caixa acoplada aparece */
  tank?: number;
  /** 0..1 nível da caixa */
  tankLevel?: number;
  /** 0..1 obturador aberto */
  flapper?: number;
  /** 0..1 água entrando pela válvula (boia aberta) */
  inlet?: number;
  /** 0..1 tubinho de reposição mandando água pro vaso */
  refill?: number;
  /** 0..1 botão pressionado */
  button?: number;
  /** 0..1 água caindo da caixa para a bacia */
  pour?: number;
};

const Poop: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <g transform={`scale(${scale})`}>
    <ellipse cx={0} cy={6} rx={34} ry={14} fill={shade(COLORS.dirt, -0.15)} />
    <ellipse cx={0} cy={-6} rx={26} ry={12} fill={COLORS.dirt} />
    <ellipse cx={2} cy={-16} rx={16} ry={9} fill={shade(COLORS.dirt, 0.1)} />
    <ellipse cx={6} cy={-24} rx={6} ry={6} fill={shade(COLORS.dirt, 0.15)} />
  </g>
);

const TankInternals: React.FC<Required<Pick<ToiletState, "tankLevel" | "flapper" | "inlet" | "refill" | "button">>> = ({
  tankLevel,
  flapper,
  inlet,
  refill,
  button,
}) => {
  const levelY = interpolate(tankLevel, [0, 1], [688, 486]);
  const floatY = Math.min(levelY - 6, 660);
  const pivot = { x: 846, y: 478 };
  const ballX = 770;
  return (
    <g>
      {/* parede da caixa */}
      <Block x={640} y={392} w={240} h={308} depth={46} color={COLORS.ceramic} />
      <rect x={656} y={404} width={208} height={284} fill={shade(COLORS.wall, 0.4)} stroke={COLORS.ceramicShade} strokeWidth={3} />
      <Liquid clip="M656 404 H864 V688 H656 Z" level={levelY} wave={4} />
      {/* tubo ladrão */}
      <rect x={728} y={470} width={24} height={218} fill={COLORS.ceramicShade} stroke={COLORS.pipeDark} strokeWidth={3} />
      {refill > 0 && (
        <rect x={734} y={480} width={12} height={208} fill={COLORS.water} opacity={refill} />
      )}
      {/* tubinho de reposição: válvula → ladrão */}
      <path d={`M${pivot.x} ${pivot.y} Q800 430 742 466`} fill="none" stroke={COLORS.pipe} strokeWidth={9} strokeLinecap="round" />
      {refill > 0 && (
        <path d={`M${pivot.x} ${pivot.y} Q800 430 742 466`} fill="none" stroke={COLORS.water} strokeWidth={5} strokeLinecap="round" opacity={refill} />
      )}
      {/* válvula de entrada */}
      <rect x={836} y={pivot.y} width={20} height={210} fill={COLORS.pipe} />
      <rect x={828} y={pivot.y - 14} width={36} height={20} rx={6} fill={COLORS.pipeDark} />
      {inlet > 0 && (
        <Particles
          seed="inlet"
          count={16}
          area={{ x: 828, y: pivot.y + 6, w: 36, h: 4 }}
          velocity={{ x: -20, y: 520 }}
          life={0.4}
          size={[3, 6]}
          color={COLORS.water}
          opacity={0.9 * inlet}
          wobble={4}
        />
      )}
      {/* boia + braço */}
      <line x1={pivot.x} y1={pivot.y} x2={ballX} y2={floatY} stroke={COLORS.ink} strokeWidth={6} strokeLinecap="round" />
      <circle cx={ballX} cy={floatY} r={26} fill="#ff9f43" stroke={COLORS.ink} strokeWidth={5} />
      {/* obturador (borracha) na saída do fundo */}
      <g transform={`rotate(${-62 * flapper} 728 686)`}>
        <rect x={666} y={678} width={62} height={16} rx={6} fill="#e5484d" stroke={COLORS.ink} strokeWidth={4} />
        <line x1={697} y1={678} x2={760} y2={470} stroke={COLORS.ink} strokeWidth={3} opacity={0.6} />
      </g>
      {/* tampa e botão */}
      <Block x={630} y={372} w={260} h={22} depth={46} color={COLORS.ceramic} />
      <Block x={770} y={354 + button * 10} w={56} h={18 - button * 8} depth={20} color="#bfc7cf" />
    </g>
  );
};

export const Toilet: React.FC<ToiletState> = ({
  trap = 0,
  seal = 0,
  bowlY = BOWL_BOTTOM,
  flush = 0,
  gas = 0,
  gasBlocked = false,
  poop = null,
  tank = 0,
  tankLevel = 1,
  flapper = 0,
  inlet = 0,
  refill = 0,
  button = 0,
  pour = 0,
}) => {
  const bob = useIdle(3, 1.6);
  const sealFrom = 0.13 - 0.13 * seal;
  const sealTo = 0.13 + (SEAL_TO - 0.13) * seal;
  const fill = flush > 0 ? { from: 0, to: interpolate(flush, [0, 1], [sealTo, 1]) } : seal > 0 && trap >= 0.5 ? { from: sealFrom, to: sealTo } : undefined;

  return (
    <g>
      {/* corpo de louça (bege, em corte) */}
      <Block x={280} y={700} w={600} h={FLOOR_Y - 700} depth={60} color={COLORS.sand} />
      {/* cavidade da bacia */}
      <path d={BOWL} fill={shade(COLORS.sand, -0.28)} />
      <path d="M350 700 C350 800 440 880 495 895" fill="none" stroke={shade(COLORS.sand, -0.42)} strokeWidth={6} />
      {bowlY < BOWL_BOTTOM && <Liquid clip={BOWL} level={bowlY} wave={flush > 0 ? 10 : 5} />}

      {/* cano: crossfade reto → sifão */}
      {/* cano: o reto some enquanto a curva "cresce" desenhando o caminho (trap 0 → 1) */}
      <Pipe d={STRAIGHT} opacity={interpolate(trap, [0, 0.35], [1, 0], { extrapolateRight: "clamp" })} fill={trap < 0.5 && flush > 0 ? { to: flush } : undefined} flow={flush * 2} />
      <Pipe d={TRAP} reveal={trap} fill={trap >= 0.999 ? fill : undefined} flow={flush * 2.2} />

      {/* gases */}
      {gas > 0 && !gasBlocked && (
        <>
          <Particles seed="g-sewer" count={18} area={{ x: 640, y: 1410, w: 420, h: 50 }} velocity={{ x: -160, y: 0 }} life={2} size={[10, 22]} opacity={0.55 * gas} blur={4} />
          <Particles seed="g-pipe" count={18} area={{ x: 500, y: 960, w: 40, h: 440 }} velocity={{ x: 0, y: -180 }} life={2} size={[10, 22]} opacity={0.55 * gas} blur={4} />
          <Particles seed="g-room" count={26} area={{ x: 380, y: 600, w: 280, h: 260 }} velocity={{ x: 0, y: -170 }} life={2.6} size={[22, 60]} opacity={0.5 * gas} wobble={30} blur={10} />
        </>
      )}
      {gas > 0 && gasBlocked && (
        <>
          <Particles seed="b-sewer" count={16} area={{ x: 880, y: 1410, w: 300, h: 50 }} velocity={{ x: -140, y: 0 }} life={2} size={[10, 22]} opacity={0.55 * gas} blur={4} />
          <Particles seed="b-up" count={16} area={{ x: 782, y: 1000, w: 36, h: 360 }} velocity={{ x: 0, y: -90 }} life={1.6} size={[10, 20]} opacity={0.55 * gas} blur={4} />
          {/* X de bloqueio na crista */}
          <g transform={`translate(800 930) scale(${0.9 + bob * 0.03})`} opacity={gas}>
            <circle r={34} fill={COLORS.white} stroke={COLORS.danger} strokeWidth={8} />
            <path d="M-14 -14 L14 14 M14 -14 L-14 14" stroke={COLORS.danger} strokeWidth={9} strokeLinecap="round" />
          </g>
        </>
      )}

      {/* cocô */}
      {poop !== null && poop <= 0 && (
        <g transform={`translate(505 ${Math.min(bowlY, BOWL_BOTTOM) - 8 + bob})`}>
          <Poop />
        </g>
      )}
      {poop !== null && poop > 0 && poop < 1 && (
        <AlongPath d={TRAP} progress={poop}>
          <Poop scale={0.7} />
        </AlongPath>
      )}

      {/* água caindo da caixa para a bacia */}
      {pour > 0 && (
        <g opacity={pour}>
          <path d="M700 700 C690 740 640 740 600 760" fill="none" stroke={COLORS.water} strokeWidth={34} strokeLinecap="round" />
          <Particles seed="pour" count={20} area={{ x: 520, y: 740, w: 120, h: 30 }} velocity={{ x: -60, y: 260 }} life={0.5} size={[6, 12]} color={COLORS.waterFoam} opacity={0.8} />
        </g>
      )}

      {/* caixa acoplada */}
      {tank > 0 && (
        <g opacity={tank} transform={`translate(0 ${interpolate(tank, [0, 1], [-120, 0])})`}>
          <TankInternals tankLevel={tankLevel} flapper={flapper} inlet={inlet} refill={refill} button={button} />
        </g>
      )}
    </g>
  );
};
