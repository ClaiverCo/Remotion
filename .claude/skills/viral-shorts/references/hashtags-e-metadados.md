# Títulos, descrições e hashtags que aumentam o alcance

Hashtag não faz um vídeo ruim viralizar. Ela ajuda a plataforma a **classificar** o vídeo e a mostrá-lo para quem já se interessa pelo nicho. O que viraliza é a retenção (o roteiro). Aqui o objetivo é **não atrapalhar** e **ganhar a distribuição inicial certa**.

## Pirâmide de hashtags (3 a 5 por post)
| Camada | Quantidade | Exemplo (vaso sanitário) | Para quê |
|---|---|---|---|
| Ampla | 1 | `#curiosidades` | Volume grande, categoria geral. |
| Nicho | 2 | `#comofunciona` `#engenharia` | Público que consome esse tipo de vídeo. |
| Específica | 1 a 2 | `#vasosanitario` `#sifao` | O assunto exato (busca e afinidade). |
| Plataforma | YouTube: `#shorts` | | Ajuda a classificar como Short. |

Use as bases de `hashtags-base.json` (pt-BR, por nicho) e acrescente 1 a 2 específicas do tema. Quando tiver WebSearch, pesquise "hashtags em alta <nicho> <mês/ano>" e troque **no máximo 2** por tendências **relevantes** (hashtag em alta que não tem a ver com o vídeo derruba a retenção, porque atrai o público errado).

## Limites e regras por plataforma (validados por `npm run validate`)
| | YouTube Shorts | TikTok | Instagram Reels |
|---|---|---|---|
| Título | ≤ 100 (ideal ≤ 60), sem `<` `>` | n/a | n/a |
| Descrição/legenda | ≤ 5000 | ≤ 4000 | ≤ 2200 |
| Hashtags | 3 a 5 (as 3 primeiras aparecem acima do título; > 60 → o YouTube ignora todas) | 3 a 5 | **máx. 5** (limite da plataforma desde dez/2025) |
| Extra | tags de busca (≤ 500 caracteres), `#shorts`, declarar mídia sintética se a voz for de IA | pergunta que puxe comentário | CTA de salvar/enviar |

Formato: `#` + letras/números/`_`, sem espaço nem pontuação, sem repetir. Acentos funcionam, mas a versão sem acento costuma ter mais volume (`#ciencia` > `#ciência`). Na dúvida, use a sem acento.

## Título (YouTube) com curiosity gap
Fórmulas:
- "Por que <coisa> NÃO <óbvio>?" → *Por que seu banheiro NÃO fede a esgoto?*
- "O segredo escondido no <objeto>"
- "<Objeto> parece simples… até você ver isso"
- "Você usa <X> errado (e nem sabe)" (só se for verdade)
- "<Número> <unidade> que <efeito>" → *6 litros que somem em 3 segundos*

Regras: palavra-chave buscável no início, ≤ 60 caracteres, no máximo 1 palavra em CAIXA ALTA, 0 a 1 emoji no fim. **O vídeo precisa cumprir o título.**

## Descrição (YouTube)
1. 1ª linha = gancho (aparece no feed).
2. 1 a 2 frases dizendo o que a pessoa aprende (com palavras-chave naturais).
3. "Fontes:" com as principais referências do dossiê (credibilidade).
4. Hashtags no fim (o script `export` já junta).

## Legendas TikTok / Reels
- TikTok: frase curta + **pergunta** ("Comenta se você já sabia!"). Comentários impulsionam.
- Reels: gancho + **CTA de salvar/enviar** ("Salva pra mostrar pra alguém…"). Envios e salvamentos impulsionam.
- 1 a 2 emojis no máximo.

## O que derruba alcance (o validador avisa)
- Palavras sensíveis: violência, armas, drogas, apostas/bets, "dinheiro fácil", nudez, suicídio. Reescreva com eufemismo ou evite.
- Hashtags genéricas demais (`#fyp`, `#viral`, `#explore`): não ajudam a classificar. Se quiser, use no máximo 1.
- Excesso de hashtags (parece spam) e hashtags sem relação com o vídeo.
- Conteúdo repetitivo/"produzido em massa" sem variação: o YouTube pode desmonetizar o canal (política de conteúdo inautêntico). Varie o modelo de roteiro, o visual e a narração.
- Personagens/marcas de terceiros: risco de direitos autorais e desmonetização.

## Melhor horário
Não existe horário universal. Comece com 12h e 19h (horário de Brasília) e depois use o YouTube Studio → Análises → "Quando seu público está on-line". Poste com regularidade (ex.: 1 por dia) pela fila: `npm run youtube -- fila add ... --intervalo-horas 24`.
