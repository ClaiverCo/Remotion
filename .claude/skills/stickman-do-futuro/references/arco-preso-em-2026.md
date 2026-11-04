# Arco "Stuck in 2026" (mini novela em 6 episódios)

Adaptação do documento "Stickman do Futuro: Preso em 2026" para a lore oficial da série. O documento original usava outros nomes; aqui vale sempre a bíblia (`src/stickman/bible.ts`):

| No documento original | Na série |
|---|---|
| Nex | **Kip (FL-01)** |
| Aurel | **Lumen** |
| aparelho de pulso | **Chrono-Band** (pulso ESQUERDO) |
| RES-01 / Ben | **Ben (PP-02)**, o morador do episódio do ventilador |
| Relógio Central | **Central Clock (CLOCK-01)** de Lumen |

## Premissa
O Central Clock de Lumen sincroniza portas, plataformas flutuantes e portais. Ele começa a atrasar, e ninguém em Lumen sabe mais fabricar a peça que falhou. Kip acha nas Old Layers um relógio de pulso parado com o mesmo cristal de quartzo, vai a 2026 buscar um que funcione e fica preso: quando o Central Clock para, o portal de volta perde a referência e a sobrecarga racha a Chrono-Band. A cada episódio, um objeto comum de hoje vira uma peça de uma máquina do tempo caseira, montada na garagem do Ben.

## Episódios
| Ep. | Slug | Título (EN) | Objeto explicado (fato) | Peça da máquina (ficção) | Gancho final |
|---|---|---|---|---|---|
| 1 | `stickman-stuck-01-crystal` ✅ | The Crystal That Counts Time | relógio de quartzo: 32.768 vibrações/s, dividido por 2 quinze vezes | marcador de tempo | o Central Clock para, a Chrono-Band racha, Kip fica preso |
| 2 | `stickman-stuck-02-battery` ✅ | Power in a Pocket | bateria de lítio: íons por dentro, elétrons pelo circuito | alimentação | a tela da Chrono-Band acende 3 s e mostra uma máquina com 4 espaços vazios |
| 3 | `stickman-stuck-03-chip` | The Brain Made of Sand | chip de silício: areia → silício → discos → luz grava bilhões de transistores | processador | a máquina pergunta onde e quando ele está |
| 4 | `stickman-stuck-04-gps` | Clocks in the Sky | GPS: distância a vários satélites; relógios corrigidos pela relatividade (~38 µs/dia) | referência de tempo e posição | a máquina pede um pulso de energia que nenhuma bateria dá de uma vez |
| 5 | `stickman-stuck-05-capacitor` | Lightning in a Box | capacitor do flash: carrega aos poucos e solta de uma vez | pulso de energia do portal | o portal começa a abrir, o chip superaquece e tudo desliga |
| 6 | `stickman-stuck-06-fan` | The Wind That Saved the Machine | ventilador do computador: o ar em movimento tira o calor da peça | refrigeração e primeiro teste | portal do tamanho de uma mão por 3 s: só o cristal passa para Lumen, o Central Clock volta, Kip segue preso e planeja uma máquina maior |

## Continuidade fixa do arco
- **Chrono-Band:** rachada e apagada desde o fim do Ep. 1 (`<Stickman band="cracked" />`). Só acende nos momentos do roteiro (Ep. 2: 3 s; Ep. 6: pisca em ciano).
- **Relógio do Ben:** no ep. 1 o Kip o segura na mão direita; do ep. 2 em diante ele fica deitado na bancada da garagem, tique-taqueando (`BenchWatch`). A relíquia empoeirada ficou no pedestal de luz em Lumen.
- **Power bank do Ben (PB-01):** cinza-escuro com 4 luzes de carga, na mão direita do Kip (`PowerBank`, escala 0,42 na mão). Ele carrega a pulseira por uma porta lateral (ficção).
- **Planta da máquina (BLUEPRINT-01):** holograma ciano com 6 encaixes (`MachineBlueprint filled={n}`). Ep. 2 termina com 2 cheios (cristal e bateria) e 4 vazios; cada episódio seguinte enche mais um.
- **Peças compartilhadas:** `Garage`, `PowerBank`, `ChargeCable`, `BandCloseup`, `MachineBlueprint` e `EndCard` ficam em `src/videos/stickman-stuck-02-battery/props.tsx`; `Watch`, `CentralClock`, `TuningFork`, `Pill` e `Sparks` em `src/videos/stickman-stuck-01-crystal/props.tsx`. Importe daí nos próximos episódios.
- **Cenário novo:** a garagem do Ben é a base de Kip em 2026; a máquina cresce nela a cada episódio.
- **Regra de cruzamento:** exceção deste arco: um relógio de 2026 e o cristal podem ir para Lumen (Ep. 6).
- **Segurança (Ep. 5):** capacitores e montagem só como desenho simples. Kip nunca abre um flash ou outro aparelho em cena, porque capacitores podem guardar carga perigosa.
- **Formato:** cada episódio pode ter 7 clipes (o mecanismo em dois) e termina com um gancho, `"caudaMs": 2200` no roteiro e o cartão "TO BE CONTINUED…" com o título do próximo episódio. O selo do gancho é `STUCK IN 2026 · EP N`.
- **Ficção:** a máquina do tempo, a viagem, o Central Clock e Lumen. As explicações dos objetos são reais, com 2 ou mais fontes no `pesquisa.md`.

Fontes de partida do documento original (conferir de novo em cada episódio): Sciencing (quartzo), U.S. Department of Energy (bateria de lítio), imec (fabricação de chips), Maketecheasier (GPS e relatividade), Explain that Stuff (capacitores).
