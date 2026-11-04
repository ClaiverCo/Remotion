import React from 'react';
import {random, spring} from 'remotion';
import {FONT as FONTE} from '../../theme';
import {FPS, percursoVento, ramp, T, vento} from './timeline';

const ORIGEM_X = 790; // de onde o vento sai (frente da grade)
const PERCURSO = 980;

/** Linhas de vento saindo do ventilador para a esquerda. */
export const LinhasVento: React.FC<{frame: number}> = ({frame}) => {
	const v = vento(frame);
	if (v <= 0.001) return null;
	const andou = percursoVento(frame);
	const N = 26;
	return (
		<g>
			{Array.from({length: N}, (_, i) => {
				const limiar = i / N;
				const visivel = Math.min(1, Math.max(0, (v - limiar * 0.95) * 6));
				if (visivel <= 0) return null;
				const fase = random(`fase${i}`);
				const y0 = 860 + random(`y${i}`) * 300;
				const s = (andou * (0.8 + random(`vel${i}`) * 0.5) + fase * PERCURSO) % PERCURSO;
				const x = ORIGEM_X - s;
				const y = y0 + (y0 - 1000) * (s / PERCURSO) * 0.7 + Math.sin(s * 0.015 + i) * 14;
				const len = 60 + random(`len${i}`) * 110 * (0.4 + v);
				const borda = Math.min(1, s / 80, (PERCURSO - s) / 160);
				const op = visivel * borda * (0.35 + v * 0.55);
				const d = `M${x} ${y}q${len * 0.5} ${-10 - v * 6} ${len} 0`;
				return (
					<g key={i} opacity={op}>
						<path d={d} stroke="#5aaee0" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.35} />
						<path d={d} stroke="#ffffff" strokeWidth={5} fill="none" strokeLinecap="round" />
					</g>
				);
			})}
		</g>
	);
};

/** Flocos de neve soprados pelo ventilador no "modo freezer". */
export const Neve: React.FC<{frame: number}> = ({frame}) => {
	const op = ramp(frame, [T.splat + 10, T.congela + 30], [0, 1]);
	if (op <= 0) return null;
	const andou = percursoVento(frame);
	return (
		<g opacity={op}>
			{Array.from({length: 34}, (_, i) => {
				const s = (andou * (0.9 + random(`nv${i}`) * 0.4) + random(`nf${i}`) * 1100) % 1100;
				const y0 = 820 + random(`ny${i}`) * 560;
				const x = 1000 - s;
				const y = y0 + Math.sin(s * 0.02 + i) * 20;
				const r = 4 + random(`nr${i}`) * 6;
				return <circle key={i} cx={x} cy={y} r={r} fill="#fff" stroke="#b9e1ff" strokeWidth={2} />;
			})}
		</g>
	);
};

/** Folhas de papel voando pela sala no turbo. */
export const Papeis: React.FC<{frame: number}> = ({frame}) => {
	const inicios = [T.clique3 + 14, T.clique3 + 24, T.clique3 + 33, T.clique3 + 47, T.clique3 + 62, T.clique3 + 80];
	return (
		<g>
			{inicios.map((ini, i) => {
				const t = frame - ini;
				if (t < 0 || t > 32) return null;
				const x = 1140 - t * 42;
				const y = 860 + random(`py${i}`) * 420 + Math.sin(t * 0.4 + i) * 40;
				const giro = t * (18 + i * 3) * (i % 2 ? 1 : -1);
				return (
					<g key={i} transform={`translate(${x} ${y}) rotate(${giro})`}>
						<rect x={-32} y={-40} width={64} height={80} fill="#fff" stroke="#262626" strokeWidth={4} />
						{[-20, -6, 8, 22].map((ly) => (
							<line key={ly} x1={-20} x2={20} y1={ly} y2={ly} stroke="#7aa7d6" strokeWidth={4} />
						))}
					</g>
				);
			})}
		</g>
	);
};

/** Explosão em quadrinho "POF!" no impacto. */
export const Pof: React.FC<{frame: number}> = ({frame}) => {
	const t = frame - T.splat;
	if (t < 0 || t > 40) return null;
	const s = spring({frame: t, fps: FPS, config: {damping: 9, stiffness: 220}});
	const op = ramp(t, [26, 40], [1, 0]);
	const pontas = 14;
	const pts = Array.from({length: pontas * 2}, (_, i) => {
		const a = (i / (pontas * 2)) * Math.PI * 2;
		const r = i % 2 === 0 ? 150 : 95;
		return `${Math.cos(a) * r},${Math.sin(a) * r * 0.8}`;
	}).join(' ');
	return (
		<g transform={`translate(335 935) scale(${s}) rotate(-8)`} opacity={op}>
			<polygon points={pts} fill="#ffd60a" stroke="#262626" strokeWidth={8} strokeLinejoin="round" />
			<text
				textAnchor="middle"
				y={26}
				fontFamily={FONTE}
				fontWeight={900}
				fontSize={78}
				fill="#ff3b30"
				stroke="#262626"
				strokeWidth={8}
				paintOrder="stroke"
			>
				POF!
			</text>
		</g>
	);
};
