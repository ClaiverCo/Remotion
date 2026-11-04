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
import { mix, ramp, useScene } from "../../lib/anim";
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

// Regra: cada evento visual acontece QUANDO a palavra que o descreve é falada (at("palavra")).
// O 2º argumento de at() é a fração da cena usada se a palavra não for encontrada.

// s01 — "Pra sumir com o xixi e o cocô, bastava um buraco ligado ao esgoto."
const S01: React.FC<SceneProps> = (props) => {
  const { t, dur, at } = useScene(props);
  return (
    <Shot
      cam={[
        { t: 0, x: 520, y: 860, zoom: 1.15 },
        { t: dur, x: 580, y: 1060, zoom: 1.02 },
      ]}
      state={{ trap: 0 }}
      mood="neutro"
    >
      <Arrow d={STRAIGHT} progress={ramp(t, at("buraco", 0.5), at("esgoto", 0.9, { edge: "end" }))} color={COLORS.captionHighlight} width={12} />
    </Shot>
  );
};

// s02 — "Só que o esgoto solta gases com cheiro de ovo podre, que subiriam pro banheiro."
const S02: React.FC<SceneProps> = (props) => {
  const { t, dur, at } = useScene(props);
  return (
    <Shot
      cam={[
        { t: 0, x: 600, y: 1000, zoom: 1.0 },
        { t: dur, x: 560, y: 880, zoom: 1.12 },
      ]}
      state={{ trap: 0, gas: ramp(t, at("solta", 0.15), at("gases", 0.3, { edge: "end" })) }}
      mood={t >= at("cheiro", 0.45) ? "nojo" : "surpreso"}
    >
      <Arrow d="M520 880 C520 760 580 660 540 520" progress={ramp(t, at("subiriam", 0.7), at("banheiro", 0.95, { edge: "end" }))} color={COLORS.danger} />
    </Shot>
  );
};

// s03 — "A solução: uma curva no cano. A água fica presa nela e tampa a passagem."
const S03: React.FC<SceneProps> = (props) => {
  const { t, dur, at } = useScene(props);
  const trap = ramp(t, at("curva", 0.2), at("cano", 0.4, { edge: "end" }));
  const seal = ramp(t, at("agua", 0.5), at("presa", 0.7, { edge: "end" }));
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

// s04 — "Essa curva é o sifão, e essa água é o fecho hídrico."
const S04: React.FC<SceneProps> = (props) => {
  const { t, dur, at } = useScene(props);
  return (
    <Shot
      cam={[
        { t: 0, x: 640, y: 980, zoom: 1.3 },
        { t: dur, x: 620, y: 1000, zoom: 1.34 },
      ]}
      state={{ trap: 1, seal: 1, bowlY: BOWL_LEVEL, gas: ramp(t, at("fecho", 0.6), at("hidrico", 0.8, { edge: "end" })), gasBlocked: true }}
    >
      <Label x={300} y={1150} text="Sifão" to={{ x: 595, y: 1065 }} delay={at("sifao", 0.2)} size={38} />
      <Label x={430} y={740} text="Fecho hídrico" to={{ x: 560, y: 1010 }} delay={at("fecho", 0.6)} size={38} color={COLORS.captionHighlight} />
    </Shot>
  );
};

// s05 — "Mas se a água tampa o cano, como o cocô passa?"
const S05: React.FC<SceneProps> = (props) => {
  const { dur, at } = useScene(props);
  const coco = at("coco", 0.6);
  return (
    <Shot
      cam={[
        { t: 0, x: 470, y: 880, zoom: 1.3 },
        { t: coco, x: 480, y: 860, zoom: 1.38 },
        { t: dur, x: 490, y: 850, zoom: 1.5 },
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

// s06 — "Pouca água não resolve. O truque é muita água de uma vez."
const S06: React.FC<SceneProps> = (props) => {
  const { t, dur, at } = useScene(props);
  const glass = ramp(t, 0, at("agua", 0.12));
  const trickle = ramp(t, at("agua", 0.12), at("resolve", 0.3)) * (1 - ramp(t, at("resolve", 0.35, { edge: "end" }), at("truque", 0.45)));
  const bucket = ramp(t, at("truque", 0.5), at("muita", 0.62));
  const wave = ramp(t, at("muita", 0.62), at("vez", 0.95, { edge: "end" }));
  return (
    <Shot
      cam={[
        { t: 0, x: 520, y: 820, zoom: 1.25 },
        { t: at("truque", 0.5), x: 540, y: 860, zoom: 1.2 },
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

// s07 — "Ela enche a curva e, ao descer, puxa tudo: é o efeito sifão."
const S07: React.FC<SceneProps> = (props) => {
  const { t, dur, at } = useScene(props);
  const flushIn = ramp(t, at("enche", 0.05), at("curva", 0.25, { edge: "end" }));
  const flushOut = ramp(t, dur - 0.5, dur);
  const descer = at("descer", 0.35);
  const puxa = at("puxa", 0.5);
  return (
    <Shot
      cam={[
        { t: 0, x: 600, y: 900, zoom: 1.08 },
        { t: dur, x: 660, y: 1100, zoom: 1.05 },
      ]}
      state={{
        trap: 1,
        seal: mix(1, 0.35, ramp(t, at("efeito", 0.75), dur)),
        flush: flushIn * (1 - flushOut),
        bowlY: mix(BOWL_LEVEL - 70, BOWL_BOTTOM + 2, ramp(t, descer, at("efeito", 0.8))),
        poop: mix(0.001, 0.99, ramp(t, puxa, dur - 0.2, "in")),
      }}
    >
      <Arrow d="M890 900 L890 1260" progress={ramp(t, descer, puxa + 0.4)} color={COLORS.captionHighlight} width={12} />
    </Shot>
  );
};

// s08 — "Por isso existe a caixa acoplada: ela guarda uns 6 litros de água."
const S08: React.FC<SceneProps> = (props) => {
  const { t, dur, at } = useScene(props);
  const caixa = at("caixa", 0.3);
  const guarda = at("guarda", 0.55);
  const litros = at("litros", 0.85, { edge: "end" });
  return (
    <Shot
      cam={[
        { t: 0, x: 600, y: 860, zoom: 1.05 },
        { t: dur, x: 660, y: 680, zoom: 1.2 },
      ]}
      state={{ trap: 1, seal: 1, bowlY: BOWL_LEVEL, tank: ramp(t, caixa - 0.2, caixa + 0.4, "out"), tankLevel: 1 }}
    >
      {t > guarda && <Counter x={430} y={560} to={6} start={guarda} end={litros} suffix=" L" size={130} color={COLORS.waterDark} />}
    </Shot>
  );
};

// s09 — "Apertou o botão, a borracha do fundo, o obturador, levanta e a água despenca."
const S09: React.FC<SceneProps> = (props) => {
  const { t, dur, at } = useScene(props);
  const botao = at("botao", 0.15, { edge: "end" });
  const levanta = at("levanta", 0.6);
  const despenca = at("despenca", 0.75);
  const press = ramp(t, at("apertou", 0), botao) * (1 - ramp(t, botao + 0.3, botao + 0.5));
  const open = ramp(t, levanta, levanta + 0.35, "out");
  const drain = ramp(t, levanta + 0.2, dur);
  return (
    <Shot
      cam={[
        { t: 0, x: 740, y: 560, zoom: 1.45 },
        { t: levanta, x: 720, y: 600, zoom: 1.45 },
        { t: dur, x: 640, y: 760, zoom: 1.2 },
      ]}
      state={{
        trap: 1,
        seal: 1,
        tank: 1,
        button: press,
        flapper: open,
        tankLevel: mix(1, 0.06, drain),
        pour: ramp(t, levanta + 0.2, despenca) * (1 - ramp(t, dur - 0.3, dur)),
        bowlY: mix(BOWL_LEVEL, BOWL_LEVEL - 60, drain),
        flush: ramp(t, despenca, dur),
      }}
    >
      <Label x={540} y={610} text="Obturador" to={{ x: 697, y: 686 }} delay={at("borracha", 0.3)} size={36} />
    </Shot>
  );
};

// s10 — "Aí a boia desce e abre a torneira. Quando a caixa enche, ela sobe e fecha."
const S10: React.FC<SceneProps> = (props) => {
  const { t, dur, at } = useScene(props);
  const abre = at("abre", 0.25);
  const fecha = at("fecha", 0.85);
  const level = mix(0.15, 0.04, ramp(t, at("desce", 0.1), at("desce", 0.2, { edge: "end" }))) + ramp(t, abre, fecha) * 0.96;
  const ballY = Math.min(mix(688, 486, Math.min(1, level)) - 6, 660);
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
        tankLevel: Math.min(1, level),
        inlet: ramp(t, abre, abre + 0.2) * (1 - ramp(t, fecha, fecha + 0.25)),
      }}
    >
      <Label x={600} y={ballY - 90} text="Boia" to={{ x: 770, y: ballY }} delay={at("boia", 0.05)} size={36} color="#ffd8b0" />
    </Shot>
  );
};

// s11 — "E um tubinho manda água pro vaso: o fecho hídrico volta e o cheiro fica lá embaixo."
const S11: React.FC<SceneProps> = (props) => {
  const { t, dur, at } = useScene(props);
  const tubinho = at("tubinho", 0.1);
  const vaso = at("vaso", 0.35);
  const back = ramp(t, at("fecho", 0.45), at("volta", 0.6, { edge: "end" }));
  const cheiro = at("cheiro", 0.7);
  return (
    <Shot
      cam={[
        { t: 0, x: 740, y: 600, zoom: 1.35 },
        { t: vaso, x: 700, y: 760, zoom: 1.25 },
        { t: cheiro, x: 660, y: 980, zoom: 1.15 },
        { t: dur, x: 660, y: 1000, zoom: 1.12 },
      ]}
      state={{
        trap: 1,
        seal: mix(0.35, 1, back),
        bowlY: mix(BOWL_BOTTOM, BOWL_LEVEL, back),
        tank: 1,
        tankLevel: mix(0.8, 1, back),
        refill: ramp(t, tubinho, tubinho + 0.3) * (1 - ramp(t, cheiro, cheiro + 0.4)),
        inlet: 1 - ramp(t, cheiro, cheiro + 0.4),
        gas: ramp(t, cheiro, cheiro + 0.5),
        gasBlocked: true,
      }}
    />
  );
};

// s12 — "Ainda acha que era só um buraco?"
const S12: React.FC<SceneProps> = (props) => {
  const { dur } = useScene(props);
  return (
    <Shot
      cam={[
        { t: 0, x: 560, y: 840, zoom: 1.12 },
        { t: dur, x: 570, y: 820, zoom: 0.92 },
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
