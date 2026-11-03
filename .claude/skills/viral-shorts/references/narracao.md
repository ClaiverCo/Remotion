# Narração: ElevenLabs ou sua própria voz

## Opção A: ElevenLabs (IA, expressiva)
1. Crie a conta em elevenlabs.io → **Profile → API Keys** → crie uma chave.
2. Em **Voices**, escolha (ou clone) uma voz que fale bem pt-BR. Copie o **Voice ID**.
3. No `.env` do projeto:
   ```
   ELEVENLABS_API_KEY=...
   ELEVENLABS_VOICE_ID=...
   ELEVENLABS_MODEL_ID=eleven_multilingual_v2   # ou eleven_v3 (mais expressivo)
   ```
4. `npm run tts -- <slug>` gera `public/<slug>/narracao.mp3` + legendas exatas + timeline.
   - A resposta fica salva em `.cache/<slug>-elevenlabs.json`. `npm run tts -- <slug> --from-cache` refaz legendas e timeline **sem gastar créditos**.
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

## Opção C: rascunho sem voz
`npm run estimate -- <slug>`: tempos estimados (~2,8 palavras/s) para montar e revisar cenas. Troque pela voz real antes do render final.

## Música de fundo (opcional)
Coloque um mp3 **com licença de uso** em `public/musica/` e no roteiro:
```json
"musica": { "arquivo": "musica/minha-trilha.mp3", "volume": 0.08 }
```
Ela entra e sai em fade e fica baixa (0,06 a 0,12) sob a voz. Músicas de bibliotecas livres (YouTube Audio Library) evitam reivindicação de direitos.

## Efeitos sonoros
`public/sfx/{whoosh,pop,ding}.mp3` (gerados por `npm run sfx`, sem direitos autorais). Cada cena escolhe `sfx` no roteiro. O selo ganha um "pop" automático.
