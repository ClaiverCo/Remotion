import React from 'react';
import {Easing, interpolateColors} from 'remotion';
import {CHAO, keys, PARADA, PAREDE_X, ramp, T, temperatura, vento, W} from './timeline';
import {FONTE} from '../fonte';

const CONTORNO = '#262626';

export const corParede = (f: number) =>
	interpolateColors(
		f,
		[0, T.clique2 + 10, T.clique2 + 45, T.clique3 + 20, T.clique3 + 120],
		['#ffb26b', '#ffb26b', '#f5e6c8', '#f5e6c8', '#cfe7ff'],
	);

const Janela: React.FC<{frame: number; v: number}> = ({frame, v}) => {
	const x0 = 110;
	const x1 = 430;
	const y0 = 690;
	const y1 = 975;
	const sol = {x: 330, y: 790};
	const frio = ramp(frame, [T.clique3 + 30, T.clique3 + 110], [0, 1]);
	const raios = Array.from({length: 10}, (_, i) => {
		const a = (i / 10) * Math.PI * 2 + frame * 0.02;
		return (
			<line
				key={i}
				x1={sol.x + Math.cos(a) * 58}
				y1={sol.y + Math.sin(a) * 58}
				x2={sol.x + Math.cos(a) * (78 + (i % 2) * 14)}
				y2={sol.y + Math.sin(a) * (78 + (i % 2) * 14)}
				stroke="#ffb703"
				strokeWidth={8}
				strokeLinecap="round"
			/>
		);
	});

	// Cortinas balançam com o vento (soprado para a esquerda)
	const cortina = (xa: number, xb: number, fase: number) => {
		const s = -v * 85 - Math.sin(frame * (0.3 + v * 0.9) + fase) * (4 + v * 22);
		const meio = (y0 + y1) / 2 + 40;
		return (
			<path
				d={`M${xa} ${y0 - 18}L${xb} ${y0 - 18}Q${xb + s * 0.25} ${meio} ${xb + s} ${y1 + 30}L${xa + s} ${y1 + 30}Q${xa + s * 0.2} ${meio} ${xa} ${y0 - 18}Z`}
				fill="#e85d75"
				stroke={CONTORNO}
				strokeWidth={5}
				strokeLinejoin="round"
			/>
		);
	};

	return (
		<g>
			<defs>
				<linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor={interpolateColors(frio, [0, 1], ['#6fc8ff', '#a9b9c9'])} />
					<stop offset="1" stopColor={interpolateColors(frio, [0, 1], ['#d4f1ff', '#e8eef5'])} />
				</linearGradient>
			</defs>
			<rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="url(#ceu)" />
			<g opacity={1 - frio * 0.7}>
				{raios}
				<circle cx={sol.x} cy={sol.y} r={50} fill="#ffd23f" stroke="#ffb703" strokeWidth={6} />
				{/* sol com cara de deboche */}
				<circle cx={sol.x - 16} cy={sol.y - 8} r={5} fill={CONTORNO} />
				<circle cx={sol.x + 16} cy={sol.y - 8} r={5} fill={CONTORNO} />
				<path d={`M${sol.x - 18} ${sol.y + 14}Q${sol.x} ${sol.y + 28} ${sol.x + 20} ${sol.y + 10}`} stroke={CONTORNO} strokeWidth={5} fill="none" strokeLinecap="round" />
			</g>
			{/* telhados lá fora */}
			<path d={`M${x0} ${y1 - 60}L${x0 + 70} ${y1 - 110}L${x0 + 140} ${y1 - 60}L${x0 + 140} ${y1}L${x0} ${y1}Z`} fill="#f4a261" opacity={0.8} />
			<path d={`M${x0 + 150} ${y1 - 45}L${x0 + 210} ${y1 - 85}L${x0 + 270} ${y1 - 45}L${x0 + 270} ${y1}L${x0 + 150} ${y1}Z`} fill="#e76f51" opacity={0.7} />
			<rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="none" stroke="#fff" strokeWidth={16} />
			<rect x={x0 - 8} y={y0 - 8} width={x1 - x0 + 16} height={y1 - y0 + 16} fill="none" stroke={CONTORNO} strokeWidth={5} />
			<line x1={(x0 + x1) / 2} y1={y0} x2={(x0 + x1) / 2} y2={y1} stroke="#fff" strokeWidth={10} />
			<line x1={x0} y1={(y0 + y1) / 2} x2={x1} y2={(y0 + y1) / 2} stroke="#fff" strokeWidth={10} />
			<rect x={x0 - 30} y={y0 - 26} width={x1 - x0 + 60} height={10} rx={5} fill="#8d5a3b" />
			{cortina(x0 - 26, x0 + 44, 0)}
			{cortina(x1 - 44, x1 + 26, 1.3)}
		</g>
	);
};

const Termometro: React.FC<{frame: number}> = ({frame}) => {
	const t = temperatura(frame);
	const x = 505;
	const topo = 712;
	const fundo = 930;
	const nivel = fundo - ((t + 15) / 60) * (fundo - topo);
	const cor = interpolateColors(t, [-10, 15, 30], ['#2f8fff', '#ff8c42', '#ff2d2d']);
	return (
		<g>
			<rect x={x - 30} y={690} width={60} height={300} rx={30} fill="#fffaf0" stroke={CONTORNO} strokeWidth={5} />
			<rect x={x - 10} y={topo - 6} width={20} height={fundo - topo + 20} rx={10} fill="#fff" stroke={CONTORNO} strokeWidth={4} />
			<rect x={x - 6} y={nivel} width={12} height={fundo - nivel + 14} fill={cor} />
			<circle cx={x} cy={950} r={22} fill={cor} stroke={CONTORNO} strokeWidth={4} />
			{[0, 1, 2, 3, 4].map((i) => (
				<line key={i} x1={x + 12} x2={x + 22} y1={topo + i * 50} y2={topo + i * 50} stroke={CONTORNO} strokeWidth={3} />
			))}
			<text
				x={x + 44}
				y={862}
				fontFamily={FONTE}
				fontWeight={900}
				fontSize={44}
				fill={cor}
				stroke="#fff"
				strokeWidth={8}
				paintOrder="stroke"
			>
				{Math.round(t)}°
			</text>
		</g>
	);
};

const Quadro: React.FC<{frame: number; v: number}> = ({frame, v}) => {
	const prego = {x: 712, y: 688};
	const solta = T.clique3 + 28;
	let giro = Math.sin(frame * (0.25 + v)) * v * 14 - v * 6;
	let dx = 0;
	let dy = 0;
	if (frame >= solta) {
		const p = (frame - solta) / 26;
		dx = -Easing.in(Easing.quad)(Math.min(p, 1.5)) * 900;
		dy = Math.sin(Math.min(p, 1.5) * 3) * 60;
		giro = -(frame - solta) * 25;
	}
	return (
		<g>
			<circle cx={prego.x} cy={prego.y} r={5} fill={CONTORNO} />
			<g transform={`translate(${dx} ${dy}) rotate(${giro} ${prego.x} ${prego.y})`}>
				{frame < solta ? (
					<path d={`M${prego.x} ${prego.y}L${prego.x - 55} ${prego.y + 22}M${prego.x} ${prego.y}L${prego.x + 55} ${prego.y + 22}`} stroke={CONTORNO} strokeWidth={3} />
				) : null}
				<rect x={prego.x - 72} y={prego.y + 20} width={144} height={108} fill="#a8e6a3" stroke="#8d5a3b" strokeWidth={12} />
				<path d={`M${prego.x - 66} ${prego.y + 110}Q${prego.x - 20} ${prego.y + 60} ${prego.x + 20} ${prego.y + 95}Q${prego.x + 45} ${prego.y + 80} ${prego.x + 66} ${prego.y + 100}L${prego.x + 66} ${prego.y + 122}L${prego.x - 66} ${prego.y + 122}Z`} fill="#4caf50" />
				<circle cx={prego.x + 35} cy={prego.y + 50} r={13} fill="#ffd23f" />
			</g>
		</g>
	);
};

/** Ondas de calor subindo do chão (só enquanto está quente). */
const OndasCalor: React.FC<{frame: number}> = ({frame}) => {
	const op = ramp(temperatura(frame), [33, 39], [0, 0.55]);
	if (op <= 0) return null;
	return (
		<g opacity={op}>
			{[180, 300, 440, 560, 980].map((x, i) => {
				const sobe = (frame * 3 + i * 70) % 260;
				const y = CHAO - 40 - sobe;
				const a = 1 - sobe / 260;
				return (
					<path
						key={i}
						d={`M${x} ${y}q12 -22 0 -44t0 -44t0 -44`}
						stroke="#ff7b00"
						strokeWidth={6}
						fill="none"
						strokeLinecap="round"
						opacity={a}
					/>
				);
			})}
		</g>
	);
};

export const Cenario: React.FC<{frame: number}> = ({frame}) => {
	const v = vento(frame);
	const parede = corParede(frame);
	const lateral = interpolateColors(frame, [0, T.clique2 + 10, T.clique2 + 45, T.clique3 + 20, T.clique3 + 120], ['#e8914b', '#e8914b', '#dccba9', '#dccba9', '#a9cdf0']);

	// Poça de suor que vira gelo no final
	const poca = keys(frame, [25, 90], [0, 1]);
	const gelo = ramp(frame, [T.clique3 + 40, T.clique3 + 110], [0, 1]);

	// Rachaduras na parede depois do impacto
	const racha = ramp(frame, [T.splat, T.splat + 4], [0, 1]);

	return (
		<g>
			<rect x={0} y={0} width={W} height={CHAO} fill={parede} />
			{/* listras sutis do papel de parede */}
			{Array.from({length: 12}, (_, i) => (
				<rect key={i} x={PAREDE_X + 20 + i * 90} y={0} width={36} height={CHAO} fill="#000" opacity={0.035} />
			))}
			<Janela frame={frame} v={v} />
			<Termometro frame={frame} />
			<Quadro frame={frame} v={v} />

			{/* rodapé e chão */}
			<rect x={0} y={CHAO - 22} width={W} height={22} fill="#fff" stroke="rgba(0,0,0,0.12)" strokeWidth={3} />
			<rect x={0} y={CHAO} width={W} height={1920 - CHAO} fill="#c98f55" />
			{[1510, 1590, 1700, 1850].map((y, i) => (
				<line key={y} x1={0} x2={W} y1={y} y2={y} stroke="rgba(0,0,0,0.13)" strokeWidth={4 + i} />
			))}
			{[160, 520, 860, 340, 720].map((x, i) => (
				<line key={i} x1={x} x2={x} y1={[CHAO, CHAO, CHAO, 1510, 1590][i]} y2={[1510, 1510, 1510, 1590, 1700][i]} stroke="rgba(0,0,0,0.1)" strokeWidth={4} />
			))}
			<rect x={0} y={CHAO} width={W} height={10} fill="rgba(0,0,0,0.08)" />

			{/* parede lateral (canto do quarto) */}
			<path d={`M0 0L${PAREDE_X} 0L${PAREDE_X} ${CHAO}L0 ${CHAO + 50}Z`} fill={lateral} />
			<line x1={PAREDE_X} y1={0} x2={PAREDE_X} y2={CHAO} stroke="rgba(0,0,0,0.18)" strokeWidth={4} />
			{racha > 0 ? (
				<g stroke={CONTORNO} strokeWidth={4} fill="none" strokeLinecap="round" opacity={racha}>
					<path d={`M${PAREDE_X} 1200l-22 -40l8 -36M${PAREDE_X} 1200l-30 18l-6 44M${PAREDE_X - 4} 1180l-36 -12M${PAREDE_X} 1250l-24 40M${PAREDE_X} 1090l-28 -30`} />
				</g>
			) : null}

			{/* poça de suor */}
			<ellipse
				cx={PARADA.inicio}
				cy={CHAO + 10}
				rx={78 * poca}
				ry={14 * poca}
				fill={interpolateColors(gelo, [0, 1], ['#6cc4ff', '#e3f6ff'])}
				stroke={interpolateColors(gelo, [0, 1], ['#3a9ad9', '#9fd3f2'])}
				strokeWidth={3}
				opacity={0.85}
			/>
			{gelo > 0.5 ? (
				<path d={`M${PARADA.inicio - 30} ${CHAO + 6}l14 -4M${PARADA.inicio + 10} ${CHAO + 12}l18 -5`} stroke="#fff" strokeWidth={4} strokeLinecap="round" />
			) : null}

			<OndasCalor frame={frame} />
		</g>
	);
};
