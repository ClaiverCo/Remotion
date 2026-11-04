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
  era: "Future — planet Lumen (fiction)",
  age: "young adult, friendly and curious",
  headShape: "perfect circle, white fill, thick black outline",
  heightHeads: 4,
  proportions:
    "head 1 unit; torso 1.5 units from neck to hip; legs 1.5 units; thin straight stick arms and legs of equal thickness; small round hands with no fingers; short rounded boots",
  face: "two solid black dot eyes set wide apart, short thick expressive eyebrows, simple single-line mouth; no nose, no ears",
  hairOrHeadwear: "no hair; a thin glowing cyan halo ring floats one head-width above his head, tilted about 10 degrees",
  clothing:
    "white sleeveless tunic shaped like a narrow trapezoid from the neck to the hip, with a cyan trim line along the hem and a small high collar",
  footwear: "short rounded white boots with a black outline",
  colors: {
    outline: "#111827",
    skin: "#FFFFFF",
    tunic: "#F8FAFC",
    trim: "#22D3EE",
    halo: "#22D3EE",
    chronoBand: "#8B5CF6",
    boots: "#FFFFFF",
  },
  signatureProp:
    "Chrono-Band: a glowing violet band on his LEFT wrist; it is the only way he travels in time",
  distinguishing: "the floating cyan halo ring above his head is visible in every shot, in every era",
  immutable: [
    "round white head with dot eyes and expressive brows",
    "floating cyan halo ring above the head",
    "white tunic with cyan trim and high collar",
    "violet Chrono-Band on the LEFT wrist",
    "black outline thickness and stick proportions",
  ],
  changeable: ["facial expression", "pose", "which hand holds the relic (record it per clip)"],
};

export const PRESENT_PEOPLE = {
  id: "PP-xx",
  rule: "Generic present-day people: same stick style but NO halo, NO tunic, NO Chrono-Band; simple t-shirt shapes in warm muted colors; slightly smaller than the lead so he stays the focus; never identifiable real people.",
  shirts: ["#D9825B", "#E0B44C", "#8FA37B", "#B9A28C", "#7B8FA6"],
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

export const STYLE =
  "clean 2D flat stickman animation: round heads, consistent thick black outlines, slim stick limbs, simple round hands and feet, dot eyes, expressive eyebrows and mouths; compact costume shapes; background lines lighter and thinner than character outlines; flat colors, no gradients on characters, no heavy textures, no photorealism, no 3D rendering, no detailed anatomy, no visual clutter";

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
export const ADDITIONS: string[] = [];

/** Parágrafo de identidade (reutilize LITERALMENTE em todo prompt com o personagem). */
export const identityParagraph = (c: CharacterBible) =>
  [
    `${c.name} (${c.id}), ${c.role}`,
    `Era of origin: ${c.era}. Age presentation: ${c.age}.`,
    `Head: ${c.headShape}. Height: ${c.heightHeads} heads tall; ${c.proportions}.`,
    `Face: ${c.face}. Headwear: ${c.hairOrHeadwear}.`,
    `Clothing: ${c.clothing}. Footwear: ${c.footwear}.`,
    `Exact colors: ${Object.entries(c.colors)
      .map(([k, v]) => `${k} ${v}`)
      .join(", ")}.`,
    `Signature prop: ${c.signatureProp}. Permanent feature: ${c.distinguishing}.`,
    `Immutable: ${c.immutable.join("; ")}. May change: ${c.changeable.join("; ")}.`,
  ].join(" ");
