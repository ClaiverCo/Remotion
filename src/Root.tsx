import {Composition} from 'remotion';
import {StickVentilador} from './ventilador/StickVentilador';
import {DURACAO, FPS} from './ventilador/timeline';
import './fonte';

export const RemotionRoot: React.FC = () => {
	return (
		<Composition
			id="StickVentilador"
			component={StickVentilador}
			durationInFrames={DURACAO}
			fps={FPS}
			width={1080}
			height={1920}
		/>
	);
};
