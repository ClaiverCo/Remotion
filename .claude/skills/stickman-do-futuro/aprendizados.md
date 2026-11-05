# Aprendizados (leia antes de cada episódio)

Correções pedidas pelo usuário e o que deu certo nesta série. Formato: `- [AAAA-MM-DD] contexto → regra`. Acrescente no fim da seção certa; não apague regras antigas (se uma ficar obsoleta, risque com ~~ ~~ e explique). Regras gerais de legenda, sincronia e narração ficam em `../viral-shorts/aprendizados.md`.

## Personagem
- [2026-11-04] A Chrono-Band saía no pulso DIREITO nas vistas de perfil (o braço do lado da câmera, olhando para a direita, é o direito) → a regra fica em `leftArm()` (`rig.ts`) e tem teste. Confira a pulseira em toda prancha de QA.
- [2026-11-04] Trocar `facing` no meio da ação faz a relíquia pular de mão → o Kip segura a relíquia na mão direita e anda/olha para a direita; para ele "olhar para trás", use `look` ou uma seta, não `facing`.

## Enquadramento
- [2026-11-04] A etiqueta "MY TIME" da tela dividida cobria o halo do Kip → `SplitCompare mid={880}` e Kip em escala 1,0 na metade de baixo.
- [2026-11-04] A etiqueta "THE OLD DAYS" ficava em y=140, onde o app cobre → as etiquetas ficam a partir de y=300.
- [2026-11-04] A chave aparecia no corte da fechadura antes de ser citada → a peça entra (`keyOpacity`) só um pouco antes da palavra "key".

## Narração (Kokoro am_michael)
- [2026-11-04] O Kokoro respira no meio da frase sem vírgula ("Nobody on Lumen ‖ can tell me") e a legenda adiantava ~0,2 s → `snapToSilences` encaixa essas pausas na fronteira de palavra mais próxima (check-sync: 0% em silêncio, 24/25 pausas entre palavras).
- [2026-11-04] Números falados: "2020s" → `"pronuncias": { "2020s": "twenty-twenties" }`. Confira os fonemas com o `Tokenizer` do kokoro_onnx antes de gerar.

## Pacote de prompts
- [2026-11-04] Com a identidade antiga (269 palavras), nenhum prompt cabia nas faixas do documento → identidade compacta (~170 palavras, todos os traços travados) e a medida de tamanho exclui os blocos literais.
- [2026-11-04] Dígitos e rótulos no prompt de imagem viram texto inventado pelo gerador → no pacote, os quadros dos dígitos ficam vazios e os números entram no editor (no vídeo por código eles aparecem normalmente).

## Novela "Stuck in 2026"
- [2026-11-04] O enredo dos 6 episódios veio de um documento com outros nomes (Nex, Aurel, "aparelho de pulso") → "nosso personagem padrão" é sempre o Kip da bíblia; traduza os nomes (tabela em `references/arco-preso-em-2026.md`) e não crie um segundo protagonista.
- [2026-11-04] Episódio de novela termina num gancho, não na volta para casa → até 7 clipes (o mecanismo em dois), clipe final com `era: "viagem"`, `"caudaMs": 2200` no roteiro para o cartão "TO BE CONTINUED…" ter tempo de tela, e um tique-taque depois da última palavra.
- [2026-11-04] Dano planejado no Kip (Chrono-Band rachada) → prop `band="cracked"` do `Stickman`, registrado em `ADDITIONS`; nunca mude a cor da pulseira de outro jeito.

- [2026-11-04] Ep. 2: o Kokoro alinhou mal uma frase com vírgula (legenda ~0,2 s adiantada; check-sync 2,1%) → reencaixar as palavras da frase entre os silêncios reais (`ffmpeg silencedetect`) no `captions.json` e rodar `npm run sync`; voltou a 0%.
- [2026-11-04] Objeto na mão do Kip em close (zoom 1,3) parecia gigante → power bank com escala 0,42 na mão e mãos na altura do peito (`HANDS`), nunca na frente do rosto.

- [2026-11-04] Ep. 3: o Kokoro de novo adiantou uma frase antes de dois-pontos ("square: a chip") → mesmo conserto do ep. 2 (reencaixar entre os silêncios reais); o check-sync voltou a 0%. Dois-pontos na narração costumam dar esse desvio: prefira ponto final.
- [2026-11-04] Para pôr uma peça num encaixe do lado direito do anel, o Kip fica na frente da máquina → depois de encaixar, ele dá dois passos para trás (`walkAlong` curto) para não parecer que está dentro do anel.

- [2026-11-04] Ep. 4: o usuário pediu o episódio em português do Brasil e quis **ouvir as vozes antes** → gerar a narração com cada voz Piper (faber, cadu, jeff), recortar o gancho + o clipe com números em `voz-<nome>.mp3`, enviar e perguntar. Escolha: **cadu**. Em pt-BR o Piper é mais lento: o mesmo roteiro deu 52 s (faber) a 58 s (cadu/jeff).
- [2026-11-04] Número com fonte contestada ("o GPS erraria 10 km por dia") → fica fora da narração; use o fato mais seguro (os relógios são ajustados antes do lançamento). Diferença invisível (38 µs) no desenho → exagere e escreva "(diferença exagerada para dar para ver)".
- [2026-11-04] Subtítulo longo do cartão final passava da largura → `EndCard` ajusta a fonte pelo comprimento do texto.
- [2026-11-05] O usuário pediu os eps. 1–3 refeitos em português → **não duplicar as cenas**: o `Scenes.tsx` original exporta `makeScenes(L)` e a versão `-pt` só tem `roteiro.json`, `lang.json`, `pesquisa.md`, `metadata.json` e um `index.ts` que chama `makeScenes(lang)`. Os originais em inglês ficam como estavam (conferido na prancha de QA).
- [2026-11-05] A mesma palavra em inglês vira palavras diferentes em cada clipe ("Then" = "Aí" no c01 e "Então" no c07; "power" = "power" no c02 e "energia" no c03) → as chaves do `lang.json` são por cena (`"c01:Then"`). E em português a palavra pode aparecer antes na mesma cena ("O Relógio Central… um relógio") → `{ "q": "relógio", "nth": 2 }`.
- [2026-11-05] Antes do render de uma versão traduzida, rode `npm run check-lang -- <slug-pt> <slug-original>`: ele confere se cada gatilho existe na fala da cena certa (eps. 1–3 pt: 148 gatilhos, todos certos).
- [2026-11-05] O Piper em português leria "Chrono-Band" e "power bank" errado → `"pronuncias": { "Chrono-Band": "Crôno-Bénd", "power": "páuer", "bank": "bénk" }` (muda só a voz; a legenda continua com a grafia original).

## Ambiente (sessões na nuvem)
- [2026-11-04] O render/QA tentou baixar o Chrome Headless Shell e falhou (rede bloqueada) → `export REMOTION_BROWSER_EXECUTABLE=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell` antes de `npm run qa`/`render`.

