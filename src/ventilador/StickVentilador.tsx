import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame} from 'remotion';
import {Boneco, CANELA, COXA, BRACO, ANTEBRACO, ik, Membro, ombroDe, PERNA, Pose, Pt} from './Boneco';
import {Cenario} from './Cenario';
import {LinhasVento, Neve, Papeis, Pof} from './Efeitos';
import {Legendas} from './Legendas';
import {Sons} from './Sons';
import {CHAO, FPS, H, keys, PARADA, ramp, T, vento, W} from './timeline';
import {TECLA, teclaX, Ventilador} from './Ventilador';

const rad = (g: number) => (g * Math.PI) / 180;

/** Onde o quadril do boneco fica grudado na parede. */
export const PAREDE = {x: 128, y: 1285};

/** Altura do quadril para o pé mais baixo encostar no chão. */
const quadrilNoChao = (x: number, pernas: Membro[]): Pt => {
	const desce = Math.max(
		...pernas.map(([a, b]) => Math.cos(rad(a)) * COXA + Math.cos(rad(a + b)) * CANELA),
	);
	return {x, y: CHAO - desce};
};

/** Caminhada de x0 até x1: devolve x e a pose das pernas/braços. */
const andar = (f: number, ini: number, fim: number, x0: number, x1: number) => {
	const p = ramp(f, [ini, fim], [0, 1], Easing.inOut(Easing.sin));
	const dist = Math.abs(x1 - x0);
	const passos = Math.max(1, Math.round(dist / 140));
	const amp = Math.max(12, (Math.asin(Math.min(0.9, dist / passos / (2 * PERNA))) * 180) / Math.PI);
	const fase = p * passos * Math.PI;
	const s = Math.sin(fase) * amp;
	const joelho = Math.abs(Math.sin(fase)) * 18;
	return {
		x: x0 + (x1 - x0) * p,
		pernaE: [s, -joelho * (s > 0 ? 0.3 : 1)] as Membro,
		pernaD: [-s, -joelho * (s < 0 ? 0.3 : 1)] as Membro,
		bracoE: [-s * 0.8, 14] as Membro,
		bracoD: [s * 0.8, 14] as Membro,
		andando: p > 0 && p < 1,
	};
};

/** Cada chute no botão: [frame inicial, tecla, frames de suspense com o pé no ar]. */
const CHUTES: [number, number, number][] = [
	[T.clique1 - 13, 1, 0],
	[T.clique2 - 13, 2, 0],
	[T.clique3 - 21, 3, 8],
];

/**
 * Trajetória do dedão do pé: repouso → acima da tecla → (suspense) → aperta → sobe → repouso.
 * O fundo da tecla é atingido exatamente em ini + 13 + suspense (= frame do clique).
 */
const peNaTecla = (f: number, [ini, n, suspense]: [number, number, number], repouso: Pt) => {
	const x = teclaX(n);
	const fr = [ini, ini + 7, ini + 10 + suspense, ini + 13 + suspense, ini + 17 + suspense, ini + 26 + suspense];
	if (f < fr[0] || f > fr[5]) return null;
	const tremor = suspense && f > fr[1] && f < fr[2] ? Math.sin(f * 3) * 3 : 0;
	return {
		pe: {
			x: keys(f, fr, [repouso.x, x - 4, x, x, x - 10, repouso.x]) + tremor,
			y: keys(f, fr, [repouso.y, 1340, 1345, TECLA.topo + TECLA.afunda, 1360, repouso.y]),
		},
		equilibrio: keys(f, [fr[0], fr[0] + 6, fr[5] - 6, fr[5]], [0, 1, 1, 0]),
		n,
	};
};

const bracosEquilibrio = (k: number): {bracoE: Membro; bracoD: Membro} => ({
	bracoE: [-8 - 32 * k, 6 - 26 * k],
	bracoD: [8 + 22 * k, 6 + 20 * k],
});

const maosNaCintura: {bracoE: Membro; bracoD: Membro} = {bracoE: [-40, 63], bracoD: [40, -63]};

const posePara = (f: number): Pose => {
	const v = vento(f);
	const balanco = Math.sin(f * (0.5 + v * 1.4)) * (6 + v * 14);
	const cabeloVento = -12 - v * 80 + balanco;

	// 1) Calor: derretendo parado
	if (f < T.andarIni) {
		const s = keys(f, [18, 80, 86, 92], [0, 1, 1, 0.4]);
		const pernaE: Membro = [-5 + 12 * s, -24 * s];
		const pernaD: Membro = [5 + 12 * s, -24 * s];
		return {
			quadril: quadrilNoChao(PARADA.inicio, [pernaE, pernaD]),
			tronco: 5 + 16 * s + Math.sin(f * 0.22) * 1.5,
			olhar: keys(f, [0, T.virar, T.virar + 8], [0.25, 0.25, 1]),
			bracoE: [-4 + 10 * s + Math.sin(f * 0.18) * 3, 6],
			bracoD: [6 + 10 * s + Math.sin(f * 0.18 + 1) * 3, 4],
			pernaE,
			pernaD,
			expressao: 'calor',
			escala: [1 + 0.05 * s, 1 - 0.05 * s],
			suor: 1,
			cabelo: -8 - 50 * s,
		};
	}

	// 2) Caminha até o ventilador
	if (f < T.andarFim) {
		const a = andar(f, T.andarIni, T.andarFim, PARADA.inicio, PARADA.b1);
		return {
			quadril: quadrilNoChao(a.x, [a.pernaE, a.pernaD]),
			tronco: 9 + Math.sin(f * 0.4) * 1.5,
			olhar: 1,
			bracoE: a.bracoE,
			bracoD: a.bracoD,
			pernaE: a.pernaE,
			pernaD: a.pernaD,
			expressao: 'calor',
			suor: 1,
			cabelo: -30,
		};
	}

	// 3) Aperta as teclas com o dedão do pé (1, 2 e 3) e o que vem entre elas
	if (f < T.clique3 + 4) {
		let x: number = PARADA.b1;
		let pernas: {pernaE: Membro; pernaD: Membro} = {pernaE: [-3, 0], pernaD: [3, 0]};
		let bracos: {bracoE: Membro; bracoD: Membro} = {bracoE: [-6, 8], bracoD: [6, 8]};
		let olhar = 1;
		let tronco = 4;
		let expressao: Pose['expressao'] = 'calor';
		let suor = 1;

		// caminhadinhas entre os botões
		if (f >= T.passo2Ini && f < T.passo2Fim) {
			const a = andar(f, T.passo2Ini, T.passo2Fim, PARADA.b1, PARADA.b2);
			x = a.x;
			pernas = a;
			bracos = a;
		} else if (f >= T.passo3Ini && f < T.passo3Fim) {
			const a = andar(f, T.passo3Ini, T.passo3Fim, PARADA.b2, PARADA.b3);
			x = a.x;
			pernas = a;
			bracos = a;
		} else if (f >= T.passo3Fim) {
			x = PARADA.b3;
		} else if (f >= T.passo2Fim) {
			x = PARADA.b2;
		}

		// expressões e gestos entre os cliques
		if (f >= T.tedio && f < T.passo2Ini) {
			olhar = ramp(f, [T.tedio, T.tedio + 8], [1, 0.1]);
			expressao = 'tedio';
			bracos = maosNaCintura;
			const bate = Math.max(0, Math.sin(f * 0.55));
			pernas = {pernaE: [-3, 0], pernaD: [4 + bate * 6, -bate * 14]};
		} else if (f >= T.feliz && f < T.malicia) {
			const abre = ramp(f, [T.feliz, T.feliz + 18], [0, 1], Easing.out(Easing.back(1.4)));
			olhar = ramp(f, [T.feliz, T.feliz + 10], [1, 0.35]);
			expressao = 'feliz';
			tronco = -3 + Math.sin(f * 0.12) * 4;
			bracos = {
				bracoE: [-6 - 122 * abre, 8 - 24 * abre],
				bracoD: [6 + 122 * abre, -8 + 24 * abre],
			};
		} else if (f >= T.malicia && f < T.passo3Ini) {
			olhar = ramp(f, [T.malicia, T.malicia + 8], [0.35, 0.05]);
			expressao = 'malicia';
			tronco = 2;
		} else if (f >= T.passo3Ini) {
			expressao = 'malicia';
		}
		suor = ramp(f, [T.clique2 + 8, T.clique2 + 35], [1, 0]);

		// pé apertando a tecla (IK na perna direita, a esquerda fica de apoio)
		const quadril = quadrilNoChao(x, [pernas.pernaE, pernas.pernaD]);
		const chute = CHUTES.map((c) => peNaTecla(f, c, {x: quadril.x + 4, y: CHAO})).find(Boolean);
		if (chute) {
			pernas = {pernaE: [-4, 0], pernaD: ik(quadril, chute.pe, COXA, CANELA, 1)};
			bracos = bracosEquilibrio(chute.equilibrio);
			olhar = 1;
			if (chute.n !== 3) expressao = 'calor';
		}

		// mãos esfregando (malícia), usando IK nos braços
		const andando = f >= T.passo3Ini && f < T.passo3Fim;
		if (expressao === 'malicia' && f >= T.malicia + 4 && !andando && !chute) {
			const ombro = ombroDe(quadril, tronco);
			const esfrega = Math.sin(f * 1.3) * 7;
			const peito = {x: quadril.x + 10, y: quadril.y - 92};
			bracos = {
				bracoE: ik(ombro, {x: peito.x - 4 + esfrega, y: peito.y}, BRACO, ANTEBRACO, -1),
				bracoD: ik(ombro, {x: peito.x + 4 - esfrega, y: peito.y + 4}, BRACO, ANTEBRACO, 1),
			};
		}

		return {
			quadril,
			tronco,
			olhar,
			...bracos,
			...pernas,
			expressao,
			suor,
			cabelo: cabeloVento,
		};
	}

	// 4) Turbo: lutando contra o vento e escorregando para trás
	if (f < T.decola) {
		const luta = ramp(f, [T.clique3 + 3, T.clique3 + 14], [0, 1]);
		const x = interpolate(f, [T.clique3 + 3, T.decola], [PARADA.b3, 545], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: Easing.out(Easing.poly(1.3)),
		});
		const pernaE: Membro = [-28 * luta, 14 * luta];
		const pernaD: Membro = [-8 * luta + Math.sin(f * 1.6) * 4 * luta, 8 * luta];
		return {
			quadril: {...quadrilNoChao(x, [pernaE, pernaD]), x: x + (random(`bx${f}`) - 0.5) * 6 * luta},
			tronco: 4 + 18 * luta + Math.sin(f * 2.1) * 2,
			olhar: 1,
			bracoE: [-6 - (96 + Math.sin(f * 1.9) * 14) * luta, (-20 + Math.sin(f * 2.3) * 30) * luta],
			bracoD: [6 - (86 + Math.sin(f * 1.7 + 1) * 14) * luta, (-10 + Math.sin(f * 2.6 + 2) * 30) * luta],
			pernaE,
			pernaD,
			expressao: luta > 0.3 ? 'vento' : 'susto',
			suor: 0,
			cabelo: -95 + Math.sin(f * 2.4) * 10,
		};
	}

	// 5) Decola e sai rodopiando até a parede
	if (f < T.splat) {
		const p = (f - T.decola) / (T.splat - T.decola);
		const pe = Easing.in(Easing.quad)(p);
		return {
			quadril: {x: 545 + (PAREDE.x - 545) * pe, y: 1280 + (PAREDE.y - 1280) * p - Math.sin(Math.PI * p) * 170},
			tronco: 0,
			giro: -720 * pe,
			olhar: 0,
			bracoE: [-110 - Math.sin(f * 0.9) * 30, Math.sin(f * 1.3) * 30],
			bracoD: [110 + Math.sin(f * 1.1) * 30, -Math.sin(f * 1.5) * 30],
			pernaE: [-25 - Math.sin(f * 1.1) * 18, -20],
			pernaD: [25 + Math.sin(f * 1.2) * 18, 20],
			expressao: 'susto',
			suor: 0,
			cabelo: -95,
		};
	}

	// 6) Grudado na parede, tonto e depois congelado
	const t = f - T.splat;
	const impacto = spring({frame: t, fps: FPS, config: {damping: 7, stiffness: 160}});
	const gelo = ramp(f, [T.congela, T.congela + 45], [0, 1]);
	const tremor = (random(`gx${f}`) - 0.5) * (gelo > 0.5 ? 4 : 2);
	return {
		quadril: {x: PAREDE.x + tremor, y: PAREDE.y},
		tronco: 0,
		olhar: 0,
		bracoE: [-128, -8],
		bracoD: [128, 8],
		pernaE: [-30, 4],
		pernaD: [30, -4],
		escala: [0.32 + 0.3 * impacto, 1.12 - 0.06 * impacto],
		expressao: f >= T.congela + 15 ? 'congelado' : 'tonto',
		suor: 0,
		gelo,
		cabelo: gelo > 0.8 ? -92 : -95 + Math.sin(f * 2.4) * 10,
	};
};

type Camera = {cx: number; cy: number; s: number};
// Enquadramento padrão (um pouco mais perto) e o que acompanha o boneco até a parede
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

export const StickVentilador: React.FC = () => {
	const frame = useCurrentFrame();
	const pose = posePara(frame);
	const cam = camera(frame);
	const sh = tremorCamera(frame);

	const gelado = ramp(frame, [T.clique3 + 20, T.clique3 + 120], [0, 1]);
	const quente = ramp(frame, [T.clique2 + 10, T.clique2 + 45], [1, 0]);
	const escurece = ramp(frame, [T.cta - 2, T.cta + 14], [0, 0.62]);

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
					<Boneco pose={pose} frame={frame} />
					<Papeis frame={frame} />
					<LinhasVento frame={frame} />
					<Neve frame={frame} />
					<Pof frame={frame} />
				</g>
				{/* tons de calor / frio */}
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
