---
name: stickman-do-futuro
description: Cria Shorts/Reels/TikTok em INGLÊS da série "Relics of the Old Days". Kip, um stickman do futuro distante (planeta Lumen), acha uma relíquia de hoje (anos 2020), viaja ao presente, explica como ela funciona de verdade, compara com o jeito do futuro e volta com o insight. Faz a pesquisa com fontes, monta a história em 6 clipes, gera a narração grátis (Kokoro am_michael) com legenda palavra por palavra e as cenas por código no Remotion, além dos metadados e hashtags em inglês. Opcionalmente gera o pacote de prompts para Google Flow / Higgsfield (folha de personagem, agente de consistência, prompts de imagem e de animação por clipe). Use quando o usuário pedir "stickman do futuro", "relíquia", "relic", "future stickman", "old days", "Kip", "universo stickman" ou um vídeo em inglês desse formato.
argument-hint: "<relíquia ou tema, ex.: house key>  |  ideias"
---

# stickman-do-futuro: série "Relics of the Old Days" (EN)

O vídeo é em inglês, vertical 9:16, com cerca de 45 a 60 s em 6 clipes. A conversa com o usuário é em português; todo o conteúdo do vídeo (narração, legendas, títulos, prompts) sai em **inglês**.

Esta skill **reaproveita o projeto Remotion da skill `viral-shorts`** (`../viral-shorts/assets/template`): narração, legendas, sincronia, render, QA, metadados e upload. Ela só acrescenta o universo (bíblia, personagem, eras) e o pacote de prompts. As duas skills precisam estar instaladas juntas.

**Regras de ouro**
1. **A bíblia é fixa.** O Kip, o planeta Lumen, a viagem pela Chrono-Band e as cores das eras vêm de `src/stickman/bible.ts`. Não redesenhe nada. Um detalhe novo só entra se não contradisser a bíblia, e vai para `ADDITIONS` com data e episódio (avise o usuário).
2. **Fato × ficção.** Tudo sobre o presente precisa de fonte (2 ou mais) e vale para um lugar e uma época ditos no dossiê. Tudo sobre o futuro é ficção e nunca é apresentado como previsão. Nada de pessoas reais identificáveis nem de ações inventadas de empresas reais.
3. **Nunca zombar de gente comum.** O humor vem do estranhamento do Kip, que fica intrigado ou impressionado.
4. **Aprovação da história antes da voz e do render.**
5. **A imagem acontece quando a palavra é dita** (`at("palavra")`), e você olha os quadros antes de entregar.
6. **Kip usa a Chrono-Band no pulso ESQUERDO.** De perfil olhando para a direita, a mão do lado da câmera (`holdNear`) é a DIREITA. É nela que ele segura a relíquia.

`SKILL_DIR` é a pasta deste arquivo; `VS_DIR` é `SKILL_DIR/../viral-shorts`; `PROJ` é o projeto Remotion do usuário.

---

## 0. Preparação

1. Leia `SKILL_DIR/aprendizados.md` e `VS_DIR/aprendizados.md` e aplique tudo.
2. Se `PROJ` ainda não é um projeto (não existe `src/videos/registry.ts`), siga o passo 0 da `VS_DIR/SKILL.md` (copiar `VS_DIR/assets/template/`, `npm install`, conferir node, ffmpeg e Python 3.10+).
3. Leia `references/serie-biblia.md`. Se o episódio for do arco **"Stuck in 2026"** (mini novela), leia também `references/arco-preso-em-2026.md` e siga a continuidade de lá. O episódio de referência, que tem código, roteiro, direção e dossiê, é `src/videos/stickman-house-key/`; leia o `Scenes.tsx` e o `clips.json` dele antes de escrever um episódio novo.

## 1. Ideias de relíquia (se o tema não veio pronto)

Se o usuário já disse a relíquia, pule para o passo 2. Se não (ou se pediu `ideias`), proponha **8 ideias concretas**, no formato de `references/roteiro-reliquia.md`. Misture casa, dinheiro, transporte, comunicação, comida, trabalho, escola e saúde, e inclua objetos em que ninguém pensa. Recomende a mais forte e diga por quê. Pergunte com **AskUserQuestion** (até 4 opções por pergunta; ponha a recomendada primeiro).

## 2. Travar o projeto

Mostre em 6 a 8 linhas: título, relíquia, escopo do presente (onde e quando), jeito do futuro, duração, número de clipes (6), idioma (EN), formato (9:16), tom e personagens (FL-01 + elenco do episódio). Siga sem pedir aprovação de cada item.

Crie o vídeo: `npm run new -- <slug> --titulo "<título em inglês>"`. O slug começa com `stickman-` (ex.: `stickman-paper-receipt`).

## 3. Dossiê de fatos do presente

Siga `VS_DIR/references/pesquisa.md`, com estes acréscimos:
- busque em inglês (WebSearch `extended` para temas técnicos ou de saúde) e prefira fabricantes, órgãos públicos, normas, universidades e museus;
- diga **onde e quando** a explicação vale (ex.: "front doors in North America and Europe, 2020s") e não trate hábito local como universal;
- confira fatos surpreendentes em separado. Se a internet falhar, escreva que a verificação está pendente e seja conservador no roteiro;
- grave `src/videos/<slug>/pesquisa.md` em inglês (ele entra no pacote de prompts), com a seção "Fiction, clearly separated" e uma tabela "o que o roteiro usa → fontes".

## 4. História em 6 clipes (aprovação obrigatória)

Siga `references/roteiro-reliquia.md`. Escreva `roteiro.json` com:
- `idioma: "en-US"`, `voz: "kokoro"`, `vozId: "am_michael"`;
- `reliquia { nome, descricao }`;
- 6 cenas, cada uma com `era` (`futuro` | `viagem` | `presente` | `presente` | `comparacao` | `futuro`), `acao` (uma frase em inglês) e `narracao` de 18 a 24 palavras, narrada pelo Kip em 1ª pessoa, do futuro, chamando o nosso tempo de passado ("back then", "the old days");
- gancho visual concreto nos 2 primeiros segundos, sem saudação;
- `selo` só no gancho (ex.: "WHAT IS THIS?").

Mostre a tabela `clipe | era | narração | ação | fontes` com a contagem de palavras. Pergunte com **AskUserQuestion**: "Aprovar história" / "Ajustar". **Não siga sem aprovação.**

## 5. Narração (Kokoro am_michael, grátis) e sincronia

```bash
npm run tts -- <slug> --dry-run     # o que a voz vai falar
npm run tts -- <slug>               # idioma en → Kokoro am_michael (vozId do roteiro)
npm run check-sync -- <slug>        # 0% de palavras em silêncio é a meta
```
- Pronúncia: confira siglas, números ("2020s") e nomes inventados. Para ver os fonemas, use `.tts/venv/bin/python -I -c "from kokoro_onnx.tokenizer import Tokenizer; print(Tokenizer().phonemize('texto','en-us'))"`. Corrija com `"pronuncias": { "2020s": "twenty-twenties" }` (muda só a voz, não a legenda).
- Mire cada clipe em ≤ 9 s de fala: o pacote de prompts usa clipes de 10 s.

## 6. Cenas por código

Leia `references/visual-stickman.md`. Edite `src/videos/<slug>/Scenes.tsx` usando `src/stickman`:
- `Stickman` (Kip ou gente de hoje), `poseAt`, `walkAlong`, `jointWorld`;
- `FutureBackdrop` / `PresentBackdrop`, `EraTag`, `TimePortal`, `SplitCompare`, `RelicGlow`.

Para a relíquia, faça um componente paramétrico do episódio (como `LockCutaway.tsx` + `HouseKey`). Se ele explica um mecanismo, o diagrama também mostra o mecanismo. Cada evento visual dispara na palavra: `const { t, at } = useScene(props)`.

## 7. QA, render e finalização

```bash
npm run qa -- <slug> --at 0.12 && npm run qa -- <slug> --at 0.5 && npm run qa -- <slug> --at 0.9
npm run qa -- <slug> --extra 2.3,9.2,26.5   # momentos-chave (s): lupa, portal, mecanismo…
npm run render -- <slug> && npm run finalize -- <slug>
```
Abra cada prancha com **Read** (cada `--at` sobrescreve `prancha.png`, então leia antes de rodar o próximo) e confira:
- a cena mostra o que a fala diz;
- o halo está sempre visível;
- a pulseira está no pulso esquerdo e a relíquia na mão direita;
- nada fica atrás das etiquetas;
- nada importante fica na faixa da legenda (y 1250–1420).

## 8. Metadados em inglês

Siga `VS_DIR/references/hashtags-e-metadados.md` com `references/hashtags-en.json`. Escreva `metadata.json` em inglês, com:
- título ≤ 60 caracteres (curiosidade + objeto);
- descrição dizendo que o futuro é ficção e citando as fontes;
- `midiaSintetica: true`;
- 3 a 5 hashtags por plataforma (Reels: no máximo 5).

Depois rode `npm run export -- <slug>`.

## 9. Pacote de prompts para Google Flow / Higgsfield (opcional)

Quando o usuário quiser gerar o episódio com IA de imagem e vídeo, siga `references/prompt-pack.md`:
1. escreva `src/videos/<slug>/clips.json` (direção de cada clipe, em inglês, coerente com o vídeo por código);
2. rode `npm run stickman-sheet` (folha do Kip feita pelo código) e depois `npm run prompt-pack -- <slug>`;
3. leia `out/<slug>/prompt-pack/prompt-pack.md` inteiro e corrija o `clips.json` até não sobrar nenhum aviso.

O pacote traz as 8 entregas do documento do usuário, a voz cortada por clipe (`C01_voice.mp3`…) e legendas no tempo de 10 s por clipe. **Não diga que gerou imagens ou vídeos:** são prompts escritos.

## 10. Upload e aprendizados

- Upload: passo 9 da `VS_DIR/SKILL.md` (sempre mostre título e data e peça confirmação antes de `--confirmar`).
- Ao final, ou quando o usuário corrigir algo, registre em `SKILL_DIR/aprendizados.md` (`- [data] contexto → regra`). Detalhes novos do universo vão para `ADDITIONS` em `bible.ts`.

## Problemas comuns
- **A pulseira aparece no pulso direito:** a regra está em `leftArm()` (`rig.ts`). Não troque `facing` no meio da cena só para "virar": isso troca a relíquia de mão. Mude a pose ou a direção da caminhada.
- **Etiqueta ("MY TIME") em cima da cabeça:** suba a divisão da `SplitCompare` (`mid={880}`) e reduza a escala de quem está embaixo.
- **Prompt longo demais (aviso do prompt-pack):** enxugue `layout`, `framing` e `opening` do clipe. Não mexa na identidade nem na bíblia.
- **Narração passa de 9,5 s num clipe:** corte palavras do clipe. Não acelere a voz.
