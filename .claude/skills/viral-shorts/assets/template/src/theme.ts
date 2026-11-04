import { loadFont } from "@remotion/fonts";
import { Easing, staticFile } from "remotion";

/**
 * Tema único do projeto: TODAS as cores, fontes e curvas de animação vêm daqui.
 * Para mudar o visual de um vídeo inteiro, mude aqui (ou crie outro tema e passe adiante).
 */

// Montserrat (variável 700–900, licença OFL) embutida em public/fonts: o render não depende de internet.
// Para trocar de fonte, coloque o .woff2 em public/fonts e mude aqui.
const FAMILY = "Montserrat";
loadFont({
  family: FAMILY,
  url: staticFile("fonts/Montserrat-latin.woff2"),
  weight: "700 900",
  unicodeRange:
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
});
loadFont({
  family: FAMILY,
  url: staticFile("fonts/Montserrat-latin-ext.woff2"),
  weight: "700 900",
  unicodeRange:
    "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF",
});

export const FONT = `${FAMILY}, "Arial Black", Arial, sans-serif`;

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/**
 * Áreas seguras 9:16 (px). Os apps cobrem o topo (busca/abas), o rodapé (legenda, música)
 * e a lateral direita (curtir/comentar). Legendas e selos SEMPRE dentro disso.
 */
export const SAFE = {
  top: 230,
  bottom: 1920 - 420,
  left: 70,
  right: 1080 - 170,
  /** Centro vertical da legenda (≈ 70% da altura) */
  captionY: 1330,
  /** Centro vertical do selo de gancho */
  badgeY: 330,
} as const;

/** Paleta inspirada em maquetes 3D de engenharia (areia, concreto, céu claro). */
export const COLORS = {
  bgTop: "#dfe8ee",
  bgBottom: "#c9d6de",
  wall: "#e9eef2",
  wallLine: "#d3dde4",
  floor: "#f6f6f3",
  soil: "#a39484",
  soilDark: "#8c7d6e",
  sand: "#d6c8b5",
  sandDark: "#b9a993",
  concrete: "#c9c2b8",
  ceramic: "#f4f2ee",
  ceramicShade: "#d9d5cd",
  pipe: "#465260",
  pipeDark: "#2f3843",
  pipeOutline: "#eef2f5",
  water: "#4fb7ea",
  waterDark: "#2c8fc6",
  waterFoam: "#bfe7fb",
  gas: "#9ccc65",
  dirt: "#8a6a4f",
  ink: "#1d232a",
  white: "#ffffff",
  danger: "#ff5a4f",
  ok: "#35c26b",
  /** Legenda */
  captionText: "#ffffff",
  captionHighlight: "#48d6ff",
  captionHighlight2: "#ffd84d",
  captionStroke: "#0c1116",
  /** Selo */
  badgeYellow: "#ffd43b",
  badgeYellowDark: "#f2b705",
  badgeRed: "#ff6b5f",
  badgeGreen: "#4cd483",
  badgeBlue: "#53b8ff",
} as const;

export const EASE = {
  /** Saída suave, padrão para quase tudo */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** Saídas são mais rápidas que entradas */
  in: Easing.bezier(0.7, 0, 0.84, 0),
} as const;

/** Presets de spring (use sempre um destes, nunca interpolação linear para movimento). */
export const SPRING = {
  pop: { damping: 12, stiffness: 220, mass: 0.6 },
  smooth: { damping: 200, stiffness: 120, mass: 1 },
  bouncy: { damping: 9, stiffness: 160, mass: 0.7 },
  snappy: { damping: 20, stiffness: 300, mass: 0.5 },
} as const;
