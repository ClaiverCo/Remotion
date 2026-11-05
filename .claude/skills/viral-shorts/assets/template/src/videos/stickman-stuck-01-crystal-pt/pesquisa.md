# Dossiê: o relógio de quartzo (versão em português)

Versão em português do Brasil do episódio 1 de "Preso em 2026". Os fatos e as fontes são os mesmos do dossiê em inglês (`src/videos/stickman-stuck-01-crystal/pesquisa.md`), pesquisados em 04/11/2026. Os números entre colchetes apontam para as fontes no fim.

**Onde e quando vale:** relógios de pulso analógicos de quartzo, a bateria, vendidos no mundo todo nos anos 2020. Os digitais usam o mesmo cristal e o mesmo divisor, mas mostram a hora numa tela; o roteiro só mostra um analógico.

**Nota de verificação:** o contêiner não conseguiu abrir as páginas das fontes diretamente (a política de rede bloqueia a maioria dos sites). Por isso, as afirmações foram conferidas nos trechos devolvidos pela busca, de várias fontes independentes. Reabra as fontes antes de publicar comercialmente.

## Pergunta central
Como um relógio de pulso comum sabe exatamente quanto dura um segundo?

## Como funciona, passo a passo
1. **Bateria.** Uma pilha-botão alimenta o circuito do relógio [2][3][4].
2. **Diapasão de quartzo.** A peça que marca o tempo é um pedacinho de quartzo cortado em forma de diapasão [1][2][3].
3. **Efeito piezoelétrico.** Uma tensão elétrica faz o quartzo se dobrar, e dobrá-lo gera uma pequena tensão. O circuito usa isso para manter o cristal vibrando sem parar [2][3][5].
4. **32.768 vibrações por segundo.** O cristal é cortado para vibrar 32.768 vezes por segundo (32.768 Hz) [1][2][3][4][5].
5. **Dividir por dois, quinze vezes.** 32.768 é 2 multiplicado por ele mesmo 15 vezes (2¹⁵). Um chip divisor (15 etapas que dividem por dois) reduz a contagem até sobrar um pulso por segundo [1][4][5].
6. **O tique.** Cada pulso de um segundo aciona um motorzinho de passo, que move o ponteiro de segundos um passo [1][4][5].

## O que o roteiro usa (e de onde vem)
| Frase da narração | Fontes |
|---|---|
| O ponteiro fininho andava uma vez por segundo | [1][4] |
| A tensão de uma bateria faz um diapasão de quartzo vibrar 32.768 vezes por segundo | [1][2][3][5] |
| Um chip divide esse número por dois, quinze vezes seguidas | [1][4][5] |
| Até sobrar um pulso por segundo, que move o ponteiro | [1][4][5] |
| Esse cristal batia dentro de um relógio comum | [1][2] |

## Ficção, separada com clareza
O planeta Lumen, o Kip, a Chrono-Band, as Camadas Antigas, o **Relógio Central de Lumen** (que comanda portas, plataformas e portais e usa o mesmo tipo de cristal), a sobrecarga do portal, a Chrono-Band rachada e o Kip preso em 2026 são **ficção**. Nada disso é apresentado como previsão. O Ben (PP-02) é uma pessoa comum inventada.

## Fontes
1. Wikipédia (em inglês) — "Quartz clock". https://en.wikipedia.org/wiki/Quartz_clock
2. ASM International — "How a Quartz Watch Works". https://www.asminternational.org/edfas/videos/-/journal_content/56/10192/25173231/VIDEO/
3. Exquisite Timepieces — "How Do Quartz Watches Work?". https://www.exquisitetimepieces.com/blog/how-do-quartz-watches-work/
4. Sciencing — "Quartz movement watches". https://sciencing.com/quartz-movement-watches-6606742
5. F. Walls, NIST Time and Frequency Division — capítulo sobre diapasões de quartzo (trecho da busca). https://tf.nist.gov/general/pdf/617.pdf
