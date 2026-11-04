import {Easing, interpolate} from 'remotion';

export const FPS = 30;
export const DURACAO = 720; // 24 s

export const W = 1080;
export const H = 1920;
export const CHAO = 1450; // linha do chão (y)
export const PAREDE_X = 62; // parede lateral esquerda

/**
 * Roteiro (frames a 30 fps)
 *  0   – calor: 40 °C, boneco derretendo
 *  92  – vai até o ventilador
 *  155 – aperta o 1 com o dedão do pé (só barulho)
 *  257 – aperta o 2 (alívio)
 *  328 – "mas e se..."
 *  383 – aperta o 3 (turbo)
 *  432 – é arrancado do chão
 *  456 – POF! na parede
 *  495 – congelado: "pelo menos parou de suar"
 *  628 – CTA: "e você, usa no 1, 2 ou 3?"
 */
export const T = {
	virar: 60,
	brilho: 66,
	andarIni: 92,
	andarFim: 140,
	clique1: 155,
	tedio: 188,
	passo2Ini: 229,
	passo2Fim: 243,
	clique2: 257,
	feliz: 270,
	malicia: 328,
	passo3Ini: 348,
	passo3Fim: 361,
	clique3: 383,
	decola: 432,
	splat: 456,
	congela: 490,
	frio: 525,
	cta: 626,
} as const;

/** Posição x onde o boneco para para apertar cada botão. */
export const PARADA = {inicio: 330, b1: 615, b2: 655, b3: 695} as const;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const suave = Easing.inOut(Easing.cubic);

/** interpolate com clamp e easing suave por padrão. */
export const ramp = (
	frame: number,
	entrada: [number, number],
	saida: [number, number],
	easing: (t: number) => number = suave,
) => interpolate(frame, entrada, saida, {...clamp, easing});

/** Interpola por vários pontos-chave com clamp. */
export const keys = (frame: number, entrada: number[], saida: number[]) =>
	interpolate(frame, entrada, saida, {...clamp, easing: suave});

/** Velocidade das pás em graus por frame. */
export const velocidadePas = (f: number) => {
	if (f < T.clique1) return 0;
	if (f < T.clique2) return ramp(f, [T.clique1, T.clique1 + 25], [0, 7]);
	if (f < T.clique3) return ramp(f, [T.clique2, T.clique2 + 22], [7, 23]);
	return ramp(f, [T.clique3, T.clique3 + 14], [23, 62], Easing.out(Easing.quad));
};

/** Ângulo acumulado das pás (integra a velocidade, então nunca "pula"). */
export const anguloPas = (frame: number) => {
	let a = 0;
	for (let f = 0; f < frame; f++) a += velocidadePas(f);
	return a;
};

/** Intensidade do vento 0..1. */
export const vento = (f: number) => {
	if (f < T.clique1) return 0;
	if (f < T.clique2) return ramp(f, [T.clique1 + 5, T.clique1 + 30], [0, 0.18]);
	if (f < T.clique3) return ramp(f, [T.clique2 + 3, T.clique2 + 25], [0.18, 0.5]);
	return ramp(f, [T.clique3, T.clique3 + 12], [0.5, 1], Easing.out(Easing.quad));
};

/** Distância acumulada percorrida pelo vento (px), para partículas contínuas. */
export const percursoVento = (frame: number) => {
	let d = 0;
	for (let f = 0; f < frame; f++) d += 4 + vento(f) * 46;
	return d;
};

/** Temperatura no termômetro (°C). */
export const temperatura = (f: number) =>
	keys(
		f,
		[0, 50, T.clique2, T.clique2 + 40, T.clique3, T.clique3 + 110],
		[26, 40, 39, 27, 27, -12],
	);

/** Índice do botão travado (0 = desligado). */
export const botaoAtivo = (f: number) =>
	f >= T.clique3 ? 3 : f >= T.clique2 ? 2 : f >= T.clique1 ? 1 : 0;
