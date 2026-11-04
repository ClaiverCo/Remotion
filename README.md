# Remotion

Repositório da skill **viral-shorts** (Claude Code + Remotion) para criar Shorts/Reels/TikTok virais.

## Vídeos

### `StickVentilador` — "Ventilador no 3"

Vídeo vertical (1080×1920, 30 fps, 24 s) de boneco palito, todo desenhado em SVG e com efeitos sonoros sintetizados.

| Tempo | Cena |
| --- | --- |
| 0–5 s | **40 °C NA SOMBRA** — o boneco derrete de calor, a poça de suor cresce e o ventilador brilha no canto |
| 5–8 s | Ele vai até o ventilador e aperta o **1** com o dedão do pé → *só faz barulho...* |
| 8–11 s | Aperta o **2** → *agora sim...* (parede esfria, suor some, fio de cabelo balança) |
| 11–13 s | **MAS E SE...** *eu colocar no 3?* (zoom de suspense no botão) |
| 13–15 s | **VELOCIDADE 3 / MODO TURBO** — papéis e quadro voando, o ventilador "anda" sozinho, o boneco é arrastado |
| 15–16 s | Sai rodopiando e... **POF!** na parede |
| 16–21 s | Congelado a −12 °C: **PELO MENOS** *parou de suar* |
| 21–24 s | CTA: **E VOCÊ?** *usa no 1, 2 ou 3?* + "comenta aí" |

## Como usar

```bash
npm install
npm run dev                # abre o Remotion Studio para ver/editar
npm run render:ventilador  # gera out/ventilador.mp4
npm run still:ventilador   # gera um frame (out/ventilador.png)
npm run sfx                # recria os efeitos sonoros em public/sfx (precisa do ffmpeg)
```

## Estrutura

```
src/
  Root.tsx                    # registra a composição
  fonte.ts                    # carrega a fonte embutida
  ventilador/
    timeline.ts               # roteiro em frames, velocidade das pás, vento, temperatura
    StickVentilador.tsx       # composição: atuação do boneco quadro a quadro + câmera
    Boneco.tsx                # boneco palito (cinemática, IK, expressões, suor, gelo)
    Ventilador.tsx            # ventilador de coluna com teclas que travam
    Cenario.tsx               # quarto: parede, janela, termômetro, quadro, chão
    Efeitos.tsx               # linhas de vento, papéis, neve, "POF!"
    Legendas.tsx              # legendas estilo Shorts e CTA final
    Sons.tsx                  # mixagem dos efeitos sonoros
scripts/gerar-sfx.mjs         # síntese dos sons com ffmpeg
public/fonts, public/sfx      # assets usados via staticFile()
```

Para ajustar o ritmo, mude os frames em `T` (`src/ventilador/timeline.ts`); cenas, câmera, legendas e sons seguem esses tempos.

## Créditos

- Fonte: [Inter Display Black](https://github.com/rsms/inter), SIL Open Font License 1.1 (veja `public/fonts/OFL.txt`).
- Efeitos sonoros: sintetizados do zero com ffmpeg (`scripts/gerar-sfx.mjs`).
