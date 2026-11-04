import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CutFlash, Grain, ProgressBar, Vignette } from "./components/Overlays";
import { HookBadge } from "./components/HookBadge";
import { ViralCaptions } from "./components/ViralCaptions";
import { msToFrame, timelineDurationInFrames } from "./lib/timeline";
import type { SceneWord, VideoDefinition } from "./lib/types";
import { COLORS, FONT, SPRING } from "./theme";

/** Palavras de uma cena, com tempos relativos ao início dela (s). */
const sceneWords = (captions: VideoDefinition["captions"], index: number, sceneStartMs: number): SceneWord[] =>
  captions
    .filter((c) => c.scene === index)
    .map((c) => ({ text: c.text.trim(), start: (c.startMs - sceneStartMs) / 1000, end: (c.endMs - sceneStartMs) / 1000 }));

/** Entrada da cena: leve "punch-in" (escala + desfoque) nos primeiros frames. */
const SceneShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: SPRING.snappy });
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${interpolate(s, [0, 1], [1.06, 1])})`,
        filter: frame < 4 ? `blur(${(4 - frame) * 1.5}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const MissingScene: React.FC<{ id: string }> = ({ id }) => (
  <AbsoluteFill style={{ background: "#2b0f12", alignItems: "center", justifyContent: "center" }}>
    <div style={{ color: "#ff8a80", fontFamily: FONT, fontWeight: 800, fontSize: 54, textAlign: "center", padding: 80 }}>
      Cena "{id}" sem componente em Scenes.tsx
    </div>
  </AbsoluteFill>
);

/**
 * Composição genérica de um Short:
 * fundo → cenas (sincronizadas pela timeline) → vinheta/grão → selo → legendas → áudio/SFX.
 */
export const ShortVideo: React.FC<{ video: VideoDefinition }> = ({ video }) => {
  const { spec, timeline, captions, scenes, Background } = video;
  const { fps } = useVideoConfig();
  const total = timelineDurationInFrames(timeline);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${COLORS.bgTop}, ${COLORS.bgBottom})` }}>
      {Background && <Background />}

      {timeline.scenes.map((s, i) => {
        const from = msToFrame(s.startMs, fps);
        const dur = Math.max(1, msToFrame(s.endMs, fps) - from);
        const Comp = scenes[s.id];
        const cena = spec.cenas[i];
        return (
          <Sequence key={s.id} from={from} durationInFrames={dur} name={s.id} premountFor={fps}>
            <SceneShell>
              {Comp ? (
                <Comp durationInFrames={dur} index={i} id={s.id} words={sceneWords(captions, i, s.startMs)} />
              ) : (
                <MissingScene id={s.id} />
              )}
            </SceneShell>
            {i > 0 && <CutFlash />}
            {cena?.selo && <HookBadge selo={cena.selo} durationInFrames={dur} />}
          </Sequence>
        );
      })}

      <Vignette />
      <Grain />
      {spec.barraProgresso && <ProgressBar />}
      <ViralCaptions captions={captions} />

      {timeline.audio && <Audio src={staticFile(timeline.audio)} />}
      {spec.musica && (
        <Audio
          src={staticFile(spec.musica.arquivo)}
          loop
          volume={(f) =>
            spec.musica!.volume *
            interpolate(f, [0, fps * 0.5, total - fps, total], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      )}
      {timeline.scenes.map((s, i) => {
        const sfx = spec.cenas[i]?.sfx ?? "nenhum";
        if (sfx === "nenhum") return null;
        return (
          <Sequence key={`sfx-${s.id}`} from={msToFrame(s.startMs, fps)} durationInFrames={fps * 2} name={`sfx ${sfx}`}>
            <Audio src={staticFile(`sfx/${sfx}.mp3`)} volume={sfx === "whoosh" ? 0.28 : 0.4} />
            {spec.cenas[i]?.selo && sfx !== "pop" && (
              <Sequence from={3}>
                <Audio src={staticFile("sfx/pop.mp3")} volume={0.35} />
              </Sequence>
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
