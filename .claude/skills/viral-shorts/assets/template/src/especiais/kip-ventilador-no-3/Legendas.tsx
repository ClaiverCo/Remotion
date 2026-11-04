import React from 'react';
import {AbsoluteFill, random, spring, useCurrentFrame} from 'remotion';
import {FONT as FONTE} from '../../theme';
import {FPS, H, ramp, T, W} from './timeline';

type Linha = {texto: string; de: number; cor?: string; tamanho?: number};
type Bloco = {de: number; ate: number; titulo: Linha; sub?: Linha[]; tremer?: boolean; y?: number};

const BLOCOS: Bloco[] = [
	{
		de: 6,
		ate: 148,
		titulo: {texto: '40°C NA SOMBRA', de: 6},
		sub: [
			{texto: 'e o ventilador ali,', de: 40},
			{texto: 'me olhando...', de: 48},
		],
	},
	{de: 158, ate: 248, titulo: {texto: 'VELOCIDADE 1', de: 158}, sub: [{texto: 'só faz barulho...', de: 192}]},
	{de: 260, ate: 328, titulo: {texto: 'VELOCIDADE 2', de: 260}, sub: [{texto: 'agora sim...', de: 284}]},
	{de: 332, ate: 382, titulo: {texto: 'MAS E SE...', de: 332}, sub: [{texto: 'eu colocar no 3?', de: 348}]},
	{
		de: 386,
		ate: 488,
		tremer: true,
		titulo: {texto: 'VELOCIDADE 3', de: 386, cor: '#ff3b30'},
		sub: [{texto: 'MODO TURBO', de: 398, cor: '#ffd60a', tamanho: 76}],
	},
	{
		de: 496,
		ate: 620,
		titulo: {texto: 'PELO MENOS', de: 496},
		sub: [{texto: 'parou de suar', de: 514, cor: '#7fd8ff', tamanho: 84}],
	},
	{
		de: T.cta + 2,
		ate: 760,
		y: 640,
		titulo: {texto: 'E VOCÊ?', de: T.cta + 2, tamanho: 128},
		sub: [{texto: 'usa no 1, 2 ou 3?', de: T.cta + 14, tamanho: 76}],
	},
];

const Texto: React.FC<{
	linha: Linha;
	y: number;
	frame: number;
	saida: number;
	padrao: number;
	corPadrao: string;
	tremer?: boolean;
}> = ({linha, y, frame, saida, padrao, corPadrao, tremer}) => {
	const t = frame - linha.de;
	if (t < 0) return null;
	const entra = spring({frame: t, fps: FPS, config: {damping: 11, stiffness: 190, mass: 0.8}});
	const escala = (0.4 + entra * 0.6) * (1 - saida * 0.15);
	const tam = linha.tamanho ?? padrao;
	const dx = tremer ? (random(`tx${frame}`) - 0.5) * 12 : 0;
	const dy = tremer ? (random(`ty${frame}`) - 0.5) * 10 : 0;
	// Evita estourar a largura em textos longos
	const largura = linha.texto.length * tam * 0.6;
	const ajuste = largura > W - 110 ? {textLength: W - 110, lengthAdjust: 'spacingAndGlyphs' as const} : {};
	return (
		<g transform={`translate(${W / 2 + dx} ${y + dy}) scale(${escala}) rotate(${(1 - entra) * -6})`} opacity={Math.min(1, entra * 2) * (1 - saida)}>
			<text
				textAnchor="middle"
				dominantBaseline="middle"
				fontFamily={FONTE}
				fontWeight={900}
				fontSize={tam}
				fill={linha.cor ?? corPadrao}
				stroke="#111"
				strokeWidth={tam * 0.2}
				strokeLinejoin="round"
				paintOrder="stroke"
				{...ajuste}
			>
				{linha.texto}
			</text>
		</g>
	);
};

export const Legendas: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill>
			<svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
				{BLOCOS.filter((b) => frame >= b.de - 1 && frame <= b.ate).map((b) => {
					const saida = ramp(frame, [b.ate - 6, b.ate], [0, 1]);
					const y = b.y ?? 300;
					return (
						<g key={b.de}>
							<Texto linha={b.titulo} y={y} frame={frame} saida={saida} padrao={100} corPadrao="#ffffff" tremer={b.tremer} />
							{b.sub?.map((s, i) => (
								<Texto key={s.texto} linha={s} y={y + 118 + i * 80} frame={frame} saida={saida} padrao={66} corPadrao="#ffd60a" tremer={b.tremer} />
							))}
						</g>
					);
				})}
				<Cta frame={frame} />
			</svg>
		</AbsoluteFill>
	);
};

/** Chamada final: os três botões gigantes + "comenta aí". */
const Cta: React.FC<{frame: number}> = ({frame}) => {
	if (frame < T.cta) return null;
	const botoes = [
		{n: 1, x: 270, rotulo: 'barulho', de: T.cta + 26},
		{n: 2, x: 540, rotulo: 'perfeito', de: T.cta + 34},
		{n: 3, x: 810, rotulo: 'decolar', de: T.cta + 42},
	];
	const y = 1080;
	const comenta = frame - (T.cta + 58);
	const sComenta = comenta >= 0 ? spring({frame: comenta, fps: FPS, config: {damping: 12}}) : 0;
	const pulaSeta = Math.abs(Math.sin(frame * 0.25)) * 18;
	return (
		<g>
			{botoes.map((b) => {
				const t = frame - b.de;
				if (t < 0) return null;
				const s = spring({frame: t, fps: FPS, config: {damping: 8, stiffness: 200}});
				const perigo = b.n === 3;
				const treme = perigo ? Math.sin(frame * 1.9) * 5 : 0;
				return (
					<g key={b.n} transform={`translate(${b.x} ${y}) scale(${s}) rotate(${treme})`}>
						<circle r={104} fill="#000" opacity={0.25} cy={10} />
						<circle r={100} fill={perigo ? '#ff3b30' : '#f4f4f4'} stroke="#111" strokeWidth={10} />
						<circle r={78} fill="none" stroke={perigo ? '#ff8a80' : '#ffffff'} strokeWidth={6} opacity={0.8} />
						<text textAnchor="middle" dominantBaseline="central" fontFamily={FONTE} fontWeight={900} fontSize={120} fill={perigo ? '#fff' : '#222'}>
							{b.n}
						</text>
						<text
							y={160}
							textAnchor="middle"
							dominantBaseline="middle"
							fontFamily={FONTE}
							fontWeight={900}
							fontSize={42}
							fill={perigo ? '#ff6b5e' : '#ffffff'}
							stroke="#111"
							strokeWidth={9}
							paintOrder="stroke"
						>
							{b.rotulo}
						</text>
						{perigo
							? [0, 1, 2].map((i) => (
									<path key={i} d={`M${-130 - ((frame * 4 + i * 20) % 50)} ${-40 + i * 40}h-40`} stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.85} />
								))
							: null}
					</g>
				);
			})}
			{sComenta > 0 ? (
				<g transform={`translate(${W / 2} 1420) scale(${sComenta})`}>
					<text textAnchor="middle" dominantBaseline="middle" fontFamily={FONTE} fontWeight={900} fontSize={70} fill="#ffffff" stroke="#111" strokeWidth={14} paintOrder="stroke">
						comenta aí
					</text>
					<path d={`M0 ${58 + pulaSeta}v60M-30 ${92 + pulaSeta}L0 ${124 + pulaSeta}L30 ${92 + pulaSeta}`} stroke="#ffd60a" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" />
				</g>
			) : null}
		</g>
	);
};
