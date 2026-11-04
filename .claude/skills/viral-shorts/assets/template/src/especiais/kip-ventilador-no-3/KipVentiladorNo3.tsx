import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame} from 'remotion';
import {jointWorld, mixPose, POSES, Stickman, walkAlong, type Expression, type Pose, type View} from '../../stickman';
import {Sweat} from '../../videos/stickman-electric-fan/props';
import {Cenario} from './Cenario';
import {LinhasVento, Neve, Papeis, Pof} from './Efeitos';
import {Legendas} from './Legendas';
import {Sons} from './Sons';
import {CHAO, FPS, keys, PARADA, ramp, T, vento, W, H} from './timeline';
import {TECLA, teclaX, Ventilador} from './Ventilador';

/**
 * "Ventilador no 3" — comédia curta em pt-BR com o Kip (spin-off do universo Stickman do Futuro).
 * O Kip segue a bíblia: halo, túnica, Chrono-Band no pulso esquerdo e cores fixas (o gelo é um bloco por cima,
 * nunca uma troca de cor do personagem).
 */

const S = 2.0; // escala do Kip (~430 px de altura)
const PAREDE = {x: 148, hipY: 1240};

type Ator = {x: number; pose: Pose; view?: View; expression: Expression; look?: number; giro?: number; hipY?: number; suor?: number};

/** Altura do quadril acima dos pés para uma pose (px, já na escala). */
const alturaQuadril = (pose: Pose) => -jointWorld({x: 0, y: 0, scale: S, facing: 1, pose}, 'hip').y;

/** IK de dois ossos no espaço do rig (ângulos a partir de baixo, + = para a frente). Devolve [quadril, joelho]. */
const ikPerna = (dx: number, dy: number): [number, number] => {
	const l = 46;
	const d = Math.min(Math.max(Math.hypot(dx, dy), 2), 2 * l - 0.01);
	const base = (Math.atan2(dx, dy) * 180) / Math.PI;
	const a = (Math.acos(d / (2 * l)) * 180) / Math.PI; // triângulo isósceles
	const b = (Math.acos((2 * l * l - d * d) / (2 * l * l)) * 180) / Math.PI;
	const coxa = base + a; // joelho dobra para a frente
	const canela = coxa - (180 - b);
	return [coxa, coxa - canela];
};

const CHUTES: [number, number, number][] = [
	[T.clique1 - 13, 1, 0],
	[T.clique2 - 13, 2, 0],
	[T.clique3 - 21, 3, 8],
];

/** Pé do Kip apertando a tecla n com o dedão: repouso → acima → (suspense) → aperta → sobe → repouso. */
const chute = (f: number, [ini, n, susp]: [number, number, number], x: number) => {
	const fr = [ini, ini + 7, ini + 10 + susp, ini + 13 + susp, ini + 17 + susp, ini + 26 + susp];
	if (f < fr[0] || f > fr[5]) return null;
	const kx = teclaX(n);
	const tremor = susp && f > fr[1] && f < fr[2] ? Math.sin(f * 3) * 3 : 0;
	const pe = {
		x: keys(f, fr, [x + 8, kx - 6, kx, kx, kx - 12, x + 8]) + tremor,
		y: keys(f, fr, [CHAO, 1335, 1340, TECLA.topo + TECLA.afunda, 1355, CHAO]),
	};
	const apoio: [number, number] = [-4, 0];
	const hip = alturaQuadril({...POSES.stand, legNear: apoio, legFar: apoio});
	const leg = ikPerna((pe.x - x) / S, (pe.y - (CHAO - hip)) / S);
	const k = keys(f, [fr[0], fr[0] + 6, fr[5] - 6, fr[5]], [0, 1, 1, 0]);
	const pose: Pose = {lean: 2, head: 6, near: [30 + 20 * k, 20 * k], far: [-20 - 40 * k, -20 * k], legNear: leg, legFar: apoio};
	return {pose, n};
};

const MAOS_NA_CINTURA: Pose = {lean: 0, head: 0, near: [38, -112], far: [-38, 112], legNear: [6, 0], legFar: [-6, 0]};
const BRACOS_ABERTOS = (k: number): Pose => ({lean: -3, head: -6, near: [22 + 140 * k, 10 - 20 * k], far: [-22 - 140 * k, -10 + 20 * k], legNear: [8, 0], legFar: [-8, 0]});
const ABRACADO_NA_PAREDE: Pose = {lean: 0, head: 0, near: [148, 6], far: [-148, -6], legNear: [24, 0], legFar: [-24, 0]};

const atorPara = (f: number): Ator => {
	const t = f / FPS;
	const v = vento(f);

	// 1) Calor: derretendo parado
	if (f < T.andarIni) {
		const s = keys(f, [18, 80, 86, 92], [0, 1, 1, 0.4]);
		return {
			x: PARADA.inicio,
			pose: mixPose('stand', 'sad', s),
			view: 'three-quarter',
			expression: 'worried',
			look: f < T.virar ? -0.3 : 1,
			suor: 1,
		};
	}

	// 2) Caminha até o ventilador
	if (f < T.andarFim) {
		const w = walkAlong(t, {fromX: PARADA.inicio, toX: PARADA.b1, start: T.andarIni / FPS, end: T.andarFim / FPS});
		return {x: w.x, pose: w.pose, expression: 'determined', suor: 1};
	}

	// 3) Os botões (com o dedão do pé) e as reações entre eles
	if (f < T.clique3 + 4) {
		let x: number = PARADA.b1;
		let pose: Pose = POSES.stand;
		let view: View = 'side';
		let expression: Expression = 'worried';
		let look = 0.6;
		if (f >= T.passo2Ini && f < T.passo2Fim) {
			const w = walkAlong(t, {fromX: PARADA.b1, toX: PARADA.b2, start: T.passo2Ini / FPS, end: T.passo2Fim / FPS});
			x = w.x;
			pose = w.pose;
		} else if (f >= T.passo3Ini && f < T.passo3Fim) {
			const w = walkAlong(t, {fromX: PARADA.b2, toX: PARADA.b3, start: T.passo3Ini / FPS, end: T.passo3Fim / FPS});
			x = w.x;
			pose = w.pose;
		} else if (f >= T.passo3Fim) x = PARADA.b3;
		else if (f >= T.passo2Fim) x = PARADA.b2;

		if (f >= T.tedio && f < T.passo2Ini) {
			// velocidade 1: de frente para a câmera, mão na cintura, nada impressionado
			view = 'front';
			expression = 'neutral';
			look = 0;
			pose = mixPose('stand', MAOS_NA_CINTURA, ramp(f, [T.tedio, T.tedio + 8]));
		} else if (f >= T.feliz && f < T.malicia) {
			// velocidade 2: alívio, braços abertos
			view = 'front';
			expression = 'happy';
			look = 0;
			pose = BRACOS_ABERTOS(ramp(f, [T.feliz, T.feliz + 16], [0, 1], Easing.out(Easing.back(1.4))));
		} else if (f >= T.malicia && f < T.passo3Ini) {
			// "mas e se..."
			view = 'three-quarter';
			expression = 'determined';
			look = -0.6;
			pose = mixPose('stand', 'think', ramp(f, [T.malicia, T.malicia + 8]));
		} else if (f >= T.passo3Ini) {
			expression = 'determined';
		}

		const c = CHUTES.map((k) => chute(f, k, x)).find(Boolean);
		if (c) {
			pose = c.pose;
			view = 'side';
			look = 1;
			if (c.n === 3) expression = 'determined';
		}
		return {x, pose, view, expression, look, suor: 1 - ramp(f, [T.clique2 + 8, T.clique2 + 35])};
	}

	// 4) Turbo: lutando contra o vento e escorregando para trás
	if (f < T.decola) {
		const luta = ramp(f, [T.clique3 + 3, T.clique3 + 14]);
		const x = interpolate(f, [T.clique3 + 3, T.decola], [PARADA.b3, 545], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: Easing.out(Easing.poly(1.3)),
		});
		const pose: Pose = {
			lean: 20 * luta + Math.sin(f * 2.1) * 2,
			head: 6,
			near: [-(100 + Math.sin(f * 1.9) * 16) * luta, (-20 + Math.sin(f * 2.3) * 30) * luta],
			far: [-(80 + Math.sin(f * 1.7 + 1) * 16) * luta, (-10 + Math.sin(f * 2.6) * 30) * luta],
			legNear: [-10 * luta + Math.sin(f * 1.6) * 4 * luta, -6 * luta],
			legFar: [-30 * luta, -14 * luta],
		};
		return {x: x + (random(`bx${f}`) - 0.5) * 6 * luta, pose, expression: luta > 0.3 ? 'shocked' : 'determined', look: 1};
	}

	// 5) Decola e sai rodopiando até a parede
	if (f < T.splat) {
		const p = (f - T.decola) / (T.splat - T.decola);
		const pe = Easing.in(Easing.quad)(p);
		const pose: Pose = {
			lean: 0,
			head: -8,
			near: [150 + Math.sin(f * 0.9) * 25, Math.sin(f * 1.3) * 30],
			far: [-150 - Math.sin(f * 1.1) * 25, -Math.sin(f * 1.5) * 30],
			legNear: [30 + Math.sin(f * 1.2) * 18, 20],
			legFar: [-30 - Math.sin(f * 1.1) * 18, 20],
		};
		return {
			x: 545 + (PAREDE.x - 545) * pe,
			hipY: 1266 + (PAREDE.hipY - 1266) * p - Math.sin(Math.PI * p) * 170,
			giro: -720 * pe,
			pose,
			view: 'front',
			expression: 'shocked',
		};
	}

	// 6) Grudado na parede (tonto e depois congelado num bloco de gelo)
	const gelo = ramp(f, [T.congela, T.congela + 45]);
	const tremor = (random(`gx${f}`) - 0.5) * (gelo > 0.5 ? 4 : 2) + 18 * Math.exp(-(f - T.splat) / 4) * Math.sin(f * 2.5);
	return {
		x: PAREDE.x + tremor,
		hipY: PAREDE.hipY,
		pose: ABRACADO_NA_PAREDE,
		view: 'front',
		expression: f >= T.congela + 15 ? 'shocked' : 'worried',
		look: v > 0 ? Math.sin(f * 0.4) : 0,
	};
};

/** Desenha o Kip a partir do quadril (quando hipY é dado) ou dos pés no chão. */
const Kip: React.FC<{a: Ator; frame: number}> = ({a, frame}) => {
	const h = alturaQuadril(a.pose);
	const feetY = a.hipY !== undefined ? a.hipY + h : CHAO;
	const hip = {x: a.x, y: feetY - h};
	const head = jointWorld({x: a.x, y: feetY, scale: S, facing: 1, pose: a.pose}, 'head');
	return (
		<g transform={`rotate(${a.giro ?? 0} ${hip.x} ${hip.y})`}>
			<Stickman x={a.x} y={feetY} scale={S} facing={1} pose={a.pose} view={a.view ?? 'side'} expression={a.expression} look={a.look ?? 0} />
			<Sweat cx={head.x} cy={head.y} r={26 * S} t={frame / FPS} amount={a.suor ?? 0} />
		</g>
	);
};

/** Estrelinhas de tontura em volta da cabeça. */
const Tontura: React.FC<{frame: number}> = ({frame}) => {
	const op = ramp(frame, [T.splat + 2, T.splat + 8]) * (1 - ramp(frame, [T.congela, T.congela + 10]));
	if (op <= 0) return null;
	const a = ABRACADO_NA_PAREDE;
	const head = jointWorld({x: PAREDE.x, y: PAREDE.hipY + alturaQuadril(a), scale: S, facing: 1, pose: a}, 'head');
	return (
		<g opacity={op}>
			{[0, 1, 2].map((i) => {
				const ang = frame * 0.25 + (i * Math.PI * 2) / 3;
				const x = head.x + Math.cos(ang) * 80;
				const y = head.y - 70 + Math.sin(ang) * 22;
				return <path key={i} d={`M${x} ${y - 16}L${x + 5} ${y - 5}L${x + 16} ${y}L${x + 5} ${y + 5}L${x} ${y + 16}L${x - 5} ${y + 5}L${x - 16} ${y}L${x - 5} ${y - 5}Z`} fill="#FFD60A" stroke="#262626" strokeWidth={3} />;
			})}
		</g>
	);
};

/** Bloco de gelo por cima do Kip (ele continua com as cores da bíblia por baixo). */
const BlocoDeGelo: React.FC<{frame: number}> = ({frame}) => {
	const g = ramp(frame, [T.congela, T.congela + 45]);
	if (g <= 0) return null;
	const a = ABRACADO_NA_PAREDE;
	const feetY = PAREDE.hipY + alturaQuadril(a);
	const top = feetY - 470;
	const x0 = 66;
	const w = 250;
	return (
		<g opacity={g}>
			<rect x={x0} y={top} width={w} height={feetY - top + 16} rx={18} fill="#BFE8FF" opacity={0.45} stroke="#7CC4EC" strokeWidth={6} />
			<path d={`M${x0 + 30} ${top + 40} l60 -20 M${x0 + 40} ${top + 70} l30 -10 M${x0 + w - 40} ${top + 120} l-50 160`} stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.8} />
			{[0, 1, 2, 3, 4].map((i) => (
				<path key={i} d={`M${x0 + 20 + i * 50} ${feetY + 16}l12 0l-6 ${26 + (i % 2) * 18}z`} fill="#E3F6FF" stroke="#7CC4EC" strokeWidth={2} />
			))}
		</g>
	);
};

type Camera = {cx: number; cy: number; s: number};
const BASE: Camera = {cx: 545, cy: 1000, s: 1.2};
const PAREDE_CAM: Camera = {cx: W / 2 / 1.2, cy: 1010, s: 1.2};
const CAM: [number, Camera][] = [
	[0, {cx: 400, cy: 1150, s: 1.45}],
	[70, BASE],
	[T.clique1 - 11, BASE],
	[T.clique1 - 2, {cx: 690, cy: 1320, s: 2.1}],
	[T.clique1 + 13, {cx: 690, cy: 1320, s: 2.1}],
	[T.clique1 + 25, BASE],
	[T.clique2 - 13, BASE],
	[T.clique2 - 4, {cx: 730, cy: 1320, s: 2.1}],
	[T.clique2 + 9, {cx: 730, cy: 1320, s: 2.1}],
	[T.clique2 + 21, BASE],
	[T.passo3Ini + 2, BASE],
	[T.clique3 - 2, {cx: 780, cy: 1350, s: 2.7}],
	[T.clique3 + 1, {cx: 780, cy: 1350, s: 2.7}],
	[T.clique3 + 9, BASE],
	[T.decola, BASE],
	[T.splat - 4, PAREDE_CAM],
];

const camera = (f: number): Camera => {
	const fs = CAM.map(([k]) => k);
	const comp = (c: keyof Camera) => keys(f, fs, CAM.map(([, v]) => v[c]));
	return {cx: comp('cx'), cy: comp('cy'), s: comp('s')};
};

const tremorCamera = (f: number) => {
	let amp = 0;
	if (f >= T.clique3) amp += ramp(f, [T.clique3, T.clique3 + 10], [0, 6]) + 14 * Math.exp(-(f - T.clique3) / 4);
	if (f >= T.splat) amp += 36 * Math.exp(-(f - T.splat) / 5);
	if (f >= T.cta) amp *= 0.4;
	return {x: (random(`cx${f}`) - 0.5) * 2 * amp, y: (random(`cy${f}`) - 0.5) * 2 * amp};
};

export const KipVentiladorNo3: React.FC = () => {
	const frame = useCurrentFrame();
	const ator = atorPara(frame);
	const cam = camera(frame);
	const sh = tremorCamera(frame);
	const gelado = ramp(frame, [T.clique3 + 20, T.clique3 + 120]);
	const quente = ramp(frame, [T.clique2 + 10, T.clique2 + 45], [1, 0]);
	const escurece = ramp(frame, [T.cta - 2, T.cta + 14], [0, 0.62]);
	// pequeno "pulo" do impacto (sem deformar o Kip)
	const impacto = frame >= T.splat ? spring({frame: frame - T.splat, fps: FPS, config: {damping: 8, stiffness: 180}}) : 1;

	return (
		<AbsoluteFill style={{backgroundColor: '#111'}}>
			<svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
				<defs>
					<radialGradient id="vinheta" cx="0.5" cy="0.55" r="0.75">
						<stop offset="0.55" stopColor="#000" stopOpacity={0} />
						<stop offset="1" stopColor="#000" stopOpacity={0.35} />
					</radialGradient>
				</defs>
				<g transform={`translate(${W / 2 + sh.x} ${H / 2 + sh.y}) scale(${cam.s}) translate(${-cam.cx} ${-cam.cy})`}>
					<Cenario frame={frame} />
					<Ventilador frame={frame} />
					<g transform={frame >= T.splat ? `translate(${(1 - impacto) * -30} 0)` : undefined}>
						<Kip a={ator} frame={frame} />
					</g>
					<Tontura frame={frame} />
					<BlocoDeGelo frame={frame} />
					<Papeis frame={frame} />
					<LinhasVento frame={frame} />
					<Neve frame={frame} />
					<Pof frame={frame} />
				</g>
				<rect width={W} height={H} fill="#ff6a00" opacity={0.1 * quente} />
				<rect width={W} height={H} fill="#7cc8ff" opacity={0.14 * gelado} />
				<rect width={W} height={H} fill="url(#vinheta)" />
				<rect width={W} height={H} fill="#000" opacity={escurece} />
			</svg>
			<Legendas />
			<Sons />
		</AbsoluteFill>
	);
};
