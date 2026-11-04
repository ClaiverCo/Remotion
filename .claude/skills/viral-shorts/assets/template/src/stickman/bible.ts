/**
 * SERIES BIBLE — "Relics of the Old Days" (universo Stickman do Futuro).
 *
 * Fonte ÚNICA de verdade do universo: o desenho por código (components em src/stickman)
 * e o pacote de prompts para IA (scripts/prompt-pack.ts) leem daqui. Não redesenhe o
 * protagonista nem o mundo: acrescente detalhes novos só se não contradisserem o que já existe
 * e registre-os em `additions` (com data e episódio).
 *
 * Tudo sobre o FUTURO é ficção. Tudo sobre o PRESENTE (anos 2020) precisa ser fato com fonte.
 */

export type CharacterBible = {
  id: string;
  name: string;
  role: string;
  era: string;
  age: string;
  headShape: string;
  heightHeads: number;
  proportions: string;
  face: string;
  hairOrHeadwear: string;
  clothing: string;
  footwear: string;
  colors: Record<string, string>;
  signatureProp: string;
  distinguishing: string;
  immutable: string[];
  changeable: string[];
};

export const LEAD: CharacterBible = {
  id: "FL-01",
  name: "Kip",
  role: "Lead and narrator. A curious relic hunter from the far future who studies objects from 'the old days' (our present, the 2020s).",
  era: "from the far future (planet Lumen, fiction)",
  age: "a friendly young-adult stickman",
  headShape: "a perfect white circle with a thick black outline",
  heightHeads: 4,
  proportions: "head 1 unit, torso 1.5, legs 1.5; thin straight stick arms and legs of equal thickness; small round fingerless hands",
  face: "two black dot eyes set wide apart, short thick expressive eyebrows, a single-line mouth; no nose, no ears",
  hairOrHeadwear: "No hair; a thin glowing cyan halo ring floats one head-width above the head, tilted about 10 degrees",
  clothing: "a white sleeveless trapezoid tunic from neck to hip with a small high collar and a cyan trim line along the hem",
  footwear: "short rounded white boots",
  colors: {
    outline: "#111827",
    skin: "#FFFFFF",
    tunic: "#F8FAFC",
    trim: "#22D3EE",
    halo: "#22D3EE",
    chronoBand: "#8B5CF6",
    boots: "#FFFFFF",
  },
  signatureProp: "A glowing violet Chrono-Band on his LEFT wrist, his only way to travel in time",
  distinguishing: "the halo is visible in every shot, in every era",
  immutable: [
    "round white head with dot eyes and expressive brows",
    "floating cyan halo ring above the head",
    "white tunic with cyan trim and high collar",
    "violet Chrono-Band on the LEFT wrist",
    "black outline thickness and stick proportions",
  ],
  changeable: ["expression", "pose", "which hand holds the relic (record it per clip)"],
};

export const PRESENT_PEOPLE = {
  id: "PP-xx",
  rule: "same stick style as Kip but NO halo, NO tunic, NO Chrono-Band; simple t-shirt shapes in warm muted colors; slightly smaller than the lead so he stays the focus; never identifiable real people.",
  shirts: ["#D9825B", "#E0B44C", "#8FA37B", "#B9A28C", "#7B8FA6"],
};

export const FUTURE_PEOPLE = {
  id: "FP-xx",
  rule: "same stick style as Kip, plain pale-gray tunics with NO cyan trim, NO halo and NO Chrono-Band; slightly smaller than the lead and visually subordinate; never a second Kip.",
  tunic: "#D5DEE6",
};

export const PLANET = {
  name: "Lumen",
  look: "clean white cities with soft rounded towers, floating platforms, thin glowing cyan and violet light lines, calm and quiet streets",
  dailyLife: [
    "doors, vehicles and devices recognize people automatically; almost nothing needs to be carried",
    "objects from the old days are rare museum relics found in 'the Old Layers' (buried ruins)",
    "information appears as soft floating light panels",
  ],
  year: "an unspecified far future (never give a real future date as a prediction)",
};

export const TIME_TRAVEL = {
  name: "Chrono-Band jump",
  steps: [
    "Kip taps the violet Chrono-Band on his LEFT wrist with his right hand",
    "a ring portal of concentric cyan and violet circles opens beside him",
    "he steps through; the portal collapses into a bright dot",
    "in the old days he arrives from a shrinking violet ring with a soft flash",
  ],
  rule: "Time travel is shown ONLY this way, in every episode.",
};

export const ERAS = {
  future: {
    label: "LUMEN · MY TIME",
    background: "#EEF3F7",
    backgroundDeep: "#DCE7EF",
    scenery: "simple futuristic city shapes, clean curves, floating or glowing elements",
    accents: ["#22D3EE", "#8B5CF6"],
    line: "#B8C7D3",
  },
  present: {
    label: "THE OLD DAYS · 2020s",
    background: "#F7F0E6",
    backgroundDeep: "#EBDDCB",
    scenery: "familiar streets, homes, shops and offices drawn simply",
    accents: ["#D9825B", "#E0B44C"],
    line: "#CDB9A0",
  },
} as const;

/** Assinatura sonora fixa de cada era e da viagem (vale para o vídeo por código e para o pacote de prompts). */
export const SOUND = {
  future: "soft airy synth pad with gentle glassy chimes; quiet, calm streets",
  present: "warm light acoustic guitar or soft piano; faint everyday ambience (distant traffic, birds, footsteps)",
  travel: "rising shimmer whoosh with a soft bass pulse, ending in a bright pop when the portal collapses",
  music: "one unobtrusive lo-fi bed under the voiceover at about -24 dB, ducked further under narration",
};

export const STYLE =
  "clean flat 2D stickman animation: round heads, consistent thick black outlines, slim stick limbs, simple round hands and feet, dot eyes, expressive brows and mouths, compact costume shapes; scenery lines lighter and thinner than character outlines; flat colors; no gradients on characters, no heavy textures, no photorealism, no 3D, no clutter";

export const NEGATIVE = [
  "no character redesign or style drift",
  "no costume or color changes",
  "no extra limbs, extra fingers or merged bodies",
  "no duplicate lead",
  "no prop duplication",
  "no flicker and no unplanned cuts",
  "no generated text, letters, brand names, logos or watermarks",
];

/** Detalhes acrescentados em episódios (não contradizem o resto). Formato: "AAAA-MM-DD · episódio · detalhe". */
export const ADDITIONS: string[] = [
  "2026-11-04 · stickman-electric-fan · On Lumen, a small floating cyan-and-violet breeze swirl can follow a person around to keep them cool (city tech, not part of Kip's outfit).",
  "2026-11-04 · stickman-stuck-01-crystal · Arc \"Stuck in 2026\" (6 episodes): Kip lands in the year 2026 specifically and cannot go home; each episode explains one ordinary object that becomes a part of his home-made time machine.",
  "2026-11-04 · stickman-stuck-01-crystal · Lumen's Central Clock (CLOCK-01): a floating white ring with 12 cyan/violet light dots, one cyan light hand and a window with a quartz tuning-fork crystal at its centre. It keeps every door, floating platform and portal in time; when it lags, doors open late; when it stops, portals lose their reference.",
  "2026-11-04 · stickman-stuck-01-crystal · Ben (PP-02), the 2026 resident from the fan episode, becomes Kip's recurring ally: mustard #E0B44C T-shirt, short black hair, no halo, slightly smaller than Kip. He wears an analog quartz watch on his left wrist and gives it to Kip.",
  "2026-11-04 · stickman-stuck-01-crystal · Planned damage: from the end of Ep. 1 the Chrono-Band stays on Kip's LEFT wrist but is cracked and dark (#4C3D78, a pale crack line, no glow) until the arc says otherwise. It can no longer open a portal by itself.",
  "2026-11-04 · stickman-stuck-01-crystal · Crossing-rule exception for this arc only: a 2026 watch and its quartz crystal may later cross to Lumen (Ep. 6).",
];

/**
 * Parágrafo de identidade (reutilize LITERALMENTE em todo prompt com o personagem).
 * Compacto de propósito (~130 palavras): entra inteiro em cada prompt de imagem e de animação.
 */
export const identityParagraph = (c: CharacterBible) =>
  [
    `${c.name} (${c.id}): ${c.age} ${c.era}.`,
    `${c.heightHeads} heads tall: ${c.proportions}.`,
    `Head: ${c.headShape}. Face: ${c.face}.`,
    `${c.hairOrHeadwear}.`,
    `Clothing: ${c.clothing}. Footwear: ${c.footwear}.`,
    `${c.signatureProp}.`,
    `Exact colors: ${Object.entries(c.colors)
      .map(([k, v]) => `${k} ${v}`)
      .join(", ")}.`,
    `Always: ${c.distinguishing}. Everything above is fixed; only ${c.changeable.join(", ")} may change.`,
  ].join(" ");
