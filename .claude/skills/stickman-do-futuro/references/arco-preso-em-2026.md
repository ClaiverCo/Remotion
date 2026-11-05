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
| 3 | `stickman-stuck-03-chip` ✅ | The Brain Made of Sand | chip de silício: areia → silício → discos → luz grava bilhões de transistores | processador | a máquina pergunta onde e quando ele está |
| 4 | `stickman-stuck-04-gps` ✅ (pt-BR) | Clocks in the Sky / Relógios no Céu | GPS: distância a vários satélites; relógios corrigidos pela relatividade (~38 µs/dia) | referência de tempo e posição | a máquina pede um pulso de energia que nenhuma bateria dá de uma vez |
| 5 | `stickman-stuck-05-capacitor` | Lightning in a Box | capacitor do flash: carrega aos poucos e solta de uma vez | pulso de energia do portal | o portal começa a abrir, o chip superaquece e tudo desliga |
| 6 | `stickman-stuck-06-fan` | The Wind That Saved the Machine | ventilador do computador: o ar em movimento tira o calor da peça | refrigeração e primeiro teste | portal do tamanho de uma mão por 3 s: só o cristal passa para Lumen, o Central Clock volta, Kip segue preso e planeja uma máquina maior |

**Versões em português do Brasil (voz Piper `cadu`):** a série em português é a principal a partir do ep. 4. Os eps. 1–3 foram refeitos em português, sem apagar os originais em inglês:

| Ep. | Slug (pt-BR) | Título | Usa as cenas de |
|---|---|---|---|
| 1 | `stickman-stuck-01-crystal-pt` ✅ | O Cristal que Conta o Tempo | `stickman-stuck-01-crystal` |
| 2 | `stickman-stuck-02-battery-pt` ✅ | Energia no Bolso | `stickman-stuck-02-battery` |
| 3 | `stickman-stuck-03-chip-pt` ✅ | O Cérebro Feito de Areia | `stickman-stuck-03-chip` |
| 4 | `stickman-stuck-04-gps` ✅ | Relógios no Céu | (já nasceu em português; a versão em inglês `stickman-stuck-04-gps-en` usa estas cenas) |

**Versões em inglês:** os eps. 1–3 em inglês são os originais (`stickman-stuck-01-crystal` etc.). O ep. 4 em inglês é `stickman-stuck-04-gps-en`: ele chama `makeScenes(lang)` do ep. 4 em português, com um `lang.json` que mapeia as palavras-gatilho em português para as em inglês (voz Kokoro `am_michael`, 56,7 s).

**Como uma versão em outro idioma reaproveita as cenas** (`src/stickman/lang.ts`):
- O `Scenes.tsx` do episódio exporta `makeScenes(L)`. A pasta da versão traduzida não tem `Scenes.tsx`; o `index.ts` dela chama `makeScenes(lang)` com o `lang.json` da pasta.
- `lang.json` tem `words` (palavra-gatilho em inglês → palavra na fala traduzida, **por cena**: `"c01:door": "porta"`, ou `{ "q": "relógio", "nth": 2 }` quando a palavra aparece antes na mesma cena), `text` (texto da tela em inglês → traduzido), `tagPresent`/`tagFuture` (etiquetas de era) e `locale` (formato dos números, `pt-BR` → 32.768).
- Dentro das cenas, os textos passam por `T("...")` e as props com rótulos recebem `tr={T}` (`WatchCutaway`, `CellCutaway`) ou `locale` (`HalvingChain`).
- Antes do render, confira que toda palavra-gatilho existe na fala da cena certa (script de checagem usado nos eps. 1–3 pt: procura cada `at("…")` de cada `C0N` no `captions.json` da versão traduzida). Uma palavra que não existe cai na fração-reserva e a animação sai fora do tempo.

## Continuidade fixa do arco
- **Chrono-Band:** rachada e apagada desde o fim do Ep. 1 (`<Stickman band="cracked" />`). Só acende nos momentos do roteiro (Ep. 2: 3 s; Ep. 6: pisca em ciano).
- **Relógio do Ben:** no ep. 1 o Kip o segura na mão direita; do ep. 2 em diante ele fica deitado na bancada da garagem, tique-taqueando (`BenchWatch`). A relíquia empoeirada ficou no pedestal de luz em Lumen.
- **Power bank do Ben (PB-01):** cinza-escuro com 4 luzes de carga, na mão direita do Kip (`PowerBank`, escala 0,42 na mão). Ele carrega a pulseira por uma porta lateral (ficção).
- **Planta da máquina (BLUEPRINT-01):** holograma ciano com 6 encaixes (`MachineBlueprint filled={n}`). Ep. 2 termina com 2 cheios (cristal e bateria) e 4 vazios; cada episódio seguinte enche mais um.
- **Peças compartilhadas:** `Garage`, `PowerBank`, `ChargeCable`, `BandCloseup`, `MachineBlueprint` e `EndCard` ficam em `src/videos/stickman-stuck-02-battery/props.tsx`; `Watch`, `CentralClock`, `TuningFork`, `Pill` e `Sparks` em `src/videos/stickman-stuck-01-crystal/props.tsx`. Importe daí nos próximos episódios.
- **Máquina física (MACHINE-01), a partir do ep. 3:** anel cinza em pé sobre uma base com telinha, à direita da garagem (`MachineFrame x={800}`), com 6 encaixes na ordem da planta. Ep. 3: 0 = relógio do Ben, 1 = power bank, 2 = placa do celular com o chip; 3–5 vazios. A telinha da base mostra o que a máquina "pede" (no fim do ep. 3: "?", alfinete de mapa e relógio). Use `machineSlot(x, groundY, i)` para alinhar a mão do Kip a um encaixe.
- **Relógio e power bank montados:** do ep. 3 em diante eles ficam nos encaixes 0 e 1 da máquina, não mais na bancada nem na mão do Kip.
- **Peças do ep. 3** (`src/videos/stickman-stuck-03-chip/props.tsx`): `MachineFrame`, `machineSlot`, `CircuitBoard`, `OpenBand`, `Drawer`, `SandPile`, `SiliconLump`, `Ingot`, `Wafers`, `LithoRig`, `SwitchGrid`, `ToggleIcon`, `RareCrystal`, `FlowArrow`.
- **Ep. 4 (pt-BR):** o GPS velho de carro do Ben (GPS-01, genérico) fica no encaixe 3, embaixo do anel (`MachineFrame extra={{ 3: <CarGPS scale={0.42} on={1} /> }}`). A telinha mostra a rota até Lumen (`RouteScreen`) e depois o pedido de energia (raio + "?"); o power bank do encaixe 1 pisca vermelho (`alert`).
- **Idioma:** do ep. 4 em diante (e nas versões `-pt` dos eps. 1–3), o usuário pediu narração em **português do Brasil**. A voz escolhida nas primeiras amostras foi a **Piper `cadu`** (`"voz": "piper", "vozId": "cadu"`), mas em 05/11/2026 o usuário achou a narração "muito ruim" (robótica) e escolheu trocar para o **Google Chirp 3 HD**. **Próximo passo:** com `GOOGLE_TTS_API_KEY` no ambiente, rode `npm run amostras-voz -- stickman-stuck-04-gps`, mande os mp3 de `out/stickman-stuck-04-gps/amostras-voz/` e pergunte qual voz ele quer; depois regrave os 4 episódios em português (`npm run tts:google -- <slug> --voz <voz>`, `"voz": "google"` e `"vozId"` no roteiro), rode check-sync e check-lang, refaça o QA, renderize e exporte. Textos na tela em português: `EraTag label`, `SplitCompare topLabel="ANTIGAMENTE" bottomLabel="MEU TEMPO"`, `EndCard title="CONTINUA…" next="PRÓXIMO · EP. N: …"`, selo `PRESO EM 2026 · EP N`. Pergunte antes de mudar de idioma ou de voz num episódio novo.
- **Peças do ep. 4** (`src/videos/stickman-stuck-04-gps/props.tsx`): `PhoneMap`, `MapCloseup`, `CarGPS`, `Satellite`, `SignalPulse`, `Receiver`, `Stopwatch`, `BigClock`, `Rocket`, `RouteScreen`, `HoloBolt`.
- **Cenário novo:** a garagem do Ben é a base de Kip em 2026; a máquina cresce nela a cada episódio.
- **Regra de cruzamento:** exceção deste arco: um relógio de 2026 e o cristal podem ir para Lumen (Ep. 6).
- **Segurança (Ep. 5):** capacitores e montagem só como desenho simples. Kip nunca abre um flash ou outro aparelho em cena, porque capacitores podem guardar carga perigosa.
- **Formato:** cada episódio pode ter 7 clipes (o mecanismo em dois) e termina com um gancho, `"caudaMs": 2200` no roteiro e o cartão "TO BE CONTINUED…" com o título do próximo episódio. O selo do gancho é `STUCK IN 2026 · EP N`.
- **Ficção:** a máquina do tempo, a viagem, o Central Clock e Lumen. As explicações dos objetos são reais, com 2 ou mais fontes no `pesquisa.md`.

Fontes de partida do documento original (conferir de novo em cada episódio): Sciencing (quartzo), U.S. Department of Energy (bateria de lítio), imec (fabricação de chips), Maketecheasier (GPS e relatividade), Explain that Stuff (capacitores).
