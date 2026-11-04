# Visual 2.5D (padrão): maquete em corte por código

O estilo "maquete de engenharia": objetos em corte lateral, faces de topo e lateral sombreadas (profundidade falsa), paleta areia/concreto/céu claro, cano escuro com contorno claro e água azul. Renderiza rápido em qualquer PC, sem GPU.

## Espaço de coordenadas
- Tudo é desenhado em SVG no espaço **1080×1920** dentro de `<Stage>`.
- `<CameraRig keys=[{t, x, y, zoom, rot?}]>` enquadra o ponto `(x, y)` no centro da tela com `zoom`. Para ver tudo, use zoom 1 centrado em (540, 960). Para dar close, use zoom 1,3 a 1,5 no detalhe.
- Profundidade: `DEPTH = {x: 0.62, y: -0.5}` (para cima/direita). `Block` e `Extrude` usam isso.

## Primitivas (`components/two5d`)
| Componente | Uso |
|---|---|
| `Backdrop floorY` | Parede com painéis + laje + solo em corte (fundo padrão). |
| `Block x y w h depth color` | Caixa com topo/lateral sombreados (louça, paredes, móveis, caixa d'água). |
| `Extrude d depth color` | Extrusão de qualquer path SVG (formas orgânicas, peças). |
| `Pipe d width fill={from,to} flow` | Cano com contorno, miolo, líquido (fração do path) e fluxo animado. |
| `Liquid clip level wave` | Água dentro de qualquer forma, com superfície ondulando. |
| `Particles seed area velocity life size color blur intensity` | Gás, fumaça, bolhas, gotas, faíscas (determinístico). |
| `AlongPath d progress` | Move qualquer elemento ao longo de um path (sujeira no cano, elétron no fio). |
| `Arrow d progress color dashed` | Seta que se desenha. |
| `Label x y text to delay` | Pílula com linha guia apontando uma peça. |
| `Counter x y to start end suffix` | Número contando ("6 L", "220 V"). |
| `Character x y mood look` | Mascote original (neutro, feliz, surpreso, nojo, pensando). |
| `ScreenLabel` (em `components/`) | Rótulo em coordenadas de tela, por cima de tudo. |

## Padrão "diagrama paramétrico" (recomendado)
Para o objeto principal (vaso, chuveiro, motor, coração…), crie `src/videos/<slug>/<Objeto>.tsx`:
1. Desenhe o objeto **uma vez** com as primitivas.
2. Exponha um **estado** com números de 0 a 1 (`trap`, `seal`, `flush`, `gas`, `tankLevel`…).
3. Em `Scenes.tsx`, cada cena só anima o estado com `ramp(t, dur*a, dur*b)` e muda a câmera.

Isso dá continuidade (o espectador não se perde), economiza código e facilita correções. Veja `exemplo-vaso-sanitario/Toilet.tsx`.

## Paleta (theme.ts → COLORS)
- Fundo: `wall` / `wallLine` / `bgTop` / `bgBottom` (cinza-azulado claro).
- Objetos: `sand` / `sandDark` (louça bege), `ceramic` (branco), `concrete`, `soil` (solo em corte).
- Canos: `pipe` / `pipeDark` / `pipeOutline`. Água: `water` / `waterDark` / `waterFoam`. Gás: `gas` (verde).
- Destaques: `danger` (vermelho), `ok` (verde), `captionHighlight` (ciano).

## Dicas de composição
- O objeto principal ocupa o **terço central** (y 500 a 1250). A faixa y 1250 a 1420 é da legenda; o topo (y 250 a 420), do selo.
- Mascote à esquerda (x ≈ 175, sobre o piso), olhando para a ação (`look=1`). Ele reage com `mood` em momentos-chave (nojo no problema, surpreso na virada, feliz no final).
- Cores fortes **só** no que importa naquela cena (água azul, gás verde, seta vermelha). O resto fica neutro.
- Rótulos: no máximo 2 por cena, com texto curto (1 a 2 palavras), entrando em cascata.
- Para temas fora de "casa/engenharia" (corpo humano, espaço), troque `Backdrop` por um fundo próprio no `Scenes.tsx` (ex.: gradiente + `Particles` como estrelas) e mantenha as mesmas regras.
