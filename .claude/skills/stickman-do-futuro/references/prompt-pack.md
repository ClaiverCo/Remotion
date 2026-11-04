# Pacote de prompts (Google Flow / Higgsfield)

`npm run prompt-pack -- <slug>` monta, a partir de `bible.ts` + `roteiro.json` + `clips.json` + `pesquisa.md`, tudo o que o documento "Future Stickman Video Instructions" pede, na ordem dele. A saída vai para `out/<slug>/prompt-pack/`:

| Arquivo | O que é |
|---|---|
| `prompt-pack.md` | as 8 entregas: travamento do projeto, dossiê de fatos, bíblia, história por clipe, estilo e identidades, **CHARACTER REFERENCE SHEET PROMPT** por personagem, **CHARACTER CONSISTENCY AGENT INSTRUCTIONS** (bloco único), pacote completo de cada clipe e guia de montagem com checklist |
| `C01_voice.mp3` … | a narração am_michael cortada por clipe (começa 150 ms antes da 1ª palavra) |
| `captions-editorial.srt` | legendas no tempo da montagem de 10 s por clipe |
| `FL-01_character-sheet.png` | folha do Kip feita pelo código (se `npm run stickman-sheet` já rodou) |

## O que o Claude escreve: `src/videos/<slug>/clips.json`
Em inglês, coerente com as cenas por código (mesmas posições, mãos, direção e estado final). Esquema em `src/stickman/clips.ts`:
- `project`: `scope` (onde e quando vale), `futureWay` (ficção), `insight`, `tone`;
- `relicDescription`: formato, cores com hex, estado, tamanho em relação ao Kip e a mão que segura. Entra **literalmente** em todo prompt;
- `cast`: personagens recorrentes além do Kip, com a ficha completa (mesmos campos da bíblia);
- `clips[]`, um por cena e na mesma ordem: `cena`, `purpose`, `location`, `timeOfDay`, `framing`, `layout {foreground, middleground, background}`, `characters[]` (posição, direção, pose, expressão, o que segura; `inStartFrame: false` para quem entra durante o clipe), `opening` (o quadro inicial, **antes** da ação), `beats` (0–2, 2–5, 5–8 e 8–10 s), `camera` (no máximo um movimento), `motionLimits` (opcional), `finalState`, `transition`, `sound {sfx, music}`, `avoid[]` e `outgoing` (registro de continuidade).

## O que o gerador garante
- O parágrafo de identidade (bíblia) e a descrição da relíquia aparecem **literalmente** em todo prompt em que o personagem ou a relíquia aparecem.
- O prompt de imagem mostra só o **início** do clipe; o de animação diz que a imagem é o quadro inicial e cobre os 10 s.
- Negativos da bíblia em todo prompt, mais os da era (no futuro, nada de hoje além da relíquia; no presente, nada futurista além do equipamento do Kip).
- A narração fica fora dos prompts visuais; não há fala nem lip sync; datas, dígitos e rótulos são postos no editor, nunca pelo gerador.
- O agente de consistência abre com o texto obrigatório do documento e traz o registro de continuidade planejado.
- O teste (`scripts/tests/prompt-pack.test.ts`) confere: ordem das entregas, abertura do agente, um prompt de folha por personagem, todos os clipes com os dois prompts, identidade literal e nenhum placeholder.

## Tamanho dos prompts
O documento pede ~150–250 palavras no prompt de imagem e ~200–350 no de animação. Como a identidade completa entra literalmente (≈170 palavras só a do Kip), o gerador mede a **direção do clipe**: o prompt menos os blocos travados (identidades, relíquia, estilo e negativos da bíblia). Cada personagem a mais em cena dá 60 palavras de folga. Se aparecer aviso, enxugue `layout`, `framing`, `opening` ou `beats`; nunca a identidade.

## Honestidade (do documento)
- Não diga que imagens ou vídeos foram gerados. O pacote é texto.
- Os modelos do Flow e do Higgsfield mudam: antes de prometer 10 s, referência por imagem ou áudio, confira no próprio app. Se o take sair maior ou menor, corte, estenda a partir do último quadro ou junte dois takes com um corte intencional.
- Um nome de arquivo escrito no prompt não anexa a imagem. A referência precisa ser anexada de fato.
- Se o usuário mandar imagens geradas, compare com a identidade (PASS ou REVISE só para o que dá para ver) e escreva um prompt de correção preciso.
