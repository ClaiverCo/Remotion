---
name: viral-shorts
description: Cria vídeos curtos virais (YouTube Shorts, TikTok, Reels) explicativos e de curiosidades com Remotion, 100% por código. A partir de um tema já escolhido, faz uma pesquisa detalhada na internet, escreve um roteiro que prende até o fim, gera a narração (grátis com Kokoro local ou Google Cloud TTS, ElevenLabs ou a voz do usuário), legendas automáticas palavra por palavra, cenas animadas em 2.5D ou 3D, hashtags/títulos para cada plataforma e faz o upload agendado no YouTube. Use quando o usuário pedir "vídeo viral", "short", "reels", "tiktok", "vídeo explicativo", "como funciona X em vídeo", "vídeo de curiosidade", "legenda automática", "narração grátis", "hashtags virais" ou "postar em massa".
argument-hint: "<tema do vídeo>  |  lote <arquivo-com-temas.txt>"
---

# viral-shorts: Shorts explicativos virais com Remotion

Você produz vídeos verticais 1080×1920 de 20 a 60 segundos no formato "como funciona / por que acontece": cenas em corte (2.5D) ou low-poly (3D), um selo de gancho ("? PARECE FÁCIL?"), legenda grande palavra por palavra com destaque nas palavras-chave, narração sincronizada e um pacote pronto para postar.

**Regras de ouro**
1. **Pesquisa antes do roteiro.** Nenhum fato entra no roteiro sem aparecer em pelo menos 2 fontes do dossiê.
2. **Aprovação antes de renderizar.** Mostre o roteiro e PARE até o usuário aprovar (renderizar gasta cota e tempo).
3. **Olhe os frames antes de entregar.** Rode o QA, abra a prancha e os PNGs com a ferramenta Read e corrija o que estiver errado.
4. **Personagens e cenários originais.** Nunca recrie personagens, marcas ou estilos protegidos (ex.: desenhos famosos). Além do risco legal, o YouTube desmonetiza.
5. **Aprenda.** Toda correção pedida pelo usuário vira uma regra em `aprendizados.md`.

Caminhos abaixo: `SKILL_DIR` é a pasta deste arquivo; `PROJ` é o projeto Remotion do usuário (a pasta atual).

---

## 0. Preparação (sempre)

1. Leia `SKILL_DIR/aprendizados.md` e aplique tudo o que estiver lá.
2. Se `PROJ` não tiver `src/videos/registry.ts`, ele ainda não é um projeto da skill. Então:
   - copie `SKILL_DIR/assets/template/` (incluindo os arquivos ocultos, como `.env.example` e `.gitignore`) para a pasta atual, ou para uma subpasta `viral-shorts/` se a pasta atual já tiver outro projeto;
   - rode `npm install`;
   - confira `node -v` (≥ 18) e `ffmpeg -version`. Sem ffmpeg, explique como instalar e pare. Para a narração grátis local (Kokoro), confira também o Python 3.10+ (`python3 --version`, ou `py -3 --version` no Windows).
   - Se o usuário for usar Google TTS, ElevenLabs ou YouTube, peça para copiar `.env.example` para `.env` e preencher. Nunca peça a chave no chat.
3. Os exemplos `exemplo-vaso-sanitario` (2.5D) e `exemplo-gelo-3d` (3D) servem de referência de código. Leia o `Scenes.tsx` e o `Toilet.tsx` deles antes de escrever cenas novas.

## 1. Briefing

O tema vem no argumento (`/viral-shorts como funciona o chuveiro elétrico`). Pergunte com **AskUserQuestion** apenas o que faltar, numa única pergunta com até 3 itens:
- **Estilo visual:** 2.5D (padrão; corte/maquete, render rápido) ou 3D (Three.js low-poly, mais lento, precisa de WebGL).
- **Duração alvo:** 30, 45 ou 60 s (padrão 45).
- **Voz:**
  - **Grátis local (Kokoro):** padrão quando não há nenhuma chave no `.env`; vozes `pm_alex` (masc.) e `pf_dora` (fem.);
  - **Grátis na nuvem (Google Cloud TTS):** cota mensal grátis, voz mais natural, exige `GOOGLE_TTS_API_KEY`;
  - **ElevenLabs:** pago, a mais expressiva;
  - **a própria voz do usuário;**
  - **rascunho sem voz.**

Gere o slug (`como-funciona-chuveiro`) e rode `npm run new -- <slug> --estilo 2.5d|3d --titulo "..."`.

## 2. Pesquisa detalhada na internet

Siga `references/pesquisa.md`. Em resumo:
- Use WebSearch (modo `extended` para temas técnicos, científicos ou de saúde) com 5 a 8 buscas em pt-BR e em inglês, enviadas na mesma rodada. Depois use WebFetch nas 3 a 5 melhores fontes.
- Prefira normas, universidades, órgãos públicos, fabricantes e enciclopédias. Evite blogs anônimos.
- Escreva `src/videos/<slug>/pesquisa.md` no formato do exemplo, com:
  - pergunta central;
  - como funciona, passo a passo;
  - fatos surpreendentes (candidatos a gancho);
  - mitos e erros comuns;
  - o que dá errado quando falha;
  - ideias de cena;
  - fontes numeradas;
  - tabela de checagem cruzada.
- Um fato com uma única fonte fica de fora do roteiro ou entra com uma ressalva ("segundo o fabricante…").
- Temas de saúde, medicina e segurança têm risco extra: não dê conselhos, cite a fonte oficial e sugira procurar um profissional.

## 3. Roteiro cativante

Siga `references/roteiro-viral.md`. Escreva `src/videos/<slug>/roteiro.json`, que é validado por `src/lib/schema.ts`:
- **Modelo:**
  - `parece-facil`: problema simples → complicação → solução genial → revelação;
  - `pergunta-final`: pergunta forte respondida só no fim;
  - `por-etapas`: premissa forte + "etapa 1, etapa 2…".
- **Gancho em ≤ 2 s** (primeira cena, ≤ 14 palavras), com o fato mais surpreendente do dossiê ou uma pergunta.
- **Um loop aberto a cada 5 a 8 s** ("só que…", "mas tem um problema…", "e o mais estranho…").
- **Ritmo:** cerca de 2,7 palavras/s. Para 45 s, ~115 a 125 palavras; para 60 s, ~155. Cenas de 3 a 6 s.
- **Final em loop:** a última frase conecta com a primeira, para o vídeo recomeçar sem parecer que acabou.
- Marque de 1 a 2 palavras-chave por cena com `*asteriscos*`. Elas aparecem destacadas na legenda.
- Use `selo` em 3 a 4 cenas: o gancho, o problema, a virada e o final.
- `visual` descreve o que a cena mostra; `fontes` lista os números das fontes do dossiê.

Mostre ao usuário uma tabela `# | narração | visual | fontes` e a contagem de palavras com a duração estimada. Pergunte com **AskUserQuestion**: "Aprovar roteiro" / "Ajustar". **Não passe daqui sem aprovação.** Se ele pedir ajustes, edite e pergunte de novo.

## 4. Narração e legendas

Escolha um caminho. Todos geram `captions.json` + `timeline.json`, que é a sincronização das cenas com a fala:

| Voz | Comando | Observação |
|---|---|---|
| **Grátis: Kokoro** (local) | `npm run tts:kokoro -- <slug> [--voz pm_alex\|pf_dora]` | Sem conta, offline. 1ª vez instala o Python env e baixa ~350 MB. Sintetiza frase por frase: o início de cada frase é exato e as vírgulas são achadas no áudio. |
| **Grátis: Google** (cota) | `npm run tts:google -- <slug> [--voz pt-BR-Neural2-C]` | Tempo exato por palavra (marcas SSML). Exige chave e faturamento ativo; cota mensal grátis. `--from-cache` não cobra de novo. |
| ElevenLabs | `npm run tts:elevenlabs -- <slug>` | Tempos exatos do próprio TTS; o texto da legenda é o do roteiro. `--from-cache` refaz sem gastar créditos. |
| Voz própria | `npm run transcribe -- <slug> --audio caminho.m4a` | Whisper (whisper.cpp) local; as palavras são realinhadas ao roteiro. Na 1ª vez baixa o modelo (~1,5 GB para `medium`). |
| Rascunho | `npm run estimate -- <slug>` | Sem áudio, com tempos estimados. Serve para montar as cenas antes da voz. |

`npm run tts -- <slug>` sem `--motor` escolhe sozinho: `TTS_MOTOR` do `.env`, ElevenLabs ou Google se houver chave, senão Kokoro. Use `--dry-run` para ver as frases e caracteres antes.

**Depois de qualquer narração, rode `npm run check-sync -- <slug>`.** Ele detecta os silêncios reais do áudio e confere se nenhuma palavra aparece durante um silêncio. Se falhar, regere a narração ou investigue antes de seguir.

Atualize `"voz"` no `roteiro.json` com o motor usado. Detalhes, vozes, cotas e como gravar bem: `references/narracao.md`. Se o roteiro mudar só na pontuação ou na divisão das cenas, rode `npm run sync -- <slug>` sem regravar.

## 5. Cenas

Edite `src/videos/<slug>/Scenes.tsx`. Ele exporta `scenes`, com um componente por `id` de cena e recebe `{ durationInFrames }`.
- **2.5D:** `components/two5d`: `Stage`, `Backdrop`, `Block`, `Extrude`, `Pipe` (cano com líquido e fluxo), `Liquid`, `Particles` (gás, bolhas, gotas), `Arrow`, `Label`, `Counter`, `Character` (mascote original), `AlongPath` e `CameraRig`. Leia `references/visual-2d5.md`.
- **3D:** `components/three`: `Scene3D` (câmera com keyframes), `LowPolyBox`, `LowPolySphere`, `Cylinder3D`, `Pipe3D`, `Water3D`, `WaterMolecule`, `Ground3D` e `Spin`. Use `ScreenLabel` para texto por cima. Leia `references/visual-3d.md`.
- Para temas com um "objeto principal" (vaso, chuveiro, motor), crie um **diagrama paramétrico** como `Toilet.tsx`: um único desenho cujo estado cada cena anima. Isso mantém a continuidade visual.
- Siga `references/motion-rules.md`:
  - anime em frações de `dur` (`useSceneTime`, `ramp`);
  - use springs e easing, nunca linear;
  - entradas em cascata, com saídas mais rápidas que as entradas;
  - a câmera sempre se mexendo;
  - legenda e selo dentro das áreas seguras (`SAFE` em `theme.ts`). Não coloque elementos importantes entre y 1250 e 1420, que é a área da legenda.

## 6. QA visual (obrigatório)

```bash
npm run qa -- <slug>            # um frame por cena + out/<slug>/qa/prancha.png
npm run qa -- <slug> --at 0.8   # outro momento de cada cena
npm run render -- <slug> --draft  # (opcional) vídeo em meia resolução para revisar o movimento
```
Abra `prancha.png` e os frames com **Read** e confira:
- a cena mostra o que a narração diz;
- a legenda está legível, numa linha e sem cobrir o essencial;
- o selo não cobre nada importante;
- nada foi cortado nas bordas;
- o mascote e os rótulos estão no lugar;
- as cores seguem o tema.

Corrija e repita. Para conferir movimento, extraia frames do rascunho com ffmpeg. Vídeo 3D sem GPU: `REMOTION_GL=swangle`.

## 7. Render final

```bash
npm run render -- <slug>     # out/<slug>/bruto.mp4 (1080×1920, H.264, 30 fps)
npm run finalize -- <slug>   # out/<slug>/video.mp4 (áudio -14 LUFS, faststart) + legendas.srt
```

## 8. Título, descrição e hashtags

Siga `references/hashtags-e-metadados.md` e `references/hashtags-base.json` e escreva `src/videos/<slug>/metadata.json` (veja o exemplo):
- **YouTube Shorts:**
  - título ≤ 60 caracteres, com curiosity gap e palavra-chave buscável;
  - descrição com o gancho na 1ª linha, 1 a 2 frases e as fontes;
  - 3 a 5 hashtags com `#shorts`;
  - tags de busca;
  - `midiaSintetica: true` se a voz for de IA.
- **TikTok:** legenda curta com uma pergunta que puxe comentário, mais 3 a 5 hashtags (1 ampla, 2 de nicho, 1 a 2 específicas).
- **Reels:** gancho, CTA de "salvar/enviar" e **no máximo 5 hashtags** (limite da plataforma desde dez/2025).
- Se tiver WebSearch, busque tendências do nicho no mês atual e troque 1 a 2 hashtags por outras em alta que sejam realmente relevantes.

Depois rode `npm run export -- <slug>`. Ele valida os limites e gera `out/<slug>/{video.mp4, legendas.srt, metadata.json, youtube.txt, tiktok.txt, reels.txt}`.

## 9. Upload no YouTube (opcional)

Leia `references/upload-youtube.md`. Na primeira vez, o usuário configura o OAuth e roda `npm run youtube -- auth`, que abre o navegador.
- Sempre mostre antes o título e a data que serão usados: `npm run youtube -- upload <slug>` sem `--confirmar` só imprime.
- Peça confirmação com **AskUserQuestion**. Só então rode com `--confirmar`.
- **Lote/agendamento:** `npm run youtube -- fila add a b c --inicio 2026-11-10T12:00:00-03:00 --intervalo-horas 24` e `npm run youtube -- fila run --confirmar`. Se a cota acabar, a fila para e retoma na próxima execução.
- Avise: projetos de API **não auditados** pelo YouTube sobem tudo como **privado**.

## 10. Aprendizados

Ao final, ou quando o usuário corrigir algo, acrescente em `SKILL_DIR/aprendizados.md` uma linha no formato `- [data] contexto → regra`. Exemplo: "legenda cobria o cano → manter elementos-chave acima de y 1250". Registre também os acertos que o usuário elogiou.

---

## Modo lote: `/viral-shorts lote temas.txt`

1. Leia os temas (um por linha). Faça a preparação uma vez.
2. Para cada tema: `npm run new`, pesquisa, `pesquisa.md` e `roteiro.json`.
3. Mostre **todos** os roteiros resumidos (gancho + nº de cenas + duração) e peça uma única aprovação. Deixe o usuário marcar quais ajustar.
4. Para cada aprovado: narração → cenas → QA (olhe as pranchas) → render → finalize → metadata → export.
5. Ofereça a fila de upload com datas espaçadas.
6. Varie o modelo de roteiro, os selos, a paleta e os movimentos entre os vídeos. Conteúdo repetitivo/"produzido em massa" é desmonetizado pelo YouTube.

## Problemas comuns
- **Kokoro: "Python 3.10+ não encontrado":** instale o Python (python.org; no Windows marque "Add to PATH") e rode de novo. Para reinstalar do zero, apague a pasta `.tts/`.
- **Google: erro 403 ou "billing":** ative a "Cloud Text-to-Speech API" e uma conta de faturamento no projeto. A cota grátis só vale com faturamento ativo.
- **Falta componente de cena:** a cena aparece vermelha ("sem componente") no vídeo. Adicione o id em `Scenes.tsx`.
- **"timeline.json desatualizada":** rode `npm run sync -- <slug>`, ou regere tts/transcribe/estimate se o texto mudou.
- **Duração muito acima do alvo:** enxugue o roteiro (o script de legenda avisa).
- **3D preto ou com erro de WebGL:** `REMOTION_GL=angle` (com GPU) ou `swangle` (CPU).
- **Fonte:** a Montserrat já vem embutida em `public/fonts` (render offline). Para outra fonte, adicione o `.woff2` e ajuste `theme.ts`.
