import React from "react";
import { EN, translator, useLangScene, type SceneLang } from "../../stickman/lang";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { mix, ramp } from "../../lib/anim";
import { FONT } from "../../theme";
import type { SceneProps } from "../../lib/types";
import {
  EraTag,
  FUTURE_PEOPLE,
  FutureBackdrop,
  GROUND_Y,
  jointWorld,
  poseAt,
  PresentBackdrop,
  SplitCompare,
  Stickman,
  walkAlong,
  type Pose,
  type PoseName,
} from "../../stickman";
import { FutureDoor, Magnifier } from "../stickman-house-key/props";
import { CentralClock, Pill } from "../stickman-stuck-01-crystal/props";
import { EndCard, Garage } from "../stickman-stuck-02-battery/props";
import { MachineFrame, machineSlot } from "../stickman-stuck-03-chip/props";
import { BigClock, CarGPS, HoloBolt, MapCloseup, PhoneMap, Receiver, Rocket, RouteScreen, Satellite, SignalPulse, Stopwatch } from "./props";

/**
 * "Preso em 2026", episódio 4: Relógios no Céu (em PORTUGUÊS do Brasil, voz Piper cadu).
 * Regra: todo evento visual acontece QUANDO a palavra é dita — at("palavra", fração-reserva).
 * Continuidade: Chrono-Band rachada; máquina física com relógio (0), power bank (1) e chip (2); o GPS entra no encaixe 3 (embaixo).
 */

const BEN = { kind: "person" as const, shirt: "#E0B44C", hair: "short" as const };
const CITIZEN = { kind: "person" as const, shirt: FUTURE_PEOPLE.tunic, hair: "none" as const };
const G = GROUND_Y;
const MX = 800;
const TAG_PRESENT = "ANTIGAMENTE · 2026";
const TAG_FUTURE = "LUMEN · MEU TEMPO";
const gpsInSlot = { 3: <CarGPS scale={0.42} on={1} /> };

const Svg: React.FC<{ children: React.ReactNode; zoom?: number; cx?: number; cy?: number }> = ({ children, zoom = 1, cx = 540, cy = 960 }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <g transform={`translate(${cx} ${cy}) scale(${zoom}) translate(${-cx} ${-cy})`}>{children}</g>
    </svg>
  </AbsoluteFill>
);

type Sfx = "whoosh" | "pop" | "ding" | "click" | "splat";
const Cue: React.FC<{ at: number; sfx: Sfx; volume?: number }> = ({ at, sfx, volume = 0.3 }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round(at * fps))} durationInFrames={fps * 2} layout="none">
      <Audio src={staticFile(`sfx/${sfx}.mp3`)} volume={volume} />
    </Sequence>
  );
};
export const makeScenes = (L: SceneLang = EN): Record<string, React.FC<SceneProps>> => {
  const T = translator(L);
  const TagFrom: React.FC<{ at: number; era: "future" | "present"; top?: number; until?: number }> = ({ at, era, top, until }) => {
    const { fps } = useVideoConfig();
    const from = Math.round(at * fps);
    return (
      <Sequence from={from} durationInFrames={until !== undefined ? Math.max(1, Math.round(until * fps) - from) : undefined} layout="none">
        <EraTag era={era} top={top} label={era === "present" ? L.tagPresent ?? TAG_PRESENT : L.tagFuture ?? TAG_FUTURE} />
      </Sequence>
    );
  };

  /** Bolha de pensamento acima de um ponto (a cabeça). */
  const Thought: React.FC<{ x: number; y: number; show: number; children: React.ReactNode }> = ({ x, y, show, children }) =>
    show > 0 ? (
      <g transform={`translate(${x} ${y}) scale(${show})`} opacity={Math.min(1, show)}>
        <circle cx={-80} cy={120} r={12} fill="#ffffff" stroke="#9AA5B1" strokeWidth={4} />
        <circle cx={-50} cy={80} r={20} fill="#ffffff" stroke="#9AA5B1" strokeWidth={4} />
        <circle r={110} fill="#ffffff" stroke="#9AA5B1" strokeWidth={5} />
        {children}
      </g>
    ) : null;

  const Cross: React.FC<{ x: number; y: number; p: number; size?: number }> = ({ x, y, p, size = 60 }) =>
    p > 0 ? (
      <g transform={`translate(${x} ${y}) scale(${p})`} stroke="#E05A47" strokeWidth={14} strokeLinecap="round" opacity={p}>
        <line x1={-size} y1={-size} x2={size} y2={size} />
        <line x1={size} y1={-size} x2={-size} y2={size} />
      </g>
    ) : null;

  // Poses sob medida (olhando para a direita)
  const REACH_DOWN: Pose = { lean: 12, head: 10, near: [38, 4], far: [-14, 10], legNear: [16, 6], legFar: [-10, 4] };
  const SHELF: Pose = { lean: -4, head: -16, near: [165, 0], far: [-14, 8], legNear: [6, 0], legFar: [-6, 0] };

  // c01 — "A máquina ligou, mas sem o Relógio Central ela não sabia onde estava. Nem quando. Assim, mirar o portal era impossível."
  const C01: React.FC<SceneProps> = (props) => {
    const { t, dur, at } = useLangScene(props, L, "c01");
    const tLigou = at("ligou", 0.09);
    const tCentral = at("Central", 0.29);
    const tOnde = at("onde", 0.45);
    const tQuando = at("quando", 0.6);
    const tPortal = at("portal", 0.82);
    const tImp = at("impossível", 0.89);
    const K = { x: 400, y: G, scale: 1.8, facing: 1 as const };
    const head = jointWorld({ ...K, pose: "think" }, "head");
    const blink = (from: number) => (t > from ? 0.5 + 0.5 * Math.round(Math.abs(Math.sin((t - from) * 6))) : 0);
    const portalTry = t > tPortal - 0.2 && t < tImp + 0.4 ? Math.abs(Math.sin((t - tPortal) * 20)) * (1 - ramp(t, tImp, tImp + 0.4)) : 0;
    const ring = machineSlot(MX, G, 0);
    const ringCy = ring.y + 150;
    return (
      <>
        <Svg zoom={mix(1, 1.04, t / dur)} cy={900}>
          <Garage groundY={G} t={t} />
          <MachineFrame x={MX} groundY={G} t={t} parts={3} hum={ramp(t, tLigou, tLigou + 0.4)} screen={{ q: ramp(t, tLigou, tLigou + 0.3), pin: blink(tOnde), clock: blink(tQuando) }} />
          {portalTry > 0 && (
            <g opacity={portalTry}>
              <ellipse cx={MX} cy={ringCy} rx={80} ry={110} fill="none" stroke="#8B5CF6" strokeWidth={8} />
              <ellipse cx={MX} cy={ringCy} rx={50} ry={72} fill="none" stroke="#22D3EE" strokeWidth={6} />
            </g>
          )}
          <Cross x={MX} y={ringCy} p={ramp(t, tImp, tImp + 0.25)} />
          <Stickman {...K} pose={poseAt(t, [{ t: 0, pose: "stand" }, { t: tCentral, pose: "think" }, { t: tImp, pose: "think" }, { t: tImp + 0.3, pose: "sad" }])} band="cracked" expression={t < tImp ? "worried" : "worried"} look={0.7} />
          <Thought x={head.x + 40} y={head.y - 230} show={ramp(t, tCentral - 0.1, tCentral + 0.25) * (1 - ramp(t, tOnde + 0.6, tOnde + 0.9))}>
            <CentralClock x={0} y={-6} r={75} t={t} hand={60} stopped={1} crystalGlow={0.3} />
          </Thought>
        </Svg>
        <TagFrom at={0} era="present" top={430} />
        <Cue at={tLigou} sfx="whoosh" volume={0.25} />
        <Cue at={tOnde} sfx="pop" volume={0.18} />
        <Cue at={tQuando} sfx="pop" volume={0.18} />
        <Cue at={tImp} sfx="splat" volume={0.25} />
      </>
    );
  };

  // c02 — "Aí o Ben abriu o mapa no celular. Um pontinho azul mostrava exatamente onde a gente estava, ali na garagem."
  const C02: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c02");
    const tAbriu = at("abriu", 0.09);
    const tMapa = at("mapa", 0.16);
    const tPontinho = at("pontinho", 0.36);
    const tExat = at("exatamente", 0.55);
    const tGaragem = at("garagem", 0.88);
    const B = { x: 590, y: G, scale: 1.6, facing: -1 as const };
    const benPose = poseAt(t, [
      { t: 0, pose: "stand" },
      { t: tAbriu, pose: "stand" },
      { t: tAbriu + 0.35, pose: "holdUp" },
    ]);
    const hand = jointWorld({ ...B, pose: benPose }, "nearHand");
    const dot = ramp(t, tPontinho, tPontinho + 0.25);
    const lock = ramp(t, tExat, tExat + 0.5);
    const mag = ramp(t, tMapa - 0.1, tMapa + 0.25);
    return (
      <>
        <Svg>
          <Garage groundY={G} t={t} />
          <MachineFrame x={MX} groundY={G} t={t} parts={3} hum={0.3} screen={{ q: 1 }} />
          <Stickman x={300} y={G} scale={1.8} pose={t > tPontinho ? "surprised" : "stand"} band="cracked" expression={t > tPontinho ? "shocked" : "curious"} look={0.7} />
          <Stickman {...BEN} {...B} pose={benPose} expression="happy" look={0.5} holdNear={t > tAbriu ? <PhoneMap y={-30} scale={0.42} t={t} dot={dot} lock={lock} /> : undefined} />
          <Magnifier cx={560} cy={540} r={175} fromX={hand.x} fromY={hand.y - 30} show={mag}>
            <MapCloseup dot={dot} lock={lock} t={t} />
          </Magnifier>
          <Pill x={560} y={755} text={T("você está aqui")} show={ramp(t, tGaragem - 0.3, tGaragem)} color="#3B82F6" size={34} />
        </Svg>
        <TagFrom at={0} era="present" />
        <Cue at={tAbriu + 0.3} sfx="pop" volume={0.2} />
        <Cue at={tPontinho} sfx="ding" volume={0.22} />
        <Cue at={tExat + 0.4} sfx="click" volume={0.25} />
      </>
    );
  };

  // c03 — "Na prateleira, ele achou um GPS velho de carro. Eu encaixei o aparelho inteiro na máquina, no quarto espaço."
  const C03: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c03");
    const tPrat = at("prateleira", 0.04);
    const tAchou = at("achou", 0.2);
    const tGPS = at("GPS", 0.28);
    const tCarro = at("carro", 0.4);
    const tEu = at("Eu", 0.5);
    const tEncaixei = at("encaixei", 0.52);
    const tMaquina = at("máquina", 0.77);
    const tQuarto = at("quarto", 0.86);
    const slot = machineSlot(MX, G, 3);
    const B = { x: 430, y: G, scale: 1.6, facing: 1 as const };
    const benPose = poseAt(t, [
      { t: 0, pose: "stand" },
      { t: tPrat, pose: SHELF },
      { t: tAchou + 0.1, pose: SHELF },
      { t: tAchou + 0.45, pose: "holdUp" },
      { t: tCarro + 0.1, pose: "holdUp" },
      { t: tCarro + 0.4, pose: "stand" },
    ]);
    const benHasIt = t > tAchou && t < tCarro + 0.1;
    const benHand = jointWorld({ ...B, pose: benPose }, "nearHand");
    // Kip pega o aparelho (passa da mão do Ben para a dele) e vai até o encaixe de baixo
    const reach = jointWorld({ x: 0, y: G, scale: 1.8, facing: 1, pose: REACH_DOWN }, "nearHand");
    const targetX = slot.x - reach.x - 20;
    const walk = walkAlong(t, { fromX: 560, toX: targetX, start: tEu - 0.1, end: tEncaixei + 0.9 });
    const insert = ramp(t, tMaquina - 0.3, tQuarto + 0.1);
    const placed = insert >= 1;
    const back = walkAlong(t, { fromX: targetX, toX: targetX - 170, start: tQuarto + 0.4, end: tQuarto + 1.2, stepsPerSec: 1.6 });
    const kipX = t < tQuarto + 0.4 ? walk.x : back.x;
    const kipPose: Pose | PoseName = walk.walking
      ? walk.pose
      : back.walking
      ? back.pose
      : poseAt(t, [
          { t: 0, pose: "stand" },
          { t: tCarro, pose: "stand" },
          { t: tCarro + 0.3, pose: "holdUp" },
          { t: tEncaixei + 0.9, pose: "holdUp" },
          { t: tMaquina - 0.2, pose: REACH_DOWN },
          { t: tQuarto + 0.4, pose: REACH_DOWN },
          { t: tQuarto + 1.3, pose: "stand" },
        ]);
    const kipHand = jointWorld({ x: kipX, y: G, scale: 1.8, facing: 1, pose: kipPose }, "nearHand");
    const pass = ramp(t, tCarro + 0.1, tEu - 0.05);
    const inPass = pass > 0 && pass < 1;
    const kipHas = pass >= 1 && insert <= 0;
    return (
      <>
        <Svg>
          <Garage groundY={G} t={t} />
          {/* o GPS ainda na prateleira */}
          {t < tAchou && <CarGPS x={470} y={480} scale={0.55} />}
          <MachineFrame x={MX} groundY={G} t={t} parts={placed ? 4 : 3} extra={gpsInSlot} glow={{ slot: 3, p: placed ? 1 - 0.5 * ramp(t, tQuarto + 0.6, tQuarto + 1.4) : 0 }} hum={0.3} screen={{ q: 1 }} />
          <Stickman {...BEN} {...B} pose={benPose} expression="happy" look={0.4} holdNear={benHasIt ? <CarGPS y={-24} scale={0.38} /> : undefined} />
          {inPass && <CarGPS x={mix(benHand.x, kipHand.x, pass)} y={mix(benHand.y - 30, kipHand.y - 30, pass) - Math.sin(pass * Math.PI) * 60} scale={0.38 * 1.7} />}
          <Stickman x={kipX} y={G} scale={1.8} pose={kipPose} band="cracked" expression={placed ? "happy" : "determined"} look={0.5} holdNear={kipHas ? <CarGPS y={-24} scale={0.38} /> : undefined} />
          {insert > 0 && !placed && <CarGPS x={mix(kipHand.x, slot.x, insert)} y={mix(kipHand.y - 30, slot.y, insert)} scale={mix(0.38 * 1.8, 0.42, insert)} />}
          <Pill x={470} y={360} text={T("GPS de carro")} show={ramp(t, tGPS, tGPS + 0.25) * (1 - ramp(t, tEu - 0.2, tEu + 0.1))} color="#6B7280" size={34} />
          <Pill x={slot.x} y={slot.y - 95} text={T("encaixe 4")} show={ramp(t, tQuarto + 0.9, tQuarto + 1.15)} color="#22D3EE" size={32} />
        </Svg>
        <TagFrom at={0} era="present" />
        <Cue at={tAchou} sfx="pop" volume={0.2} />
        <Cue at={tQuarto + 0.1} sfx="click" volume={0.45} />
        <Cue at={tQuarto + 0.2} sfx="ding" volume={0.22} />
      </>
    );
  };

  // Layout do diagrama dos satélites (clipe 4)
  const EARTH = { cx: 540, cy: 2050, r: 960 };
  const RX = { x: 540, y: EARTH.cy - EARTH.r - 10 };
  const SATS = [
    { x: 200, y: 560 },
    { x: 430, y: 420 },
    { x: 690, y: 440 },
    { x: 900, y: 600 },
  ];

  // c04 — "Lá em cima, satélites mandam sinais com a hora exata. O receptor vê quanto cada sinal demorou e calcula a distância até eles."
  const C04: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c04");
    const tSat = at("satélites", 0.14);
    const tSinais = at("sinais", 0.25);
    const tHora = at("hora", 0.34);
    const tReceptor = at("receptor", 0.47);
    const tDemorou = at("demorou", 0.69);
    const tDist = at("distância", 0.83);
    const tEles = at("eles", 0.93);
    return (
      <>
        <Svg>
          <rect width={1080} height={1920} fill="#F7F0E6" />
          <defs>
            <clipPath id="c04panel">
              <rect x={40} y={300} width={1000} height={900} rx={40} />
            </clipPath>
          </defs>
          <g clipPath="url(#c04panel)">
            <rect x={40} y={300} width={1000} height={900} fill="#16243A" />
            {Array.from({ length: 30 }, (_, i) => (
              <circle key={i} cx={60 + ((i * 137) % 960)} cy={320 + ((i * 89) % 520)} r={i % 4 === 0 ? 3 : 2} fill="#ffffff" opacity={0.5} />
            ))}
            <circle cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r} fill="#3B82F6" stroke="#93C5FD" strokeWidth={6} />
            <path d={`M${EARTH.cx - 700} ${EARTH.cy - EARTH.r + 120} Q${EARTH.cx - 300} ${EARTH.cy - EARTH.r + 20} ${EARTH.cx - 60} ${EARTH.cy - EARTH.r + 60} L${EARTH.cx - 60} ${EARTH.cy - EARTH.r + 300} Z`} fill="#22C55E" opacity={0.7} />
            {/* círculos de distância */}
            {SATS.map((s, i) => {
              const d = Math.hypot(s.x - RX.x, s.y - RX.y);
              const g = ramp(t, tDist + i * 0.12, tDist + 0.6 + i * 0.12);
              return g > 0 ? <circle key={i} cx={s.x} cy={s.y} r={d * g} fill="none" stroke="#FCD34D" strokeWidth={4} strokeDasharray="14 10" opacity={0.85} /> : null;
            })}
            {/* sinais com a hora */}
            {SATS.map((s, i) => {
              const start = tSinais + i * 0.18;
              const p = t > start ? ((t - start) / 1.4) % 1 : 0;
              return t > start && t < tDist + 0.4 ? <SignalPulse key={i} from={s} to={RX} p={p} clock={t > tHora} /> : null;
            })}
            {SATS.map((s, i) => (
              <g key={i} opacity={ramp(t, tSat - 0.1 + i * 0.12, tSat + 0.2 + i * 0.12)}>
                <Satellite x={s.x} y={s.y} s={0.8} t={t} glow={t > tSinais ? 0.6 : 0} />
              </g>
            ))}
            <Receiver x={RX.x} y={RX.y} glow={ramp(t, tReceptor, tReceptor + 0.3) + ramp(t, tEles, tEles + 0.3)} t={t} />
            <Stopwatch x={RX.x + 130} y={RX.y - 70} t={t} show={ramp(t, tDemorou - 0.1, tDemorou + 0.2) * (1 - ramp(t, tDist + 0.4, tDist + 0.8))} />
          </g>
          <rect x={40} y={300} width={1000} height={900} rx={40} fill="none" stroke="#CDB9A0" strokeWidth={4} />
          <Pill x={RX.x - 170} y={RX.y - 60} text={T("receptor")} show={ramp(t, tReceptor, tReceptor + 0.25)} color="#3B82F6" size={34} />
          <Pill x={540} y={350} text={T("hora exata")} show={ramp(t, tHora, tHora + 0.25) * (1 - ramp(t, tReceptor, tReceptor + 0.3))} color="#F5C542" size={34} />
          <Pill x={540} y={350} text={T("distância = tempo × velocidade da luz")} show={ramp(t, tDist, tDist + 0.25)} color="#F5C542" size={28} />
        </Svg>
        <TagFrom at={0} era="present" />
        <Cue at={tSat} sfx="whoosh" volume={0.2} />
        <Cue at={tSinais} sfx="ding" volume={0.18} />
        <Cue at={tDemorou} sfx="click" volume={0.3} />
        <Cue at={tEles} sfx="ding" volume={0.25} />
      </>
    );
  };

  // c05 — "Mas esses relógios adiantam cerca de 38 microssegundos por dia, por causa da relatividade. Por isso, eles são ajustados antes de subir."
  const C05: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c05");
    const tAdiantam = at("adiantam", 0.14);
    const t38 = at("38", 0.27);
    const tRel = at("relatividade", 0.56);
    const tAjust = at("ajustados", 0.81);
    const tSubir = at("subir", 0.93);
    const base = t * 90;
    // diferença EXAGERADA para dar para ver (a real é 38 microssegundos por dia)
    const ahead = 40 * ramp(t, tAdiantam, t38 + 0.6) * (1 - ramp(t, tAjust, tAjust + 0.7));
    const sat = { x: 290, y: 640 };
    const ground = { x: 790, y: 640 };
    return (
      <>
        <Svg>
          <rect width={1080} height={1920} fill="#F7F0E6" />
          <rect x={40} y={300} width={1000} height={920} rx={40} fill="#FBF6EE" stroke="#CDB9A0" strokeWidth={4} />
          {/* Terra e órbita (aparecem em "relatividade") */}
          <g opacity={ramp(t, tRel - 0.2, tRel + 0.2)}>
            <defs>
              <clipPath id="c05panel">
                <rect x={40} y={300} width={1000} height={920} rx={40} />
              </clipPath>
            </defs>
            <g clipPath="url(#c05panel)">
              <circle cx={790} cy={1500} r={420} fill="#93C5FD" stroke="#3B82F6" strokeWidth={6} />
              <circle cx={790} cy={1500} r={760} fill="none" stroke="#8B5CF6" strokeWidth={4} strokeDasharray="16 12" />
              {[0, 1, 2].map((k) => (
                <circle key={k} cx={790} cy={1500} r={470 + k * 70} fill="none" stroke="#3B82F6" strokeWidth={3} opacity={0.35 - k * 0.1} />
              ))}
            </g>
          </g>
          <g opacity={ramp(t, 0, 0.4)}>
            <BigClock x={sat.x} y={sat.y} angle={base + ahead} label={T("no satélite")} color="#C7D2FE" wrench={ramp(t, tAjust - 0.05, tAjust + 0.9)} />
            <BigClock x={ground.x} y={ground.y} angle={base} label={T("no chão")} />
          </g>
          <Satellite x={sat.x} y={sat.y - 205} s={0.7} t={t} />
          <Pill x={540} y={930} text={T("+38 microssegundos por dia")} show={ramp(t, t38, t38 + 0.25)} color="#E05A47" size={36} />
          <Pill x={540} y={1010} text={T("relatividade")} show={ramp(t, tRel, tRel + 0.25)} color="#8B5CF6" size={36} />
          <text x={540} y={880} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={26} fill="#7B8FA6" opacity={ramp(t, tAdiantam, tAdiantam + 0.3)}>
            {T("(diferença exagerada para dar para ver)")}
          </text>
          <Rocket x={150} y={mix(1190, 800, ramp(t, tSubir - 0.1, tSubir + 0.6, "in"))} show={ramp(t, tSubir - 0.2, tSubir)} t={t} />
        </Svg>
        <TagFrom at={0} era="present" />
        <Cue at={tAdiantam} sfx="click" volume={0.25} />
        <Cue at={t38} sfx="ding" volume={0.25} />
        <Cue at={tRel} sfx="whoosh" volume={0.18} />
        <Cue at={tAjust} sfx="click" volume={0.35} />
        <Cue at={tSubir} sfx="whoosh" volume={0.3} />
      </>
    );
  };

  // c06 — "Em Lumen, o Relógio Central resolve tudo. Aqui, até um mapa de celular depende de relógios no espaço, corrigidos pela relatividade."
  const C06: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c06");
    const MID = 880;
    const TOPG = 840;
    const BOTG = 1235;
    const tLumen = at("Lumen", 0.04);
    const tCentral = at("Central", 0.17);
    const tResolve = at("resolve", 0.23);
    const tAqui = at("Aqui", 0.35);
    const tMapa = at("mapa", 0.46);
    const tDepende = at("depende", 0.56);
    const tRelogios = at("relógios", 0.63);
    const tCorr = at("corrigidos", 0.78);
    const topShow = ramp(t, tAqui - 0.25, tAqui + 0.1);
    const phone = { x: 540, y: 700 };
    const sats = [
      { x: 260, y: 400 },
      { x: 540, y: 360 },
      { x: 820, y: 400 },
    ];
    const top = (
      <g>
        <PresentBackdrop variant="street" groundY={TOPG} />
        {sats.map((s, i) => (
          <g key={i}>
            {t > tDepende && (
              <line x1={s.x} y1={s.y} x2={phone.x} y2={phone.y - 80} stroke="#F5C542" strokeWidth={4} strokeDasharray="12 10" strokeDashoffset={-t * 60} opacity={ramp(t, tDepende, tDepende + 0.3)} />
            )}
            <g opacity={ramp(t, tRelogios - 0.4 + i * 0.1, tRelogios + i * 0.1)}>
              <Satellite x={s.x} y={s.y} s={0.6} t={t} check={ramp(t, tCorr + i * 0.12, tCorr + 0.25 + i * 0.12)} />
            </g>
          </g>
        ))}
        <g opacity={ramp(t, tMapa - 0.2, tMapa + 0.1)}>
          <PhoneMap x={phone.x} y={phone.y} scale={0.9} t={t} dot={1} lock={1} />
        </g>
        <Stickman x={880} y={TOPG} scale={1.1} facing={-1} pose={t > tCorr ? "point" : "stand"} band="cracked" expression="curious" look={0.5} />
        <rect x={0} y={0} width={1080} height={MID} fill="#F7F0E6" opacity={0.8 * (1 - topShow)} />
      </g>
    );
    const doorOpen = (k: number) => (t > tResolve ? 0.5 + 0.5 * Math.sin((t - tResolve) * 3 + k) : 0);
    const bottom = (
      <g>
        <FutureBackdrop variant="city" groundY={BOTG} />
        <FutureDoor x={110} groundY={BOTG} w={150} h={260} scan={0.6} open={Math.max(0, doorOpen(0))} />
        <FutureDoor x={820} groundY={BOTG} w={150} h={260} scan={0.6} open={Math.max(0, doorOpen(Math.PI))} />
        <CentralClock x={540} y={1070} r={88} t={t} hand={40 + t * 30} crystalGlow={0.5 + 0.5 * ramp(t, tCentral, tCentral + 0.3)} />
        <Stickman {...CITIZEN} x={330} y={BOTG} scale={0.95} facing={1} pose="stand" expression="happy" look={0.4} />
      </g>
    );
    return (
      <>
        <Svg>
          <SplitCompare top={top} bottom={bottom} topLabel={T("ANTIGAMENTE")} bottomLabel={T("MEU TEMPO")} mid={MID} />
        </Svg>
        <Cue at={tLumen} sfx="whoosh" volume={0.2} />
        <Cue at={tAqui} sfx="pop" volume={0.2} />
        <Cue at={tCorr} sfx="ding" volume={0.22} />
      </>
    );
  };

  // c07 — "A máquina calculou o caminho até Lumen. Então pediu uma descarga de energia que nenhuma bateria consegue dar de uma vez."
  const C07: React.FC<SceneProps> = (props) => {
    const { t, dur, at } = useLangScene(props, L, "c07");
    const tCalc = at("calculou", 0.08);
    const tCaminho = at("caminho", 0.14);
    const tLumen = at("Lumen", 0.22);
    const tPediu = at("pediu", 0.32);
    const tDescarga = at("descarga", 0.38);
    const tNenhuma = at("nenhuma", 0.52);
    const tBateria = at("bateria", 0.56);
    const tVez = at("vez", 0.72);
    const K = { x: 420, y: G, scale: 1.8, facing: 1 as const };
    const pose = poseAt(t, [
      { t: 0, pose: "stand" },
      { t: tCaminho, pose: "stand" },
      { t: tLumen + 0.2, pose: "celebrate" },
      { t: tPediu, pose: "stand" },
      { t: tNenhuma, pose: "think" },
    ]);
    const end = ramp(t, tVez + 0.6, tVez + 1.0);
    const ringTop = machineSlot(MX, G, 0);
    return (
      <>
        <Svg zoom={mix(1, 1.05, ramp(t, tPediu, dur))} cy={900}>
          <Garage groundY={G} t={t} />
          <MachineFrame
            x={MX}
            groundY={G}
            t={t}
            parts={4}
            extra={gpsInSlot}
            hum={0.5}
            glow={{ slot: 3, p: ramp(t, tCalc, tCalc + 0.3) * (1 - ramp(t, tPediu, tPediu + 0.3)) }}
            alert={{ slot: 1, p: t > tBateria ? 0.5 + 0.5 * Math.round(Math.abs(Math.sin((t - tBateria) * 6))) : 0 }}
            screenNode={<RouteScreen route={ramp(t, tCaminho, tLumen + 0.3)} bolt={ramp(t, tDescarga - 0.1, tDescarga + 0.2)} t={t} />}
          />
          <HoloBolt x={MX} y={ringTop.y - 150} show={ramp(t, tDescarga, tDescarga + 0.3) * (1 - end)} t={t} />
          <Stickman {...BEN} x={170} y={G} scale={1.6} pose={t > tDescarga ? "surprised" : "stand"} expression={t > tDescarga ? "shocked" : "happy"} look={0.6} />
          <Stickman {...K} pose={pose} band="cracked" expression={t < tPediu ? "happy" : t < tNenhuma ? "shocked" : "worried"} look={0.7} />
          <Pill x={MX} y={ringTop.y - 300} text={T("descarga de energia")} show={ramp(t, tDescarga + 0.1, tDescarga + 0.35) * (1 - end)} color="#F5C542" size={34} />
          <Pill x={MX - 10} y={machineSlot(MX, G, 1).y - 80} text={T("não aguenta")} show={ramp(t, tBateria, tBateria + 0.25) * (1 - end)} color="#E05A47" size={30} />
          <EndCard show={end} title={T("CONTINUA…")} next={T("PRÓXIMO · EP. 5: UM RAIO GUARDADO NA CAIXA")} />
        </Svg>
        <TagFrom at={0} era="present" until={tVez + 0.5} />
        <Cue at={tCalc} sfx="click" volume={0.25} />
        <Cue at={tLumen} sfx="ding" volume={0.25} />
        <Cue at={tDescarga} sfx="whoosh" volume={0.3} />
        <Cue at={tBateria} sfx="splat" volume={0.22} />
        <Cue at={tVez + 0.65} sfx="pop" volume={0.22} />
      </>
    );
  };

  return {
    "c01-lost": C01,
    "c02-map": C02,
    "c03-receiver": C03,
    "c04-signals": C04,
    "c05-relativity": C05,
    "c06-compare": C06,
    "c07-energy": C07,
  };
};

export const scenes = makeScenes(EN);
