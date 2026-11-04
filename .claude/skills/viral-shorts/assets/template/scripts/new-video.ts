/**
 * Cria a pasta de um vídeo novo em src/videos/<slug>/ e registra a composição.
 *
 * Uso: npm run new -- <slug> [--estilo 2.5d|3d] [--titulo "Como funciona X"]
 * Cria: roteiro.json, metadata.json, Scenes.tsx, index.ts, captions.json, timeline.json
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { estimateCaptions } from "../src/lib/captions.ts";
import { parseRoteiro } from "../src/lib/schema.ts";
import { scriptWords } from "../src/lib/words.ts";
import { fail, ROOT, saveCaptionsAndTimeline, videoDir, writeJson } from "./lib/project.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    estilo: { type: "string", default: "2.5d" },
    titulo: { type: "string" },
  },
});
const slug = positionals[0];
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  fail("Uso: npm run new -- <slug> (só letras minúsculas, números e hífen, ex.: como-funciona-chuveiro)");
}
const estilo = values.estilo === "3d" ? "3d" : "2.5d";
const dir = videoDir(slug!);
if (fs.existsSync(dir)) fail(`src/videos/${slug} já existe.`);
fs.mkdirSync(dir, { recursive: true });

const roteiro = {
  slug,
  titulo: values.titulo ?? slug!.replace(/-/g, " "),
  tema: values.titulo ?? slug!.replace(/-/g, " "),
  modelo: "parece-facil",
  estilo,
  idioma: "pt-BR",
  perguntaCentral: "Qual é a pergunta que só será respondida no final?",
  duracaoAlvoSeg: 45,
  voz: "estimada",
  barraProgresso: false,
  cenas: [
    {
      id: "s01-gancho",
      narracao: "Gancho forte em até *dois* segundos.",
      visual: "Descreva o que aparece na tela.",
      selo: { texto: "PARECE FÁCIL?", icone: "?" },
      sfx: "whoosh",
      fontes: [],
    },
    {
      id: "s02-final",
      narracao: "Final que conecta com o *começo*.",
      visual: "Descreva o que aparece na tela.",
      sfx: "ding",
      fontes: [],
    },
  ],
};
writeJson(path.join(dir, "roteiro.json"), roteiro);

writeJson(path.join(dir, "metadata.json"), {
  youtube: {
    titulo: "Título com curiosidade (até 60 caracteres)",
    descricao: "Primeira linha = gancho. Depois 1–2 frases explicando o que a pessoa vai aprender.",
    hashtags: ["#shorts", "#curiosidades", "#ciencia"],
    tags: ["curiosidades", "como funciona"],
    categoria: "27",
    privacidade: "private",
    publicarEm: null,
    midiaSintetica: true,
  },
  tiktok: { legenda: "Gancho curto + pergunta para comentar", hashtags: ["#curiosidades", "#aprendanotiktok", "#ciencia"] },
  reels: { legenda: "Gancho + CTA (salve para mostrar a alguém)", hashtags: ["#curiosidades", "#ciencia", "#comofunciona"] },
});

const scenesTsx =
  estilo === "3d"
    ? `import { AbsoluteFill } from "remotion";
import type { SceneProps } from "../../lib/types";
import { Scene3D, LowPolyBox, Ground3D } from "../../components/three";

// Uma entrada por id de cena do roteiro.json. Use os primitivos de components/three.
const Gancho: React.FC<SceneProps> = () => (
  <AbsoluteFill>
    <Scene3D camera={[{ t: 0, pos: [6, 5, 9], look: [0, 1, 0] }, { t: 3, pos: [4, 3, 7], look: [0, 1, 0] }]}>
      <Ground3D />
      <LowPolyBox position={[0, 1, 0]} size={[2, 2, 2]} color="#e8b04b" />
    </Scene3D>
  </AbsoluteFill>
);

export const scenes = {
  "s01-gancho": Gancho,
  "s02-final": Gancho,
};
`
    : `import { AbsoluteFill } from "remotion";
import type { SceneProps } from "../../lib/types";
import { Stage, Block, CameraRig } from "../../components/two5d";

// Uma entrada por id de cena do roteiro.json. Use os primitivos de components/two5d.
const Gancho: React.FC<SceneProps> = () => (
  <AbsoluteFill>
    <CameraRig keys={[{ t: 0, x: 540, y: 960, zoom: 1 }, { t: 3, x: 540, y: 980, zoom: 1.08 }]}>
      <Stage>
        <Block x={340} y={820} w={400} h={300} depth={60} color="#cbbba6" />
      </Stage>
    </CameraRig>
  </AbsoluteFill>
);

export const scenes = {
  "s01-gancho": Gancho,
  "s02-final": Gancho,
};
`;
fs.writeFileSync(path.join(dir, "Scenes.tsx"), scenesTsx);

fs.writeFileSync(
  path.join(dir, "index.ts"),
  `import captions from "./captions.json";
import roteiro from "./roteiro.json";
import timeline from "./timeline.json";
import { parseRoteiro } from "../../lib/schema";
import type { Timeline, VideoCaption, VideoDefinition } from "../../lib/types";
import { scenes } from "./Scenes";

export const video: VideoDefinition = {
  spec: parseRoteiro(roteiro),
  timeline: timeline as Timeline,
  captions: captions as VideoCaption[],
  scenes,
};
`,
);

const parsed = parseRoteiro(roteiro);
saveCaptionsAndTimeline(slug!, parsed, estimateCaptions(scriptWords(parsed)), { audio: null, source: "estimada" });

// Registra no src/videos/registry.ts
const registry = path.join(ROOT, "src", "videos", "registry.ts");
const ident = slug!.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase()).replace(/^[0-9]/, "_$&");
let reg = fs.readFileSync(registry, "utf8");
reg = reg.replace(
  "// @registry-imports",
  `import { video as ${ident} } from "./${slug}";\n// @registry-imports`,
);
reg = reg.replace("// @registry-entries", `${ident},\n  // @registry-entries`);
fs.writeFileSync(registry, reg);

console.log(`✔ src/videos/${slug}/ criado e registrado (estilo ${estilo}).`);
console.log("ℹ Próximo: escreva pesquisa.md e roteiro.json, depois npm run estimate -- " + slug);
