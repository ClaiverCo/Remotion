# Visual por código: `src/stickman`

Tudo em SVG no espaço 1080×1920. O chão padrão é `GROUND_Y = 1180`; a faixa da legenda (y 1250–1420) fica livre. Exemplo completo: `src/videos/stickman-house-key/Scenes.tsx`.

## Personagem
```tsx
<Stickman x={420} y={GROUND_Y} scale={1.8} facing={1} pose={pose} expression="curious"
  holdNear={<HouseKey rotate={-35} />} look={0.6} />
```
- `x, y` = posição dos pés. Escala 1,8 ≈ 390 px de altura; o Kip é sempre o maior em cena.
- `kind="person"` + `shirt` + `hair` ("short" | "long" | "bun") = gente de hoje. Cidadão de Lumen: `shirt={FUTURE_PEOPLE.tunic}`, `hair="none"`.
- `view`: "side" (padrão), "three-quarter", "front", "back".
- `holdNear` / `holdFar`: objeto na mão, desenhado em coordenadas da mão. **De perfil com `facing={1}`, `holdNear` é a mão DIREITA.** A Chrono-Band vai sozinha para o pulso esquerdo (`leftArm`).
- **Não troque `facing` no meio de uma ação:** a relíquia pularia de mão. Para virar, termine a ação, corte de plano ou faça o personagem andar para o outro lado já de mãos livres.
- Expressões: neutral, happy, curious, worried, shocked, angry, determined. O piscar é automático.

## Poses e movimento
- `POSES`: stand, point, holdUp (mostrar a relíquia), think, shrug, surprised, explain, wave, tapWrist (viagem), crouch, celebrate (pulo), sad.
- `poseAt(t, [{ t, pose }, …])` faz a transição suave entre poses. Os tempos vêm de `at("palavra")`.
- Pose sob medida: `{ lean, head, near: [ombro, cotovelo], far, legNear: [quadril, joelho], legFar }` em graus. Ex.: o `REACH` do episódio de exemplo leva a mão à fechadura.
- `walkAlong(t, { fromX, toX, start, end })` devolve `{ x, pose, walking }`.
- `jointWorld({ x, y, scale, facing, pose }, "nearHand")` dá a posição da mão na tela, para pôr brilho, lupa, seta ou para alinhar a mão com uma fechadura (`personX = lockX - jointWorld({ x: 0, … }).x`).

## Cenários e efeitos
- `FutureBackdrop variant="city" | "home" | "museum"` e `PresentBackdrop variant="street" | "doorstep" | "home" | "shop"` (`groundY` ajustável; `door={false}` no doorstep para desenhar uma porta própria que abre).
- `EraTag era="future" | "present" top={250}`: componente HTML, fica **fora** do `<svg>`. Para trocar no meio da cena, use `<Sequence from={…}>` (veja `TagFrom` no exemplo). Com selo na cena, use `top={430}`.
- `TimePortal x y open collapse`: o portal da bíblia. A chegada é o anel violeta encolhendo + clarão.
- `SplitCompare top bottom mid={880}`: OLD DAYS em cima (quente), MY TIME embaixo (frio). Suba `mid` quando houver gente na metade de baixo, para ela não ficar sob a etiqueta nem sob a legenda.
- `RelicGlow x y r strength`: brilho pulsante em volta da relíquia.

## Regras de enquadramento
- Gancho (clipe 1): a relíquia brilhando na mão do Kip desde o primeiro quadro, mais o selo "WHAT IS THIS?".
- Diagrama do mecanismo (clipe 4): grande, no meio de cima (y 300–1000), com o Kip pequeno num canto apontando. Rótulos curtos, em pixels de tela, só quando a palavra é dita.
- Nada de texto importante acima de y 230 (o app cobre) nem entre y 1250 e 1420 (legenda).
- Sons por evento: `Cue at={at("palavra")} sfx="pop" | "ding" | "whoosh"` dentro da cena.
- Confira na prancha de QA: halo sempre visível, pulseira no pulso esquerdo, relíquia na mão direita e nada coberto por etiquetas.
