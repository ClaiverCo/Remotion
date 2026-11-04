import React from 'react';
import {random} from 'remotion';
import {FONT} from '../../theme';
import {anguloPas, botaoAtivo, CHAO, keys, ramp, T, velocidadePas} from './timeline';

// Geometria do ventilador de coluna (visto de 3/4, soprando para a esquerda)
export const GRADE = {x: 870, y: 1000, r: 170, k: 0.5};
const POSTE_X = 908;
const BASE = {x0: 700, x1: 1010, y0: 1404};
export const TECLA = {x0: 718, passo: 44, larg: 38, topo: 1391, afunda: 7};

/** Centro (x) da tecla n (1..3), no topo da base. */
export const teclaX = (n: number) => TECLA.x0 + (n - 1) * TECLA.passo + TECLA.larg / 2;

const CONTORNO = '#262626';

type P = [number, number];

// Formato de uma pá em coordenadas do círculo (apontando para cima)
const PA: P[] = [
	[0, -26],
	[50, -48],
	[74, -140],
	[18, -153],
	[-22, -160],
	[-46, -118],
	[-20, -38],
];

export const Ventilador: React.FC<{frame: number}> = ({frame}) => {
	const vel = velocidadePas(frame);
	const ang = anguloPas(frame);
	const ativo = botaoAtivo(frame);

	// No turbo o ventilador treme e "anda" sozinho pelo chão
	const turbo = frame >= T.clique3 ? ramp(frame, [T.clique3, T.clique3 + 12], [0, 1]) : 0;
	const anda = -ramp(frame, [T.clique3, T.cta], [0, 48]);
	const pulo = -Math.abs(Math.sin(frame * 1.4)) * 4 * turbo;
	const tremX = (random(`vx${frame}`) - 0.5) * 6 * turbo;
	const tremY = (random(`vy${frame}`) - 0.5) * 5 * turbo;

	const {x: cx, y: cy, r, k} = GRADE;
	const mapa = (u: number, v: number, a: number): P => {
		const c = Math.cos((a * Math.PI) / 180);
		const s = Math.sin((a * Math.PI) / 180);
		return [cx + k * (u * c - v * s), cy + (u * s + v * c)];
	};
	const pathPa = (a: number) => {
		const p = PA.map(([u, v]) => mapa(u, v, a));
		const f = (q: P) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
		return `M${f(p[0])}C${f(p[1])} ${f(p[2])} ${f(p[3])}C${f(p[4])} ${f(p[5])} ${f(p[6])}Z`;
	};

	// Desfoque de movimento: cópias "fantasma" atrás de cada pá
	const fantasmas = vel > 10 ? Math.min(5, Math.floor(vel / 10)) : 0;
	const opPa = vel > 40 ? 0.35 : 0.92;

	const pas: React.ReactNode[] = [];
	for (let g = fantasmas; g >= 0; g--) {
		for (let i = 0; i < 3; i++) {
			const a = ang + i * 120 - g * vel * 0.22;
			pas.push(
				<path
					key={`${g}-${i}`}
					d={pathPa(a)}
					fill="#6ec6ff"
					stroke={g === 0 ? '#2a86c8' : 'none'}
					strokeWidth={3}
					opacity={g === 0 ? opPa : (0.28 * (fantasmas + 1 - g)) / (fantasmas + 1)}
				/>,
			);
		}
	}

	// Grade: aros e raios
	const raios = Array.from({length: 18}, (_, i) => {
		const a = (i / 18) * 360;
		const [x1, y1] = mapa(0, -30, a);
		const [x2, y2] = mapa(0, -r, a);
		return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={CONTORNO} strokeWidth={2.2} opacity={0.55} />;
	});

	// Brilho "ting!" quando o boneco olha para o ventilador
	const brilho = keys(frame, [T.brilho, T.brilho + 6, T.brilho + 16], [0, 1, 0]);

	return (
		<g transform={`translate(${anda + tremX} ${pulo + tremY})`}>
			{/* sombra */}
			<ellipse cx={(BASE.x0 + BASE.x1) / 2} cy={CHAO + 4} rx={175} ry={16} fill="rgba(0,0,0,0.18)" />

			{/* poste e pescoço */}
			<rect x={POSTE_X - 11} y={1080} width={22} height={BASE.y0 - 1078} rx={6} fill="#f2f2f2" stroke={CONTORNO} strokeWidth={6} />
			<path d={`M${cx + 55} ${cy + 45}L${POSTE_X} ${1090}`} stroke={CONTORNO} strokeWidth={30} strokeLinecap="round" />
			<path d={`M${cx + 55} ${cy + 45}L${POSTE_X} ${1090}`} stroke="#f2f2f2" strokeWidth={18} strokeLinecap="round" />

			{/* motor (atrás da grade) */}
			<ellipse cx={cx + 62} cy={cy} rx={46} ry={76} fill="#f2f2f2" stroke={CONTORNO} strokeWidth={7} />
			<ellipse cx={cx + 80} cy={cy - 8} rx={12} ry={30} fill="#ffffff" opacity={0.8} />

			{/* pás */}
			{vel > 40 ? <ellipse cx={cx} cy={cy} rx={r * k * 0.93} ry={r * 0.93} fill="#9fd9ff" opacity={0.45} /> : null}
			{pas}

			{/* grade frontal */}
			{raios}
			<ellipse cx={cx} cy={cy} rx={r * k * 0.66} ry={r * 0.66} fill="none" stroke={CONTORNO} strokeWidth={2.5} opacity={0.5} />
			<ellipse cx={cx} cy={cy} rx={r * k * 0.36} ry={r * 0.36} fill="none" stroke={CONTORNO} strokeWidth={2.5} opacity={0.5} />
			<ellipse cx={cx} cy={cy} rx={r * k} ry={r} fill="none" stroke={CONTORNO} strokeWidth={10} />
			<ellipse cx={cx} cy={cy} rx={15} ry={30} fill="#f7f7f7" stroke={CONTORNO} strokeWidth={5} />
			<ellipse cx={cx - 2} cy={cy} rx={5} ry={11} fill="#ff4d4d" />

			{/* base com as teclas (apertadas com o dedão do pé, claro) */}
			{[1, 2, 3].map((n) => {
				const x = TECLA.x0 + (n - 1) * TECLA.passo;
				const desce = n === ativo ? TECLA.afunda : 0;
				return (
					<rect
						key={n}
						x={x}
						y={TECLA.topo + desce}
						width={TECLA.larg}
						height={20}
						rx={5}
						fill={n === ativo ? (n === 3 ? '#ff6b5e' : '#9be38f') : '#e6e6e6'}
						stroke={CONTORNO}
						strokeWidth={4}
					/>
				);
			})}
			<rect x={BASE.x0} y={BASE.y0} width={BASE.x1 - BASE.x0} height={CHAO - BASE.y0 + 4} rx={22} fill="#f7f7f7" stroke={CONTORNO} strokeWidth={7} />
			{[1, 2, 3].map((n) => (
				<text
					key={n}
					x={teclaX(n)}
					y={1438}
					textAnchor="middle"
					fontFamily={FONT}
					fontWeight={900}
					fontSize={26}
					fill={n === 3 ? '#e0392b' : '#555'}
				>
					{n}
				</text>
			))}

			{/* brilho */}
			{brilho > 0 ? (
				<g transform={`translate(${cx - 60} ${cy - 130}) scale(${brilho}) rotate(${frame * 6})`}>
					<path d="M0 -38L8 -8L38 0L8 8L0 38L-8 8L-38 0L-8 -8Z" fill="#fff8b0" stroke="#f5c400" strokeWidth={3} />
				</g>
			) : null}
		</g>
	);
};
