# Legendas automáticas (estilo Shorts/TikTok)

Muita gente assiste vídeos curtos **sem som** (no transporte, no trabalho, de madrugada). A legenda grande, palavra por palavra, segura quem está no mudo, e as palavras destacadas ajudam a fixar a ideia.

## Como são geradas (fonte única de verdade)
Tudo vira o tipo `Caption` do `@remotion/captions` (uma entrada por palavra, com `startMs`/`endMs`) em `src/videos/<slug>/captions.json`, com dois campos extras:
- `emphasis`: a palavra estava entre `*asteriscos*` no roteiro → cor de destaque;
- `scene`: o índice da cena → sincroniza o corte com a fala (`timeline.json`).

| Origem | Script | Precisão |
|---|---|---|
| ElevenLabs | `npm run tts` | Exata: o próprio TTS devolve o tempo de cada caractere. |
| Sua voz | `npm run transcribe` | Whisper dá os tempos; o **texto é sempre o do roteiro** (alinhamento Needleman–Wunsch corrige erros como "arquíferos"). |
| Rascunho | `npm run estimate` | Estimativa por tamanho de palavra e pausas; só para prévia. |

## Estilo padrão (`components/ViralCaptions.tsx`)
- **1 a 3 palavras por "página"**, até ~15 letras. Quebra em pontuação, pausas > 350 ms e troca de cena (`src/lib/paginate.ts`).
- **CAIXA ALTA**, Montserrat 900, contorno escuro grosso + sombra (legível em qualquer fundo).
- O tamanho da fonte é **medido** para caber numa linha (60 a 124 px).
- Palavra *enfatizada* em ciano (`COLORS.captionHighlight`); a palavra sendo falada dá um "pop" (escala 1,07 e sobe 6 px).
- Modo `page` (padrão: a página toda aparece) ou `reveal` (cada palavra entra quando é falada).
- Posição: centro em **y = 1330** (~70% da altura), dentro da área segura.

## Áreas seguras 9:16 (theme.ts → `SAFE`)
- Topo: 0 a 230 px (busca/abas). Rodapé: 1500 a 1920 px (nome do canal, legenda do post, música). Direita: 910 a 1080 px (curtir, comentar, compartilhar).
- **Nada essencial da cena entre y 1250 e 1420**, a faixa da legenda.

## Ajustes por vídeo
Em `ShortVideo.tsx` você pode passar props para `<ViralCaptions>`:
- `mode="reveal"`: mais dinâmico para frases curtas.
- `highlight={COLORS.captionHighlight2}`: amarelo em vez de ciano.
- `paginate={{ maxWords: 2, maxChars: 12 }}`: legendas mais "picadas" (ritmo acelerado).
- `y={1180}`: sobe a legenda se a cena tiver algo importante embaixo.

## Boas práticas
- De 1 a 2 ênfases por cena. Destacar tudo é o mesmo que não destacar nada.
- Destaque **substantivos-chave e números** ("sifão", "6 litros"), não artigos.
- Evite emojis na legenda queimada (a fonte não tem). Emojis vão na descrição.
- `npm run finalize` também gera `legendas.srt` (frases maiores) para subir como legenda oficial (acessibilidade e SEO).
