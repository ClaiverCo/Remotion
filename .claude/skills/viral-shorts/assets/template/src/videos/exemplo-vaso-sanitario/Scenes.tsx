import React from "react";
import { AbsoluteFill } from "remotion";
import {
  Arrow,
  Backdrop,
  CameraRig,
  Character,
  Counter,
  Label,
  Stage,
  type CameraKey,
} from "../../components/two5d";
import { mix, ramp, useSceneTime } from "../../lib/anim";
import type { SceneProps } from "../../lib/types";
import { COLORS } from "../../theme";
import { BOWL_LEVEL, FLOOR_Y, STRAIGHT, Toilet, type ToiletState } from "./Toilet";

type Mood = "neutro" | "feliz" | "surpreso" | "nojo" | "pensando";

/** Enquadramento padrão: câmera + palco + fundo + vaso + mascote. */
const Shot: React.FC<{
  cam: CameraKey[];
  state: ToiletState;
  mood?: Mood | null;
  look?: number;
  children?: React.ReactNode;
}> = ({ cam, state, mood = null, look = 1, children }) => (
  <AbsoluteFill>
    <CameraRig keys={cam}>
      <Stage>
        <Backdrop floorY={FLOOR_Y} />
        <Toilet {...state} />
        {mood && <Character x={175} y={962} scale={0.75} mood={mood} look={look} />}
        {children}
      </Stage>
    </CameraRig>
  </AbsoluteFill>
);

const BOWL_BOTTOM = 895;

// s01 — "Pra sumir com o xixi e o cocô, bastava um buraco ligado ao esgoto."
const S01: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { t, dur } = useSceneTime(durationInFrames);
  return (
    <Shot
      cam={[
        { t: 0, x: 560, y: 820, zoom: 1.3 },
        { t: dur, x: 600, y: 1060, zoom: 1.02 },
      ]}
      state={{ trap: 0 }}
      mood="neutro"
    >
      <Arrow d={STRAIGHT} progress={ramp(t, dur * 0.35, dur * 0.95)} color={COLORS.captionHighlight} width={12} />
    </Shot>
  );
};

// s02 — gases com cheiro de ovo podre subiriam pro banheiro
const S02: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { t, dur } = useSceneTime(durationInFrames);
  return (
    <Shot
      cam={[
        { t: 0, x: 600, y: 1000, zoom: 1.0 },
        { t: dur, x: 560, y: 880, zoom: 1.12 },
      ]}
      state={{ trap: 0, gas: ramp(t, 0, 0.6) }}
      mood={t > dur * 0.4 ? "nojo" : "surpreso"}
    >
      <Arrow d="M520 880 C520 760 580 660 540 520" progress={ramp(t, dur * 0.3, dur * 0.8)} color={COLORS.danger} />
    </Shot>
  );
};

// s03 — a curva no cano; a água fica presa e tampa a passagem
const S03: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { t, dur } = useSceneTime(durationInFrames);
  const trap = ramp(t, dur * 0.15, dur * 0.4);
  const seal = ramp(t, dur * 0.5, dur * 0.85);
  return (
    <Shot
      cam={[
        { t: 0, x: 600, y: 1000, zoom: 1.0 },
        { t: dur, x: 640, y: 980, zoom: 1.3 },
      ]}
      state={{ trap, seal, bowlY: mix(BOWL_BOTTOM, BOWL_LEVEL, seal) }}
    />
  );
};

// s04 — sifão e fecho hídrico (gás barrado)
const S04: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { t, dur } = useSceneTime(durationInFrames);
  return (
    <Shot
      cam={[
        { t: 0, x: 640, y: 980, zoom: 1.3 },
        { t: dur, x: 620, y: 1000, zoom: 1.34 },
      ]}
      state={{ trap: 1, seal: 1, bowlY: BOWL_LEVEL, gas: ramp(t, dur * 0.45, dur * 0.7), gasBlocked: true }}
    >
      <Label x={300} y={1150} text="Sifão" to={{ x: 595, y: 1065 }} delay={0.05} size={38} />
      <Label x={430} y={740} text="Fecho hídrico" to={{ x: 560, y: 1010 }} delay={dur * 0.45} size={38} color={COLORS.captionHighlight} />
    </Shot>
  );
};

// s05 — mas como o cocô passa?
const S05: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { dur } = useSceneTime(durationInFrames);
  return (
    <Shot
      cam={[
        { t: 0, x: 470, y: 880, zoom: 1.35 },
        { t: dur, x: 480, y: 860, zoom: 1.45 },
      ]}
      state={{ trap: 1, seal: 1, bowlY: BOWL_LEVEL, poop: 0 }}
      mood="pensando"
    />
  );
};

const Glass: React.FC<{ x: number; y: number; tilt: number }> = ({ x, y, tilt }) => (
  <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
    <path d="M-40 -70 L40 -70 L32 60 L-32 60 Z" fill={COLORS.white} fillOpacity={0.55} stroke={COLORS.ink} strokeWidth={5} />
    <path d="M-36 -20 L36 -20 L32 60 L-32 60 Z" fill={COLORS.water} opacity={0.8} />
  </g>
);

const Bucket: React.FC<{ x: number; y: number; tilt: number }> = ({ x, y, tilt }) => (
  <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
    <path d="M-90 -80 L90 -80 L70 90 L-70 90 Z" fill="#5c9ded" stroke={COLORS.ink} strokeWidth={6} />
    <path d="M-90 -80 Q0 -170 90 -80" fill="none" stroke={COLORS.ink} strokeWidth={6} />
    <rect x={-92} y={-92} width={184} height={18} rx={8} fill="#3f7fd0" stroke={COLORS.ink} strokeWidth={5} />
  </g>
);

// s06 — pouca água não resolve; o truque é muita água de uma vez
const S06: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { t, dur } = useSceneTime(durationInFrames);
  const glass = ramp(t, 0, dur * 0.12);
  const trickle = ramp(t, dur * 0.12, dur * 0.25) * (1 - ramp(t, dur * 0.4, dur * 0.48));
  const bucket = ramp(t, dur * 0.5, dur * 0.62);
  const wave = ramp(t, dur * 0.62, dur * 0.95);
  return (
    <Shot
      cam={[
        { t: 0, x: 520, y: 820, zoom: 1.25 },
        { t: dur * 0.5, x: 540, y: 860, zoom: 1.2 },
        { t: dur, x: 600, y: 900, zoom: 1.08 },
      ]}
      state={{
        trap: 1,
        seal: 1,
        bowlY: BOWL_LEVEL - 10 * trickle - 70 * wave,
        flush: 0.12 * trickle,
        poop: 0,
      }}
      mood={wave > 0 ? "surpreso" : "pensando"}
    >
      {glass > 0 && bucket < 1 && (
        <g opacity={glass * (1 - bucket)}>
          <Glass x={430} y={560} tilt={mix(0, 70, glass)} />
          {trickle > 0 && <path d="M470 600 Q480 680 470 800" stroke={COLORS.water} strokeWidth={10} fill="none" opacity={trickle} />}
        </g>
      )}
      {bucket > 0 && (
        <g opacity={bucket}>
          <Bucket x={420} y={470} tilt={mix(10, 75, bucket)} />
          {wave > 0 && <path d="M480 500 C520 600 520 700 500 800" stroke={COLORS.water} strokeWidth={70 * wave} strokeLinecap="round" fill="none" />}
        </g>
      )}
    </Shot>
  );
};

// s07 — enche a curva e, ao descer, puxa tudo: efeito sifão
const S07: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { t, dur } = useSceneTime(durationInFrames);
  const flushIn = ramp(t, 0, dur * 0.3);
  const flushOut = ramp(t, dur * 0.85, dur);
  return (
    <Shot
      cam={[
        { t: 0, x: 600, y: 900, zoom: 1.08 },
        { t: dur, x: 660, y: 1100, zoom: 1.05 },
      ]}
      state={{
        trap: 1,
        seal: mix(1, 0.35, ramp(t, dur * 0.6, dur)),
        flush: flushIn * (1 - flushOut),
        bowlY: mix(BOWL_LEVEL - 70, BOWL_BOTTOM + 2, ramp(t, dur * 0.2, dur * 0.85)),
        poop: mix(0.001, 0.99, ramp(t, dur * 0.15, dur * 0.9, "in")),
      }}
    >
      <Arrow d="M890 900 L890 1260" progress={ramp(t, dur * 0.15, dur * 0.6)} color={COLORS.captionHighlight} width={12} />
    </Shot>
  );
};

// s08 — a caixa acoplada guarda uns 6 litros
const S08: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { t, dur } = useSceneTime(durationInFrames);
  return (
    <Shot
      cam={[
        { t: 0, x: 600, y: 860, zoom: 1.05 },
        { t: dur, x: 660, y: 680, zoom: 1.2 },
      ]}
      state={{ trap: 1, seal: 1, bowlY: BOWL_LEVEL, tank: ramp(t, 0, dur * 0.3, "out"), tankLevel: 1 }}
      mood="surpreso"
      look={1}
    >
      {t > dur * 0.3 && <Counter x={430} y={560} to={6} start={dur * 0.32} end={dur * 0.8} suffix=" L" size={130} color={COLORS.waterDark} />}
    </Shot>
  );
};

// s09 — botão → obturador levanta → água despenca
const S09: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { t, dur } = useSceneTime(durationInFrames);
  const press = ramp(t, 0, dur * 0.12) * (1 - ramp(t, dur * 0.3, dur * 0.4));
  const open = ramp(t, dur * 0.15, dur * 0.35, "out");
  const drain = ramp(t, dur * 0.3, dur);
  return (
    <Shot
      cam={[
        { t: 0, x: 740, y: 560, zoom: 1.45 },
        { t: dur * 0.5, x: 720, y: 600, zoom: 1.4 },
        { t: dur, x: 640, y: 760, zoom: 1.2 },
      ]}
      state={{
        trap: 1,
        seal: 1,
        tank: 1,
        button: press,
        flapper: open,
        tankLevel: mix(1, 0.06, drain),
        pour: ramp(t, dur * 0.3, dur * 0.4) * (1 - ramp(t, dur * 0.9, dur)),
        bowlY: mix(BOWL_LEVEL, BOWL_LEVEL - 60, drain),
        flush: ramp(t, dur * 0.6, dur),
      }}
    >
      <Label x={540} y={610} text="Obturador" to={{ x: 697, y: 686 }} delay={dur * 0.25} size={36} />
    </Shot>
  );
};

// s10 — boia desce, abre a entrada, enche e fecha
const S10: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { t, dur } = useSceneTime(durationInFrames);
  const fill = ramp(t, dur * 0.12, dur * 0.85);
  const level = mix(0.06, 1, fill);
  const ballY = Math.min(mix(688, 486, level) - 6, 660);
  return (
    <Shot
      cam={[
        { t: 0, x: 760, y: 600, zoom: 1.45 },
        { t: dur, x: 760, y: 560, zoom: 1.5 },
      ]}
      state={{
        trap: 1,
        seal: 0.35,
        bowlY: BOWL_BOTTOM,
        tank: 1,
        tankLevel: level,
        inlet: ramp(t, 0, dur * 0.1) * (1 - ramp(t, dur * 0.82, dur * 0.92)),
      }}
    >
      <Label x={600} y={ballY - 90} text="Boia" to={{ x: 770, y: ballY }} delay={0.05} size={36} color="#ffd8b0" />
    </Shot>
  );
};

// s11 — o tubinho devolve água: o fecho volta e o cheiro fica lá embaixo
const S11: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { t, dur } = useSceneTime(durationInFrames);
  const back = ramp(t, dur * 0.1, dur * 0.6);
  return (
    <Shot
      cam={[
        { t: 0, x: 740, y: 600, zoom: 1.35 },
        { t: dur * 0.45, x: 660, y: 960, zoom: 1.15 },
        { t: dur, x: 660, y: 1000, zoom: 1.12 },
      ]}
      state={{
        trap: 1,
        seal: mix(0.35, 1, back),
        bowlY: mix(BOWL_BOTTOM, BOWL_LEVEL, back),
        tank: 1,
        tankLevel: mix(0.8, 1, back),
        refill: ramp(t, 0, dur * 0.1) * (1 - ramp(t, dur * 0.7, dur * 0.8)),
        inlet: 1 - ramp(t, dur * 0.6, dur * 0.7),
        gas: ramp(t, dur * 0.55, dur * 0.75),
        gasBlocked: true,
      }}
    />
  );
};

// s12 — "Ainda acha que era só um buraco?"
const S12: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { dur } = useSceneTime(durationInFrames);
  return (
    <Shot
      cam={[
        { t: 0, x: 600, y: 840, zoom: 1.12 },
        { t: dur, x: 590, y: 820, zoom: 0.92 },
      ]}
      state={{ trap: 1, seal: 1, bowlY: BOWL_LEVEL, tank: 1, tankLevel: 1 }}
      mood="feliz"
    />
  );
};

export const scenes = {
  "s01-gancho": S01,
  "s02-gases": S02,
  "s03-curva": S03,
  "s04-nomes": S04,
  "s05-pergunta": S05,
  "s06-pouca-agua": S06,
  "s07-efeito-sifao": S07,
  "s08-caixa": S08,
  "s09-obturador": S09,
  "s10-boia": S10,
  "s11-selo-volta": S11,
  "s12-final": S12,
};
