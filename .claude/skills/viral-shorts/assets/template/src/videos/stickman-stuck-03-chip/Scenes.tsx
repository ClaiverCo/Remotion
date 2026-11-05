import React from "react";
import { EN, translator, useLangScene, type SceneLang } from "../../stickman/lang";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { mix, ramp } from "../../lib/anim";
import type { SceneProps } from "../../lib/types";
import {
  EraTag,
  FutureBackdrop,
  GROUND_Y,
  jointWorld,
  leftArm,
  poseAt,
  PresentBackdrop,
  resolvePose,
  solve,
  SplitCompare,
  Stickman,
  walkAlong,
  type Pose,
  type PoseName,
} from "../../stickman";
import { Magnifier } from "../stickman-house-key/props";
import { LightPedestal, Pill } from "../stickman-stuck-01-crystal/props";
import { EndCard, Garage } from "../stickman-stuck-02-battery/props";
import {
  CircuitBoard,
  Drawer,
  FlowArrow,
  Ingot,
  LithoRig,
  MachineFrame,
  machineSlot,
  OpenBand,
  RareCrystal,
  SandPile,
  SiliconLump,
  SwitchGrid,
  ToggleIcon,
  Wafers,
} from "./props";

/**
 * "Stuck in 2026", episódio 3: The Brain Made of Sand.
 * Regra: todo evento visual acontece QUANDO a palavra é dita — at("palavra", fração-reserva).
 * Continuidade: Chrono-Band rachada (band="cracked"); a máquina física (MachineFrame) fica à direita da garagem,
 * com o relógio (encaixe 0) e o power bank (encaixe 1); o chip entra no encaixe 2 no clipe 3.
 */

const BEN = { kind: "person" as const, shirt: "#E0B44C", hair: "short" as const };
const G = GROUND_Y;
const MX = 800;
const NEXT = "NEXT · EP. 4: CLOCKS IN THE SKY";

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
        <EraTag era={era} top={top} label={era === "present" ? L.tagPresent : L.tagFuture} />
      </Sequence>
    );
  };

  /** Posição na tela da Chrono-Band (pulso esquerdo, a 72% do antebraço). */
  const bandWorld = (o: { x: number; y: number; scale: number; facing: 1 | -1; pose: Pose | PoseName }) => {
    const sk = solve(resolvePose(o.pose));
    const arm = leftArm("side", o.facing) === "near" ? sk.near : sk.far;
    const p = { x: arm.elbow.x + (arm.hand.x - arm.elbow.x) * 0.72, y: arm.elbow.y + (arm.hand.y - arm.elbow.y) * 0.72 };
    return { x: o.x + p.x * o.scale * o.facing, y: o.y + p.y * o.scale };
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

  // Poses sob medida (olhando para a direita)
  const SHOWBAND: Pose = { lean: -2, head: -10, near: [40, 70], far: [118, 18], legNear: [6, 0], legFar: [-6, 0] };
  /** Mão direita estendida um pouco abaixo do ombro (para pôr a placa no encaixe). */
  const REACH_LOW: Pose = { lean: 6, head: 6, near: [62, 4], far: [-12, 10], legNear: [10, 0], legFar: [-8, 0] };

  // c01 — "Power was only half the problem. Inside my Chrono-Band, its tiny brain had burned out. And nobody here sold parts from the future."
  const C01: React.FC<SceneProps> = (props) => {
    const { t, dur, at } = useLangScene(props, L, "c01");
    const tInside = at("Inside", 0.25);
    const tBrain = at("brain", 0.51);
    const tBurned = at("burned", 0.58);
    const tNobody = at("nobody", 0.7);
    const tFuture = at("future", 0.92);
    const K = { x: 400, y: G, scale: 1.8, facing: 1 as const };
    const pose = poseAt(t, [
      { t: 0, pose: "stand" },
      { t: 0.35, pose: SHOWBAND },
      { t: tNobody - 0.1, pose: SHOWBAND },
      { t: tNobody + 0.25, pose: "shrug" },
    ]);
    const band = bandWorld({ ...K, pose: SHOWBAND });
    const mag = ramp(t, 0.35, 0.65) * (1 - ramp(t, tNobody + 0.2, tNobody + 0.5));
    return (
      <>
        <Svg zoom={mix(1, 1.04, t / dur)} cy={900}>
          <Garage groundY={G} t={t} />
          <MachineFrame x={MX} groundY={G} t={t} parts={2} />
          <Stickman {...K} pose={pose} band="cracked" expression={t < tBurned ? "curious" : t < tNobody ? "shocked" : "worried"} look={t < tNobody ? 0.6 : -0.3} />
          <Magnifier cx={600} cy={540} r={150} fromX={band.x} fromY={band.y} show={mag}>
            <g transform="scale(1.35)">
              <OpenBand open={ramp(t, tInside, tInside + 0.45)} burned={ramp(t, tBurned, tBurned + 0.3)} t={t} />
            </g>
          </Magnifier>
          <Pill x={600} y={740} text={T("brain")} show={ramp(t, tBrain, tBrain + 0.25) * (1 - ramp(t, tNobody, tNobody + 0.3))} color="#9AA5B1" size={36} />
          <Pill x={250} y={620} text={T("no future parts")} show={ramp(t, tFuture - 0.2, tFuture + 0.1)} color="#E05A47" size={36} />
        </Svg>
        <TagFrom at={0} era="present" top={430} />
        <Cue at={tInside} sfx="click" volume={0.35} />
        <Cue at={tBurned} sfx="splat" volume={0.25} />
        <Cue at={tNobody} sfx="pop" volume={0.2} />
      </>
    );
  };

  // c02 — "Ben dug through a drawer and found an old phone's circuit board. In the middle sat a small black square: a chip."
  const C02: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c02");
    const tDrawer = at("drawer", 0.14);
    const tFound = at("found", 0.27);
    const tBoard = at("board", 0.49);
    const tBlack = at("black", 0.75);
    const tChip = at("chip", 0.91);
    const B = { x: 610, y: G, scale: 1.6, facing: -1 as const };
    const rummage = t > tDrawer && t < tFound + 0.2;
    const benPose = poseAt(t, [
      { t: 0, pose: "stand" },
      { t: tDrawer - 0.4, pose: "crouch" },
      { t: tFound + 0.2, pose: rummage ? { lean: 26, head: -10, near: [70 + Math.sin(t * 18) * 10, -10], far: [52, 0], legNear: [58, 98], legFar: [22, 86] } : "crouch" },
      { t: tFound + 0.6, pose: "holdUp" },
    ]);
    const hasBoard = t > tFound + 0.4;
    const hand = jointWorld({ ...B, pose: benPose }, "nearHand");
    const mag = ramp(t, tBlack - 0.15, tBlack + 0.15);
    const benchY = G - 190;
    return (
      <>
        <Svg>
          <Garage groundY={G} t={t} />
          <MachineFrame x={MX} groundY={G} t={t} parts={2} />
          <Drawer x={300} y={benchY + 34} open={ramp(t, tDrawer - 0.1, tDrawer + 0.35)} />
          <Stickman x={170} y={G} scale={1.8} pose={t < tBoard ? "stand" : "think"} band="cracked" expression="curious" look={0.6} />
          <Stickman
            {...BEN}
            {...B}
            pose={benPose}
            expression={hasBoard ? "happy" : "curious"}
            look={0.4}
            holdNear={hasBoard ? <CircuitBoard y={-26} scale={0.55} rotate={-10} chipGlow={ramp(t, tChip, tChip + 0.25)} /> : undefined}
          />
          <Pill x={hand.x - 30} y={hand.y - 140} text={T("circuit board")} show={ramp(t, tBoard - 0.2, tBoard + 0.1) * (1 - ramp(t, tBlack - 0.3, tBlack))} color="#3F8F5A" size={36} />
          <Magnifier cx={330} cy={540} r={150} fromX={hand.x} fromY={hand.y - 26} show={mag}>
            <CircuitBoard scale={2.6} chipGlow={ramp(t, tChip, tChip + 0.25)} />
          </Magnifier>
          <Pill x={330} y={740} text={T("chip")} show={ramp(t, tChip, tChip + 0.25)} color="#22D3EE" size={40} />
        </Svg>
        <TagFrom at={0} era="present" />
        <Cue at={tDrawer} sfx="whoosh" volume={0.18} />
        <Cue at={tFound + 0.5} sfx="pop" volume={0.25} />
        <Cue at={tChip} sfx="ding" volume={0.25} />
      </>
    );
  };

  // c03 — "I fitted it into my machine's third slot. Then Ben said something strange: chips like this start out as sand."
  const C03: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c03");
    const tFitted = at("fitted", 0.03);
    const tThird = at("third", 0.24);
    const tSlot = at("slot", 0.29);
    const tBen = at("Ben", 0.41);
    const tStrange = at("strange", 0.57);
    const tSand = at("sand", 0.91);
    const slot = machineSlot(MX, G, 2);
    const reach = jointWorld({ x: 0, y: G, scale: 1.8, facing: 1, pose: REACH_LOW }, "nearHand");
    const targetX = slot.x - reach.x - 30;
    const walk = walkAlong(t, { fromX: 430, toX: targetX, start: Math.max(0, tFitted - 0.2), end: tThird });
    const insert = ramp(t, tThird + 0.05, tSlot + 0.2);
    const placed = insert >= 1;
    // depois de encaixar, ele dá dois passos para trás (sai da frente do anel)
    const back = walkAlong(t, { fromX: targetX, toX: targetX - 170, start: tSlot + 0.55, end: tSlot + 1.35, stepsPerSec: 1.6 });
    const kipX = t < tSlot + 0.55 ? walk.x : back.x;
    const pose: Pose | PoseName = walk.walking
      ? walk.pose
      : back.walking
      ? back.pose
      : poseAt(t, [
          { t: tThird, pose: "holdUp" },
          { t: tThird + 0.25, pose: REACH_LOW },
          { t: tSlot + 0.35, pose: REACH_LOW },
          { t: tSlot + 0.7, pose: "stand" },
          { t: tSand - 0.1, pose: "stand" },
          { t: tSand + 0.2, pose: "surprised" },
        ]);
    const hand = jointWorld({ x: kipX, y: G, scale: 1.8, facing: 1, pose }, "nearHand");
    const boardX = mix(hand.x, slot.x, insert);
    const boardY = mix(hand.y - 26 * 0.55 * 1.8, slot.y, insert);
    const head = jointWorld({ x: kipX, y: G, scale: 1.8, facing: 1, pose }, "head");
    return (
      <>
        <Svg>
          <Garage groundY={G} t={t} />
          <MachineFrame x={MX} groundY={G} t={t} parts={placed ? 3 : 2} glow={{ slot: 2, p: placed ? 1 - 0.5 * ramp(t, tSlot + 0.6, tSlot + 1.4) : 0 }} hum={placed ? 0.3 : 0} />
          <Stickman {...BEN} x={170} y={G} scale={1.6} pose={t > tBen ? "explain" : "stand"} expression={t > tStrange ? "curious" : "happy"} look={0.6} />
          <Stickman
            x={kipX}
            y={G}
            scale={1.8}
            pose={pose}
            band="cracked"
            expression={t > tSand ? "shocked" : placed ? "happy" : "determined"}
            look={t > tBen ? -0.8 : 0.5}
            holdNear={insert <= 0 ? <CircuitBoard y={-26} scale={0.55} rotate={-10} /> : undefined}
          />
          {insert > 0 && !placed && <CircuitBoard x={boardX} y={boardY} scale={mix(0.99, 0.42, insert)} rotate={-10 * (1 - insert)} />}
          <Pill x={slot.x} y={slot.y + 110} text={T("slot 3")} show={ramp(t, tThird, tThird + 0.25) * (1 - ramp(t, tBen, tBen + 0.3))} color="#22D3EE" size={32} />
          <Thought x={head.x - 40} y={head.y - 220} show={ramp(t, tSand - 0.05, tSand + 0.25)}>
            <SandPile x={0} y={50} s={0.7} />
          </Thought>
        </Svg>
        <TagFrom at={0} era="present" />
        <Cue at={tSlot + 0.15} sfx="click" volume={0.45} />
        <Cue at={tSlot + 0.25} sfx="ding" volume={0.22} />
        <Cue at={tSand} sfx="pop" volume={0.25} />
      </>
    );
  };

  // c04 — "Factories purify the silica in sand into almost perfect silicon, grow it into one big crystal, and slice it into thin discs."
  const C04: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c04");
    const tSilica = at("silica", 0.15);
    const tAlmost = at("almost", 0.29);
    const tSilicon = at("silicon", 0.4);
    const tGrow = at("grow", 0.51);
    const tCrystal = at("crystal", 0.65);
    const tSlice = at("slice", 0.78);
    const tThin = at("thin", 0.89);
    const tDiscs = at("discs", 0.92);
    return (
      <>
        <Svg>
          <rect width={1080} height={1920} fill="#F7F0E6" />
          <rect x={40} y={300} width={1000} height={920} rx={40} fill="#FBF6EE" stroke="#CDB9A0" strokeWidth={4} />
          <SandPile x={270} y={720} s={1.3} show={ramp(t, 0, 0.4)} />
          <Pill x={270} y={500} text={T("silica sand")} show={ramp(t, tSilica, tSilica + 0.25)} color="#C9AE70" size={34} />
          <FlowArrow d="M440 650 L600 650 M576 626 L600 650 L576 674" show={ramp(t, tAlmost - 0.4, tSilicon - 0.1)} />
          <SiliconLump x={790} y={650} s={1.4} show={ramp(t, tSilicon - 0.1, tSilicon + 0.3)} />
          <Pill x={790} y={500} text={T("silicon")} show={ramp(t, tSilicon, tSilicon + 0.25)} color="#7B8FA6" size={36} />
          <FlowArrow d="M790 770 Q790 840 600 850 Q470 856 450 880" show={ramp(t, tGrow - 0.5, tGrow)} />
          <Ingot x={300} y={1170} grow={ramp(t, tGrow, tCrystal + 0.5)} show={ramp(t, tGrow - 0.3, tGrow)} spin={t * 3} />
          <Pill x={300} y={740} text={T("crystal")} show={ramp(t, tCrystal, tCrystal + 0.25)} color="#7B8FA6" size={36} />
          <FlowArrow d="M430 1000 L610 1000 M586 976 L610 1000 L586 1024" show={ramp(t, tSlice - 0.5, tSlice)} />
          <Wafers x={800} y={1000} n={5 * ramp(t, tSlice, tThin + 0.3)} glint={ramp(t, tDiscs, tDiscs + 0.3)} />
          <Pill x={800} y={1150} text={T("thin discs")} show={ramp(t, tThin, tThin + 0.25)} color="#7B8FA6" size={34} />
        </Svg>
        <TagFrom at={0} era="present" />
        <Cue at={tSilica} sfx="pop" volume={0.18} />
        <Cue at={tSilicon} sfx="ding" volume={0.2} />
        <Cue at={tGrow} sfx="whoosh" volume={0.18} />
        <Cue at={tSlice} sfx="click" volume={0.3} />
        <Cue at={tSlice + 0.35} sfx="click" volume={0.25} />
        <Cue at={tSlice + 0.7} sfx="click" volume={0.25} />
      </>
    );
  };

  // c05 — "Then light prints circuit patterns onto each disc, layer after layer, until one chip holds billions of transistors: tiny on-off switches."
  const C05: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c05");
    const tLight = at("light", 0.04);
    const tPrints = at("prints", 0.07);
    const tDisc = at("disc", 0.26);
    const tLayer = at("layer", 0.33);
    const tUntil = at("until", 0.47);
    const tBillions = at("billions", 0.6);
    const tTransistors = at("transistors", 0.68);
    const tTiny = at("tiny", 0.8);
    const tSwitches = at("switches", 0.9);
    const mag = ramp(t, tBillions - 0.15, tBillions + 0.15);
    return (
      <>
        <Svg>
          <rect width={1080} height={1920} fill="#F7F0E6" />
          <rect x={40} y={300} width={1000} height={920} rx={40} fill="#FBF6EE" stroke="#CDB9A0" strokeWidth={4} />
          <LithoRig x={540} y={860} t={t} light={ramp(t, tLight - 0.1, tLight + 0.2)} print={ramp(t, tPrints, tDisc + 0.4)} layers={1 + 2 * ramp(t, tLayer, tUntil)} />
          <Pill x={860} y={600} text={T("mask")} show={ramp(t, tPrints, tPrints + 0.25) * (1 - ramp(t, tLayer, tLayer + 0.3))} color="#7B8FA6" size={32} />
          <Pill x={860} y={760} text={T("layers")} show={ramp(t, tLayer, tLayer + 0.25) * (1 - ramp(t, tBillions - 0.3, tBillions))} color="#93C5FD" size={32} />
          <Magnifier cx={790} cy={1060} r={140} fromX={660} fromY={860} show={mag}>
            <SwitchGrid t={t} />
          </Magnifier>
          <Pill x={330} y={1060} text={T("billions")} show={ramp(t, tBillions, tBillions + 0.25)} color="#F5C542" size={42} />
          <Pill x={330} y={1160} text={T("transistors")} show={ramp(t, tTransistors, tTransistors + 0.25) * (1 - ramp(t, tTiny - 0.2, tTiny))} color="#8B5CF6" size={32} />
          <ToggleIcon x={330} y={1160} on={t > tSwitches ? (Math.sin(t * 9) > 0 ? 1 : 0) : 0} show={ramp(t, tTiny, tTiny + 0.25)} />
        </Svg>
        <TagFrom at={0} era="present" />
        <Cue at={tLight} sfx="whoosh" volume={0.2} />
        <Cue at={tLayer} sfx="pop" volume={0.18} />
        <Cue at={tLayer + 0.4} sfx="pop" volume={0.18} />
        <Cue at={tBillions} sfx="ding" volume={0.28} />
        <Cue at={tSwitches} sfx="click" volume={0.3} />
      </>
    );
  };

  // c06 — "On Lumen, I thought brains like this needed rare crystals. Back then, they started as sand, purified and printed with light."
  const C06: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c06");
    const MID = 880;
    const TOPG = 840;
    const BOTG = 1235;
    const tLumen = at("Lumen", 0.04);
    const tThought = at("thought", 0.15);
    const tRare = at("rare", 0.37);
    const tBack = at("Back", 0.5);
    const tSand = at("sand", 0.66);
    const tPurified = at("purified", 0.75);
    const tPrinted = at("printed", 0.84);
    const tLight = at("light", 0.92);
    const topShow = ramp(t, tBack - 0.25, tBack + 0.1);
    const top = (
      <g>
        <PresentBackdrop variant="home" groundY={TOPG} />
        <SandPile x={190} y={790} s={0.85} show={ramp(t, tBack, tBack + 0.3)} />
        <FlowArrow d="M310 700 L380 700 M362 682 L380 700 L362 718" show={ramp(t, tSand, tSand + 0.4)} />
        <Wafers x={490} y={690} n={ramp(t, tPurified - 0.1, tPurified + 0.3)} />
        <FlowArrow d="M600 700 L670 700 M652 682 L670 700 L652 718" show={ramp(t, tPrinted - 0.3, tPrinted)} />
        <g opacity={ramp(t, tPrinted, tPrinted + 0.3)}>
          <rect x={700} y={640} width={120} height={120} rx={14} fill="#22D3EE" opacity={0.35 * ramp(t, tLight, tLight + 0.3)} />
          <rect x={720} y={660} width={80} height={80} rx={10} fill="#1F2937" stroke="#111827" strokeWidth={4} />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={728 + i * 18} y={644} width={8} height={14} fill="#9AA5B1" />
              <rect x={728 + i * 18} y={742} width={8} height={14} fill="#9AA5B1" />
            </g>
          ))}
        </g>
        <Stickman x={950} y={TOPG} scale={1.15} facing={-1} pose={t > tLight ? "point" : "stand"} band="cracked" expression={t > tSand ? "shocked" : "curious"} look={0.5} />
        <rect x={0} y={0} width={1080} height={MID} fill="#F7F0E6" opacity={0.8 * (1 - topShow)} />
      </g>
    );
    const bottom = (
      <g>
        <FutureBackdrop variant="museum" groundY={BOTG} />
        <LightPedestal x={540} y={BOTG - 70} t={t} lit={ramp(t, tThought, tThought + 0.3)} />
        <RareCrystal x={540} y={BOTG - 72} t={t} show={ramp(t, tThought - 0.1, tThought + 0.3)} />
        {t > tRare && <circle cx={540} cy={BOTG - 160} r={60 + 120 * ramp(t, tRare, tRare + 0.7)} fill="none" stroke="#8B5CF6" strokeWidth={5} opacity={1 - ramp(t, tRare, tRare + 0.7)} />}
      </g>
    );
    return (
      <>
        <Svg>
          <SplitCompare top={top} bottom={bottom} topLabel={T("THE OLD DAYS")} bottomLabel={T("MY TIME")} mid={MID} />
        </Svg>
        <Cue at={tLumen} sfx="whoosh" volume={0.2} />
        <Cue at={tRare} sfx="ding" volume={0.2} />
        <Cue at={tBack} sfx="pop" volume={0.2} />
        <Cue at={tLight} sfx="ding" volume={0.22} />
      </>
    );
  };

  // c07 — "The chip woke up. Then the machine asked me a question: where exactly are we, in space and in time? I had no idea."
  const C07: React.FC<SceneProps> = (props) => {
    const { t, dur, at } = useLangScene(props, L, "c07");
    const tWoke = at("woke", 0.07);
    const tQuestion = at("question", 0.27);
    const tWhere = at("where", 0.36);
    const tSpace = at("space", 0.52);
    const tTime = at("time", 0.6);
    const tIdea = at("idea", 0.74);
    const K = { x: 420, y: G, scale: 1.8, facing: 1 as const };
    const pose = poseAt(t, [
      { t: 0, pose: "stand" },
      { t: tWhere, pose: "stand" },
      { t: tWhere + 0.3, pose: "think" },
      { t: tIdea - 0.15, pose: "think" },
      { t: tIdea + 0.15, pose: "shrug" },
    ]);
    const end = ramp(t, tIdea + 0.55, tIdea + 0.95);
    return (
      <>
        <Svg zoom={mix(1, 1.05, ramp(t, tWhere, dur))} cy={900}>
          <Garage groundY={G} t={t} />
          <MachineFrame
            x={MX}
            groundY={G}
            t={t}
            parts={3}
            glow={{ slot: 2, p: ramp(t, tWoke - 0.1, tWoke + 0.2) * (0.6 + 0.4 * Math.sin(t * 4)) }}
            hum={ramp(t, tWoke, tWoke + 0.4)}
            screen={{ q: ramp(t, tQuestion, tQuestion + 0.25), pin: ramp(t, tSpace, tSpace + 0.25), clock: ramp(t, tTime, tTime + 0.25) }}
          />
          <Stickman {...BEN} x={170} y={G} scale={1.6} pose={t > tWhere ? "think" : "stand"} expression={t > tWhere ? "worried" : "happy"} look={0.6} />
          <Stickman {...K} pose={pose} band="cracked" expression={t < tQuestion ? "happy" : t < tIdea ? "curious" : "worried"} look={0.7} />
          <Pill x={MX} y={590} text={T("where? when?")} show={ramp(t, tWhere, tWhere + 0.25) * (1 - end)} color="#22D3EE" size={38} />
          <EndCard show={end} title={T("TO BE CONTINUED…")} next={T(NEXT)} />
        </Svg>
        <TagFrom at={0} era="present" until={tIdea + 0.5} />
        <Cue at={tWoke} sfx="ding" volume={0.28} />
        <Cue at={tQuestion} sfx="pop" volume={0.22} />
        <Cue at={tSpace} sfx="pop" volume={0.18} />
        <Cue at={tTime} sfx="pop" volume={0.18} />
        <Cue at={tIdea + 0.6} sfx="whoosh" volume={0.2} />
      </>
    );
  };

  return {
    "c01-burned": C01,
    "c02-board": C02,
    "c03-slot": C03,
    "c04-wafer": C04,
    "c05-light": C05,
    "c06-compare": C06,
    "c07-question": C07,
  };
};

export const scenes = makeScenes(EN);
