# Narração: grátis em pt-BR (Piper ou Google), ElevenLabs ou sua própria voz

Um comando para todos os motores:
```bash
npm run tts -- <slug>                       # escolhe sozinho (veja abaixo)
npm run tts -- <slug> --motor piper --voz cadu
npm run tts:piper -- <slug>                 # atalhos: tts:piper · tts:google · tts:elevenlabs · tts:kokoro
npm run tts -- <slug> --dry-run             # mostra frases/caracteres sem gerar nada
npm run tts -- --motor google --listar-vozes
npm run check-sync -- <slug>                # confere a sincronia legenda × áudio (sem precisar ouvir)
```
Sem `--motor`, a ordem é: `TTS_MOTOR` no `.env` → ElevenLabs (se houver chave) → Google (se houver chave) → **Piper** (grátis, português brasileiro, sempre funciona).

| Motor | Custo | Qualidade pt-BR | Tempo das legendas | Precisa de |
|---|---|---|---|---|
| **Piper** (padrão) | grátis, ilimitado, offline | **sotaque brasileiro** (locutores brasileiros); ainda soa sintética | início de cada frase exato; vírgulas pelo áudio; palavras por peso | Python 3.10+, ~65 MB na 1ª vez |
| Kokoro | grátis, offline | ⚠ sotaque puxa para **Portugal**, fala "travada" | igual ao Piper | Python 3.10+, ~350 MB |
| **Google Cloud TTS** | grátis até a cota mensal | muito boa (Neural2) | exato por palavra (marcas SSML) | conta Google Cloud com faturamento + chave de API |
| **ElevenLabs** | pago (plano grátis limitado, sem uso comercial) | excelente, expressiva | exato por caractere | conta + chave |
| **Sua voz** | grátis | a mais autêntica | Whisper + alinhamento ao roteiro | gravar o áudio |

Depois de gerar, rode **`npm run check-sync -- <slug>`**: ele detecta os silêncios reais do áudio e confere se nenhuma palavra aparece durante um silêncio. Se falhar, regere ou ajuste o roteiro.

## Opção grátis 1 (padrão): Piper — português BRASILEIRO, local e offline
- `npm run tts:piper -- <slug>` (ou só `npm run tts -- <slug>` sem chaves no `.env`). Na 1ª vez ele cria `.tts/venv` (**Python 3.10+**), instala o `piper-tts` e baixa a voz (~65 MB) do repositório oficial (Hugging Face) ou, se ele estiver fora do ar, do pacote no GitHub. Depois disso funciona **sem internet**.
- **Vozes (todas masculinas, gravadas por brasileiros, datasets CC0 → uso comercial liberado):** `faber` (padrão, ritmo mais ágil), `cadu`, `jeff` (mais calmos) e `edresson` (qualidade baixa). Use `--voz` ou `PIPER_VOZ`. O "de" sai "dji" e o "t" de "existe" sai "tchi", como no Brasil.
- **Velocidade:** `--velocidade 1.1` ou `PIPER_VELOCIDADE` (padrão 1,0).
- Licenças: o programa `piper-tts` é GPL-3.0 (é só instalado e usado como ferramenta; o áudio gerado é seu); as vozes vêm de datasets CC0.

### Corrigindo pronúncia (vale para todos os motores)
O TTS às vezes erra o timbre de uma vogal ou lê uma sigla do jeito errado. No `roteiro.json`:
```json
"pronuncias": { "fecho": "fêcho", "NBR": "ene bê erre", "Wi-Fi": "uai fai" }
```
Só a VOZ muda; a legenda continua com o texto original. `npm run tts -- <slug> --dry-run` mostra o texto falado (marca "pronúncia ajustada"). O que mais dá problema são palavras escritas iguais com timbre diferente (e/o aberto × fechado). Casos conferidos no Piper:
| Escrito | A voz lê | Corrija para |
|---|---|---|
| fecho (substantivo, "fecho hídrico") | "fécho" | `fêcho` |
| forma (no sentido de "fôrma de bolo") | "fórma" | `fôrma` |

Conferidos e **corretos** sem ajuste: colher, sede, olho/olhos, porco/porcos, gelo, siglas comuns (GPS, NBR, ABS), "de" → "dji", "existe" → "ezistchi". Para palavras raras, nomes próprios e estrangeirismos, confira o `--dry-run` e ouça a amostra.

## Opção grátis (alternativa): Kokoro (local, offline, Apache 2.0)
> ⚠ As vozes de português do Kokoro têm sotaque que puxa para **Portugal**. Prefira o Piper para pt-BR.

- `npm run tts:kokoro -- <slug>`. Na 1ª vez ele cria `.tts/venv` (precisa do **Python 3.10+**; no Windows, marque "Add Python to PATH" no instalador), instala o `kokoro-onnx` e baixa o modelo e as vozes do GitHub (~350 MB). Depois disso funciona **sem internet**.
- **Vozes pt-BR:** `pm_alex` (masculina, padrão), `pm_santa` (masculina) e `pf_dora` (feminina). Use `--voz` ou `KOKORO_VOZ` no `.env`.
- **Velocidade:** `--velocidade 1.1` ou `KOKORO_VELOCIDADE` (0,5 a 2; padrão 1,05).
- **Modelo menor/mais rápido:** `KOKORO_MODELO=kokoro-v1.0.int8.onnx` (~90 MB, qualidade um pouco menor).
- **Como a sincronia funciona:** a narração é sintetizada **frase por frase** (quebras em . ! ? e troca de cena), e as pausas entre frases são inseridas por nós, então o início de cada frase é exato. Dentro da frase, as vírgulas são localizadas pelos vales de energia do áudio e as palavras são distribuídas pelo tamanho.
- Frases repetidas ficam em cache (`.cache/<slug>-<motor>/`): mudar uma cena só ressintetiza o que mudou.
- Licença: o modelo Kokoro-82M é Apache 2.0 (uso comercial permitido). Declare voz sintética no YouTube (`midiaSintetica: true`).
- Dicas: frases curtas soam melhor. Números saem por extenso ("9%" → "nove por cento"). Siglas podem sair soletradas; escreva como se fala.

## Opção grátis 2: Google Cloud Text-to-Speech (cota mensal grátis)
1. No **mesmo projeto do Google Cloud** do upload do YouTube (ou num novo): **APIs e serviços → Biblioteca → "Cloud Text-to-Speech API" → Ativar**. O Google exige uma **conta de faturamento** (cartão), mesmo para ficar dentro da cota grátis.
2. **Credenciais → Criar credenciais → Chave de API**. Em "Restrições de API", restrinja a chave à **Cloud Text-to-Speech API**.
3. No `.env`: `GOOGLE_TTS_API_KEY=...` (e, opcionalmente, `GOOGLE_TTS_VOZ`, `GOOGLE_TTS_VELOCIDADE`).
4. `npm run tts:google -- <slug>`.
- **Vozes:** `pt-BR-Neural2-B` (masculina, padrão) e `pt-BR-Neural2-C` (feminina). Também há Wavenet. Liste com `npm run tts -- --motor google --listar-vozes`. Use Neural2/Wavenet: a legenda exata depende de marcas SSML, e não confirmei se as vozes Chirp 3 HD aceitam marcas.
- **Cota grátis (referência de nov/2026, segundo fontes de terceiros; confira em cloud.google.com/text-to-speech/pricing):** ~1 milhão de caracteres/mês para Neural2 e ~4 milhões para Standard/WaveNet. Um Short de 45 s tem ~700 caracteres, ou seja, centenas de vídeos por mês. Acima da cota, a cobrança é por caractere. Crie um **alerta de orçamento** no Console → Faturamento para não ter surpresa.
- **Tempo das legendas:** uma `<mark>` antes de cada palavra + `enableTimePointing` devolvem o tempo exato de cada palavra. Se a API "esquecer" alguma marca (bug conhecido), ela é interpolada e o script avisa.
- A resposta fica em `.cache/<slug>-google.json`: `--from-cache` refaz legendas e timeline sem nova cobrança.

## Opção A: ElevenLabs (IA, expressiva)
1. Crie a conta em elevenlabs.io → **Profile → API Keys** → crie uma chave.
2. Em **Voices**, escolha (ou clone) uma voz que fale bem pt-BR. Copie o **Voice ID**.
3. No `.env` do projeto:
   ```
   ELEVENLABS_API_KEY=...
   ELEVENLABS_VOICE_ID=...
   ELEVENLABS_MODEL_ID=eleven_multilingual_v2   # ou eleven_v3 (mais expressivo)
   ```
4. `npm run tts:elevenlabs -- <slug>` (ou só `npm run tts -- <slug>` quando a chave está no `.env`) gera `public/<slug>/narracao.mp3` + legendas exatas + timeline.
   - A resposta fica salva em `.cache/<slug>-elevenlabs.json`. `npm run tts:elevenlabs -- <slug> --from-cache` refaz legendas e timeline **sem gastar créditos**.
   - Custo: cobrado por caractere. Um Short de 45 s tem ~650 a 750 caracteres.

Ajuste fino (`.env`):
| Variável | Efeito | Shorts |
|---|---|---|
| `ELEVENLABS_STABILITY` | menor = mais emoção/variação | 0,35 a 0,45 |
| `ELEVENLABS_SIMILARITY` | fidelidade ao timbre | 0,75 a 0,85 |
| `ELEVENLABS_STYLE` | exagero de estilo | 0,2 a 0,45 |
| `ELEVENLABS_SPEED` | velocidade (0,7 a 1,2) | 1,0 a 1,1 |

Dicas de texto para TTS: pontuação manda no ritmo. Vírgula = respiro curto; ponto = pausa; "…" = suspense; "?" sobe a entonação. Escreva números como se fala quando a pronúncia importar ("seis litros").

Declare no YouTube que a voz é sintética (`midiaSintetica: true` no metadata, que já é o padrão).

## Opção B: sua própria voz (grátis, mais autêntica)
1. Grave **lendo exatamente o roteiro aprovado** (pode errar e repetir a frase; o alinhamento tolera pequenas diferenças).
2. Ambiente silencioso, celular a ~20 cm da boca, sem música de fundo. Formatos: m4a, mp3, wav.
3. `npm run transcribe -- <slug> --audio caminho/gravacao.m4a`
   - Na 1ª vez instala o whisper.cpp em `.whisper/` (precisa de `git`, `make` e compilador C++; no Windows ele baixa o binário pronto) e baixa o modelo (`WHISPER_MODEL`, padrão `medium` ~1,5 GB). Para máquinas fracas, use `small`.
   - O Whisper só fornece os **tempos**; o texto da legenda é sempre o do roteiro (sem erros de transcrição).
   - Se aparecer "Diferença grande", a gravação pulou/trocou frases: regrave o trecho ou ajuste o roteiro para bater com o que foi dito.
4. Corte silêncios longos antes (opcional) ou deixe: a timeline se adapta.

## Opção C: rascunho sem voz (só para montar as cenas)
`npm run estimate -- <slug>`: tempos estimados (~2,8 palavras/s) para montar e revisar cenas. Troque pela voz real antes do render final.

## Música de fundo (opcional)
Coloque um mp3 **com licença de uso** em `public/musica/` e no roteiro:
```json
"musica": { "arquivo": "musica/minha-trilha.mp3", "volume": 0.08 }
```
Ela entra e sai em fade e fica baixa (0,06 a 0,12) sob a voz. Músicas de bibliotecas livres (YouTube Audio Library) evitam reivindicação de direitos.

## Efeitos sonoros
`public/sfx/{whoosh,pop,ding}.mp3` (gerados por `npm run sfx`, sem direitos autorais). Cada cena escolhe `sfx` no roteiro. O selo ganha um "pop" automático.
