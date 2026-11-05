import captions from "./captions.json";
import roteiro from "./roteiro.json";
import timeline from "./timeline.json";
import lang from "./lang.json";
import { parseRoteiro } from "../../lib/schema";
import type { Timeline, VideoCaption, VideoDefinition } from "../../lib/types";
import type { SceneLang } from "../../stickman/lang";
import { makeScenes } from "../stickman-stuck-01-crystal/Scenes";

/** Versão em português do Brasil: as mesmas cenas do episódio em inglês, com o pacote de idioma (lang.json). */
export const video: VideoDefinition = {
  spec: parseRoteiro(roteiro),
  timeline: timeline as Timeline,
  captions: captions as VideoCaption[],
  scenes: makeScenes(lang as SceneLang),
};
