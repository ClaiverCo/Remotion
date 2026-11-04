// Gera os efeitos sonoros do vídeo "Ventilador" sinteticamente com ffmpeg.
// Uso: npm run sfx   (precisa do ffmpeg no PATH)
// Os arquivos vão para public/sfx/ e são usados via staticFile() no Remotion.
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';

const OUT = join(process.cwd(), 'public', 'sfx');
mkdirSync(OUT, {recursive: true});

const ff = (name, args) => {
	const file = join(OUT, name);
	execFileSync(
		'ffmpeg',
		['-hide_banner', '-loglevel', 'error', '-y', ...args, '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-q:a', '4', file],
		{stdio: 'inherit'},
	);
	console.log('ok', name);
};

// Ruído branco determinístico dentro de expressões do aevalsrc
const noise = '(2*random(0)-1)';

// Clique de botão de ventilador (plástico)
ff('click.mp3', [
	'-f', 'lavfi', '-i',
	`aevalsrc='0.7*sin(2*PI*2400*t)*exp(-t*160)+0.5*${noise}*exp(-t*220)+0.4*sin(2*PI*700*t)*exp(-t*60)':d=0.12`,
]);

// "Pop" para textos e botões aparecendo
ff('pop.mp3', [
	'-f', 'lavfi', '-i',
	"aevalsrc='0.6*sin(2*PI*(300+2600*t)*t)*exp(-t*22)':d=0.18",
]);

// Motor + vento do ventilador nas três velocidades.
// Cada nível: ruído rosa filtrado (vento), tremolo na frequência das pás e um zumbido de motor.
const fan = (name, {lp, trem, depth, hum, vol, d}) =>
	ff(name, [
		'-f', 'lavfi', '-i', `anoisesrc=color=pink:amplitude=0.6:d=${d}:seed=7`,
		'-f', 'lavfi', '-i', `sine=f=${hum}:d=${d}`,
		'-filter_complex',
		`[0]highpass=f=80,lowpass=f=${lp},tremolo=f=${trem}:d=${depth}[w];` +
			`[1]volume=0.25,tremolo=f=${trem / 2}:d=0.3[h];` +
			`[w][h]amix=inputs=2:normalize=0,volume=${vol},afade=t=in:d=0.4`,
	]);

fan('fan1.mp3', {lp: 500, trem: 6, depth: 0.5, hum: 95, vol: 0.9, d: 6});
fan('fan2.mp3', {lp: 1400, trem: 18, depth: 0.35, hum: 150, vol: 1.1, d: 6});
fan('fan3.mp3', {lp: 5000, trem: 42, depth: 0.25, hum: 230, vol: 1.5, d: 12});

// Rajada de vento (o boneco sendo arrastado)
ff('whoosh.mp3', [
	'-f', 'lavfi', '-i', 'anoisesrc=color=white:amplitude=0.8:d=1.2:seed=3',
	'-af', "highpass=f=400,lowpass=f=6000,volume='pow(sin(PI*t/1.2),2)':eval=frame",
]);

// Impacto na parede
ff('splat.mp3', [
	'-f', 'lavfi', '-i',
	`aevalsrc='0.9*sin(2*PI*(110-80*t)*t)*exp(-t*8)+0.7*${noise}*exp(-t*28)':d=0.7`,
	'-af', 'lowpass=f=2500',
]);

// Dentes batendo de frio
ff('frio.mp3', [
	'-f', 'lavfi', '-i',
	`aevalsrc='0.5*${noise}*exp(-mod(t,0.07)*90)*lt(mod(t,0.07),0.03)':d=2.5`,
	'-af', 'highpass=f=1500,lowpass=f=7000',
]);

// Cigarras de verão (ambiente da cena de calor)
ff('cigarra.mp3', [
	'-f', 'lavfi', '-i',
	"aevalsrc='0.3*sin(2*PI*4300*t)*(0.5+0.5*sin(2*PI*38*t))*(0.65+0.35*sin(2*PI*0.8*t))+0.15*sin(2*PI*5100*t)*(0.5+0.5*sin(2*PI*41*t+1))':d=6",
	'-af', 'highpass=f=2000,afade=t=in:d=0.6,afade=t=out:st=5.2:d=0.8',
]);

// "Ding" final (pergunta / call-to-action)
ff('ding.mp3', [
	'-f', 'lavfi', '-i',
	"aevalsrc='0.45*sin(2*PI*1320*t)*exp(-t*4)+0.3*sin(2*PI*1980*t)*exp(-t*5)':d=1.2",
]);
