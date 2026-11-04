import React, { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { keyframes, useIdle, useTime } from "../../lib/anim";
import { EASE } from "../../theme";

/**
 * Primitivas 3D low-poly (Three.js via @remotion/three).
 * Render: precisa de WebGL. Localmente use --gl=angle (padrão do npm run render para estilo 3d);
 * em servidor sem GPU, REMOTION_GL=swangle.
 * Regra: TODA animação vem de useCurrentFrame()/useTime(), nunca de useFrame/relógio.
 */

export type Vec3 = [number, number, number];
/**
 * fov = campo de visão VERTICAL (graus). Em 9:16 o horizontal fica bem mais estreito:
 * com fov 50 a 10 unidades de distância cabem ~9 de altura e só ~5 de largura.
 */
export type Camera3DKey = { t: number; pos: Vec3; look: Vec3; fov?: number };

const CameraRig3D: React.FC<{ keys: Camera3DKey[]; ease: keyof typeof EASE }> = ({ keys, ease }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const t = useTime();
  const k = keyframes(
    t,
    keys.map((c) => ({
      t: c.t,
      px: c.pos[0], py: c.pos[1], pz: c.pos[2],
      lx: c.look[0], ly: c.look[1], lz: c.look[2],
      fov: c.fov ?? 50,
    })),
    ["px", "py", "pz", "lx", "ly", "lz", "fov"],
    ease,
  );
  useLayoutEffect(() => {
    camera.position.set(k.px, k.py, k.pz);
    camera.fov = k.fov;
    camera.lookAt(k.lx, k.ly, k.lz);
    camera.updateProjectionMatrix();
  });
  return null;
};

/** Cena 3D em tela cheia com luzes de estúdio e câmera animada por keyframes. */
export const Scene3D: React.FC<{
  camera: Camera3DKey[];
  background?: string;
  fog?: boolean;
  ease?: keyof typeof EASE;
  children: React.ReactNode;
}> = ({ camera, background = "#dfe8ee", fog = true, ease = "inOut", children }) => {
  const { width, height } = useVideoConfig();
  const first = camera[0];
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: first.pos, fov: first.fov ?? 50, near: 0.1, far: 200 }}
      shadows
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ background }}
    >
      <color attach="background" args={[background]} />
      {fog && <fog attach="fog" args={[background, 18, 60]} />}
      <hemisphereLight args={["#ffffff", "#b9a993", 0.9]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[6, 12, 8]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-8, 5, -4]} intensity={0.5} color="#bcd7ff" />
      <CameraRig3D keys={camera} ease={ease} />
      {children}
    </ThreeCanvas>
  );
};

type MeshBase = {
  position?: Vec3;
  rotation?: Vec3;
  scale?: number | Vec3;
  color?: string;
  opacity?: number;
};

const material = (color: string, opacity = 1, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => (
  <meshStandardMaterial
    color={color}
    flatShading
    roughness={0.85}
    metalness={0.02}
    transparent={opacity < 1}
    opacity={opacity}
    {...extra}
  />
);

export const LowPolyBox: React.FC<MeshBase & { size?: Vec3 }> = ({
  position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, size = [1, 1, 1], color = "#d6c8b5", opacity = 1,
}) => (
  <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
    <boxGeometry args={size} />
    {material(color, opacity)}
  </mesh>
);

export const LowPolySphere: React.FC<MeshBase & { radius?: number; detail?: number }> = ({
  position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, radius = 0.5, detail = 1, color = "#e8b04b", opacity = 1,
}) => (
  <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
    <icosahedronGeometry args={[radius, detail]} />
    {material(color, opacity)}
  </mesh>
);

export const Cylinder3D: React.FC<MeshBase & { radius?: number; height?: number; segments?: number; open?: boolean }> = ({
  position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, radius = 1, height = 2, segments = 24, open = false, color = "#ffffff", opacity = 1,
}) => (
  <mesh position={position} rotation={rotation} scale={scale} castShadow={opacity >= 1} receiveShadow>
    <cylinderGeometry args={[radius, radius * 0.92, height, segments, 1, open]} />
    {material(color, opacity, { side: open ? THREE.DoubleSide : THREE.FrontSide, flatShading: false, roughness: 0.25 })}
  </mesh>
);

/** Chão grande que recebe sombra. */
export const Ground3D: React.FC<{ color?: string; size?: number; y?: number }> = ({ color = "#e9e4dc", size = 80, y = 0 }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
    <planeGeometry args={[size, size]} />
    <meshStandardMaterial color={color} roughness={1} />
  </mesh>
);

/** Cano 3D ao longo de pontos (curva suave). */
export const Pipe3D: React.FC<{ points: Vec3[]; radius?: number; color?: string; opacity?: number }> = ({
  points, radius = 0.25, color = "#465260", opacity = 1,
}) => {
  const geom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "centripetal");
    return new THREE.TubeGeometry(curve, 96, radius, 16, false);
  }, [points, radius]);
  return (
    <mesh geometry={geom} castShadow receiveShadow>
      {material(color, opacity, { flatShading: false, roughness: 0.5 })}
    </mesh>
  );
};

/** Volume de água (caixa ou cilindro) com superfície levemente ondulando. size = [largura, altura, profundidade]. */
export const Water3D: React.FC<{ position?: Vec3; size: Vec3; color?: string; opacity?: number; shape?: "box" | "cylinder" }> = ({
  position = [0, 0, 0], size, color = "#4fb7ea", opacity = 0.6, shape = "box",
}) => {
  const wob = useIdle(0.015, 1.6);
  return (
    <mesh position={[position[0], position[1] + wob, position[2]]} receiveShadow>
      {shape === "cylinder" ? <cylinderGeometry args={[size[0] / 2, size[0] / 2, size[1], 32]} /> : <boxGeometry args={size} />}
      <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.15} metalness={0.05} depthWrite={false} />
    </mesh>
  );
};

/** Molécula de água: O vermelho + 2 H brancos a 104,5°. */
export const WaterMolecule: React.FC<{ position?: Vec3; rotation?: Vec3; scale?: number }> = ({
  position = [0, 0, 0], rotation = [0, 0, 0], scale = 1,
}) => {
  const a = (104.5 / 2) * (Math.PI / 180);
  const d = 0.42;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <LowPolySphere radius={0.3} color="#e5484d" detail={2} />
      <LowPolySphere radius={0.18} color="#f5f7fa" position={[Math.sin(a) * d, -Math.cos(a) * d, 0]} detail={2} />
      <LowPolySphere radius={0.18} color="#f5f7fa" position={[-Math.sin(a) * d, -Math.cos(a) * d, 0]} detail={2} />
    </group>
  );
};

/** Gira um grupo continuamente (graus por segundo), derivado do frame. */
export const Spin: React.FC<{ speed?: number; axis?: "x" | "y" | "z"; children: React.ReactNode }> = ({
  speed = 20, axis = "y", children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = ((frame / fps) * speed * Math.PI) / 180;
  const rot: Vec3 = axis === "x" ? [r, 0, 0] : axis === "y" ? [0, r, 0] : [0, 0, r];
  return <group rotation={rot}>{children}</group>;
};
