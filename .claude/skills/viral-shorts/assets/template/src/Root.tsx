import React from "react";
import { Composition } from "remotion";
import { ShortVideo } from "./ShortVideo";
import { timelineDurationInFrames } from "./lib/timeline";
import type { VideoDefinition } from "./lib/types";
import { StickmanSheet } from "./stickman/StickmanSheet";
import { VIDEO } from "./theme";
import { videos } from "./videos/registry";

const checkScenes = (v: VideoDefinition) => {
  const missing = v.spec.cenas.filter((c) => !v.scenes[c.id]).map((c) => c.id);
  if (missing.length) {
    console.warn(`[${v.spec.slug}] cenas sem componente em Scenes.tsx: ${missing.join(", ")}`);
  }
  const ids = v.timeline.scenes.map((s) => s.id).join(",");
  if (ids !== v.spec.cenas.map((c) => c.id).join(",")) {
    console.warn(`[${v.spec.slug}] timeline.json desatualizada em relação ao roteiro: rode npm run sync -- ${v.spec.slug}`);
  }
};

// Um componente estável por vídeo (o Remotion exige referência fixa).
const entries = videos.map((video) => {
  checkScenes(video);
  const Comp: React.FC = () => <ShortVideo video={video} />;
  Comp.displayName = `Short(${video.spec.slug})`;
  return { video, Comp };
});

export const RemotionRoot: React.FC = () => (
  <>
    {entries.map(({ video, Comp }) => (
      <Composition
        key={video.spec.slug}
        id={video.spec.slug}
        component={Comp}
        durationInFrames={timelineDurationInFrames(video.timeline)}
        fps={video.timeline.fps || VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
    ))}
    {/* Folha de referência do Kip (universo Stickman do Futuro) — npm run stickman-sheet */}
    <Composition id="StickmanSheet" component={StickmanSheet} durationInFrames={1} fps={30} width={1920} height={1080} />
  </>
);
