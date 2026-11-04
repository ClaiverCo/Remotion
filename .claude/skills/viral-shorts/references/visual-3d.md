# Visual 3D (Three.js low-poly)

3D de verdade com `@remotion/three` + React Three Fiber: luz, sombra e câmera em 3D. Fica mais impressionante, mas **renderiza bem mais devagar** e precisa de WebGL.

## Quando usar
- Objetos que ganham com rotação/órbita (moléculas, planetas, peças mecânicas, corpo humano estilizado).
- Quando o usuário pedir explicitamente "3D".
- Para cortes técnicos (cano, fiação), o 2.5D costuma explicar melhor e é 5 a 10× mais rápido.

## Render
- `npm run render` usa `--gl=angle` automaticamente para roteiros com `"estilo": "3d"` (GPU local).
- Sem GPU (servidor, nuvem): `REMOTION_GL=swangle npm run render -- <slug>`, só CPU. Exemplo medido: 19 s de vídeo levou ~10 min.
- Teste com `npm run qa -- <slug>` (só alguns frames) antes do render completo.

## Primitivas (`components/three`)
| Componente | Uso |
|---|---|
| `Scene3D camera=[{t, pos, look, fov?}]` | Canvas em tela cheia com luz de estúdio, sombra, névoa e câmera em keyframes. |
| `LowPolyBox`, `LowPolySphere`, `Cylinder3D` | Formas com `flatShading` (visual low-poly). `opacity < 1` = vidro/gelo. |
| `Ground3D` | Chão que recebe sombra. |
| `Pipe3D points radius` | Tubo suave por pontos (canos, veias, fios). |
| `Water3D size shape="box" | "cylinder"` | Volume de água transparente com leve ondulação. |
| `WaterMolecule` | H₂O (O vermelho + 2 H a 104,5°). Base para outras moléculas. |
| `Spin speed axis` | Gira um grupo continuamente (derivado do frame). |
| `ScreenLabel` (em `components/`) | Texto/pílula **por cima** do canvas, em px de tela. |

## Regras de câmera em 9:16
- `fov` é o campo **vertical** (padrão 50°). Em retrato, o horizontal é bem mais estreito: a 10 unidades de distância cabem ~9 de altura e só ~5 de largura.
- Enquadre objetos de 2 a 3 unidades de largura a uma distância de 8 a 12. Afaste a câmera até o objeto ocupar ~60% da largura.
- Mova a câmera entre 2 keyframes por cena (órbita curta, dolly in/out). Evite girar mais de 90° em menos de 2 s.
- `look` no centro de massa do objeto. Deixe o topo da tela (selo) e a faixa da legenda livres.

## Regras técnicas
- **Nunca** use `useFrame` nem relógio do three.js. Toda animação vem de `useCurrentFrame()`/`useTime()` (cada frame precisa ser reproduzível).
- Geometrias caras em `useMemo`.
- Texto em 3D dá trabalho: use `ScreenLabel` por cima (veja `exemplo-gelo-3d`, cena g03).
- Transparências: deixe `depthWrite={false}` em água/vidro para não sumir com objetos atrás.

## Estilo
- Paleta clara e suave (fundo `#dfe8ee`, chão `#e9e4dc`), 1 cor forte por cena.
- Low-poly: `flatShading`, `roughness` alto, nada de texturas fotográficas.
- Personagens: formas simples e originais (cápsulas, esferas). Nunca modele personagens de terceiros.
