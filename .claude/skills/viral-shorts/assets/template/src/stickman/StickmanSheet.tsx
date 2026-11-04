import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT } from "../theme";
import { LEAD } from "./bible";
import { Stickman, type Expression, type View } from "./Stickman";

/**
 * Folha de referência do protagonista (1920×1080, 1 frame).
 * Serve para o QA do rig e como IMAGEM DE REFERÊNCIA para anexar no Google Flow / Higgsfield.
 * Render: npm run stickman-sheet → out/stickman/character-sheet.png
 */
const VIEWS: { view: View; label: string; facing: 1 | -1 }[] = [
  { view: "front", label: "FRONT", facing: 1 },
  { view: "three-quarter", label: "3/4", facing: 1 },
  { view: "side", label: "SIDE", facing: 1 },
  { view: "back", label: "BACK", facing: -1 },
];
const EXPRESSIONS: Expression[] = ["neutral", "happy", "worried", "shocked", "angry", "determined", "curious"];

export const StickmanSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#FFFFFF", fontFamily: FONT }}>
    <div style={{ position: "absolute", left: 60, top: 40, fontSize: 44, fontWeight: 900, color: LEAD.colors.outline }}>
      {LEAD.name} · {LEAD.id} — character reference sheet
    </div>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
      {VIEWS.map((v, i) => (
        <g key={v.view}>
          <rect x={60 + i * 300} y={130} width={270} height={560} rx={18} fill="#F7F9FB" stroke="#D6DEE5" strokeWidth={3} />
          <Stickman x={195 + i * 300} y={640} scale={1.75} view={v.view} facing={v.facing} expression="neutral" blink={false} />
          <text x={195 + i * 300} y={680} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={26} fill="#5B6670">
            {v.label}
          </text>
        </g>
      ))}
      {/* expressões (close da cabeça) */}
      <defs>
        {EXPRESSIONS.map((e, i) => (
          <clipPath key={e} id={`expr-${e}`}>
            <rect x={60 + i * 170} y={730} width={150} height={250} rx={16} />
          </clipPath>
        ))}
      </defs>
      {EXPRESSIONS.map((e, i) => (
        <g key={e}>
          <rect x={60 + i * 170} y={730} width={150} height={250} rx={16} fill="#F7F9FB" stroke="#D6DEE5" strokeWidth={3} />
          <g clipPath={`url(#expr-${e})`}>
            {/* close: cabeça e ombros (corpo cortado pelo painel) */}
            <Stickman x={135 + i * 170} y={1240} scale={2.1} view="front" expression={e} blink={false} />
          </g>
          <text x={135 + i * 170} y={1012} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={20} fill="#5B6670">
            {e.toUpperCase()}
          </text>
        </g>
      ))}
      {/* paleta */}
      {Object.entries(LEAD.colors).map(([k, v], i) => (
        <g key={k} transform={`translate(${1320 + (i % 2) * 280} ${160 + Math.floor(i / 2) * 90})`}>
          <rect width={64} height={64} rx={12} fill={v} stroke="#111827" strokeWidth={3} />
          <text x={80} y={28} fontFamily={FONT} fontWeight={800} fontSize={22} fill="#111827">
            {k}
          </text>
          <text x={80} y={56} fontFamily={FONT} fontWeight={700} fontSize={20} fill="#5B6670">
            {v}
          </text>
        </g>
      ))}
    </svg>
  </AbsoluteFill>
);
