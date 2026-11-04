# Bíblia da série: "Relics of the Old Days"

A fonte única é `src/stickman/bible.ts`. O desenho por código (`src/stickman/*`) e o pacote de prompts leem dali. Este arquivo explica as regras em português; os textos que vão para os prompts estão em inglês no `.ts`.

## Premissa (fixa)
Kip é um stickman de um futuro distante, do planeta **Lumen** (ficção). Em cada episódio ele acha uma **relíquia dos "old days"**: um objeto ou prática comum de **hoje (anos 2020)**. Ele não entende para que servia, viaja ao presente, vê como as pessoas usam, explica como funciona de verdade, compara com o jeito do futuro e volta para casa com um insight.

## Protagonista: Kip (FL-01)
- 4 cabeças de altura; cabeça redonda branca com contorno preto grosso; olhos de ponto, sobrancelhas expressivas, boca de traço; sem nariz e sem orelhas.
- **Halo ciano flutuando** acima da cabeça, inclinado ~10°, visível em todo plano e em toda era.
- **Túnica branca** trapezoidal sem mangas, com gola alta e friso ciano na barra.
- Botas brancas arredondadas.
- **Chrono-Band violeta no pulso ESQUERDO**, o único meio de viajar no tempo.
- Cores: contorno `#111827`, pele `#FFFFFF`, túnica `#F8FAFC`, friso e halo `#22D3EE`, Chrono-Band `#8B5CF6`.
- Só mudam a expressão, a pose e a mão que segura a relíquia (padrão: **direita**).

## Viagem no tempo (sempre igual)
1. Kip toca a Chrono-Band (pulso esquerdo) com a mão direita.
2. Abre um portal de anéis ciano e violeta ao lado dele (`TimePortal`).
3. Ele entra e o portal colapsa num ponto brilhante.
4. No destino, ele chega de um anel violeta que encolhe, com um clarão (`ArrivalRing` no episódio de exemplo).

## Eras
| | Futuro (Lumen, ficção) | Presente (anos 2020) |
|---|---|---|
| Fundo | off-white frio `#EEF3F7` | off-white quente `#F7F0E6` |
| Cenário | torres brancas arredondadas, plataformas flutuantes, linhas de luz ciano/violeta | ruas, casas, lojas e escritórios simples |
| Acentos | `#22D3EE`, `#8B5CF6` | `#D9825B`, `#E0B44C` |
| Etiqueta | LUMEN · MY TIME | THE OLD DAYS · 2020s |
| Som | pad etéreo com sininhos de vidro | violão/piano leve e ambiente do dia a dia |

- Kip mantém o visual do futuro no presente, por isso sempre se destaca.
- Só a relíquia e o equipamento do Kip atravessam as eras. Nada de cenário futurista no presente, nem de tralha de hoje no futuro.

## Figurantes
- **Gente de hoje (PP-xx):** mesmo traço, camiseta em cor quente, sem halo, túnica ou pulseira, um pouco menor que o Kip. Nunca pessoas reais.
- **Cidadãos de Lumen (FP-xx):** túnica cinza-clara sem friso, sem halo e sem pulseira, menores que o Kip. Nunca um segundo Kip.
- Personagem recorrente de um episódio (ex.: PP-01 Sam) ganha ficha completa no `cast` do `clips.json`, com o mesmo formato da bíblia.

## Como acrescentar algo
1. Confira se não contradiz nada acima.
2. Registre em `ADDITIONS` (`bible.ts`) no formato `"AAAA-MM-DD · <slug> · detalhe"`.
3. Avise o usuário na entrega ("adicionei à bíblia: …"), para ele guardar.
4. Mudança no Kip (cor, roupa, proporção) **não entra** sem pedido explícito do usuário. Se ele pedir, mude em `bible.ts`, regenere `npm run stickman-sheet` e confira a folha.
