import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { mix, ramp, useScene } from "../../lib/anim";
import { FONT } from "../../theme";
import type { SceneProps } from "../../lib/types";
import {
  EraTag,
  FUTURE_PEOPLE,
  FutureBackdrop,
  GROUND_Y,
  jointWorld,
  mixPose,
  poseAt,
  PresentBackdrop,
  RelicGlow,
  SplitCompare,
  Stickman,
  TimePortal,
  walkAlong,
  type Pose,
  type PoseName,
} from "../../stickman";
import { ArrivalRing, DigSite, Magnifier } from "../stickman-house-key/props";
import { Breeze, Chair, Fan, HeatShimmer, InsightPanel, LumenBreeze, SkinCutaway, Sweat, Thermometer } from "./props";

/**
 * Episódio "The Electric Fan" (universo Stickman do Futuro).
 * Regra: todo evento visual acontece QUANDO a palavra é dita — at("palavra", fração-reserva).
 * Kip segura a relíquia (o ventilador empoeirado) na mão DIREITA o episódio todo (olhando para a direita = mão "near").
 */

const PP02 = { kind: "person" as const, shirt: "#E0B44C", hair: "short" as const };
const CITIZEN = { kind: "person" as const, shirt: FUTURE_PEOPLE.tunic, hair: "none" as const };
const ROOM_TEMP = 34;

const Svg: React.FC<{ children: React.ReactNode; zoom?: number; cx?: number; cy?: number }> = ({ children, zoom = 1, cx = 540, cy = 960 }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <g transform={`translate(${cx} ${cy}) scale(${zoom}) translate(${-cx} ${-cy})`}>{children}</g>
    </svg>
  </AbsoluteFill>
);

type Sfx = "whoosh" | "pop" | "ding" | "click";
/** Efeito sonoro num instante da cena (s). */
const Cue: React.FC<{ at: number; sfx: Sfx; volume?: number }> = ({ at, sfx, volume = 0.3 }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round(at * fps))} durationInFrames={fps * 2} layout="none">
      <Audio src={staticFile(`sfx/${sfx}.mp3`)} volume={volume} />
    </Sequence>
  );
};

/** Zumbido do ventilador ligado, de `from` (s) até o fim da cena. */
const FanHum: React.FC<{ from: number; volume?: number }> = ({ from, volume = 0.12 }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round(from * fps))} layout="none">
      <Audio src={staticFile("sfx/fan-hum.mp3")} volume={(f) => volume * Math.min(1, f / 8)} loop />
    </Sequence>
  );
};

/** Etiqueta de era que entra num instante (s) da cena. */
const TagFrom: React.FC<{ at: number; era: "future" | "present"; top?: number; until?: number }> = ({ at, era, top, until }) => {
  const { fps } = useVideoConfig();
  const from = Math.round(at * fps);
  return (
    <Sequence from={from} durationInFrames={until !== undefined ? Math.max(1, Math.round(until * fps) - from) : undefined} layout="none">
      <EraTag era={era} top={top} />
    </Sequence>
  );
};

/** O ventilador-relíquia na mão do Kip (coordenadas da mão). */
const relicFan = (spin = 0, speed = 0, cageGlow = 0) => <Fan grip dusty scale={0.5} spin={spin} speed={speed} cageGlow={cageGlow} />;
/** Centro da grade do ventilador-relíquia na tela, a partir da mão do Kip. */
const relicCage = (hand: { x: number; y: number }, kipScale: number) => ({ x: hand.x, y: hand.y - 82 * 0.5 * kipScale });

/** Seta "voar" para cima riscada com um X vermelho. */
const NoFly: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) => {
  if (p <= 0) return null;
  return (
    <g transform={`translate(${x} ${y})`} opacity={Math.min(1, p * 2)}>
      <path d={`M0 0 L0 ${-150 * p}`} stroke="#F5C542" strokeWidth={10} strokeLinecap="round" strokeDasharray="22 16" />
      <path d={`M-26 ${-120 * p} L0 ${-152 * p} L26 ${-120 * p}`} stroke="#F5C542" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {p > 0.6 && (
        <g transform={`translate(0 -80) scale(${(p - 0.6) / 0.4})`} stroke="#E05A47" strokeWidth={14} strokeLinecap="round">
          <line x1={-44} y1={-44} x2={44} y2={44} />
          <line x1={44} y1={-44} x2={-44} y2={44} />
        </g>
      )}
    </g>
  );
};

const Pill: React.FC<{ x: number; y: number; text: string; show: number; color?: string; size?: number }> = ({ x, y, text, show, color = "#9AA5B1", size = 40 }) =>
  show > 0 ? (
    <g transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * show})`} opacity={show}>
      <rect x={-text.length * size * 0.33 - 24} y={-size * 0.95} width={text.length * size * 0.66 + 48} height={size * 1.7} rx={size * 0.85} fill="#ffffff" stroke={color} strokeWidth={5} />
      <text y={size * 0.33} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill="#111827">
        {text}
      </text>
    </g>
  ) : null;

// c01 — "We dug this out of the Old Layers: a propeller locked inside a cage. It can't fly anywhere. So what was it for?"
const C01: React.FC<SceneProps> = (props) => {
  const { t, dur, at } = useScene(props);
  const G = 1060;
  const K = { x: 560, y: G, scale: 1.8, facing: 1 as const };
  const tDug = at("dug", 0.04);
  const tLayers = at("Layers", 0.2, { edge: "end" });
  const tProp = at("propeller", 0.27);
  const tCage = at("cage", 0.45);
  const tFly = at("fly", 0.6);
  const tWhat = at("what", 0.82);
  const pose = poseAt(t, [
    { t: 0, pose: "holdUp" },
    { t: tWhat - 0.15, pose: "holdUp" },
    { t: tWhat + 0.25, pose: "point" },
  ]);
  const hand = jointWorld({ ...K, pose }, "nearHand");
  const cage = relicCage(hand, K.scale);
  // ele dá um peteleco na pá depois de "fly": gira e vai parando
  const sinceFlick = Math.max(0, t - (tFly + 0.35));
  const spin = 520 * (1 - Math.exp(-sinceFlick * 1.2));
  const speed = 520 * 1.2 * Math.exp(-sinceFlick * 1.2) * (sinceFlick > 0 ? 1 : 0);
  const mag = ramp(t, tProp - 0.1, tProp + 0.25) * (1 - ramp(t, tCage + 0.5, tCage + 0.8));
  const dig = { x: 30, w: 440, depth: 190 };
  const imprint = { x: dig.x + dig.w * 0.5, y: G + dig.depth - 40 };
  const arrow = ramp(t, tDug, tLayers);
  const citizens = [
    { from: 1180, to: 860, delay: 0 },
    { from: 1300, to: 990, delay: 0.15 },
  ];
  return (
    <>
      <Svg zoom={mix(1, 1.04, t / dur)} cy={900}>
        <FutureBackdrop variant="city" groundY={G} />
        <DigSite x={dig.x} groundY={G} w={dig.w} depth={dig.depth} glow={ramp(t, tDug, tDug + 0.3)} />
        {arrow > 0 && (
          <path
            d={`M${hand.x - 30} ${hand.y + 40} Q${hand.x - 280} ${hand.y + 140} ${imprint.x} ${imprint.y - 20}`}
            fill="none"
            stroke="#F5C542"
            strokeWidth={7}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - arrow}
            opacity={1 - ramp(t, tProp, tProp + 0.3)}
          />
        )}
        {citizens.map((c, i) => {
          const w = walkAlong(t, { fromX: c.from, toX: c.to, start: tFly - 0.2 + c.delay, end: tFly + 0.9 + c.delay });
          const shrug = ramp(t, tWhat + i * 0.1, tWhat + 0.3 + i * 0.1);
          const p: Pose | PoseName = w.walking ? w.pose : shrug > 0 ? mixPose("stand", "shrug", shrug) : "stand";
          return <Stickman key={i} {...CITIZEN} x={w.x} y={G} scale={1.45} facing={-1} pose={p} expression="curious" />;
        })}
        <RelicGlow x={cage.x} y={cage.y} r={110} strength={1 - 0.6 * ramp(t, tFly, tFly + 0.4)} />
        <Stickman
          {...K}
          pose={pose}
          expression={t < tFly ? "curious" : t < tWhat ? "worried" : "worried"}
          holdNear={relicFan(spin, speed, ramp(t, tCage, tCage + 0.2) * (1 - ramp(t, tCage + 0.8, tCage + 1.1)))}
          look={t < tDug + 0.6 ? -0.8 : t < tWhat ? 0.6 : -0.6}
        />
        <NoFly x={cage.x + 150} y={cage.y - 40} p={ramp(t, tFly - 0.05, tFly + 0.45)} />
        <Magnifier cx={800} cy={560} r={160} fromX={cage.x + 30} fromY={cage.y} show={mag}>
          <Fan x={0} y={232 * 1.9} scale={1.9} dusty spin={20} />
        </Magnifier>
      </Svg>
      <TagFrom at={0} era="future" top={430} />
      <Cue at={tProp} sfx="pop" volume={0.25} />
      <Cue at={tFly + 0.35} sfx="whoosh" volume={0.15} />
    </>
  );
};

// c02 — "So I tapped my Chrono-Band and jumped back to the old days, the 2020s, right into a very hot summer afternoon."
const C02: React.FC<SceneProps> = (props) => {
  const { t, at } = useScene(props);
  const G = GROUND_Y;
  const tTap = at("tapped", 0.06);
  const tBand = at("Chrono", 0.14);
  const tJump = at("jumped", 0.27);
  const tOld = at("old", 0.43);
  const tHot = at("hot", 0.8);
  const portal = { x: 760, y: G - 215 };
  const tSwitch = Math.max(tJump + 1.0, tOld - 0.2);
  const future = t < tSwitch;
  const walk = walkAlong(t, { fromX: 380, toX: portal.x - 40, start: tJump, end: tJump + 0.75, rest: "stand" });
  const futurePose =
    t < tJump
      ? poseAt(t, [
          { t: 0, pose: "stand" },
          { t: tTap, pose: "stand" },
          { t: tTap + 0.25, pose: "tapWrist" },
          { t: tJump - 0.15, pose: "tapWrist" },
          { t: tJump, pose: "stand" },
        ])
      : walk.pose;
  const kipFutureX = t < tJump ? 380 : walk.x;
  const vanish = ramp(t, tJump + 0.5, tJump + 0.8);
  const bandGlow = ramp(t, tTap, tTap + 0.2) * (1 - ramp(t, tJump, tJump + 0.3));
  const wrist = jointWorld({ x: 380, y: G, scale: 1.8, facing: 1, pose: "tapWrist" }, "farHand");
  const arrive = ramp(t, tSwitch, tSwitch + 0.6);
  const hot = ramp(t, tHot - 0.1, tHot + 0.4);
  const pastPose = poseAt(t, [
    { t: tSwitch, pose: "surprised" },
    { t: tSwitch + 0.9, pose: "stand" },
    { t: tHot - 0.1, pose: "stand" },
    { t: tHot + 0.35, pose: "sad" },
  ]);
  const K = { x: 420, y: G, scale: 1.8, facing: 1 as const };
  const head = jointWorld({ ...K, pose: pastPose }, "head");
  return (
    <>
      <Svg>
        {future ? (
          <>
            <FutureBackdrop variant="city" />
            <TimePortal x={portal.x} y={portal.y} open={ramp(t, tBand, tBand + 0.5)} collapse={ramp(t, tJump + 0.7, tJump + 1.0)} />
            {bandGlow > 0 && <circle cx={wrist.x} cy={wrist.y} r={30 + 10 * Math.sin(t * 20)} fill="#8B5CF6" opacity={0.35 * bandGlow} />}
            <Stickman x={kipFutureX} y={G} scale={1.8 * (1 - 0.3 * vanish)} pose={futurePose} expression="determined" holdNear={relicFan()} opacity={1 - vanish} />
          </>
        ) : (
          <>
            <PresentBackdrop variant="home" />
            <Thermometer x={820} y={560} value={mix(26, ROOM_TEMP, hot)} scale={1.25} label={hot} />
            <HeatShimmer x={140} y={G - 20} w={820} t={t} amount={hot} />
            <ArrivalRing x={420} y={G - 215} p={arrive} />
            <Stickman
              {...K}
              pose={pastPose}
              expression={t < tSwitch + 1.2 ? "shocked" : t < tHot ? "curious" : "worried"}
              look={t < tHot ? Math.sin(t * 3) : 1}
              holdNear={relicFan()}
              opacity={ramp(t, tSwitch + 0.25, tSwitch + 0.5)}
            />
            <Sweat cx={head.x} cy={head.y} r={26 * K.scale} t={t} amount={hot} />
            <rect x={0} y={0} width={1080} height={1920} fill="#ffffff" opacity={0.85 * (1 - ramp(t, tSwitch, tSwitch + 0.3))} />
          </>
        )}
      </Svg>
      <TagFrom at={0} era="future" until={tSwitch} />
      <TagFrom at={tSwitch + 0.3} era="present" />
      <Cue at={tBand} sfx="whoosh" volume={0.35} />
      <Cue at={tSwitch} sfx="pop" volume={0.3} />
    </>
  );
};

// Poses sob medida (olhando para a direita)
const REACH: Pose = { lean: 4, head: -4, near: [72, 8], far: [-12, 10], legNear: [10, 0], legFar: [-8, 0] };
const SIT: Pose = { lean: 2, head: 0, near: [30, 50], far: [-6, 40], legNear: [88, 88], legFar: [80, 80] };
const RELAX: Pose = { lean: -10, head: -10, near: [-28, 14], far: [-36, 10], legNear: [84, 70], legFar: [76, 64] };
/** Abanando o rosto com a mão (calor). */
const fanning = (t: number): Pose => ({ lean: 6, head: 8, near: [150 + Math.sin(t * 14) * 14, 60], far: [-6, 6], legNear: [6, 0], legFar: [-6, 0] });

// c03 — "Back then, people in hot rooms pressed a button, sat right in front of the spinning blades, and sighed with relief."
const C03: React.FC<SceneProps> = (props) => {
  const { t, at } = useScene(props);
  const G = GROUND_Y;
  const PS = 1.55;
  const F = { x: 905, scale: 1.45 };
  const tPressed = at("pressed", 0.3);
  const tSat = at("sat", 0.5);
  const tSpin = at("spinning", 0.72);
  const tRelief = at("relief", 0.93);
  // pessoa: mão na altura do painel de botões do ventilador
  const reach = jointWorld({ x: 0, y: G, scale: PS, facing: 1, pose: REACH }, "nearHand");
  const panelH = (G - reach.y) / F.scale;
  const panelX = F.x - 16 * F.scale - 4; // dir = -1 espelha o painel para a esquerda do poste
  const reachX = panelX - reach.x - 10;
  const chairX = 590;
  const walkIn = walkAlong(t, { fromX: 520, toX: reachX, start: tPressed - 0.75, end: tPressed - 0.1 });
  const back = ramp(t, tSat - 0.1, tSat + 0.45);
  const personX = t < tSat - 0.1 ? walkIn.x : mix(reachX, chairX, back);
  let personPose: Pose | PoseName;
  if (t < tPressed - 0.75) personPose = fanning(t);
  else if (walkIn.walking) personPose = walkIn.pose;
  else if (t < tSat - 0.1) personPose = mixPose("stand", REACH, ramp(t, tPressed - 0.15, tPressed));
  else if (t < tRelief - 0.1) personPose = mixPose(REACH, SIT, back);
  else personPose = mixPose(SIT, RELAX, ramp(t, tRelief - 0.1, tRelief + 0.35));
  const on = t >= tPressed ? 1 : 0;
  const run = Math.max(0, t - tPressed);
  const speed = on ? 1100 * ramp(t, tPressed, tPressed + 0.8, "in") : 0;
  const spin = on ? 1100 * (run - 0.4 * Math.min(run, 0.8)) : 0;
  const breeze = ramp(t, tPressed + 0.2, tSpin);
  const head = jointWorld({ x: personX, y: G, scale: PS, facing: 1, pose: personPose }, "head");
  const kipPose = poseAt(t, [
    { t: 0, pose: "holdUp" },
    { t: tPressed - 0.3, pose: "holdUp" },
    { t: tPressed, pose: "think" },
    { t: tRelief - 0.1, pose: "think" },
    { t: tRelief + 0.25, pose: "surprised" },
  ]);
  return (
    <>
      <Svg>
        <PresentBackdrop variant="home" />
        <Thermometer x={180} y={520} value={ROOM_TEMP} scale={1.0} />
        <Chair x={chairX - 6} groundY={G} seat={70} scale={1.05} />
        <Fan x={F.x} y={G} scale={F.scale} dir={-1} spin={spin} speed={speed} panelH={panelH} on={on} />
        <Stickman {...PP02} x={personX} y={G} scale={PS} pose={personPose} expression={t > tRelief ? "happy" : t > tSat ? "neutral" : "worried"} look={0.6} />
        <Sweat cx={head.x} cy={head.y} r={26 * PS} t={t} amount={1 - ramp(t, tSpin, tRelief)} />
        <Breeze x={F.x - 70} y={G - 232 * F.scale} dir={-1} length={560} spread={260} power={breeze} t={t} />
        <Stickman x={150} y={G} scale={1.7} pose={kipPose} expression={t > tRelief ? "shocked" : "curious"} look={0.8} holdNear={relicFan()} />
      </Svg>
      <TagFrom at={0} era="present" />
      <Cue at={tPressed} sfx="click" volume={0.45} />
      <FanHum from={tPressed} />
      <Cue at={tRelief} sfx="pop" volume={0.2} />
    </>
  );
};

// c04 — "But the room never got cooler. The breeze swept warm air off the skin, so sweat evaporated faster and carried heat away."
const C04: React.FC<SceneProps> = (props) => {
  const { t, at } = useScene(props);
  const tNever = at("never", 0.1);
  const tCooler = at("cooler", 0.2, { edge: "end" });
  const tBreeze = at("breeze", 0.27);
  const tSwept = at("swept", 0.32);
  const tWarm = at("warm", 0.38);
  const tSkin = at("skin", 0.5);
  const tSweat = at("sweat", 0.58);
  const tEvap = at("evaporated", 0.64);
  const tHeat = at("heat", 0.88);
  const wipe = ramp(t, tBreeze - 0.25, tBreeze + 0.25, "out");
  const room = 1 - ramp(t, tBreeze - 0.05, tBreeze + 0.2);
  return (
    <>
      <Svg>
        <rect width={1080} height={1920} fill="#F7F0E6" />
        <rect x={40} y={300} width={1000} height={880} rx={40} fill="#FBF6EE" stroke="#CDB9A0" strokeWidth={4} />
        {/* 1) a sala: o termômetro não se mexe na frente do ventilador */}
        {room > 0 && (
          <g opacity={room}>
            <Fan x={830} y={1040} scale={1.55} dir={-1} spin={t * 1100} speed={1100} on={1} />
            <Breeze x={760} y={1040 - 232 * 1.55} dir={-1} length={560} spread={260} power={1} t={t} />
            <Thermometer x={380} y={720} value={ROOM_TEMP} scale={1.8} />
            <Pill x={420} y={1000} text="still 34°C" show={ramp(t, tNever, tNever + 0.25)} />
            {t > tNever && t < tCooler + 0.6 && (
              <g transform="translate(380 470)" stroke="#9AA5B1" strokeWidth={10} strokeLinecap="round" opacity={ramp(t, tNever, tNever + 0.2)}>
                <line x1={-30} y1={-8} x2={30} y2={-8} />
                <line x1={-30} y1={12} x2={30} y2={12} />
              </g>
            )}
          </g>
        )}
        {/* 2) o corte da pele */}
        <defs>
          <clipPath id="c04wipe">
            <circle cx={540} cy={640} r={20 + wipe * 900} />
          </clipPath>
        </defs>
        {wipe > 0 && (
          <g clipPath="url(#c04wipe)">
            <rect x={40} y={300} width={1000} height={880} rx={40} fill="#FBF6EE" />
            <SkinCutaway
              x={110}
              y={380}
              t={t}
              sweep={ramp(t, tSwept, tSkin + 0.2)}
              evap={ramp(t, tEvap - 0.1, tEvap + 1.0)}
              heat={ramp(t, tHeat - 0.1, tHeat + 0.6)}
              labels={{ warm: ramp(t, tWarm - 0.1, tWarm + 0.2), sweat: ramp(t, tSweat - 0.1, tSweat + 0.2), heat: ramp(t, tHeat - 0.05, tHeat + 0.25) }}
            />
          </g>
        )}
        <Stickman x={150} y={1180} scale={1.05} pose={t < tHeat ? "explain" : "point"} expression={t < tBreeze ? "worried" : t < tEvap ? "curious" : "happy"} holdNear={relicFan()} />
      </Svg>
      <TagFrom at={0.2} era="present" />
      <FanHum from={0} volume={0.08} />
      <Cue at={tBreeze} sfx="whoosh" volume={0.2} />
      <Cue at={tEvap} sfx="pop" volume={0.2} />
      <Cue at={tHeat} sfx="ding" volume={0.28} />
    </>
  );
};

// c05 — "Point it at an empty chair, and it cooled nobody. On Lumen, a cool breeze follows me around. Back then, people chased the breeze."
const C05: React.FC<SceneProps> = (props) => {
  const { t, at } = useScene(props);
  const MID = 880;
  const TOPG = 840;
  const BOTG = 1235;
  const tChair = at("chair", 0.12);
  const tNobody = at("nobody", 0.25);
  const tLumen = at("Lumen", 0.36);
  const tFollows = at("follows", 0.52);
  const tBack = at("Back", 0.7);
  const tChased = at("chased", 0.82);
  const chairX = 400;
  // em cima: ventilador soprando numa cadeira vazia; depois alguém corre para a brisa
  const person = walkAlong(t, { fromX: -80, toX: chairX + 4, start: tBack - 0.1, end: tChased + 0.35 });
  const sit = ramp(t, tChased + 0.35, tChased + 0.75);
  const personPose: Pose | PoseName = person.walking ? person.pose : sit > 0 ? mixPose("stand", RELAX, sit) : "stand";
  const top = (
    <g>
      <PresentBackdrop variant="home" groundY={TOPG} />
      <Thermometer x={160} y={560} value={ROOM_TEMP} scale={0.75} />
      <Chair x={chairX - 4} groundY={TOPG} seat={48} scale={0.72} />
      <Fan x={790} y={TOPG} scale={1.0} dir={-1} spin={t * 1100} speed={1100} on={1} />
      <Breeze x={740} y={TOPG - 232} dir={-1} length={460} spread={180} power={1} t={t} n={10} />
      {t > tBack - 0.1 && <Stickman {...PP02} x={person.x} y={TOPG} scale={1.05} pose={personPose} expression="happy" />}
      {t > tNobody && t < tBack && (
        <g transform={`translate(${chairX} ${TOPG - 120}) scale(${ramp(t, tNobody, tNobody + 0.25)})`} stroke="#9AA5B1" strokeWidth={14} strokeLinecap="round">
          <line x1={-50} y1={-50} x2={50} y2={50} />
          <line x1={50} y1={-50} x2={-50} y2={50} />
        </g>
      )}
      <Pill x={chairX} y={TOPG - 250} text="empty" show={ramp(t, tChair, tChair + 0.25) * (1 - ramp(t, tBack - 0.2, tBack))} size={34} />
    </g>
  );
  // embaixo: em Lumen, uma brisa fresca segue o Kip (ficção)
  const reveal = ramp(t, tLumen - 0.25, tLumen + 0.1);
  const kipWalk = walkAlong(t, { fromX: 200, toX: 700, start: tLumen, end: tBack });
  const kipPose: Pose | PoseName = kipWalk.walking ? kipWalk.pose : t > tBack ? "explain" : "stand";
  const kipHead = jointWorld({ x: kipWalk.x, y: BOTG, scale: 1.0, facing: 1, pose: kipPose }, "head");
  const bottom = (
    <g>
      <FutureBackdrop variant="city" groundY={BOTG} />
      <LumenBreeze x={kipHead.x - 80} y={kipHead.y - 30} t={t} show={ramp(t, tFollows - 0.3, tFollows)} />
      <Stickman x={kipWalk.x} y={BOTG} scale={1.0} pose={kipPose} expression="happy" holdNear={relicFan()} />
      <rect x={0} y={MID} width={1080} height={1920 - MID} fill="#EEF3F7" opacity={0.75 * (1 - reveal)} />
    </g>
  );
  return (
    <>
      <Svg>
        <SplitCompare top={top} bottom={bottom} topLabel="THE OLD DAYS" bottomLabel="MY TIME" mid={MID} />
      </Svg>
      <FanHum from={0} volume={0.07} />
      <Cue at={tNobody} sfx="pop" volume={0.22} />
      <Cue at={tFollows} sfx="ding" volume={0.25} />
      <Cue at={tChased + 0.3} sfx="pop" volume={0.2} />
    </>
  );
};

/** Vitrine do museu de Lumen. */
const DisplayCase: React.FC<{ x: number; groundY: number; lit: number }> = ({ x, groundY, lit }) => (
  <g>
    <rect x={x - 90} y={groundY - 150} width={180} height={150} rx={14} fill="#E3EAF0" stroke="#111827" strokeWidth={4} />
    <rect x={x - 110} y={groundY - 520} width={220} height={370} rx={20} fill="#22D3EE" opacity={0.08 + 0.12 * lit} stroke="#22D3EE" strokeWidth={5} />
  </g>
);

// c06 — "So it wasn't a broken flying machine. It never cooled the air. It cooled people, one breeze at a time."
const C06: React.FC<SceneProps> = (props) => {
  const { t, at } = useScene(props);
  const G = GROUND_Y;
  const tFlying = at("flying", 0.2);
  const tNever = at("never", 0.4);
  const tPeople = at("people", 0.66);
  const tOne = at("one", 0.76);
  const tTime = at("time", 0.92);
  const caseX = 880;
  const pose = poseAt(t, [
    { t: 0, pose: "stand" },
    { t: 0.4, pose: "holdUp" },
    { t: tNever - 0.1, pose: "holdUp" },
    { t: tNever + 0.2, pose: "explain" },
    { t: tOne - 0.2, pose: "explain" },
    { t: tOne + 0.1, pose: "point" },
    { t: tTime, pose: "point" },
    { t: tTime + 0.3, pose: "celebrate" },
  ]);
  const K = { x: 470, y: G, scale: 1.8, facing: 1 as const };
  const hand = jointWorld({ ...K, pose }, "nearHand");
  const place = ramp(t, tOne - 0.1, tOne + 0.5);
  const placed = place >= 1;
  const target = { x: caseX, y: G - 150 };
  const fanPos = { x: mix(hand.x, target.x, place), y: mix(hand.y + 150 * 0.5 * K.scale, target.y, place) };
  const fanScale = mix(0.5 * K.scale, 1.05, place);
  const cage = relicCage(hand, K.scale);
  return (
    <>
      <Svg zoom={mix(1, 1.03, ramp(t, 0, 7))} cy={900}>
        <FutureBackdrop variant="museum" />
        <InsightPanel x={540} y={500} show={ramp(t, tNever - 0.1, tNever + 0.25)} mode={ramp(t, tPeople - 0.1, tPeople + 0.25)} t={t} />
        <DisplayCase x={caseX} groundY={G} lit={placed ? 1 : 0} />
        {place > 0 && <RelicGlow x={caseX} y={G - 340} r={placed ? 140 : 90} strength={placed ? 1 : 0.6} />}
        <ArrivalRing x={470} y={G - 215} p={ramp(t, 0, 0.55)} />
        <Stickman {...K} pose={pose} expression={t < tNever ? "determined" : "happy"} holdNear={place > 0 ? undefined : relicFan()} opacity={ramp(t, 0.25, 0.45)} />
        {place > 0 && <Fan x={fanPos.x} y={fanPos.y} scale={fanScale} dusty spin={placed ? (t - tOne) * 60 : 0} />}
        <NoFly x={cage.x + 160} y={cage.y - 30} p={ramp(t, tFlying - 0.05, tFlying + 0.4) * (1 - ramp(t, tNever - 0.2, tNever))} />
      </Svg>
      <TagFrom at={0.3} era="future" />
      <Cue at={0} sfx="pop" volume={0.25} />
      <Cue at={tPeople} sfx="ding" volume={0.28} />
      <Cue at={tTime + 0.3} sfx="ding" volume={0.22} />
    </>
  );
};

export const scenes: Record<string, React.FC<SceneProps>> = {
  "c01-relic": C01,
  "c02-jump": C02,
  "c03-room": C03,
  "c04-inside": C04,
  "c05-compare": C05,
  "c06-home": C06,
};
