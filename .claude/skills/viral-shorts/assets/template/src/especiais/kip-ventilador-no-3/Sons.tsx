import React from 'react';
import {Html5Audio, interpolate, Sequence, staticFile} from 'remotion';
import {DURACAO, T} from './timeline';
import falas from './falas.json';

/** Frame em que cada fala do narrador começa (mesma ordem de falas.json e das legendas). */
const INICIO_FALAS = [6, 40, 158, 192, 260, 284, 334, 386, 400, 496, 514, T.cta + 2];

const FALAS = falas.falas.map((fala, i) => ({...fala, de: INICIO_FALAS[i], ate: INICIO_FALAS[i] + Math.ceil(fala.segundos * 30)}));

/** 0..1: quanto abaixar o fundo agora (1 = tem alguém falando). */
const falando = (f: number) =>
	Math.max(0, ...FALAS.map((x) => interpolate(f, [x.de - 4, x.de + 2, x.ate - 6, x.ate + 4], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})));

/** Voz do narrador (Piper pt-BR, gerada por npm run narrar-especial). */
const Narrador: React.FC = () => (
	<>
		{FALAS.map((x) => (
			<Sequence key={x.arquivo} from={x.de} durationInFrames={x.ate - x.de + 6} name={x.texto}>
				<Html5Audio src={staticFile(x.arquivo)} volume={1} />
			</Sequence>
		))}
	</>
);

const Sfx: React.FC<{de: number; arquivo: string; volume?: number}> = ({de, arquivo, volume = 1}) => (
	<Sequence from={de} name={arquivo}>
		<Html5Audio src={staticFile(`sfx/${arquivo}`)} volume={volume} />
	</Sequence>
);

/** Loop do motor com fade de entrada/saída (frames relativos à sequência). */
const Motor: React.FC<{de: number; ate: number; arquivo: string; volume: number; cauda?: [number, number]}> = ({
	de,
	ate,
	arquivo,
	volume,
	cauda,
}) => {
	const dur = ate - de;
	return (
		<Sequence from={de} durationInFrames={dur} name={arquivo}>
			<Html5Audio
				src={staticFile(`sfx/${arquivo}`)}
				volume={(f) => {
					const entra = interpolate(f, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
					const sai = interpolate(f, [dur - 8, dur], [1, 0], {extrapolateLeft: 'clamp'});
					const abaixa = cauda ? interpolate(f, cauda, [1, 0.3], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
					return volume * entra * sai * abaixa * (1 - 0.55 * falando(de + f));
				}}
			/>
		</Sequence>
	);
};

export const Sons: React.FC = () => (
	<>
		<Narrador />
		<Motor de={0} ate={T.clique1 + 10} arquivo="cigarra.mp3" volume={0.35} />
		<Sfx de={6} arquivo="pop.mp3" volume={0.5} />
		<Sfx de={T.brilho} arquivo="ding.mp3" volume={0.3} />

		<Sfx de={T.clique1} arquivo="click.mp3" volume={0.7} />
		<Motor de={T.clique1} ate={T.clique2 + 4} arquivo="fan1.mp3" volume={1.6} />
		<Sfx de={158} arquivo="pop.mp3" volume={0.4} />

		<Sfx de={T.clique2} arquivo="click.mp3" volume={0.7} />
		<Motor de={T.clique2} ate={T.clique3 + 4} arquivo="fan2.mp3" volume={1.35} />
		<Sfx de={260} arquivo="pop.mp3" volume={0.4} />
		<Sfx de={332} arquivo="pop.mp3" volume={0.4} />

		<Sfx de={T.clique3} arquivo="click.mp3" volume={0.9} />
		<Motor de={T.clique3} ate={DURACAO} arquivo="fan3.mp3" volume={0.9} cauda={[T.cta - T.clique3 - 6, T.cta - T.clique3 + 14]} />
		<Sfx de={T.decola - 4} arquivo="whoosh.mp3" volume={0.9} />
		<Sfx de={T.splat} arquivo="splat.mp3" volume={0.75} />
		<Sfx de={T.frio} arquivo="frio.mp3" volume={0.55} />
		<Sfx de={496} arquivo="pop.mp3" volume={0.4} />

		<Sfx de={T.cta + 2} arquivo="ding.mp3" volume={0.6} />
		<Sfx de={T.cta + 26} arquivo="pop.mp3" volume={0.5} />
		<Sfx de={T.cta + 34} arquivo="pop.mp3" volume={0.5} />
		<Sfx de={T.cta + 42} arquivo="pop.mp3" volume={0.6} />
	</>
);
