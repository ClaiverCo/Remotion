import captions from "./captions.json";
import roteiro from "./roteiro.json";
import timeline from "./timeline.json";
import lang from "./lang.json";
import { parseRoteiro } from "../../lib/schema";
import type { Timeline, VideoCaption, VideoDefinition } from "../../lib/types";
import type { SceneLang } from "../../stickman/lang";
import { makeScenes } from "../stickman-stuck-04-gps/Scenes";

/** Versão em inglês do ep. 4 (o original é em português): as mesmas cenas, com o pacote de idioma (lang.json). */
export const video: VideoDefinition = {
  spec: parseRoteiro(roteiro),
  timeline: timeline as Timeline,
  captions: captions as VideoCaption[],
  scenes: makeScenes(lang as SceneLang),
};
