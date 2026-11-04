# Pesquisa detalhada: do tema ao dossiê

O roteiro só é tão bom quanto a pesquisa. Um Short viral de curiosidade vive de **um fato surpreendente e verdadeiro**. Se for falso, os comentários desmontam o vídeo e o canal perde credibilidade.

## 1. Perguntas-guia (responda todas)
1. **Como funciona?** Passo a passo, na ordem física/causal. Que peças/etapas existem e como se chamam?
2. **Por que é assim?** Que problema cada parte resolve? (Isso vira os "loops abertos" do roteiro.)
3. **O que dá errado?** Falhas comuns e o que acontece quando uma peça quebra.
4. **Mito × fato.** O que quase todo mundo acha e está errado?
5. **Números concretos.** Medidas, volumes, temperaturas, velocidades, datas, normas. Números fazem a pessoa parar de rolar.
6. **O fato mais surpreendente.** Qual informação faria alguém dizer "não sabia disso"? É o candidato a gancho.
7. **O que mostrar?** Objetos, cortes, movimentos que explicam sem palavras (ideias de cena).

## 2. Como buscar
- Faça **5 a 8 buscas na mesma rodada**, mudando o ângulo: "como funciona X", "X norma ABNT", "X curiosidades", "why does X", "how X works", "X myth", "X failure".
- Use o modo **extended** do WebSearch para temas técnicos, científicos, de saúde ou recentes. Para o resto, use **standard**.
- Abra com **WebFetch** as 3 a 5 melhores fontes e extraia trechos concretos. Não confie só no resumo da busca.
- Temas brasileiros (normas, leis, preços, hábitos): busque em pt-BR. Ciência e engenharia em geral: inglês também.

## 3. Confiabilidade das fontes (da melhor para a pior)
1. Normas técnicas (ABNT, ISO), órgãos públicos (Ministério da Saúde, INMETRO, NASA, NOAA), universidades e artigos científicos (SciELO, PubMed).
2. Enciclopédias e divulgação científica estabelecida (Britannica, HowStuffWorks, Superinteressante, revistas de universidades).
3. Fabricantes: ótimos para o funcionamento de peças; números de "economia" são marketing.
4. Jornais e portais: bons para contexto; confira os números.
5. Blogs, fóruns, vídeos: só como pista para achar uma fonte melhor.

## 4. Regras de checagem
- **Todo fato do roteiro precisa de ≥ 2 fontes independentes** (tabela de checagem no fim do dossiê).
- Se as fontes divergem, use o valor da fonte mais forte e diga "cerca de", ou corte o número.
- Números derivados (ex.: 1/0,917 ≈ 9%) podem ser usados quando a conta é direta. Anote "derivado".
- **Saúde, medicina, segurança, dinheiro:** nada de conselho prático ("tome", "faça"). Explique o mecanismo, cite a fonte oficial e, se fizer sentido, diga "procure um profissional".
- Não invente estatística, citação, nome de cientista nem data.

## 5. Formato do dossiê (`src/videos/<slug>/pesquisa.md`)
```markdown
# Dossiê: <tema>
## Pergunta central do vídeo
## Como funciona, passo a passo      (com [n] das fontes)
## Fatos mais surpreendentes (candidatos a gancho)
## Mitos e erros comuns
## O que dá errado quando falha
## Ideias de cena (o que mostrar)
## Fontes                            (numeradas, com título e URL)
## Checagem cruzada                  (tabela: fato usado | fontes)
```
Veja `assets/template/src/videos/exemplo-vaso-sanitario/pesquisa.md`.

## 6. Do dossiê para o roteiro
- O **gancho** sai de "fatos surpreendentes" ou de "mito × fato".
- Cada "por que é assim?" vira um **problema → solução**, que são os loops abertos.
- "O que dá errado" rende uma cena de tensão ("se essa peça falhar…").
- As **ideias de cena** viram o campo `visual` do roteiro.
