# Regras de movimento (motion design)

O Remotion não é o gargalo; o acabamento do movimento é. Estas regras separam "slide animado" de vídeo que parece profissional. (Adaptadas de haidrrrry/claude-remotion-skill e das práticas oficiais do Remotion.)

1. **Nada de interpolação linear em movimento.** Use `spring` (presets em `theme.ts → SPRING`) ou `interpolate` com `EASE.out` / `EASE.inOut` e `extrapolate: "clamp"`. Linear só para fluxo contínuo (água correndo, rotação constante).
2. **Anime 2 a 3 propriedades juntas na entrada** (escala + opacidade + posição). Uma só parece barata.
3. **Cascata (stagger).** Elementos entram um depois do outro (0,08 a 0,2 s de diferença), nunca todos juntos.
4. **Saídas mais rápidas que entradas** (saída ≈ 60% do tempo da entrada, `EASE.in`).
5. **Camadas:** fundo → cena/objetos → overlays (setas, rótulos) → vinheta + grão → selo → legenda. `ShortVideo.tsx` já empilha fundo, vinheta, grão, selo e legenda.
6. **Câmera sempre viva.** Toda cena tem `CameraRig` (2.5D) ou keyframes de câmera (3D). Mesmo "parada", há um drift leve. Corte de cena = mudança de enquadramento.
7. **Idle.** Elementos parados respiram: `useIdle(amplitude, período)` (balanço, flutuação, piscar do mascote).
8. **Tempo derivado da fala.** Use `useScene(props)` e anime nos tempos das palavras (`at("palavra")`). Para o que não tem palavra-gatilho (câmera, idle), use frações de `dur`. Números fixos de frame quebram quando a voz muda.
9. **Tema único.** Cores, fontes e springs só de `theme.ts`. Nada de hex solto nas cenas (exceto detalhes do objeto, como a boia laranja).
10. **Renderizar → inspecionar → corrigir → renderizar.** Nunca entregue sem olhar os frames (`npm run qa`).

## Sincronia com a fala
- A cena começa ~120 ms **antes** da primeira palavra dela (`leadMs` em `timeline.ts`): o olho chega antes do ouvido.
- O evento visual principal da cena deve acontecer **quando a palavra-chave é dita**: `const { t, at } = useScene(props)` e `ramp(t, at("litros"), at("litros") + 0.4)`. `at()` aceita prefixo e ignora acento/pontuação, `{ edge: "end" }` dá o fim da palavra e `{ nth: 2 }` a 2ª ocorrência. O 2º argumento é a fração da cena usada se a palavra não existir (ex.: `at("despenca", 0.75)`).
- Mudança de cena a cada 3 a 6 s. Mais de 7 s parado no mesmo enquadramento = queda de retenção.

## Determinismo
- Nada de `Math.random()`, `Date.now()` ou `useFrame` do three.js. Use `random("semente")` do Remotion e `useCurrentFrame()`. Cada frame precisa ser reproduzível.
- Fontes e assets locais (`public/`), carregados com `staticFile()`.
