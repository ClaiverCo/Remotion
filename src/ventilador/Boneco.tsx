import React from 'react';

// Medidas do boneco (px)
export const COXA = 85;
export const CANELA = 85;
export const PERNA = COXA + CANELA;
export const TRONCO = 150;
export const OMBRO = 128; // distância do quadril até o ombro, ao longo do tronco
export const BRACO = 75;
export const ANTEBRACO = 70;
export const RAIO = 46;
const PESCOCO = 8;
const TRACO = 13;

export type Pt = {x: number; y: number};
/** [ângulo do segmento de cima (graus, 0 = para baixo, + = para +x), ângulo relativo do de baixo] */
export type Membro = [number, number];

export type Expressao =
	| 'calor'
	| 'tedio'
	| 'feliz'
	| 'malicia'
	| 'vento'
	| 'susto'
	| 'tonto'
	| 'congelado';

export type Pose = {
	quadril: Pt;
	tronco: number; // inclinação (graus, + = topo vai para +x)
	olhar: number; // -1 (esquerda) .. 0 (câmera) .. 1 (direita)
	bracoE: Membro;
	bracoD: Membro;
	pernaE: Membro;
	pernaD: Membro;
	expressao: Expressao;
	/** Rotação do corpo inteiro em volta do quadril (voando). */
	giro?: number;
	/** Achatamento horizontal/vertical em volta do quadril. */
	escala?: [number, number];
	suor?: number; // 0..1
	gelo?: number; // 0..1 (cor e pingentes)
	cabelo?: number; // ângulo do fio de cabelo (graus, - = soprado para a esquerda)
};

const rad = (g: number) => (g * Math.PI) / 180;
const dir = (g: number): Pt => ({x: Math.sin(rad(g)), y: Math.cos(rad(g))});
const soma = (p: Pt, d: Pt, k: number): Pt => ({x: p.x + d.x * k, y: p.y + d.y * k});

export const ombroDe = (quadril: Pt, tronco: number): Pt => ({
	x: quadril.x + Math.sin(rad(tronco)) * OMBRO,
	y: quadril.y - Math.cos(rad(tronco)) * OMBRO,
});

export const cabecaDe = (quadril: Pt, tronco: number): Pt => {
	const k = TRONCO + PESCOCO + RAIO;
	return {x: quadril.x + Math.sin(rad(tronco)) * k, y: quadril.y - Math.cos(rad(tronco)) * k};
};

/**
 * IK de dois ossos: devolve os ângulos para a ponta do membro alcançar `alvo`.
 * dobra = +1 dobra o joelho/cotovelo para +x, -1 para -x.
 */
export const ik = (base: Pt, alvo: Pt, l1: number, l2: number, dobra: 1 | -1): Membro => {
	const vx = alvo.x - base.x;
	const vy = alvo.y - base.y;
	const d = Math.min(Math.max(Math.hypot(vx, vy), Math.abs(l1 - l2) + 1), l1 + l2 - 0.01);
	const base0 = (Math.atan2(vx, vy) * 180) / Math.PI;
	const a = (Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)) * 180) / Math.PI;
	const b = (Math.acos((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2)) * 180) / Math.PI;
	// Ex.: alvo logo abaixo, dobra = +1 → coxa aponta para +x e a canela volta até o alvo.
	return [base0 + dobra * a, -dobra * (180 - b)];
};

const membro = (base: Pt, [a, b]: Membro, l1: number, l2: number) => {
	const meio = soma(base, dir(a), l1);
	const ponta = soma(meio, dir(a + b), l2);
	return {meio, ponta};
};

const misturaCor = (c1: string, c2: string, t: number) => {
	const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
	const [a, b] = [p(c1), p(c2)];
	return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
};

export const Boneco: React.FC<{pose: Pose; frame: number}> = ({pose, frame}) => {
	const {quadril: q, tronco} = pose;
	const gelo = pose.gelo ?? 0;
	const cor = misturaCor('#1b1b1b', '#3d8fd6', gelo);
	const pele = misturaCor('#ffffff', '#dff2ff', gelo);

	const ombro = ombroDe(q, tronco);
	const pescoco = soma(q, {x: Math.sin(rad(tronco)), y: -Math.cos(rad(tronco))}, TRONCO);
	const cabeca = cabecaDe(q, tronco);

	const bE = membro(ombro, pose.bracoE, BRACO, ANTEBRACO);
	const bD = membro(ombro, pose.bracoD, BRACO, ANTEBRACO);
	const pE = membro(q, pose.pernaE, COXA, CANELA);
	const pD = membro(q, pose.pernaD, COXA, CANELA);

	const linha = (a: Pt, b: Pt, c: Pt) => `M${a.x} ${a.y}L${b.x} ${b.y}L${c.x} ${c.y}`;
	const [sx, sy] = pose.escala ?? [1, 1];
	const transform = `rotate(${pose.giro ?? 0} ${q.x} ${q.y}) translate(${q.x} ${q.y}) scale(${sx} ${sy}) translate(${-q.x} ${-q.y})`;

	const estilo = {
		fill: 'none',
		stroke: cor,
		strokeWidth: TRACO,
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
	};

	// Pingentes de gelo nos braços
	const pingentes = gelo > 0.3
		? [bE, bD].flatMap(({meio, ponta}, i) =>
				[0.3, 0.65].map((k, j) => {
					const p = {x: meio.x + (ponta.x - meio.x) * k, y: meio.y + (ponta.y - meio.y) * k};
					const len = (14 + ((i + j) % 2) * 10) * Math.min(1, (gelo - 0.3) / 0.5);
					return <path key={`${i}${j}`} d={`M${p.x - 7} ${p.y + 4}L${p.x + 7} ${p.y + 4}L${p.x} ${p.y + 4 + len}Z`} fill="#e9f7ff" stroke="#8cc8f0" strokeWidth={2} />;
				}),
			)
		: null;

	return (
		<g transform={transform}>
			<path d={linha(q, pE.meio, pE.ponta)} {...estilo} />
			<path d={linha(q, pD.meio, pD.ponta)} {...estilo} />
			<path d={`M${q.x} ${q.y}L${pescoco.x} ${pescoco.y}`} {...estilo} />
			<path d={linha(ombro, bE.meio, bE.ponta)} {...estilo} />
			<path d={linha(ombro, bD.meio, bD.ponta)} {...estilo} />
			{pingentes}
			<Cabeca centro={cabeca} pose={pose} frame={frame} cor={cor} pele={pele} />
		</g>
	);
};

const Cabeca: React.FC<{centro: Pt; pose: Pose; frame: number; cor: string; pele: string}> = ({
	centro: c,
	pose,
	frame,
	cor,
	pele,
}) => {
	const ox = c.x + pose.olhar * 15; // centro do rosto desloca para onde olha
	const olhoY = c.y - 6;
	const boca = {x: ox, y: c.y + 18};
	const tr = {stroke: cor, strokeWidth: 6, strokeLinecap: 'round' as const, fill: 'none'};
	const olhos = [ox - 14, ox + 14];

	let rosto: React.ReactNode = null;
	switch (pose.expressao) {
		case 'calor': {
			const ofego = 7 + Math.abs(Math.sin(frame * 0.45)) * 6;
			rosto = (
				<>
					{olhos.map((x, i) => (
						<path key={i} d={`M${x - 8} ${olhoY - 2}Q${x} ${olhoY + 5} ${x + 8} ${olhoY - 2}`} {...tr} />
					))}
					<ellipse cx={boca.x} cy={boca.y} rx={9} ry={ofego} fill={cor} />
					<ellipse cx={boca.x + 2} cy={boca.y + ofego - 2} rx={6} ry={5} fill="#ff6b8a" />
				</>
			);
			break;
		}
		case 'tedio':
			rosto = (
				<>
					{olhos.map((x, i) => (
						<g key={i}>
							<path d={`M${x - 9} ${olhoY - 3}L${x + 9} ${olhoY - 3}`} {...tr} />
							<circle cx={x} cy={olhoY + 3} r={3.5} fill={cor} />
						</g>
					))}
					<path d={`M${boca.x - 12} ${boca.y + 2}L${boca.x + 10} ${boca.y}`} {...tr} />
				</>
			);
			break;
		case 'feliz':
			rosto = (
				<>
					{olhos.map((x, i) => (
						<path key={i} d={`M${x - 8} ${olhoY + 2}Q${x} ${olhoY - 8} ${x + 8} ${olhoY + 2}`} {...tr} />
					))}
					<path d={`M${boca.x - 14} ${boca.y - 4}Q${boca.x} ${boca.y + 14} ${boca.x + 14} ${boca.y - 4}`} {...tr} />
				</>
			);
			break;
		case 'malicia':
			rosto = (
				<>
					{olhos.map((x, i) => (
						<g key={i}>
							<path d={`M${x - 9} ${olhoY - 12 + (i ? -4 : 4)}L${x + 9} ${olhoY - 12 + (i ? 4 : -4)}`} {...tr} strokeWidth={5} />
							<circle cx={x} cy={olhoY + 1} r={4} fill={cor} />
						</g>
					))}
					<path d={`M${boca.x - 17} ${boca.y - 6}Q${boca.x} ${boca.y + 12} ${boca.x + 17} ${boca.y - 6}Z`} fill={cor} />
				</>
			);
			break;
		case 'vento': {
			const abre = 8 + Math.abs(Math.sin(frame * 1.7)) * 7;
			rosto = (
				<>
					{olhos.map((x, i) => (
						<path key={i} d={`M${x - 7} ${olhoY - 6}L${x + 5} ${olhoY}L${x - 7} ${olhoY + 6}`} {...tr} />
					))}
					<ellipse cx={boca.x - 4} cy={boca.y} rx={18} ry={abre} fill={cor} />
				</>
			);
			break;
		}
		case 'susto':
			rosto = (
				<>
					{olhos.map((x, i) => (
						<g key={i}>
							<circle cx={x} cy={olhoY - 2} r={10} fill="#fff" stroke={cor} strokeWidth={4} />
							<circle cx={x} cy={olhoY - 2} r={3.5} fill={cor} />
						</g>
					))}
					<ellipse cx={boca.x} cy={boca.y + 4} rx={10} ry={13} fill={cor} />
				</>
			);
			break;
		case 'tonto':
			rosto = (
				<>
					{olhos.map((x, i) => (
						<path key={i} d={`M${x - 7} ${olhoY - 7}L${x + 7} ${olhoY + 7}M${x + 7} ${olhoY - 7}L${x - 7} ${olhoY + 7}`} {...tr} />
					))}
					<path d={`M${boca.x - 16} ${boca.y + 2}q5 -8 10 0t10 0t10 0`} {...tr} strokeWidth={5} />
				</>
			);
			break;
		case 'congelado': {
			const bate = Math.sin(frame * 2.2) > 0 ? 2 : -2;
			rosto = (
				<>
					{olhos.map((x, i) => (
						<circle key={i} cx={x} cy={olhoY} r={4} fill={cor} />
					))}
					<rect x={boca.x - 17} y={boca.y - 7 + bate * 0.5} width={34} height={15} rx={4} fill="#fff" stroke={cor} strokeWidth={4} />
					<path d={`M${boca.x - 17} ${boca.y}L${boca.x + 17} ${boca.y}M${boca.x - 6} ${boca.y - 7}L${boca.x - 6} ${boca.y + 8}M${boca.x + 6} ${boca.y - 7}L${boca.x + 6} ${boca.y + 8}`} stroke={cor} strokeWidth={2.5} />
				</>
			);
			break;
		}
	}

	// Fio de cabelo solitário (indicador do vento)
	const cab = pose.cabelo ?? 0;
	const raiz = {x: c.x + pose.olhar * 4, y: c.y - RAIO + 2};
	const ponta = soma(raiz, dir(180 + cab), 34);
	const ctrl = soma(raiz, dir(180 + cab * 0.5 + 35), 26);

	// Gotas de suor (caem em ciclo)
	const suor = pose.suor ?? 0;
	const gotas =
		suor > 0.01
			? [0, 1, 2].map((i) => {
					const ciclo = 26;
					const t = ((frame + i * 9) % ciclo) / ciclo;
					const lado = i % 2 === 0 ? -1 : 1;
					const gx = c.x + lado * (RAIO - 4) + lado * t * 22 - (pose.cabelo ?? 0) * t * 0.6;
					const gy = c.y - 18 + i * 8 + t * t * 70;
					return (
						<path
							key={i}
							d={`M${gx} ${gy - 12}Q${gx + 8} ${gy} ${gx} ${gy + 4}Q${gx - 8} ${gy} ${gx} ${gy - 12}Z`}
							fill="#53b8ff"
							stroke="#1f7fc4"
							strokeWidth={2}
							opacity={suor * (1 - t * 0.6)}
						/>
					);
				})
			: null;

	return (
		<g>
			<path d={`M${raiz.x} ${raiz.y}Q${ctrl.x} ${ctrl.y} ${ponta.x} ${ponta.y}`} stroke={cor} strokeWidth={5} fill="none" strokeLinecap="round" />
			<circle cx={c.x} cy={c.y} r={RAIO} fill={pele} stroke={cor} strokeWidth={TRACO} />
			{rosto}
			{gotas}
		</g>
	);
};
