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
import { ArrivalRing, FutureDoor, Magnifier } from "../stickman-house-key/props";
import { CentralClock, HalvingChain, LightPedestal, Pill, Sparks, StepMotor, Watch, WatchCutaway } from "./props";

/**
 * "Stuck in 2026", episódio 1: The Crystal That Counts Time.
 * Regra: todo evento visual acontece QUANDO a palavra é dita — at("palavra", fração-reserva).
 * Kip olha para a direita e segura o relógio na mão DIREITA (near) o episódio todo.
 * Ben (PP-02) é o morador de 2026 do episódio do ventilador: camiseta mostarda, cabelo curto.
 */

const BEN = { kind: "person" as const, shirt: "#E0B44C", hair: "short" as const };
const CITIZEN = { kind: "person" as const, shirt: FUTURE_PEOPLE.tunic, hair: "none" as const };

const Svg: React.FC<{ children: React.ReactNode; zoom?: number; cx?: number; cy?: number }> = ({ children, zoom = 1, cx = 540, cy = 960 }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <g transform={`translate(${cx} ${cy}) scale(${zoom}) translate(${-cx} ${-cy})`}>{children}</g>
    </svg>
  </AbsoluteFill>
);

type Sfx = "whoosh" | "pop" | "ding" | "click" | "splat";
/** Efeito sonoro num instante da cena (s). */
const Cue: React.FC<{ at: number; sfx: Sfx; volume?: number }> = ({ at, sfx, volume = 0.3 }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round(at * fps))} durationInFrames={fps * 2} layout="none">
      <Audio src={staticFile(`sfx/${sfx}.mp3`)} volume={volume} />
    </Sequence>
  );
};

/** Tique-taque do relógio: um clique por segundo a partir de `from` (s), `n` vezes. */
const Ticks: React.FC<{ from: number; n: number; volume?: number }> = ({ from, n, volume = 0.18 }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <Cue key={i} at={from + i} sfx="click" volume={volume} />
    ))}
  </>
);

export const makeScenes = (L: SceneLang = EN): Record<string, React.FC<SceneProps>> => {
  const T = translator(L);
  /** Etiqueta de era que entra num instante (s) da cena. */
  const TagFrom: React.FC<{ at: number; era: "future" | "present"; top?: number; until?: number }> = ({ at, era, top, until }) => {
    const { fps } = useVideoConfig();
    const from = Math.round(at * fps);
    return (
      <Sequence from={from} durationInFrames={until !== undefined ? Math.max(1, Math.round(until * fps) - from) : undefined} layout="none">
        <EraTag era={era} top={top} label={era === "present" ? L.tagPresent : L.tagFuture} />
      </Sequence>
    );
  };

  /** O relógio na mão do Kip (coordenadas da mão): o mostrador fica logo acima da mão. */
  const heldWatch = (o: { dusty?: boolean; sec?: number; open?: number; glow?: number; scale?: number } = {}) => (
    <Watch y={-30 * (o.scale ?? 0.55)} scale={o.scale ?? 0.55} dusty={o.dusty} sec={o.sec} open={o.open} crystalGlow={o.glow} />
  );

  /** Buraco de escavação simples (as Old Layers de Lumen). */
  const DigPit: React.FC<{ x: number; groundY: number; w: number; depth: number; glow?: number }> = ({ x, groundY, w, depth, glow = 0 }) => {
    const bands = ["#C3D2DE", "#AFC1CF", "#9BAFC0", "#8599AC"];
    const bh = depth / bands.length;
    return (
      <g>
        {bands.map((c, i) => (
          <rect key={i} x={x} y={groundY + i * bh} width={w} height={bh + 1} fill={c} />
        ))}
        <rect x={x} y={groundY} width={w} height={depth} fill="none" stroke="#B8C7D3" strokeWidth={4} />
        {glow > 0 && <ellipse cx={x + w * 0.5} cy={groundY + depth - 30} rx={90} ry={26} fill="#F5C542" opacity={0.35 * glow} />}
        {[x + 10, x + w - 10].map((sx) => (
          <g key={sx}>
            <line x1={sx} y1={groundY} x2={sx} y2={groundY - 70} stroke="#B8C7D3" strokeWidth={6} />
            <circle cx={sx} cy={groundY - 74} r={7} fill="#22D3EE" />
          </g>
        ))}
        <path d={`M${x + 10} ${groundY - 70} Q${x + w / 2} ${groundY - 40} ${x + w - 10} ${groundY - 70}`} fill="none" stroke="#22D3EE" strokeWidth={4} opacity={0.6} />
      </g>
    );
  };

  // Poses sob medida (olhando para a direita)
  const REACH: Pose = { lean: 4, head: -4, near: [72, 8], far: [-12, 10], legNear: [10, 0], legFar: [-8, 0] };
  /** Olhando o relógio no pulso (braço do lado da câmera levantado na frente do rosto). */
  const CHECK: Pose = { lean: 2, head: 14, near: [62, 92], far: [-14, 8], legNear: [6, 0], legFar: [-6, 0] };
  /** Recuo de susto (bateu na porta / faíscas). */
  const RECOIL: Pose = { lean: -14, head: -10, near: [40, 60], far: [-40, 50], legNear: [16, 8], legFar: [-20, 6] };

  // c01 — "Lumen's Central Clock times every door and portal, and it was falling behind. Then I dug up a watch with the same crystal."
  const C01: React.FC<SceneProps> = (props) => {
    const { t, dur, at } = useLangScene(props, L, "c01");
    const tCentral = at("Central", 0.08);
    const tDoor = at("door", 0.27);
    const tPortal = at("portal", 0.34);
    const tFalling = at("falling", 0.52);
    const tBehind = at("behind", 0.57);
    const tThen = at("Then", 0.66);
    const tDug = at("dug", 0.71);
    const tWatch = at("watch", 0.77);
    const tSame = at("same", 0.87);
    const tCrystal = at("crystal", 0.9);
    const cut = tThen - 0.1;
    const lag = ramp(t, tFalling - 0.1, tFalling + 0.3);
    // o ponteiro de luz anda devagar e, com o atraso, tropeça para trás
    const clockHand = (o: number) => 40 + t * 14 - 26 * lag + o;

    if (t < cut) {
      // Plano A: a porta que abre tarde
      const G = GROUND_Y;
      const door = { x: 700, w: 230, h: 430 };
      const walk = walkAlong(t, { fromX: 250, toX: 612, start: 0, end: tDoor, rest: "stand" });
      const bonk = ramp(t, tDoor - 0.05, tDoor + 0.15) * (1 - ramp(t, tDoor + 0.6, tDoor + 1.0));
      const open = ramp(t, tBehind + 0.05, tBehind + 0.45);
      const x = t < tDoor ? walk.x : 612 - 26 * bonk;
      const pose: Pose | PoseName = t < tDoor ? walk.pose : bonk > 0.02 ? mixPose("stand", RECOIL, bonk) : open > 0 ? mixPose("stand", "shrug", open) : "stand";
      const head = jointWorld({ x, y: G, scale: 1.8, facing: 1, pose }, "head");
      return (
        <>
          <Svg zoom={mix(1, 1.04, t / cut)} cy={900}>
            <FutureBackdrop variant="city" />
            <CentralClock x={330} y={650} r={98} t={t} hand={clockHand(0)} lag={lag} crystalGlow={0.5 + 0.5 * ramp(t, tCentral, tCentral + 0.3)} />
            {t > tCentral && t < tCentral + 0.8 && <circle cx={330} cy={650} r={120 + 60 * ramp(t, tCentral, tCentral + 0.8)} fill="none" stroke="#22D3EE" strokeWidth={6} opacity={1 - ramp(t, tCentral, tCentral + 0.8)} />}
            <Pill x={150} y={650} text={T("LATE")} show={ramp(t, tFalling, tFalling + 0.25)} color="#E05A47" size={40} />
            <FutureDoor x={door.x} groundY={G} w={door.w} h={door.h} scan={0.4 + 0.4 * Math.abs(Math.sin(t * 3))} open={open} />
            {/* portal pequeno que também falha (ficção): pisca na palavra "portal" */}
            {t > tPortal && t < tPortal + 0.9 && <TimePortal x={980} y={760} size={70} open={Math.abs(Math.sin((t - tPortal) * 18)) * (1 - ramp(t, tPortal + 0.5, tPortal + 0.9))} />}
            <Stickman x={x} y={G} scale={1.8} pose={pose} expression={t < tDoor ? "curious" : open > 0 ? "worried" : "shocked"} look={t < tDoor ? 0.4 : -0.6} />
            <Sparks x={head.x + 50} y={head.y - 10} p={ramp(t, tDoor, tDoor + 0.45)} r={60} />
          </Svg>
          <TagFrom at={0} era="future" top={430} />
          <Cue at={tDoor} sfx="splat" volume={0.3} />
          <Cue at={tBehind + 0.05} sfx="whoosh" volume={0.18} />
        </>
      );
    }

    // Plano B: a escavação e o cristal igual
    const G = 1060;
    const K = { x: 470, y: G, scale: 1.8, facing: 1 as const };
    const pit = { x: 40, w: 300, depth: 180 };
    const rise = ramp(t, tDug, tWatch + 0.15);
    const pose = poseAt(t, [
      { t: cut, pose: "crouch" },
      { t: tDug + 0.1, pose: "crouch" },
      { t: tWatch + 0.1, pose: "holdUp" },
    ]);
    const hand = jointWorld({ ...K, pose }, "nearHand");
    const dial = { x: hand.x, y: hand.y - 30 * 0.55 * K.scale };
    const from = { x: pit.x + pit.w / 2, y: G + pit.depth - 40 };
    const flyX = mix(from.x, dial.x, rise);
    const flyY = mix(from.y, dial.y, rise) - Math.sin(rise * Math.PI) * 160;
    const open = ramp(t, tSame - 0.15, tSame + 0.25);
    const glow = ramp(t, tCrystal - 0.05, tCrystal + 0.25);
    const mag = ramp(t, tSame - 0.1, tSame + 0.2);
    const clock = { x: 250, y: 700, r: 100 };
    const magC = { x: 820, y: 640, r: 145 };
    return (
      <>
        <Svg zoom={mix(1.02, 1.06, ramp(t, cut, dur))} cy={880}>
          <FutureBackdrop variant="city" groundY={G} />
          <rect x={-200} y={G} width={1480} height={900} fill="#D5E1EA" />
          <DigPit x={pit.x} groundY={G} w={pit.w} depth={pit.depth} glow={1 - rise} />
          <CentralClock x={clock.x} y={clock.y} r={clock.r} t={t} hand={clockHand(0)} lag={lag} crystalGlow={0.4 + 0.6 * glow} />
          {glow > 0 && (
            <path
              d={`M${magC.x - magC.r + 10} ${magC.y} Q${(magC.x + clock.x) / 2} ${clock.y - 260} ${clock.x + 30} ${clock.y - 40}`}
              fill="none"
              stroke="#22D3EE"
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray="18 14"
              pathLength={1}
              opacity={0.9 * glow}
            />
          )}
          {rise > 0 && rise < 1 && <Watch x={flyX} y={flyY} scale={0.55 * K.scale} dusty rotate={(1 - rise) * 160} />}
          {rise >= 1 && <RelicGlow x={dial.x} y={dial.y} r={80} strength={0.8} />}
          <Stickman {...K} pose={pose} expression={glow > 0 ? "shocked" : "curious"} look={t < tWatch ? -0.6 : 0.5} holdNear={rise >= 1 ? heldWatch({ dusty: true, open, glow }) : undefined} />
          <Magnifier cx={magC.x} cy={magC.y} r={magC.r} fromX={dial.x + 20} fromY={dial.y} show={mag}>
            <Watch scale={4.4} dusty open={open} crystalGlow={glow} strap={false} />
          </Magnifier>
        </Svg>
        <TagFrom at={cut} era="future" top={430} />
        <Cue at={tDug} sfx="whoosh" volume={0.2} />
        <Cue at={tSame} sfx="pop" volume={0.25} />
        <Cue at={tCrystal} sfx="ding" volume={0.3} />
      </>
    );
  };

  // c02 — "I needed one that still worked. So I tapped my Chrono-Band and jumped back to the old days, the year 2026."
  const C02: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c02");
    const G = GROUND_Y;
    const tNeeded = at("needed", 0.04);
    const tWorked = at("worked", 0.19);
    const tTap = at("tapped", 0.31);
    const tBand = at("Chrono", 0.39);
    const tJump = at("jumped", 0.51);
    const tOld = at("old", 0.66);
    const tYear = at("year", 0.83);
    const portal = { x: 830, y: G - 215 };
    const tSwitch = Math.max(tJump + 1.0, tOld - 0.2);
    const future = t < tSwitch;
    const K0 = { x: 330, y: G, scale: 1.8, facing: 1 as const };
    // pedestal onde a mão alcança na pose REACH
    const reachHand = jointWorld({ ...K0, pose: REACH }, "nearHand");
    const ped = { x: reachHand.x + 20, y: reachHand.y + 8 };
    const place = ramp(t, tNeeded + 0.25, tWorked);
    const walk = walkAlong(t, { fromX: K0.x, toX: portal.x - 40, start: tJump, end: tJump + 0.8, rest: "stand" });
    const futurePose =
      t < tJump
        ? poseAt(t, [
            { t: 0, pose: "holdUp" },
            { t: tNeeded + 0.1, pose: "holdUp" },
            { t: tNeeded + 0.45, pose: REACH },
            { t: tWorked + 0.1, pose: REACH },
            { t: tWorked + 0.4, pose: "stand" },
            { t: tTap, pose: "stand" },
            { t: tTap + 0.25, pose: "tapWrist" },
            { t: tJump - 0.15, pose: "tapWrist" },
            { t: tJump, pose: "stand" },
          ])
        : walk.pose;
    const kipX = t < tJump ? K0.x : walk.x;
    const hand = jointWorld({ x: kipX, y: G, scale: 1.8, facing: 1, pose: futurePose }, "nearHand");
    const vanish = ramp(t, tJump + 0.55, tJump + 0.85);
    const bandGlow = ramp(t, tTap, tTap + 0.2) * (1 - ramp(t, tJump, tJump + 0.3));
    const wrist = jointWorld({ ...K0, pose: "tapWrist" }, "farHand");
    const watchOnPed = { x: ped.x, y: ped.y - 30 * 0.55 * 1.8 - 6 };
    const holding = place <= 0;
    const watchX = mix(hand.x, watchOnPed.x, place);
    const watchY = mix(hand.y - 30 * 0.55 * 1.8, watchOnPed.y, place);
    const arrive = ramp(t, tSwitch, tSwitch + 0.6);
    const pastPose = poseAt(t, [
      { t: tSwitch, pose: "surprised" },
      { t: tSwitch + 0.9, pose: "stand" },
      { t: tYear, pose: "stand" },
      { t: tYear + 0.3, pose: "point" },
    ]);
    return (
      <>
        <Svg>
          {future ? (
            <>
              <FutureBackdrop variant="city" />
              <LightPedestal x={ped.x} y={ped.y} t={t} lit={ramp(t, tNeeded, tNeeded + 0.3)} />
              <TimePortal x={portal.x} y={portal.y} open={ramp(t, tBand, tBand + 0.5)} collapse={ramp(t, tJump + 0.75, tJump + 1.0)} />
              {bandGlow > 0 && <circle cx={wrist.x} cy={wrist.y} r={30 + 10 * Math.sin(t * 20)} fill="#8B5CF6" opacity={0.35 * bandGlow} />}
              {!holding && <Watch x={watchX} y={watchY} scale={0.55 * 1.8} dusty />}
              {place >= 1 && <RelicGlow x={watchOnPed.x} y={watchOnPed.y} r={70} strength={0.6} />}
              <Stickman
                x={kipX}
                y={G}
                scale={1.8 * (1 - 0.3 * vanish)}
                pose={futurePose}
                expression={t < tTap ? "curious" : "determined"}
                holdNear={holding ? heldWatch({ dusty: true }) : undefined}
                opacity={1 - vanish}
              />
            </>
          ) : (
            <>
              <PresentBackdrop variant="street" />
              <ArrivalRing x={430} y={G - 215} p={arrive} />
              <Stickman x={430} y={G} scale={1.8} pose={pastPose} expression={t < tSwitch + 1.2 ? "shocked" : "curious"} look={t < tYear ? Math.sin(t * 3) : 1} opacity={ramp(t, tSwitch + 0.25, tSwitch + 0.5)} />
              <Pill x={780} y={620} text="2026" show={ramp(t, tYear + 0.1, tYear + 0.45)} color="#E0B44C" size={80} />
              <rect x={0} y={0} width={1080} height={1920} fill="#ffffff" opacity={0.85 * (1 - ramp(t, tSwitch, tSwitch + 0.3))} />
            </>
          )}
        </Svg>
        <TagFrom at={0} era="future" until={tSwitch} />
        <TagFrom at={tSwitch + 0.3} era="present" />
        <Cue at={tWorked} sfx="click" volume={0.25} />
        <Cue at={tBand} sfx="whoosh" volume={0.35} />
        <Cue at={tSwitch} sfx="pop" volume={0.3} />
        <Cue at={tYear + 0.1} sfx="ding" volume={0.22} />
      </>
    );
  };

  // c03 — "There I met Ben. He checked his wrist, smiled, and handed me his watch. Its thin hand ticked once every second."
  const C03: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c03");
    const G = GROUND_Y;
    const tBen = at("Ben", 0.12);
    const tChecked = at("checked", 0.21);
    const tSmiled = at("smiled", 0.32);
    const tHanded = at("handed", 0.48);
    const tWatch = at("watch", 0.58);
    const tTicked = at("ticked", 0.77);
    const K = { x: 330, y: G, scale: 1.8, facing: 1 as const };
    const B = { scale: 1.6, facing: -1 as const };
    const benWalk = walkAlong(t, { fromX: 1180, toX: 700, start: 0, end: tBen + 0.35 });
    const benPose: Pose | PoseName = benWalk.walking
      ? benWalk.pose
      : poseAt(t, [
          { t: tBen + 0.35, pose: "stand" },
          { t: tChecked - 0.1, pose: "stand" },
          { t: tChecked + 0.2, pose: CHECK },
          { t: tSmiled + 0.4, pose: CHECK },
          { t: tHanded, pose: REACH },
          { t: tWatch + 0.2, pose: REACH },
          { t: tWatch + 0.6, pose: "stand" },
        ]);
    const benX = benWalk.x;
    const give = ramp(t, tHanded + 0.1, tWatch + 0.1);
    const kipPose = poseAt(t, [
      { t: 0, pose: "stand" },
      { t: tBen, pose: "wave" },
      { t: tChecked, pose: "stand" },
      { t: tHanded, pose: "stand" },
      { t: tHanded + 0.3, pose: REACH },
      { t: tWatch + 0.15, pose: REACH },
      { t: tWatch + 0.5, pose: "holdUp" },
    ]);
    const benHand = jointWorld({ x: benX, y: G, scale: B.scale, facing: B.facing, pose: benPose }, "nearHand");
    const kipHand = jointWorld({ ...K, pose: kipPose }, "nearHand");
    const inFlight = give > 0 && give < 1;
    const benHas = give <= 0;
    const kipHas = give >= 1;
    const benHead = jointWorld({ x: benX, y: G, scale: B.scale, facing: B.facing, pose: benPose }, "head");
    const sec = Math.max(0, t - tTicked + 0.05) + 17;
    const mag = ramp(t, tTicked - 0.1, tTicked + 0.2);
    return (
      <>
        <Svg>
          <PresentBackdrop variant="street" />
          <Stickman
            {...BEN}
            x={benX}
            y={G}
            scale={B.scale}
            facing={B.facing}
            pose={benPose}
            expression={t > tSmiled ? "happy" : t > tChecked ? "curious" : "neutral"}
            look={0.6}
            holdNear={benHas ? <Watch y={-8} scale={0.42} sec={t + 12} rotate={-20} /> : undefined}
          />
          <Pill x={benHead.x} y={benHead.y - 120} text="BEN" show={ramp(t, tBen, tBen + 0.25) * (1 - ramp(t, tHanded - 0.2, tHanded + 0.1))} color="#E0B44C" size={40} />
          {inFlight && <Watch x={mix(benHand.x, kipHand.x, give)} y={mix(benHand.y, kipHand.y - 30 * 0.55 * K.scale, give) - Math.sin(give * Math.PI) * 70} scale={mix(0.42 * B.scale, 0.55 * K.scale, give)} sec={t + 12} />}
          <Stickman {...K} pose={kipPose} expression={kipHas ? (t > tTicked ? "happy" : "shocked") : "curious"} look={kipHas ? 0.7 : 0.4} holdNear={kipHas ? heldWatch({ sec }) : undefined} />
          <Magnifier cx={600} cy={500} r={170} fromX={kipHand.x + 20} fromY={kipHand.y - 40} show={mag}>
            <Watch scale={5} sec={sec} strap={false} />
          </Magnifier>
        </Svg>
        <TagFrom at={0} era="present" />
        <Cue at={tChecked + 0.1} sfx="pop" volume={0.15} />
        <Cue at={tWatch} sfx="pop" volume={0.25} />
        <Ticks from={tTicked} n={3} volume={0.3} />
      </>
    );
  };

  // c04 — "Inside, a battery's voltage makes a quartz tuning fork vibrate 32,768 times a second."
  const C04: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c04");
    const tBattery = at("battery", 0.13);
    const tVoltage = at("voltage", 0.23);
    const tMakes = at("makes", 0.32);
    const tQuartz = at("quartz", 0.44);
    const tTuning = at("tuning", 0.51);
    const tVibrate = at("vibrate", 0.7);
    const tNum = at("32", 0.77);
    const tTimes = at("times", 0.83);
    const tSecond = at("second", 0.9);
    const intro = ramp(t, 0, 0.5, "out");
    const vib = ramp(t, tVibrate - 0.1, tVibrate + 0.3);
    const count = Math.round(32768 * ramp(t, tNum - 0.1, tTimes + 0.35, "out"));
    return (
      <>
        <Svg>
          <rect width={1080} height={1920} fill="#F7F0E6" />
          <rect x={40} y={300} width={1000} height={900} rx={40} fill="#FBF6EE" stroke="#CDB9A0" strokeWidth={4} />
          <g transform={`translate(540 690) scale(${0.8 + 0.2 * intro}) translate(-540 -690)`} opacity={intro}>
            <WatchCutaway tr={T}
              x={540}
              y={690}
              t={t}
              power={ramp(t, tBattery, tBattery + 0.3)}
              flow={mix(0, 0.7, ramp(t, tVoltage - 0.1, tMakes + 0.5))}
              vib={vib}
              zoomFork={ramp(t, tTuning - 0.1, tTuning + 0.3)}
              show={{ battery: ramp(t, tBattery, tBattery + 0.25), voltage: ramp(t, tVoltage, tVoltage + 0.25), quartz: ramp(t, tQuartz, tQuartz + 0.25) }}
            />
          </g>
          {count > 0 && (
            <g transform="translate(600 1120)">
              <rect x={-250} y={-58} width={500} height={92} rx={46} fill="#ffffff" stroke="#22D3EE" strokeWidth={6} />
              <text y={14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={60} fill="#111827">
                {count.toLocaleString(L.locale ?? "en-US")}
                <tspan fontSize={40} fill="#5E7183">{" "}/ s</tspan>
              </text>
            </g>
          )}
          {t > tSecond && <circle cx={600} cy={1095} r={260 * ramp(t, tSecond, tSecond + 0.6)} fill="none" stroke="#22D3EE" strokeWidth={5} opacity={1 - ramp(t, tSecond, tSecond + 0.6)} />}
          <Stickman x={150} y={1180} scale={1.05} pose={t < tQuartz ? "explain" : "point"} expression={vib > 0 ? "shocked" : "curious"} holdNear={heldWatch({ sec: t + 21 })} />
        </Svg>
        <TagFrom at={0.2} era="present" />
        <Cue at={tBattery} sfx="pop" volume={0.2} />
        <Cue at={tVoltage} sfx="whoosh" volume={0.18} />
        <Cue at={tVibrate} sfx="ding" volume={0.25} />
        <Cue at={tSecond} sfx="ding" volume={0.2} />
      </>
    );
  };

  // c05 — "A chip cuts that in half fifteen times in a row, leaving one pulse a second to move the hand."
  const C05: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c05");
    const tChip = at("chip", 0.04);
    const tHalf = at("half", 0.2);
    const tRow = at("row", 0.43);
    const tOne = at("one", 0.63);
    const tPulse = at("pulse", 0.66);
    const tMove = at("move", 0.83);
    const tHand = at("hand", 0.9);
    const lit = t < tHalf ? ramp(t, tChip, tChip + 0.4) : 1 + 15 * ramp(t, tHalf, tRow + 0.35, "inOut");
    const final = ramp(t, tOne - 0.1, tOne + 0.2);
    const CH = { x: 95, y: 330 };
    // última caixa (linha 4, coluna 1 do zigue-zague)
    const last = { x: CH.x + 98, y: CH.y + 3 * 140 + 92 };
    const motor = { x: 330, y: 1010 };
    const watch = { x: 790, y: 1030, scale: 2.8 };
    // pulsos: o primeiro sai em "pulse", depois um por segundo
    const firstPulse = tPulse + 0.05;
    const k = Math.floor(Math.max(0, t - firstPulse));
    const phase = t < firstPulse ? -1 : (t - firstPulse) % 1;
    const seg1 = phase >= 0 ? ramp(phase, 0, 0.35) : 0;
    const seg2 = phase >= 0 ? ramp(phase, 0.35, 0.7) : 0;
    const ticks = t < firstPulse + 0.7 ? 0 : k + (phase >= 0.7 ? 1 : 0);
    const motorFlash = phase >= 0.3 && phase < 0.6 ? 1 - Math.abs(phase - 0.45) / 0.15 : 0;
    const wire1 = `M${last.x} ${last.y + 8} L${last.x} ${motor.y - 80} Q${last.x} ${motor.y - 40} ${motor.x - 60} ${motor.y - 40}`;
    const wire2 = `M${motor.x + 80} ${motor.y} L${watch.x - 100} ${motor.y}`;
    const dot = (d: string, p: number) =>
      p > 0 && p < 1 ? <path d={d} fill="none" stroke="#F5C542" strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray="0.08 1" strokeDashoffset={-p * 0.92} /> : null;
    return (
      <>
        <Svg>
          <rect width={1080} height={1920} fill="#F7F0E6" />
          <rect x={40} y={290} width={1000} height={920} rx={40} fill="#FBF6EE" stroke="#CDB9A0" strokeWidth={4} />
          <HalvingChain locale={L.locale} x={CH.x} y={CH.y} lit={lit} final={final} />
          {final > 0 && (
            <g opacity={final}>
              <path d={wire1} fill="none" stroke="#9AA5B1" strokeWidth={6} strokeLinecap="round" />
              <path d={wire2} fill="none" stroke="#9AA5B1" strokeWidth={6} strokeLinecap="round" />
              {dot(wire1, seg1)}
              {dot(wire2, seg2)}
              <StepMotor x={motor.x} y={motor.y} pulse={motorFlash} />
              <Watch x={watch.x} y={watch.y} scale={watch.scale} sec={ticks} strap={false} />
              <Pill x={motor.x} y={motor.y + 90} text="motor" show={ramp(t, tMove - 0.1, tMove + 0.2)} color="#D9825B" size={34} />
            </g>
          )}
          <Pill x={700} y={1172} text={T("1 pulse / second")} show={ramp(t, tPulse, tPulse + 0.25)} color="#F5C542" size={34} />
          {t > tHand && <circle cx={watch.x} cy={watch.y} r={100 + 120 * ramp(t, tHand, tHand + 0.6)} fill="none" stroke="#F5C542" strokeWidth={6} opacity={1 - ramp(t, tHand, tHand + 0.6)} />}
        </Svg>
        <TagFrom at={0} era="present" />
        <Cue at={tChip} sfx="pop" volume={0.2} />
        <Cue at={tHalf} sfx="whoosh" volume={0.2} />
        <Cue at={tOne} sfx="ding" volume={0.28} />
        <Ticks from={firstPulse + 0.7} n={2} volume={0.35} />
      </>
    );
  };

  // c06 — "Back then, this crystal ticked inside an everyday watch. On Lumen, nobody remembers how our Central Clock keeps time."
  const C06: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c06");
    const MID = 880;
    const TOPG = 840;
    const BOTG = 1235;
    const tCrystal = at("crystal", 0.19);
    const tTicked = at("ticked", 0.24);
    const tEveryday = at("everyday", 0.35);
    const tLumen = at("Lumen", 0.49);
    const tNobody = at("nobody", 0.6);
    const tCentral = at("Central", 0.76);
    const tTime = at("time", 0.92);
    const K = { x: 330, y: TOPG, scale: 1.3, facing: 1 as const };
    const kipPose = poseAt(t, [
      { t: 0, pose: "holdUp" },
      { t: tEveryday, pose: "holdUp" },
      { t: tEveryday + 0.3, pose: "explain" },
    ]);
    const hand = jointWorld({ ...K, pose: kipPose }, "nearHand");
    const open = ramp(t, tCrystal - 0.1, tCrystal + 0.2) * (1 - ramp(t, tTicked + 0.1, tTicked + 0.3));
    const sec = 28 + Math.max(0, t - tTicked);
    const top = (
      <g>
        <PresentBackdrop variant="street" groundY={TOPG} />
        <Stickman {...K} pose={kipPose} expression="happy" look={0.6} holdNear={heldWatch({ sec, open, glow: open })} />
        <Magnifier cx={760} cy={470} r={140} fromX={hand.x + 20} fromY={hand.y - 30} show={ramp(t, tCrystal - 0.15, tCrystal + 0.15)}>
          <Watch scale={4.2} sec={sec} open={open} crystalGlow={open} strap={false} />
        </Magnifier>
      </g>
    );
    const reveal = ramp(t, tLumen - 0.25, tLumen + 0.1);
    const shrug = ramp(t, tNobody - 0.05, tNobody + 0.3);
    const citizens = [
      { x: 230, facing: 1 as const },
      { x: 860, facing: -1 as const },
    ];
    const bottom = (
      <g>
        <FutureBackdrop variant="city" groundY={BOTG} />
        <CentralClock x={540} y={1085} r={80} t={t} hand={40 + t * 14} lag={ramp(t, tCentral - 0.1, tCentral + 0.3)} crystalGlow={0.5} />
        {citizens.map((c, i) => {
          const head = jointWorld({ x: c.x, y: BOTG, scale: 1.0, facing: c.facing, pose: "shrug" }, "head");
          return (
            <g key={i}>
              <Stickman {...CITIZEN} x={c.x} y={BOTG} scale={1.0} facing={c.facing} pose={shrug > 0 ? mixPose("stand", "shrug", shrug) : "stand"} expression={shrug > 0 ? "worried" : "curious"} look={0.6} />
              {shrug > 0 && (
                <text x={head.x + c.facing * 8} y={head.y - 46 - 10 * shrug} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={54} fill="#8B5CF6" opacity={shrug}>
                  ?
                </text>
              )}
            </g>
          );
        })}
        <rect x={0} y={MID} width={1080} height={1920 - MID} fill="#EEF3F7" opacity={0.8 * (1 - reveal)} />
      </g>
    );
    return (
      <>
        <Svg>
          <SplitCompare top={top} bottom={bottom} topLabel={T("THE OLD DAYS")} bottomLabel={T("MY TIME")} mid={MID} />
          {t > tTime && <circle cx={540} cy={1085} r={100 + 80 * ramp(t, tTime, tTime + 0.6)} fill="none" stroke="#22D3EE" strokeWidth={5} opacity={1 - ramp(t, tTime, tTime + 0.6)} />}
        </Svg>
        <Ticks from={tTicked} n={2} volume={0.22} />
        <Cue at={tLumen} sfx="whoosh" volume={0.2} />
        <Cue at={tNobody} sfx="pop" volume={0.22} />
      </>
    );
  };

  /** Cartão final da novela. */
  const EndCard: React.FC<{ show: number }> = ({ show }) =>
    show > 0 ? (
      <g transform={`translate(540 520) scale(${0.85 + 0.15 * show})`} opacity={show}>
        <rect x={-400} y={-110} width={800} height={220} rx={40} fill="#111827" opacity={0.92} />
        <text y={-12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={66} fill="#ffffff">
          {T("TO BE CONTINUED…")}
        </text>
        <text y={60} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={36} fill="#22D3EE">
          {T("NEXT · EP. 2: POWER IN A POCKET")}
        </text>
      </g>
    ) : null;

  // c07 — "I opened the portal home. Then, on Lumen, the Central Clock stopped. My Chrono-Band cracked, the portal closed, and I was stuck."
  const C07: React.FC<SceneProps> = (props) => {
    const { t, dur, at } = useLangScene(props, L, "c07");
    const G = GROUND_Y;
    const tOpened = at("opened", 0.03);
    const tPortal = at("portal", 0.1);
    const tThen = at("Then", 0.2);
    const tLumen = at("Lumen", 0.35);
    const tStopped = at("stopped", 0.46);
    const tCracked = at("cracked", 0.61);
    const tClosed = at("closed", 0.76);
    const tStuck = at("stuck", 0.86);
    const portal = { x: 840, y: G - 215 };
    const K = { x: 520, y: G, scale: 1.8, facing: 1 as const };
    const cracked = t >= tCracked;
    const flicker = t > tStopped ? 1 - 0.45 * Math.abs(Math.sin((t - tStopped) * 26)) : 1;
    const open = ramp(t, tOpened + 0.2, tPortal + 0.5) * flicker;
    const collapse = ramp(t, tClosed - 0.15, tClosed + 0.3);
    const kipPose = poseAt(t, [
      { t: 0, pose: "stand" },
      { t: tOpened, pose: "tapWrist" },
      { t: tPortal + 0.2, pose: "tapWrist" },
      { t: tPortal + 0.5, pose: "holdUp" },
      { t: tCracked - 0.1, pose: "holdUp" },
      { t: tCracked + 0.15, pose: RECOIL },
      { t: tClosed + 0.3, pose: RECOIL },
      { t: tStuck, pose: "sad" },
    ]);
    const wrist = jointWorld({ ...K, pose: kipPose }, "farHand");
    const benPose = poseAt(t, [
      { t: 0, pose: "wave" },
      { t: tThen, pose: "wave" },
      { t: tThen + 0.3, pose: "stand" },
      { t: tCracked, pose: "stand" },
      { t: tCracked + 0.3, pose: "surprised" },
      { t: tStuck, pose: "stand" },
    ]);
    const cutIn = ramp(t, tLumen - 0.15, tLumen + 0.2) * (1 - ramp(t, tCracked - 0.1, tCracked + 0.2));
    const stopped = ramp(t, tStopped, tStopped + 0.6);
    // o ponteiro de luz para em "stopped"
    const clockHand = 40 + Math.min(t, tStopped) * 14;
    const end = ramp(t, tStuck + 0.45, tStuck + 0.85);
    const shake = t > tCracked && t < tCracked + 0.4 ? Math.sin(t * 90) * 6 : 0;
    return (
      <>
        <Svg zoom={mix(1, 1.08, ramp(t, tStuck - 0.2, dur))} cy={900} cx={540 + shake}>
          <PresentBackdrop variant="street" />
          {/* fim de tarde */}
          <rect x={-200} y={-200} width={1480} height={2320} fill="#E8894F" opacity={0.16} />
          <rect x={-200} y={-200} width={1480} height={700} fill="#8B5CF6" opacity={0.08} />
          <Stickman {...BEN} x={170} y={G} scale={1.5} pose={benPose} expression={t > tCracked ? "worried" : "happy"} look={0.6} />
          {collapse < 1 && <TimePortal x={portal.x} y={portal.y} open={open} collapse={collapse} />}
          {t > tOpened && t < tCracked && <circle cx={wrist.x} cy={wrist.y} r={30 + 10 * Math.sin(t * 20)} fill="#8B5CF6" opacity={0.35} />}
          <Stickman
            {...K}
            pose={kipPose}
            expression={t < tStopped ? "determined" : t < tStuck ? "shocked" : "worried"}
            look={t < tCracked ? 0.7 : -0.3}
            band={cracked ? "cracked" : "ok"}
            holdNear={heldWatch({ sec: t + 40 })}
          />
          <Sparks x={wrist.x} y={wrist.y} p={ramp(t, tCracked - 0.05, tCracked + 0.5)} r={80} />
          <Sparks x={portal.x} y={portal.y} p={ramp(t, tClosed - 0.05, tClosed + 0.5)} r={160} color="#22D3EE" n={12} />
          <Magnifier cx={300} cy={560} r={175} fromX={portal.x - 100} fromY={portal.y - 60} show={cutIn}>
            <rect x={-200} y={-200} width={400} height={400} fill="#EEF3F7" />
            <path d="M-200 120 Q0 80 200 110 L200 200 L-200 200 Z" fill="#DCE7EF" />
            <CentralClock x={0} y={-6} r={120} t={t} hand={clockHand} lag={0.3 * (1 - stopped)} stopped={stopped} crystalGlow={0.8} />
            <text y={160} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill="#5E7183">
              LUMEN
            </text>
          </Magnifier>
          <EndCard show={end} />
        </Svg>
        <TagFrom at={0} era="present" until={tStuck + 0.3} />
        <Cue at={tOpened} sfx="whoosh" volume={0.3} />
        <Cue at={tStopped} sfx="ding" volume={0.25} />
        <Cue at={tCracked} sfx="splat" volume={0.3} />
        <Cue at={tClosed} sfx="pop" volume={0.35} />
        <Ticks from={tStuck + 0.7} n={2} volume={0.3} />
      </>
    );
  };

  return {
    "c01-late": C01,
    "c02-jump": C02,
    "c03-ben": C03,
    "c04-quartz": C04,
    "c05-halves": C05,
    "c06-compare": C06,
    "c07-stuck": C07,
  };
};

export const scenes = makeScenes(EN);
