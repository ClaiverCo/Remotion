import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fonte embutida no projeto (public/fonts) para o render ficar igual em qualquer máquina.
export const FONTE = 'Inter Display Black';

loadFont({
	family: FONTE,
	url: staticFile('fonts/InterDisplay-Black.otf'),
	weight: '900',
	format: 'opentype',
});
