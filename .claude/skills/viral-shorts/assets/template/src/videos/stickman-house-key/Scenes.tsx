import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { mix, ramp, useScene } from "../../lib/anim";
import type { SceneProps } from "../../lib/types";
import {
  EraTag,
  FUTURE_PEOPLE,
  FutureBackdrop,
  GROUND_Y,
  jointWorld,
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
import { HouseKey, Keyring, LockCutaway, LockFront, RIGHT_BITTING, WRONG_BITTING } from "./LockCutaway";
import { ArrivalRing, CodePanel, DigSite, FrontDoor, FutureDoor, Magnifier } from "./props";

/**
 * Episódio "The House Key" (universo Stickman do Futuro).
 * Regra: todo evento visual acontece QUANDO a palavra é dita — at("palavra", fração-reserva).
 * Kip segura a relíquia na mão DIREITA o episódio todo (olhando para a direita = mão "near").
 */

const PP01 = { kind: "person" as const, shirt: "#D9825B", hair: "bun" as const };
const CITIZEN = { kind: "person" as const, shirt: FUTURE_PEOPLE.tunic, hair: "none" as const };

const Svg: React.FC<{ children: React.ReactNode; zoom?: number; cx?: number; cy?: number }> = ({ children, zoom = 1, cx = 540, cy = 960 }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <g transform={`translate(${cx} ${cy}) scale(${zoom}) translate(${-cx} ${-cy})`}>{children}</g>
    </svg>
  </AbsoluteFill>
);

/** Efeito sonoro num instante da cena (s). */
const Cue: React.FC<{ at: number; sfx: "whoosh" | "pop" | "ding"; volume?: number }> = ({ at, sfx, volume = 0.3 }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round(at * fps))} durationInFrames={fps * 2} layout="none">
      <Audio src={staticFile(`sfx/${sfx}.mp3`)} volume={volume} />
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

const KEY_IN_HAND = <HouseKey x={4} y={-2} rotate={-35} scale={0.95} />;

// c01 — "This tiny metal stick with jagged teeth was buried in the Old Layers. Nobody on Lumen can tell me what it did."
const C01: React.FC<SceneProps> = (props) => {
  const { t, dur, at } = useScene(props);
  const G = 1060;
  const K = { x: 520, y: G, scale: 1.8, facing: 1 as const };
  const tNobody = at("Nobody", 0.62);
  const tWhat = at("what", 0.86);
  const pose = poseAt(t, [
    { t: 0, pose: "holdUp" },
    { t: tNobody, pose: "holdUp" },
    { t: tNobody + 0.35, pose: "explain" },
    { t: tWhat - 0.1, pose: "explain" },
    { t: tWhat + 0.25, pose: "shrug" },
  ]);
  const hand = jointWorld({ ...K, pose }, "nearHand");
  const tJag = at("jagged", 0.24);
  const tWas = at("was", 0.37);
  const mag = ramp(t, tJag - 0.1, tJag + 0.25) * (1 - ramp(t, tWas + 0.15, tWas + 0.45));
  const tBuried = at("buried", 0.4);
  const arrow = ramp(t, tBuried, at("Layers", 0.55, { edge: "end" }));
  const dig = { x: 30, w: 440, depth: 190 };
  const imprint = { x: dig.x + dig.w * 0.42 + 40, y: G + dig.depth - 30 };
  const citizens = [
    { from: 1180, to: 800, delay: 0 },
    { from: 1300, to: 950, delay: 0.15 },
  ];
  return (
    <>
      <Svg zoom={mix(1, 1.04, t / dur)} cy={900}>
        <FutureBackdrop variant="city" groundY={G} />
        <DigSite x={dig.x} groundY={G} w={dig.w} depth={dig.depth} glow={ramp(t, tBuried, tBuried + 0.3)} />
        {arrow > 0 && (
          <path
            d={`M${hand.x - 20} ${hand.y + 30} Q${hand.x - 260} ${hand.y + 120} ${imprint.x} ${imprint.y - 20}`}
            fill="none"
            stroke="#F5C542"
            strokeWidth={7}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - arrow}
          />
        )}
        {citizens.map((c, i) => {
          const w = walkAlong(t, { fromX: c.from, toX: c.to, start: tNobody - 0.1 + c.delay, end: tNobody + 1.0 + c.delay });
          const shrug = ramp(t, at("tell", 0.8) + i * 0.1, at("tell", 0.8) + 0.3 + i * 0.1);
          const p: Pose | PoseName = w.walking ? w.pose : shrug > 0 ? poseAt(shrug, [{ t: 0, pose: "stand" }, { t: 1, pose: "shrug" }]) : "stand";
          return <Stickman key={i} {...CITIZEN} x={w.x} y={G} scale={1.5} facing={-1} pose={p} expression="curious" />;
        })}
        <RelicGlow x={hand.x + 30} y={hand.y - 20} r={90} strength={1 - 0.6 * ramp(t, tNobody, tNobody + 0.4)} />
        <Stickman {...K} pose={pose} expression={t < tNobody ? "curious" : "worried"} holdNear={<HouseKey x={4} y={-2} rotate={-35} scale={0.95} dusty />} look={t < tBuried ? 0.6 : t < tNobody ? -0.8 : 0.8} />
        <Magnifier cx={820} cy={600} r={150} fromX={hand.x + 40} fromY={hand.y - 30} show={mag}>
          <HouseKey x={-170} y={-30} scale={3.8} dusty />
        </Magnifier>
      </Svg>
      <TagFrom at={0} era="future" top={430} />
      <Cue at={tJag} sfx="pop" volume={0.25} />
      <Cue at={tNobody} sfx="whoosh" volume={0.15} />
    </>
  );
};

// c02 — "So I tapped my Chrono-Band and jumped back to the old days, the 2020s, to watch someone use one."
const C02: React.FC<SceneProps> = (props) => {
  const { t, at } = useScene(props);
  const G = GROUND_Y;
  const tTap = at("tapped", 0.06);
  const tBand = at("Chrono", 0.14);
  const tJump = at("jumped", 0.27);
  const tOld = at("old", 0.43);
  const tWatch = at("watch", 0.77);
  const portal = { x: 760, y: G - 215 };
  const tSwitch = Math.max(tJump + 1.0, tOld - 0.2);
  const future = t < tSwitch;
  // futuro: toca a pulseira, abre o portal, entra
  const walk = walkAlong(t, { fromX: 380, toX: portal.x - 40, start: tJump, end: tJump + 0.75, rest: "stand" });
  const futurePose = t < tJump ? poseAt(t, [{ t: 0, pose: "stand" }, { t: tTap, pose: "stand" }, { t: tTap + 0.25, pose: "tapWrist" }, { t: tJump - 0.15, pose: "tapWrist" }, { t: tJump, pose: "stand" }]) : walk.pose;
  const kipFutureX = t < tJump ? 380 : walk.x;
  const vanish = ramp(t, tJump + 0.5, tJump + 0.8);
  const bandGlow = ramp(t, tTap, tTap + 0.2) * (1 - ramp(t, tJump, tJump + 0.3));
  const wrist = jointWorld({ x: 380, y: G, scale: 1.8, facing: 1, pose: "tapWrist" }, "farHand");
  // presente: chega pelo anel violeta, olha em volta, aponta para alguém usando uma chave
  const arrive = ramp(t, tSwitch, tSwitch + 0.6);
  const pastPose = poseAt(t, [
    { t: tSwitch, pose: "surprised" },
    { t: tSwitch + 0.9, pose: "stand" },
    { t: tWatch - 0.1, pose: "stand" },
    { t: tWatch + 0.25, pose: "point" },
  ]);
  const person = walkAlong(t, { fromX: 1160, toX: 905, start: tWatch - 0.4, end: tWatch + 1.0 });
  return (
    <>
      <Svg>
        {future ? (
          <>
            <FutureBackdrop variant="city" />
            <TimePortal x={portal.x} y={portal.y} open={ramp(t, tBand, tBand + 0.5)} collapse={ramp(t, tJump + 0.7, tJump + 1.0)} />
            {bandGlow > 0 && <circle cx={wrist.x} cy={wrist.y} r={30 + 10 * Math.sin(t * 20)} fill="#8B5CF6" opacity={0.35 * bandGlow} />}
            <Stickman x={kipFutureX} y={G} scale={1.8 * (1 - 0.3 * vanish)} pose={futurePose} expression="determined" holdNear={KEY_IN_HAND} opacity={1 - vanish} />
          </>
        ) : (
          <>
            <PresentBackdrop variant="street" />
            <Stickman {...PP01} x={person.x} y={G} scale={1.55} facing={-1} pose={person.walking ? person.pose : "stand"} expression="neutral" opacity={ramp(t, tWatch - 0.4, tWatch - 0.1)} />
            <ArrivalRing x={420} y={G - 215} p={arrive} />
            <Stickman
              x={420}
              y={G}
              scale={1.8}
              pose={pastPose}
              expression={t < tSwitch + 1.2 ? "shocked" : "curious"}
              look={t < tWatch ? Math.sin(t * 3) : 1}
              holdNear={KEY_IN_HAND}
              opacity={ramp(t, tSwitch + 0.25, tSwitch + 0.5)}
            />
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

// c03 — "Back then, people carried little bundles of them. One push into the lock, one twist of the wrist, and the door opened."
const DOOR = { x: 640, w: 290, h: 560 };
const PS = 1.75;
const REACH: Pose = { lean: 2, head: -6, near: [84, 4], far: [-12, 10], legNear: [8, 0], legFar: [-8, 0] };
const C03: React.FC<SceneProps> = (props) => {
  const { t, at } = useScene(props);
  const G = GROUND_Y;
  const lockX = DOOR.x + 30;
  const reach = jointWorld({ x: 0, y: G, scale: PS, facing: 1, pose: REACH }, "nearHand");
  const px = lockX - reach.x - 6;
  const lockFrac = (G - reach.y) / DOOR.h;
  const tBundles = at("bundles", 0.26);
  const tPush = at("push", 0.44);
  const tTwist = at("twist", 0.66);
  const tDoor = at("door", 0.87);
  const walk = walkAlong(t, { fromX: px - 170, toX: px, start: 0, end: 1.1 });
  const personPose: Pose | PoseName = walk.walking
    ? walk.pose
    : poseAt(t, [
        { t: 1.1, pose: "stand" },
        { t: tBundles - 0.2, pose: "stand" },
        { t: tBundles + 0.15, pose: "holdUp" },
        { t: tPush - 0.3, pose: "holdUp" },
        { t: tPush, pose: REACH },
        { t: tDoor + 0.2, pose: REACH },
        { t: tDoor + 0.5, pose: "stand" },
      ]);
  const keyIn = ramp(t, tPush - 0.02, tPush + 0.1);
  const keyTurn = ramp(t, tTwist, tTwist + 0.35);
  const open = ramp(t, tDoor - 0.05, tDoor + 0.6);
  const swing = Math.sin(t * 9) * 12 * (1 - ramp(t, tBundles + 0.9, tBundles + 1.3)) + Math.sin(t * 9) * 3;
  const kipPose = poseAt(t, [
    { t: 0, pose: "stand" },
    { t: tBundles, pose: "stand" },
    { t: tBundles + 0.3, pose: "holdUp" },
    { t: tPush, pose: "holdUp" },
    { t: tPush + 0.3, pose: "think" },
    { t: tDoor - 0.1, pose: "think" },
    { t: tDoor + 0.2, pose: "surprised" },
  ]);
  return (
    <>
      <Svg>
        <PresentBackdrop variant="doorstep" door={false} />
        <FrontDoor x={DOOR.x} groundY={G} w={DOOR.w} h={DOOR.h} open={open} keyIn={keyIn} keyTurn={keyTurn} lockFrac={lockFrac} />
        {keyIn > 0 && open < 0.35 && (
          <Keyring x={lockX} y={G - DOOR.h * lockFrac + 4} scale={0.9 * (1 - open / 0.35)} swing={Math.sin(t * 7) * 6} />
        )}
        <Stickman
          {...PP01}
          x={walk.x}
          y={G}
          scale={PS}
          pose={personPose}
          expression={t > tDoor ? "happy" : "neutral"}
          holdNear={keyIn > 0 ? undefined : <Keyring y={12} scale={1.1} swing={swing} />}
        />
        <Stickman
          x={200}
          y={G}
          scale={2.0}
          pose={kipPose}
          expression={t > tDoor ? "shocked" : "curious"}
          look={0.8}
          holdNear={KEY_IN_HAND}
        />
      </Svg>
      <TagFrom at={0} era="present" />
      <Cue at={tTwist + 0.2} sfx="pop" volume={0.22} />
      <Cue at={tDoor} sfx="whoosh" volume={0.18} />
    </>
  );
};

// c04 — "Inside, spring pins jam the cylinder. The right key lifts each pin to exactly the shear line, and the cylinder turns."
const C04: React.FC<SceneProps> = (props) => {
  const { t, at } = useScene(props);
  const tSpring = at("spring", 0.09);
  const tJam = at("jam", 0.18);
  const tKey = at("key", 0.42);
  const tShear = at("shear", 0.66);
  const tTurn = at("cylinder", 0.87, { nth: 2 });
  const insert = ramp(t, tKey - 0.45, tShear - 0.05, "inOut");
  const wipe = ramp(t, 0, 0.45, "out");
  const blocked = t > tJam && t < tJam + 0.9 ? Math.sin((t - tJam) * 30) * 9 * (1 - (t - tJam) / 0.9) : 0;
  const turn = ramp(t, tTurn, tTurn + 0.5);
  const inset = ramp(t, tJam - 0.2, tJam + 0.1);
  return (
    <>
      <Svg>
        <defs>
          <clipPath id="c04wipe">
            <circle cx={670} cy={900} r={40 + wipe * 1500} />
          </clipPath>
        </defs>
        <g clipPath="url(#c04wipe)">
          <rect width={1080} height={1920} fill="#F7F0E6" />
          <rect x={40} y={270} width={1000} height={930} rx={40} fill="#FBF6EE" stroke="#CDB9A0" strokeWidth={4} />
          <LockCutaway
            x={330}
            y={640}
            scale={1.85}
            insert={insert}
            bitting={RIGHT_BITTING}
            keyOpacity={ramp(t, tKey - 0.7, tKey - 0.4)}
            shear={ramp(t, tShear, tShear + 0.3)}
            springs={ramp(t, tSpring, tSpring + 0.2) * (1 - ramp(t, tJam + 0.4, tJam + 0.7))}
            verdict={ramp(t, tShear, tShear + 0.1)}
            labels={{ pins: ramp(t, tSpring, tSpring + 0.25), shear: ramp(t, tShear, tShear + 0.25) }}
          />
          {inset > 0 && (
            <g opacity={inset}>
              <LockFront x={830} y={1080} r={78} turn={turn} blocked={blocked} />
              {t > tJam && t < tJam + 1.0 && (
                <g transform="translate(830 1080)" stroke="#E05A47" strokeWidth={12} strokeLinecap="round">
                  <line x1={-40} y1={-40} x2={40} y2={40} />
                  <line x1={40} y1={-40} x2={-40} y2={40} />
                </g>
              )}
            </g>
          )}
          <Stickman x={130} y={1180} scale={1.05} pose={t < tTurn ? "explain" : "celebrate"} expression={t < tTurn ? "curious" : "happy"} holdFar={undefined} holdNear={KEY_IN_HAND} />
          <rect x={0} y={0} width={1080} height={1920} fill="#ffffff" opacity={0.6 * (1 - wipe)} />
        </g>
      </Svg>
      <TagFrom at={0.2} era="present" />
      <Cue at={tJam} sfx="pop" volume={0.2} />
      <Cue at={tShear} sfx="ding" volume={0.3} />
      <Cue at={tTurn + 0.3} sfx="pop" volume={0.3} />
    </>
  );
};

// c05 — "Wrong teeth, and one pin still blocks it. On Lumen, my door simply knows me. Back then, the door only trusted the key."
const C05: React.FC<SceneProps> = (props) => {
  const { t, at } = useScene(props);
  const MID = 880;
  const TOPG = 840;
  const BOTG = 1235;
  const tWrong = at("Wrong", 0.02);
  const tBlocks = at("blocks", 0.25);
  const tLumen = at("Lumen", 0.38);
  const tKnows = at("knows", 0.57);
  const tBack = at("Back", 0.67);
  const tTrusted = at("trusted", 0.83);
  // em cima: chave errada → um pino bloqueia; depois a certa gira e a porta abre
  const swapOut = ramp(t, tBack, tBack + 0.35);
  const rightIn = ramp(t, tBack + 0.35, tTrusted);
  const bitting = t < tBack + 0.35 ? WRONG_BITTING : RIGHT_BITTING;
  const insert = t < tBack + 0.35 ? ramp(t, tWrong, tWrong + 1.0) * (1 - swapOut) : rightIn;
  const verdict = t < tBack ? ramp(t, tBlocks, tBlocks + 0.15) : ramp(t, tTrusted - 0.05, tTrusted + 0.1);
  const topOpen = ramp(t, tTrusted + 0.35, tTrusted + 0.9);
  const topTurn = ramp(t, tTrusted, tTrusted + 0.3);
  const wobble = t > tBlocks && t < tBlocks + 0.8 ? Math.sin((t - tBlocks) * 28) * 12 * (1 - (t - tBlocks) / 0.8) : 0;
  const reachTop = { lean: 2, head: -6, near: [84, 4] as [number, number], far: [-12, 10] as [number, number], legNear: [8, 0] as [number, number], legFar: [-8, 0] as [number, number] };
  const DS = 1.1;
  const door = { x: 660, w: 190, h: 320 };
  const reach = jointWorld({ x: 0, y: TOPG, scale: DS, facing: 1, pose: reachTop }, "nearHand");
  const personX = door.x + 22 - reach.x - 4;
  const lockFrac = (TOPG - reach.y) / door.h;
  // embaixo: Kip anda até a porta de Lumen, que o reconhece e abre
  const reveal = ramp(t, tLumen - 0.25, tLumen + 0.1);
  const kipWalk = walkAlong(t, { fromX: 230, toX: 640, start: tLumen, end: tKnows - 0.05 });
  const scan = ramp(t, tKnows, tKnows + 0.3);
  const bottomOpen = ramp(t, tKnows + 0.25, tKnows + 0.75);
  const top = (
    <g>
      <PresentBackdrop variant="doorstep" groundY={TOPG} door={false} />
      <FrontDoor x={door.x} groundY={TOPG} w={door.w} h={door.h} open={topOpen} keyIn={1} keyTurn={topTurn + wobble / 90} lockFrac={lockFrac} />
      <Stickman {...PP01} x={personX} y={TOPG} scale={DS} pose={topOpen > 0.5 ? "stand" : reachTop} expression={t > tTrusted ? "happy" : t > tBlocks ? "worried" : "neutral"} />
      {/* corte da fechadura numa lente */}
      <g>
        <clipPath id="c05lens">
          <circle cx={250} cy={570} r={155} />
        </clipPath>
        <circle cx={250} cy={570} r={155} fill="#FBF6EE" />
        <g clipPath="url(#c05lens)">
          <LockCutaway x={115} y={580} scale={0.9} insert={insert} bitting={bitting} verdict={verdict} shear={verdict} />
        </g>
        <circle cx={250} cy={570} r={155} fill="none" stroke="#111827" strokeWidth={7} />
        <line x1={405} y1={570} x2={door.x + 10} y2={TOPG - door.h * lockFrac} stroke="#111827" strokeWidth={4} strokeDasharray="10 8" />
      </g>
    </g>
  );
  const bottom = (
    <g>
      <FutureBackdrop variant="city" groundY={BOTG} />
      <FutureDoor x={780} groundY={BOTG} w={150} h={250} scan={scan} open={bottomOpen} />
      <Stickman x={kipWalk.x} y={BOTG} scale={1.0} pose={kipWalk.walking ? kipWalk.pose : t > tKnows + 0.4 ? "celebrate" : "stand"} expression="happy" holdNear={KEY_IN_HAND} />
      <rect x={0} y={MID} width={1080} height={1920 - MID} fill="#EEF3F7" opacity={0.75 * (1 - reveal)} />
    </g>
  );
  return (
    <>
      <Svg>
        <SplitCompare top={top} bottom={bottom} topLabel="THE OLD DAYS" bottomLabel="MY TIME" mid={MID} />
      </Svg>
      <Cue at={tBlocks} sfx="pop" volume={0.22} />
      <Cue at={tKnows} sfx="ding" volume={0.28} />
      <Cue at={tTrusted + 0.3} sfx="pop" volume={0.22} />
    </>
  );
};

// c06 — "So this wasn't junk. It was a password, cut into metal, that people carried in their pockets every day."
const C06: React.FC<SceneProps> = (props) => {
  const { t, at } = useScene(props);
  const G = GROUND_Y;
  const tThis = at("this", 0.04);
  const tPassword = at("password", 0.3);
  const tCut = at("cut", 0.41);
  const tMetal = at("metal", 0.5, { edge: "end" });
  const tCarried = at("carried", 0.64);
  const tPockets = at("pockets", 0.76);
  const tEvery = at("every", 0.81);
  const walk = walkAlong(t, { fromX: 520, toX: 700, start: tCarried - 0.3, end: tPockets });
  const pose: Pose | PoseName = walk.walking
    ? walk.pose
    : poseAt(t, [
        { t: 0, pose: "stand" },
        { t: tThis, pose: "stand" },
        { t: tThis + 0.3, pose: "holdUp" },
        { t: tPassword - 0.2, pose: "holdUp" },
        { t: tPassword + 0.1, pose: "explain" },
        { t: tPockets, pose: "explain" },
        { t: tPockets + 0.3, pose: "point" },
        { t: tEvery + 0.35, pose: "point" },
        { t: tEvery + 0.7, pose: "celebrate" },
      ]);
  const K = { x: walk.x, y: G, scale: 1.8, facing: 1 as const };
  const hand = jointWorld({ ...K, pose }, "nearHand");
  const place = ramp(t, tPockets + 0.25, tEvery + 0.35);
  const caseC = { x: 860, y: G - 300 };
  const keyPlaced = place >= 1;
  const keyPos = { x: mix(hand.x, caseC.x, place), y: mix(hand.y, caseC.y, place) };
  return (
    <>
      <Svg zoom={mix(1, 1.03, ramp(t, 0, 7))} cy={900}>
        <FutureBackdrop variant="museum" />
        <CodePanel x={540} y={580} show={ramp(t, tPassword - 0.1, tPassword + 0.25)} digits={ramp(t, tPassword, tCut + 0.3)} trace={ramp(t, tCut, tMetal)} />
        <ArrivalRing x={520} y={G - 215} p={ramp(t, 0, 0.55)} />
        {place > 0 && <RelicGlow x={caseC.x + 30} y={caseC.y} r={keyPlaced ? 110 : 70} strength={keyPlaced ? 1 : 0.6} />}
        <Stickman
          {...K}
          pose={pose}
          expression={t < tPassword ? "determined" : "happy"}
          holdNear={place > 0 ? undefined : KEY_IN_HAND}
          opacity={ramp(t, 0.25, 0.45)}
        />
        {place > 0 && <HouseKey x={keyPos.x} y={keyPos.y} rotate={mix(-35, -10, place)} scale={mix(0.95 * 1.8, 1.4, place)} />}
        {t > tThis && t < tPassword && <RelicGlow x={hand.x + 30} y={hand.y - 20} r={80} strength={0.8} />}
      </Svg>
      <TagFrom at={0.3} era="future" />
      <Cue at={0} sfx="pop" volume={0.25} />
      <Cue at={tPassword} sfx="ding" volume={0.28} />
      <Cue at={tEvery + 0.35} sfx="ding" volume={0.22} />
    </>
  );
};

export const scenes: Record<string, React.FC<SceneProps>> = {
  "c01-relic": C01,
  "c02-jump": C02,
  "c03-doorstep": C03,
  "c04-inside": C04,
  "c05-compare": C05,
  "c06-home": C06,
};
