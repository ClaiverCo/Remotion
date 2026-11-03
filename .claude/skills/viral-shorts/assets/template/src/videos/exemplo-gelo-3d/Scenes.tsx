import React from "react";
import { AbsoluteFill, random } from "remotion";
import { ScreenLabel } from "../../components/ScreenLabel";
import {
  Cylinder3D,
  Ground3D,
  LowPolyBox,
  Scene3D,
  Water3D,
  WaterMolecule,
  type Vec3,
} from "../../components/three";
import { mix, ramp, useIdle, useSceneTime } from "../../lib/anim";
import type { SceneProps } from "../../lib/types";

const ICE = "#d9f1ff";

/** Copo com água e um cubo de gelo boiando (10% acima da linha d'água ≈ 0,917). */
const GlassWithIce: React.FC<{ bob: number }> = ({ bob }) => (
  <group>
    <Water3D position={[0, 1.15, 0]} size={[2.9, 2.3, 2.9]} opacity={0.55} shape="cylinder" />
    <LowPolyBox position={[0, 2.22 + bob, 0]} rotation={[0.1, 0.5 + bob, 0.05]} size={[0.95, 0.95, 0.95]} color={ICE} opacity={0.92} />
    <Cylinder3D position={[0, 1.4, 0]} radius={1.55} height={2.8} open color="#ffffff" opacity={0.22} />
  </group>
);

const G01: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { t, dur } = useSceneTime(durationInFrames);
  const bob = useIdle(0.05, 1.8);
  const a = mix(-0.6, 0.5, ramp(t, 0, dur));
  return (
    <Scene3D camera={[{ t: 0, pos: [Math.sin(a) * 9, 5, Math.cos(a) * 9], look: [0, 1.5, 0] }]}>
      <Ground3D />
      <GlassWithIce bob={bob} />
    </Scene3D>
  );
};

/** Posições de uma rede hexagonal simples (anéis de 6) num plano. */
const hexLattice = (): Vec3[] => {
  const pts: Vec3[] = [];
  const r = 1.0;
  for (const [cx, cy] of [[0, 0], [1.75, 1.0], [-1.75, 1.0], [0, 2.0], [1.75, -1.0], [-1.75, -1.0], [0, -2.0]] as const) {
    for (let k = 0; k < 6; k++) {
      const ang = (k / 6) * Math.PI * 2 + Math.PI / 6;
      pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 0]);
    }
  }
  // remove duplicados (vértices compartilhados)
  return pts.filter((p, i) => pts.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.2) === i);
};
const LATTICE = hexLattice();

const G02: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { t, dur } = useSceneTime(durationInFrames);
  const order = ramp(t, dur * 0.2, dur * 0.8);
  return (
    <Scene3D camera={[{ t: 0, pos: [0, 0.5, 15], look: [0, 0, 0] }, { t: dur, pos: [2, 1.5, 13], look: [0, 0, 0] }]} fog={false}>
      {LATTICE.map((p, i) => {
        const messy: Vec3 = [
          (random(`mx${i}`) - 0.5) * 3.2,
          (random(`my${i}`) - 0.5) * 3.2,
          (random(`mz${i}`) - 0.5) * 2,
        ];
        const jitter = (1 - order) * Math.sin(t * 6 + i) * 0.15;
        const pos: Vec3 = [mix(messy[0], p[0] * 1.15, order) + jitter, mix(messy[1], p[1] * 1.15, order), mix(messy[2], 0, order)];
        return <WaterMolecule key={i} position={pos} rotation={[0, 0, (i % 6) * (Math.PI / 3) * order + (1 - order) * random(`r${i}`) * 6]} scale={0.9} />;
      })}
    </Scene3D>
  );
};

const G03: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { t, dur } = useSceneTime(durationInFrames);
  const grow = ramp(t, dur * 0.08, dur * 0.4, "out");
  const s = mix(1, 1.09 ** (1 / 3) * 1.0, grow);
  return (
    <AbsoluteFill>
      <Scene3D camera={[{ t: 0, pos: [0, 4, 11], look: [0, 1.1, 0] }, { t: dur, pos: [1.2, 3.8, 10.5], look: [0, 1.1, 0] }]}>
        <Ground3D />
        <Water3D position={[-1.25, 0.8, 0]} size={[1.6, 1.6, 1.6]} opacity={0.75} />
        <LowPolyBox position={[1.25, 0.8 * s, 0]} size={[1.6, 1.6, 1.6]} scale={s} color={ICE} opacity={0.9} />
      </Scene3D>
      <ScreenLabel x={330} y={700} text="Água" delay={0.1} color="#9fdcff" />
      <ScreenLabel x={760} y={700} text="Gelo +9%" delay={dur * 0.25} />
    </AbsoluteFill>
  );
};

const G04: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { t, dur } = useSceneTime(durationInFrames);
  const bob = useIdle(0.05, 1.8);
  return (
    <Scene3D camera={[{ t: 0, pos: [3, 4, 8], look: [0, 1.7, 0] }, { t: dur, pos: [7, 6, 13], look: [0, 1.4, 0] }]}>
      <Ground3D />
      <GlassWithIce bob={bob + Math.sin(t * 2) * 0.02} />
    </Scene3D>
  );
};

export const scenes = {
  "g01-gancho": G01,
  "g02-rede": G02,
  "g03-volume": G03,
  "g04-final": G04,
};
