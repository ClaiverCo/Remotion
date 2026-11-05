import captions from "./captions.json";
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
