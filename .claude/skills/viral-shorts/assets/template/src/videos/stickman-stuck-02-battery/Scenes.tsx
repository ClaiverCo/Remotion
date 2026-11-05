import React from "react";
import { EN, translator, useLangScene, type SceneLang } from "../../stickman/lang";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { mix, ramp } from "../../lib/anim";
import type { SceneProps } from "../../lib/types";
import {
  EraTag,
  FUTURE_PEOPLE,
  FutureBackdrop,
  GROUND_Y,
  jointWorld,
  leftArm,
  poseAt,
  PresentBackdrop,
  RelicGlow,
  resolvePose,
  solve,
  SplitCompare,
  Stickman,
  TimePortal,
  walkAlong,
  type Pose,
  type PoseName,
} from "../../stickman";
import { Magnifier } from "../stickman-house-key/props";
import { Pill, Watch } from "../stickman-stuck-01-crystal/props";
import { BandCloseup, benchTopY, CellCutaway, ChargeCable, EndCard, Garage, MachineBlueprint, PowerBank, PowerWaves, WallSocket } from "./props";

/**
 * "Stuck in 2026", episódio 2: Power in a Pocket.
 * Regra: todo evento visual acontece QUANDO a palavra é dita — at("palavra", fração-reserva).
 * Continuidade: a Chrono-Band está rachada e apagada (band="cracked"); o relógio do Ben fica na bancada da garagem.
 * Kip olha para a direita; o power bank fica na mão DIREITA (near) e a pulseira no pulso ESQUERDO (far).
 */

const BEN = { kind: "person" as const, shirt: "#E0B44C", hair: "short" as const };
const CITIZEN = { kind: "person" as const, shirt: FUTURE_PEOPLE.tunic, hair: "none" as const };
const G = GROUND_Y;
const NEXT = "NEXT · EP. 3: THE BRAIN MADE OF SAND";

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
const Ticks: React.FC<{ from: number; n: number; volume?: number }> = ({ from, n, volume = 0.18 }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <Cue key={i} at={from + i} sfx="click" volume={volume} />
    ))}
  </>
);
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

  /** Posição na tela da Chrono-Band (pulso esquerdo, a 72% do antebraço), igual ao desenho do Stickman. */
  const bandWorld = (o: { x: number; y: number; scale: number; facing: 1 | -1; pose: Pose | PoseName }) => {
    const sk = solve(resolvePose(o.pose));
    const arm = leftArm("side", o.facing) === "near" ? sk.near : sk.far;
    const p = { x: arm.elbow.x + (arm.hand.x - arm.elbow.x) * 0.72, y: arm.elbow.y + (arm.hand.y - arm.elbow.y) * 0.72 };
    return { x: o.x + p.x * o.scale * o.facing, y: o.y + p.y * o.scale };
  };

  /** O relógio do Ben deitado na bancada (continuidade do ep. 1), tique-taqueando. */
  const BenchWatch: React.FC<{ t: number; x?: number; glow?: number }> = ({ t, x = 300, glow = 0 }) => (
    <g>
      {glow > 0 && <RelicGlow x={x} y={benchTopY(G) - 22} r={70} strength={glow} />}
      <Watch x={x} y={benchTopY(G) - 20} scale={0.75} rotate={-90} sec={t + 30} />
    </g>
  );

  /** Power bank na mão do Kip (coordenadas da mão). */
  const BANK_S = 0.42;
  const heldBank = (leds = 4, glow = 0) => <PowerBank y={-12} scale={BANK_S} leds={leds} glow={glow} />;

  /** Brilho violeta sobre a pulseira rachada (quando recebe energia). */
  const BandGlow: React.FC<{ p: { x: number; y: number }; s: number; t: number }> = ({ p, s, t }) =>
    s > 0 ? <circle cx={p.x} cy={p.y} r={26 + 6 * Math.sin(t * 9)} fill="#8B5CF6" opacity={0.45 * s} /> : null;

  // Poses sob medida (olhando para a direita)
  const POCKET: Pose = { lean: 4, head: 8, near: [-12, -8], far: [-16, 8], legNear: [6, 0], legFar: [-6, 0] };
  /** As duas mãos na frente do peito: direita com o power bank, esquerda com a pulseira. */
  const HANDS: Pose = { lean: 4, head: 14, near: [28, 62], far: [14, 84], legNear: [6, 0], legFar: [-6, 0] };
  /** Braço esquerdo erguido para a frente, mostrando a pulseira (o holograma sai dela). */
  const SHOWBAND: Pose = { lean: -2, head: -10, near: [14, 8], far: [118, 18], legNear: [6, 0], legFar: [-6, 0] };

  // c01 — "Stuck in 2026, my Chrono-Band was dead. I tapped it again and again. Nothing. Without power, I had no way home."
  const C01: React.FC<SceneProps> = (props) => {
    const { t, dur, at } = useLangScene(props, L, "c01");
    const tBand = at("Chrono", 0.24);
    const tDead = at("dead", 0.34);
    const tTap1 = at("tapped", 0.43);
    const tTap2 = at("again", 0.49);
    const tTap3 = at("again", 0.55, { nth: 2 });
    const tNothing = at("Nothing", 0.62);
    const tWithout = at("Without", 0.72);
    const tHome = at("home", 0.93);
    const K = { x: 560, y: G, scale: 1.8, facing: 1 as const };
    const taps = [0.25, tTap1, tTap2, tTap3];
    const keys: { t: number; pose: Pose | PoseName }[] = [{ t: 0, pose: "stand" }];
    for (const tp of taps) {
      keys.push({ t: tp - 0.12, pose: "stand" }, { t: tp + 0.05, pose: "tapWrist" }, { t: tp + 0.3, pose: "tapWrist" });
    }
    keys.push({ t: tTap3 + 0.45, pose: "stand" }, { t: tWithout, pose: "stand" }, { t: tWithout + 0.4, pose: "sad" });
    const pose = poseAt(t, keys);
    const band = bandWorld({ ...K, pose: "tapWrist" });
    const head = jointWorld({ ...K, pose }, "head");
    const tapFlash = Math.max(...taps.map((tp) => (t > tp && t < tp + 0.35 ? 1 - (t - tp) / 0.35 : 0)));
    const mag = ramp(t, 0.3, 0.6) * (1 - ramp(t, tWithout - 0.2, tWithout + 0.1));
    const bubble = ramp(t, tWithout + 0.3, tWithout + 0.7) * (1 - ramp(t, tHome + 0.15, tHome + 0.35));
    const pop = ramp(t, tHome + 0.15, tHome + 0.5);
    return (
      <>
        <Svg zoom={mix(1, 1.05, t / dur)} cy={900}>
          <Garage groundY={G} t={t} />
          <BenchWatch t={t} />
          {tapFlash > 0 && <circle cx={band.x} cy={band.y} r={20 + 30 * (1 - tapFlash)} fill="none" stroke="#9AA5B1" strokeWidth={5} opacity={tapFlash} />}
          <Stickman {...K} pose={pose} band="cracked" expression={t < tNothing ? "worried" : "worried"} look={t < tWithout ? 0.7 : -0.4} />
          {/* bolha de pensamento: o portal para casa, que não abre */}
          {bubble > 0 && (
            <g transform={`translate(${head.x + 130} ${head.y - 190}) scale(${bubble})`} opacity={bubble}>
              <circle cx={-90} cy={110} r={12} fill="#ffffff" stroke="#9AA5B1" strokeWidth={4} />
              <circle cx={-60} cy={70} r={20} fill="#ffffff" stroke="#9AA5B1" strokeWidth={4} />
              <circle r={110} fill="#ffffff" stroke="#9AA5B1" strokeWidth={5} />
              <g opacity={0.55}>
                <TimePortal x={0} y={0} open={0.6} size={80} />
              </g>
            </g>
          )}
          {pop > 0 && pop < 1 && (
            <circle cx={head.x + 130} cy={head.y - 190} r={110 + 60 * pop} fill="none" stroke="#9AA5B1" strokeWidth={5} opacity={1 - pop} />
          )}
          <Magnifier cx={810} cy={620} r={150} fromX={band.x} fromY={band.y} show={mag}>
            <g transform="scale(1.35)">
              <BandCloseup cracked glow={0} />
            </g>
            {t > tNothing && (
              <g stroke="#9AA5B1" strokeWidth={14} strokeLinecap="round" opacity={ramp(t, tNothing, tNothing + 0.2)}>
                <line x1={-60} y1={-60} x2={60} y2={60} />
                <line x1={60} y1={-60} x2={-60} y2={60} />
              </g>
            )}
          </Magnifier>
          <Pill x={810} y={820} text={T("no power")} show={ramp(t, tDead, tDead + 0.25) * (1 - ramp(t, tWithout - 0.2, tWithout + 0.1))} color="#9AA5B1" size={38} />
        </Svg>
        <TagFrom at={0} era="present" top={430} />
        {[tTap1, tTap2, tTap3].map((tp, i) => (
          <Cue key={i} at={tp + 0.05} sfx="click" volume={0.35} />
        ))}
        <Cue at={tBand} sfx="pop" volume={0.2} />
        <Cue at={tHome + 0.15} sfx="pop" volume={0.25} />
      </>
    );
  };

  // c02 — "Then Ben pulled a small brick from his pocket: a power bank, a lithium-ion battery that people carried around."
  const C02: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c02");
    const tBen = at("Ben", 0.05);
    const tPulled = at("pulled", 0.08);
    const tBrick = at("brick", 0.18);
    const tPower = at("power", 0.41);
    const tLithium = at("lithium", 0.57);
    const tPeople = at("people", 0.77);
    const B = { scale: 1.6, facing: -1 as const };
    const tStop = Math.max(1.0, tPulled + 0.4);
    const walk = walkAlong(t, { fromX: 1130, toX: 790, start: 0, end: tStop });
    const benPose: Pose | PoseName = walk.walking
      ? walk.pose
      : poseAt(t, [
          { t: tStop, pose: "stand" },
          { t: tStop + 0.2, pose: POCKET },
          { t: Math.max(tBrick, tStop + 0.2), pose: POCKET },
          { t: Math.max(tBrick, tStop + 0.2) + 0.35, pose: "holdUp" },
          { t: tPeople, pose: "holdUp" },
          { t: tPeople + 0.4, pose: "explain" },
        ]);
    const hasBank = t > Math.max(tBrick, tStop + 0.2) - 0.05;
    const benHand = jointWorld({ x: walk.x, y: G, scale: B.scale, facing: B.facing, pose: benPose }, "nearHand");
    const K = { x: 380, y: G, scale: 1.8, facing: 1 as const };
    const kipPose = poseAt(t, [
      { t: 0, pose: "sad" },
      { t: tBen, pose: "sad" },
      { t: tBen + 0.4, pose: "stand" },
      { t: tBrick, pose: "stand" },
      { t: tBrick + 0.4, pose: "think" },
    ]);
    return (
      <>
        <Svg>
          <Garage groundY={G} t={t} />
          <BenchWatch t={t} />
          <Stickman {...K} pose={kipPose} band="cracked" expression={t < tBrick ? "worried" : "curious"} look={0.8} />
          <Stickman
            {...BEN}
            x={walk.x}
            y={G}
            scale={B.scale}
            facing={B.facing}
            pose={benPose}
            expression="happy"
            look={0.6}
            holdNear={hasBank ? <PowerBank y={-14} scale={0.5} leds={4} /> : undefined}
          />
          {hasBank && <RelicGlow x={benHand.x} y={benHand.y - 22} r={60} strength={ramp(t, tBrick, tBrick + 0.3) * 0.7} />}
          <Pill x={600} y={660} text={T("power bank")} show={ramp(t, tPower, tPower + 0.25)} color="#7EE081" size={40} />
          <Pill x={600} y={560} text={T("lithium-ion")} show={ramp(t, tLithium, tLithium + 0.25)} color="#22D3EE" size={36} />
        </Svg>
        <TagFrom at={0} era="present" />
        <Cue at={tPulled + 0.3} sfx="whoosh" volume={0.15} />
        <Cue at={tBrick} sfx="pop" volume={0.25} />
        <Cue at={tPower} sfx="ding" volume={0.2} />
      </>
    );
  };

  // c03 — "His cable fit a tiny port on my band. The little lights blinked, and power started flowing in."
  const C03: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c03");
    const tCable = at("cable", 0.06);
    const tPort = at("port", 0.24);
    const tLights = at("lights", 0.53);
    const tBlinked = at("blinked", 0.58);
    const tPower = at("power", 0.71);
    const tFlowing = at("flowing", 0.84);
    const K = { x: 470, y: G, scale: 1.8, facing: 1 as const };
    const pose = poseAt(t, [
      { t: 0, pose: "stand" },
      { t: 0.35, pose: HANDS },
    ]);
    const hand = jointWorld({ ...K, pose }, "nearHand");
    const band = bandWorld({ ...K, pose });
    const port = { x: hand.x, y: hand.y + (-12 + 56) * BANK_S * K.scale };
    const plug = ramp(t, tCable + 0.1, tPort + 0.1);
    const dangle = { x: port.x + 30, y: port.y + 170 };
    const end = { x: mix(dangle.x, band.x + 10, plug), y: mix(dangle.y, band.y + 4, plug) };
    const blink = t > tBlinked && t < tPower ? Math.floor((t - tBlinked) * 8) % 5 : t >= tPower ? 1 + 3 * ramp(t, tPower, tFlowing + 0.4) : 0;
    const flow = ramp(t, tPower - 0.1, tPower + 0.3);
    return (
      <>
        <Svg zoom={1.32} cx={540} cy={860}>
          <Garage groundY={G} t={t} />
          <BenchWatch t={t} />
          <Stickman {...BEN} x={850} y={G} scale={1.6} facing={-1} pose={t > tPower ? "celebrate" : "stand"} expression="happy" look={0.6} />
          <Stickman {...K} pose={pose} band="cracked" expression={t < tPower ? "curious" : "shocked"} look={0.3} holdNear={heldBank(blink)} />
          <ChargeCable from={port} to={end} sag={plug > 0.95 ? 70 : 40} flow={flow} t={t} />
          <BandGlow p={band} s={0.6 * ramp(t, tFlowing - 0.2, tFlowing + 0.3)} t={t} />
          {plug >= 1 && t < tPort + 0.6 && <circle cx={band.x} cy={band.y} r={14 + 40 * ramp(t, tPort + 0.1, tPort + 0.6)} fill="none" stroke="#F5C542" strokeWidth={4} opacity={1 - ramp(t, tPort + 0.1, tPort + 0.6)} />}
          <Pill x={band.x - 10} y={band.y - 120} text={T("port")} show={ramp(t, tPort, tPort + 0.2) * (1 - ramp(t, tLights - 0.2, tLights))} color="#8B5CF6" size={30} />
        </Svg>
        <TagFrom at={0} era="present" />
        <Cue at={tPort + 0.1} sfx="click" volume={0.4} />
        <Cue at={tBlinked} sfx="pop" volume={0.15} />
        <Cue at={tPower} sfx="ding" volume={0.25} />
      </>
    );
  };

  const CELL = { x: 560, y: 800 };

  // c04 — "Inside the battery, lithium ions drift from one side to the other, through a thin wall called a separator."
  const C04: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c04");
    const tBattery = at("battery", 0.11);
    const tLithium = at("lithium", 0.23);
    const tDrift = at("drift", 0.33);
    const tOther = at("other", 0.55);
    const tWall = at("wall", 0.77);
    const tSep = at("separator", 0.88);
    const intro = ramp(t, 0, 0.5, "out");
    return (
      <>
        <Svg>
          <rect width={1080} height={1920} fill="#F7F0E6" />
          <rect x={40} y={300} width={1000} height={900} rx={40} fill="#FBF6EE" stroke="#CDB9A0" strokeWidth={4} />
          <g transform={`translate(${CELL.x} ${CELL.y}) scale(${0.8 + 0.2 * intro}) translate(${-CELL.x} ${-CELL.y})`} opacity={intro}>
            <CellCutaway
            tr={T}
              x={CELL.x}
              y={CELL.y}
              t={t}
              ions={ramp(t, tDrift - 0.1, tOther + 0.9)}
              ionGlow={ramp(t, tLithium, tLithium + 0.3) * (1 - ramp(t, tOther + 0.6, tOther + 1.0))}
              labels={{
                graphite: ramp(t, tBattery, tBattery + 0.25) * (1 - ramp(t, tSep - 0.3, tSep)),
                oxide: ramp(t, tBattery + 0.15, tBattery + 0.4) * (1 - ramp(t, tSep - 0.3, tSep)),
                ions: ramp(t, tLithium, tLithium + 0.25),
                separator: ramp(t, tSep - 0.05, tSep + 0.2),
              }}
            />
            {t > tWall - 0.1 && (
              <rect x={CELL.x - 20} y={CELL.y - 240} width={40} height={480} rx={20} fill="none" stroke="#22D3EE" strokeWidth={6} opacity={Math.abs(Math.sin((t - tWall) * 6)) * (1 - ramp(t, tSep + 0.4, tSep + 0.8))} />
            )}
          </g>
          <Stickman x={95} y={1180} scale={0.9} pose={t < tDrift ? "explain" : "point"} band="cracked" expression={t < tDrift ? "curious" : "happy"} holdNear={heldBank(4)} />
        </Svg>
        <TagFrom at={0.2} era="present" />
        <Cue at={tLithium} sfx="pop" volume={0.2} />
        <Cue at={tDrift} sfx="whoosh" volume={0.18} />
        <Cue at={tSep} sfx="ding" volume={0.22} />
      </>
    );
  };

  // c05 — "But the separator blocks electrons. So they take the long way, out through the wire, powering my band. Charging pushes everything back."
  const C05: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c05");
    const tBlocks = at("blocks", 0.13);
    const tElectrons = at("electrons", 0.17);
    const tLong = at("long", 0.36);
    const tOut = at("out", 0.46);
    const tPowering = at("powering", 0.58);
    const tCharging = at("Charging", 0.75);
    const tBack = at("back", 0.93);
    const bounce = ramp(t, tBlocks - 0.1, tBlocks + 0.2) * (1 - ramp(t, tLong, tLong + 0.3));
    const wire = ramp(t, tLong - 0.1, tLong + 0.3);
    const charging = ramp(t, tCharging - 0.1, tCharging + 0.2);
    const electrons = ramp(t, tOut - 0.1, tOut + 0.3);
    return (
      <>
        <Svg>
          <rect width={1080} height={1920} fill="#F7F0E6" />
          <rect x={40} y={300} width={1000} height={900} rx={40} fill="#FBF6EE" stroke="#CDB9A0" strokeWidth={4} />
          <CellCutaway
            tr={T}
            x={CELL.x}
            y={CELL.y}
            t={t}
            ions={1 - ramp(t, tCharging + 0.2, tBack + 0.4)}
            ionGlow={charging * 0.8}
            electrons={electrons}
            bounce={bounce}
            wire={wire}
            bandLit={ramp(t, tPowering - 0.05, tPowering + 0.25) * (1 - charging)}
            charging={charging}
            labels={{ electrons: ramp(t, tElectrons, tElectrons + 0.25) * (1 - ramp(t, tCharging - 0.3, tCharging)), charging: ramp(t, tCharging, tCharging + 0.25) }}
          />
          <Stickman x={95} y={1180} scale={0.9} pose={t < tPowering ? "explain" : "point"} band="cracked" expression={t < tPowering ? "curious" : "happy"} holdNear={heldBank(4)} />
        </Svg>
        <TagFrom at={0} era="present" />
        <Cue at={tBlocks} sfx="splat" volume={0.18} />
        <Cue at={tLong} sfx="whoosh" volume={0.2} />
        <Cue at={tPowering} sfx="ding" volume={0.25} />
        <Cue at={tCharging} sfx="click" volume={0.35} />
      </>
    );
  };

  // c06 — "On Lumen, power flows through the air to everything. Here, people store it in batteries and charge them again and again."
  const C06: React.FC<SceneProps> = (props) => {
    const { t, at } = useLangScene(props, L, "c06");
    const MID = 880;
    const TOPG = 840;
    const BOTG = 1235;
    const tLumen = at("Lumen", 0.04);
    const tFlows = at("flows", 0.16);
    const tEverything = at("everything", 0.32);
    const tHere = at("Here", 0.43);
    const tStore = at("store", 0.54);
    const tCharge = at("charge", 0.76);
    const tAgain2 = at("again", 0.92, { nth: 2 });
    // em 2026: o power bank enche na tomada, esvazia e enche de novo
    const fill1 = ramp(t, tStore - 0.1, tStore + 0.7);
    const drain = ramp(t, tCharge - 0.4, tCharge);
    const fill2 = ramp(t, tCharge, tAgain2 + 0.3);
    const leds = 4 * Math.max(0, Math.min(1, fill1 - drain + fill2));
    const topShow = ramp(t, tHere - 0.25, tHere + 0.1);
    const bank = { x: 600, y: 690 };
    const top = (
      <g>
        <PresentBackdrop variant="home" groundY={TOPG} />
        <WallSocket x={380} y={600} />
        <ChargeCable from={{ x: 380, y: 640 }} to={{ x: bank.x, y: bank.y + 60 }} sag={110} flow={fill1 > 0 && drain < 1 ? 1 : fill2 > 0 ? 1 : 0} t={t} />
        <PowerBank x={bank.x} y={bank.y} scale={1.3} leds={leds} glow={leds >= 3.9 ? 0.6 : 0} />
        <Stickman x={850} y={TOPG} scale={1.2} facing={1} pose="think" band="cracked" expression="curious" look={-0.9} />
        <rect x={0} y={0} width={1080} height={MID} fill="#F7F0E6" opacity={0.8 * (1 - topShow)} />
      </g>
    );
    const citizens = [
      { x: 230, facing: 1 as const },
      { x: 850, facing: -1 as const },
    ];
    const bottom = (
      <g>
        <FutureBackdrop variant="city" groundY={BOTG} />
        <PowerWaves x={540} y={1070} t={t} show={ramp(t, tFlows - 0.2, tFlows + 0.2)} r={420} />
        {citizens.map((c, i) => {
          const panel = jointWorld({ x: c.x, y: BOTG, scale: 1.0, facing: c.facing, pose: "holdUp" }, "nearHand");
          const lit = ramp(t, tEverything - 0.2 + i * 0.15, tEverything + 0.1 + i * 0.15);
          return (
            <g key={i}>
              <Stickman {...CITIZEN} x={c.x} y={BOTG} scale={1.0} facing={c.facing} pose="holdUp" expression="happy" look={0.4} />
              <rect x={panel.x - 34} y={panel.y - 60} width={68} height={46} rx={10} fill="#22D3EE" opacity={0.15 + 0.5 * lit} stroke="#22D3EE" strokeWidth={4} />
            </g>
          );
        })}
      </g>
    );
    return (
      <>
        <Svg>
          <SplitCompare top={top} bottom={bottom} topLabel={T("THE OLD DAYS")} bottomLabel={T("MY TIME")} mid={MID} />
        </Svg>
        <Cue at={tLumen} sfx="whoosh" volume={0.2} />
        <Cue at={tHere} sfx="pop" volume={0.2} />
        <Cue at={tStore + 0.7} sfx="ding" volume={0.2} />
        <Cue at={tAgain2 + 0.3} sfx="ding" volume={0.2} />
      </>
    );
  };

  // c07 — "Then my band lit up for three seconds. It showed a machine with four empty slots. To get home, I had to build one."
  const C07: React.FC<SceneProps> = (props) => {
    const { t, dur, at } = useLangScene(props, L, "c07");
    const tLit = at("lit", 0.09);
    const tShowed = at("showed", 0.29);
    const tFour = at("four", 0.42);
    const tSlots = at("slots", 0.49);
    const tHome = at("home", 0.6);
    const tBuild = at("build", 0.7);
    const tOne = at("one", 0.74);
    const K = { x: 360, y: G, scale: 1.8, facing: 1 as const };
    const pose = poseAt(t, [
      { t: 0, pose: "stand" },
      { t: tLit - 0.2, pose: "stand" },
      { t: tLit + 0.15, pose: SHOWBAND },
      { t: tSlots + 0.6, pose: SHOWBAND },
      { t: tSlots + 0.9, pose: "stand" },
      { t: tBuild - 0.1, pose: "stand" },
      { t: tBuild + 0.2, pose: "explain" },
    ]);
    const band = bandWorld({ ...K, pose });
    const on = ramp(t, tLit, tLit + 0.25) * (1 - ramp(t, tSlots + 0.45, tSlots + 0.7));
    const flicker = on > 0 && t > tSlots + 0.2 ? Math.abs(Math.sin(t * 30)) : 1;
    const holo = { x: 620, y: 560 };
    const end = ramp(t, tOne + 0.5, tOne + 0.9);
    return (
      <>
        <Svg zoom={mix(1, 1.06, ramp(t, tHome, dur))} cy={880}>
          <Garage groundY={G} t={t} lamp={1 - 0.4 * on} />
          <BenchWatch t={t} glow={ramp(t, tBuild, tBuild + 0.3) * 0.8} />
          {on > 0 && (
            <path d={`M${band.x} ${band.y} L${holo.x - 230} ${holo.y + 60} L${holo.x + 230} ${holo.y + 60} Z`} fill="#22D3EE" opacity={0.12 * on * flicker} />
          )}
          <MachineBlueprint x={holo.x} y={holo.y} show={on * flicker} t={t} filled={2} empties={ramp(t, tFour - 0.1, tSlots + 0.2)} />
          <Stickman {...BEN} x={880} y={G} scale={1.6} facing={-1} pose={t > tLit && t < tSlots + 0.6 ? "surprised" : "stand"} expression={t > tBuild ? "happy" : "shocked"} look={-0.5} />
          <Stickman {...K} pose={pose} band="cracked" expression={t < tLit ? "worried" : t < tHome ? "shocked" : "determined"} look={t < tSlots + 0.6 ? 0.4 : 0.8} holdNear={heldBank(4)} />
          <BandGlow p={band} s={on} t={t} />
          <EndCard show={end} title={T("TO BE CONTINUED…")} next={T(NEXT)} />
        </Svg>
        <TagFrom at={0} era="present" until={tOne + 0.4} />
        <Cue at={tLit} sfx="whoosh" volume={0.3} />
        <Cue at={tShowed} sfx="ding" volume={0.22} />
        <Cue at={tSlots + 0.5} sfx="pop" volume={0.25} />
        <Cue at={tBuild} sfx="ding" volume={0.25} />
        <Ticks from={tOne + 0.8} n={2} volume={0.3} />
      </>
    );
  };

  return {
    "c01-dead": C01,
    "c02-bank": C02,
    "c03-plug": C03,
    "c04-ions": C04,
    "c05-electrons": C05,
    "c06-compare": C06,
    "c07-blueprint": C07,
  };
};

export const scenes = makeScenes(EN);
