# Dossiê: o GPS e os relógios no espaço

Pesquisa feita em 04/11/2026, seguindo `references/pesquisa.md` (viral-shorts) e o passo de fatos do presente da série Stickman. Os números entre colchetes apontam para as fontes no fim.

Este é o **episódio 4 de 6 do arco "Preso em 2026"**, o primeiro narrado em **português do Brasil**. Só a explicação do GPS (clipes 4 e 5) é fato do presente. A máquina do tempo, o Relógio Central e a "rota até Lumen" são ficção.

**Onde e quando vale:** o GPS (sistema de satélites dos Estados Unidos) usado por celulares e navegadores de carro no mundo todo nos anos 2020. Outros sistemas (Galileo, GLONASS, BeiDou) funcionam de modo parecido, mas o roteiro fala só de "satélites" e "GPS".

**Nota de verificação:** o contêiner não conseguiu abrir as páginas das fontes diretamente (a política de rede bloqueia a maioria dos sites). Por isso, as afirmações abaixo foram conferidas nos trechos devolvidos pela busca, de várias fontes independentes. Reabra as fontes antes de publicar comercialmente.

## Pergunta central
Como um mapa de celular sabe exatamente onde você está?

## Como funciona, passo a passo
1. **Satélites com relógios atômicos.** Cada satélite GPS carrega relógios atômicos muito precisos e transmite um sinal com a hora exata em que o enviou [2][3][4].
2. **Tempo de viagem → distância.** O receptor compara a hora de envio com a hora de chegada. Multiplicando esse tempo pela velocidade da luz, ele calcula a distância até cada satélite (D = T × C) [3][4].
3. **Quatro satélites ou mais.** Cada distância forma uma esfera em volta de um satélite. Com quatro ou mais, as esferas se cruzam num ponto, e a quarta medida também corrige o relógio barato do receptor [2][3].
4. **Posição e hora.** O resultado é a posição do receptor e uma referência de hora muito precisa [2][3].
5. **A relatividade.** Pela relatividade especial, os relógios dos satélites, que se movem rápido, atrasariam cerca de 7 microssegundos por dia. Pela relatividade geral, como estão longe da gravidade da Terra, adiantariam cerca de 45. O resultado líquido é que eles adiantam **cerca de 38 microssegundos por dia** em relação aos relógios no chão [1][5].
6. **A correção.** Por isso, os relógios dos satélites são ajustados para andar um pouco mais devagar antes do lançamento e, em órbita, batem no ritmo certo [1].

## Fatos surpreendentes (candidatos a gancho)
- Sem a correção, o erro de distância cresceria mais de 10 km por dia [1][5]. *(O roteiro não usa o número: uma fonte de fórum contesta a forma como ele costuma ser explicado.)*
- O receptor do celular usa um relógio de quartzo comum, o mesmo do episódio 1; só os satélites têm relógios atômicos [3].

## Mitos e erros comuns
- "O celular manda sinal para o satélite." Não: o receptor só escuta os sinais; os satélites não sabem onde o celular está [2][3].
- Precisões em metros e número de satélites variam por aparelho e lugar, então **o roteiro deixa isso de fora**.

## O que o roteiro usa (e de onde vem)
| Afirmação do roteiro | Fontes |
|---|---|
| Um ponto azul no mapa mostrava onde a gente estava | [2][3] (uso comum, simplificado na tela) |
| Satélites mandam sinais com a hora exata | [2][3][4] |
| O receptor vê quanto cada sinal demorou e calcula a distância | [3][4] |
| Os relógios dos satélites adiantam cerca de 38 microssegundos por dia, por causa da relatividade | [1][5] |
| Por isso, eles são ajustados | [1] |
| Até um mapa de celular depende de relógios no espaço | [1][2][3] |

## Ficção, separada com clareza
O planeta Lumen e o **Relógio Central**, o Kip, a Chrono-Band, a **máquina do tempo** e seu pedido de "descarga de energia", e o Kip preso em 2026 são **ficção**. Nada disso é apresentado como previsão. O Ben (PP-02) é uma pessoa comum inventada. O GPS velho de carro é genérico, sem marca.

## Fontes
1. Richard Pogge, Ohio State University — "Real-World Relativity: The GPS Navigation System" (−7 µs/dia pela relatividade especial, +45 µs/dia pela geral, +38 µs/dia no total; relógios ajustados antes do lançamento). https://www.astronomy.ohio-state.edu/pogge.1/Ast162/Unit5/gps
2. SparkFun — "GPS Basics" (como funciona o GPS; quatro ou mais satélites; esferas que se cruzam). https://learn.sparkfun.com/tutorials/gps-basics
3. University of Alaska Fairbanks, física — "GPS" (D = T × C; relógios atômicos só nos satélites; receptor com relógio de quartzo). https://ffden-2.phys.uaf.edu/104_spring2004.web.dir/Sean_OGuinn/UAF_Web/GPS_pg04.htm
4. GIM International — "GPS: Position, Time and Distance". https://www.gim-international.com/content/article/gps-position-time-and-distance
5. IAPS — "Implications of Relativistic Effects on the Global Positioning System (GPS)" (cita Pogge e Will; erros acima de 10 km/dia sem correção). https://iaps.info/2023/03/01/article-of-the-month-march-2023/
