import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Selo } from "../lib/schema";
import { shade, useIdle } from "../lib/anim";
import { COLORS, EASE, FONT, SAFE, SPRING } from "../theme";

const BG: Record<Selo["cor"], string> = {
  amarelo: COLORS.badgeYellow,
  vermelho: COLORS.badgeRed,
  verde: COLORS.badgeGreen,
  azul: COLORS.badgeBlue,
};

const Icon: React.FC<{ icone: Selo["icone"]; size: number; color: string }> = ({ icone, size, color }) => {
  const s = size;
  const stroke = { stroke: COLORS.ink, strokeWidth: s * 0.1, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill={shade(color, 0.55)} stroke={COLORS.ink} strokeWidth="7" />
      {icone === "?" && (
        <>
          <path d="M36 38 C36 24 64 22 64 38 C64 50 50 50 50 62" {...stroke} strokeWidth={10} />
          <circle cx="50" cy="77" r="6" fill={COLORS.ink} />
        </>
      )}
      {icone === "!" && (
        <>
          <path d="M50 24 L50 60" {...stroke} strokeWidth={11} />
          <circle cx="50" cy="77" r="6.5" fill={COLORS.ink} />
        </>
      )}
      {icone === "check" && <path d="M28 52 L44 68 L73 34" {...stroke} strokeWidth={11} />}
      {icone === "x" && <path d="M32 32 L68 68 M68 32 L32 68" {...stroke} strokeWidth={11} />}
      {icone === "raio" && <path d="M56 18 L30 56 L50 56 L44 84 L72 44 L52 44 Z" fill={COLORS.ink} />}
    </svg>
  );
};

export type HookBadgeProps = {
  selo: Selo;
  durationInFrames: number;
  y?: number;
};

/** Selo de gancho (pílula com ícone), como o "? PARECE FÁCIL?". Entra com pop, sai rápido. */
export const HookBadge: React.FC<HookBadgeProps> = ({ selo, durationInFrames, y = SAFE.badgeY }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 2, fps, config: SPRING.bouncy });
  const exitStart = durationInFrames - Math.round(0.25 * fps);
  const exit = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.in,
  });
  const bob = useIdle(4, 2.4);
  const tilt = useIdle(1.2, 3.1, 1);
  const color = BG[selo.cor];
  const size = 64;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: y,
          display: "flex",
          justifyContent: "center",
          transform: `translateY(calc(-50% + ${bob}px)) scale(${interpolate(enter, [0, 1], [0.3, 1]) * (1 - exit * 0.6)}) rotate(${tilt}deg)`,
          opacity: interpolate(enter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }) * (1 - exit),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "14px 34px 14px 16px",
            borderRadius: 999,
            background: `linear-gradient(180deg, ${shade(color, 0.18)} 0%, ${color} 55%, ${shade(color, -0.08)} 100%)`,
            border: `5px solid ${COLORS.ink}`,
            boxShadow: `0 10px 0 ${shade(color, -0.45)}, 0 18px 30px rgba(0,0,0,0.25)`,
          }}
        >
          <Icon icone={selo.icone} size={size} color={color} />
          <span
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 58,
              letterSpacing: 0.5,
              color: COLORS.ink,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {selo.texto}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
