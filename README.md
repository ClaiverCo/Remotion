# Skills do Claude Code para Shorts virais com Remotion

Este repositório traz duas skills que usam o mesmo projeto Remotion:

| Skill | O que faz | Idioma do vídeo |
|---|---|---|
| **`viral-shorts`** | Shorts explicativos "como funciona / por que acontece" em 2.5D ou 3D | pt-BR (Piper grátis) |
| **`stickman-do-futuro`** | série **"Relics of the Old Days"**: Kip, um stickman do futuro, acha uma relíquia de hoje, viaja ao presente e explica como ela funciona. Vídeo por código **e** pacote de prompts para Google Flow / Higgsfield | inglês (Kokoro am_michael grátis) |

## viral-shorts

Skill que transforma um **tema** num **Short/Reels/TikTok explicativo pronto para postar**, 100% por código. A partir do tema, ela:

1. faz uma **pesquisa detalhada na internet** e monta um dossiê com fontes checadas;
2. escreve um **roteiro que prende até o fim** e **para para você aprovar**;
3. gera a **narração**: **grátis em português brasileiro** com o Piper (local, offline) ou com o Google Cloud TTS (cota mensal grátis), pelo ElevenLabs ou pela sua voz transcrita com Whisper;
4. produz **legendas automáticas** palavra por palavra, com as palavras-chave destacadas;
5. anima as cenas em **2.5D** (maquete em corte) ou **3D** (Three.js low-poly);
6. inspeciona os frames, corrige e renderiza em **1080×1920**;
7. escreve **título, descrição e hashtags** para YouTube Shorts, TikTok e Reels, validando os limites de cada plataforma;
8. **sobe e agenda** no YouTube, um vídeo ou em lote;
9. **aprende** com cada correção sua (`aprendizados.md`).

```
.claude/skills/viral-shorts/
├── SKILL.md              ← o fluxo que o Claude segue
├── aprendizados.md       ← regras aprendidas (cresce a cada vídeo)
├── references/           ← pesquisa, roteiro, legendas, hashtags, visual 2.5D/3D, narração, upload
└── assets/template/      ← projeto Remotion completo (copiado para a sua pasta na 1ª vez)
    ├── src/components/   ← legendas virais, selo de gancho, câmera, primitivas 2.5D e 3D
    ├── src/videos/       ← um vídeo por pasta (exemplos: vaso sanitário 2.5D, gelo 3D)
    └── scripts/          ← tts, transcribe, render, qa, finalize, export, youtube…
```

## Instalação

**Requisitos:** [Claude Code](https://claude.com/claude-code), Node.js 18+ (reinicie o PC depois de instalar), ffmpeg e git. No Windows, também o Git Bash. Para a narração grátis local (Piper): Python 3.10+.

- **Só neste projeto:** clone este repositório e abra a pasta no Claude Code. A skill já está em `.claude/skills/`.
- **Em qualquer projeto:** copie a pasta da skill para a pasta pessoal:
  ```bash
  cp -r .claude/skills/viral-shorts ~/.claude/skills/
  ```

## Uso

Numa pasta vazia, no Claude Code:

```
/viral-shorts como funciona o chuveiro elétrico
```

Na primeira vez, a skill copia o template e roda `npm install`. Depois ela pergunta o estilo, a duração e a voz, pesquisa, mostra o roteiro para você aprovar e só então gera o vídeo.

Em lote (um tema por linha):

```
/viral-shorts lote temas.txt
```

### Configuração (`.env`)

Copie `.env.example` para `.env` e preencha só o que for usar.

| O quê | Variáveis | Guia |
|---|---|---|
| Voz grátis local pt-BR (Piper) | nada obrigatório. Opcionais: `PIPER_VOZ` (`faber`/`cadu`/`jeff`), `PIPER_VELOCIDADE` | `references/narracao.md` |
| Voz grátis Google (cota mensal) | `GOOGLE_TTS_API_KEY`, `GOOGLE_TTS_VOZ` | `references/narracao.md` |
| Voz ElevenLabs | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | `references/narracao.md` |
| Sua voz (Whisper local) | `WHISPER_MODEL` (padrão `medium`) | `references/narracao.md` |
| Upload YouTube | `.secrets/client_secret.json` + `npm run youtube -- auth` | `references/upload-youtube.md` |
| 3D sem GPU | `REMOTION_GL=swangle` | `references/visual-3d.md` |

### Comandos do projeto (o Claude roda por você)

```bash
npm run new -- <slug> [--estilo 2.5d|3d]   # cria src/videos/<slug>/
npm run estimate -- <slug>                 # legendas estimadas (rascunho sem voz)
npm run tts -- <slug>                      # narração (Piper pt-BR grátis por padrão; Google/ElevenLabs se houver chave)
npm run tts:piper -- <slug> --voz cadu     # força um motor/voz (tts:piper · tts:google · tts:elevenlabs · tts:kokoro)
npm run check-sync -- <slug>               # confere a sincronia legenda × áudio
npm run transcribe -- <slug> --audio x.m4a # sua voz + Whisper + alinhamento com o roteiro
npm run studio                             # pré-visualização no navegador
npm run qa -- <slug>                       # um frame por cena + prancha
npm run render -- <slug> [--draft]         # MP4 1080×1920
npm run finalize -- <slug>                 # áudio -14 LUFS + legendas.srt
npm run export -- <slug>                   # pacote: video.mp4, youtube.txt, tiktok.txt, reels.txt…
npm run youtube -- upload <slug> --confirmar
npm run youtube -- fila add a b c --inicio 2026-11-10T12:00:00-03:00 --intervalo-horas 24
npm test                                   # testes das bibliotecas (legendas, alinhamento, metadados, stickman, prompt pack)
```

## Exemplos incluídos

- **`exemplo-vaso-sanitario`** (2.5D, ~48 s, modelo "parece fácil?"): sifão, fecho hídrico, efeito sifão e caixa acoplada. O dossiê tem 10 fontes, incluindo as normas ABNT NBR 8160 e 15097.
- **`exemplo-gelo-3d`** (3D, ~20 s, modelo "pergunta final"): densidade e rede hexagonal do gelo.

Os dois já vêm **narrados** com a voz grátis brasileira do Piper (`faber`), legendas sincronizadas pelo áudio real e cenas que animam na palavra falada. Para trocar de voz: `npm run tts -- exemplo-vaso-sanitario --voz cadu`.

## stickman-do-futuro ("Relics of the Old Days", em inglês)

```
/stickman-do-futuro house key
/stickman-do-futuro ideias        ← 8 ideias de relíquia para você escolher
```

A skill segue o documento "Future Stickman Video Instructions":
1. **dossiê de fatos** do presente, com fontes, separado da ficção do futuro;
2. **história em 6 clipes** (achado → viagem → uso → mecanismo → comparação → volta), que você aprova;
3. **narração grátis em inglês** (Kokoro `am_michael`) com legenda palavra por palavra;
4. **cenas por código**: o Kip tem esqueleto com poses, halo, túnica e a Chrono-Band no pulso esquerdo, e há eras, portal do tempo e tela dividida;
5. **metadados e hashtags em inglês**.

Opcionalmente, ela gera o **pacote de prompts** (`npm run prompt-pack -- <slug>`), com:
- folha de personagem;
- agente de consistência;
- prompts de imagem e de animação de cada clipe;
- a voz cortada por clipe;
- legendas no tempo de 10 s por clipe.

```
.claude/skills/stickman-do-futuro/
├── SKILL.md            ← fluxo (instruções em PT, conteúdo em EN)
├── aprendizados.md
└── references/         ← bíblia da série, roteiro de relíquia, visual por código, pacote de prompts, hashtags EN
```

O código do universo fica no template da `viral-shorts`, por isso **instale as duas juntas**:
- `src/stickman/`: `bible.ts`, a fonte única do universo; o rig; `Stickman.tsx`; as eras; `clips.ts`;
- `scripts/prompt-pack.ts`;
- `scripts/stickman-sheet.ts`.

```bash
cp -r .claude/skills/viral-shorts .claude/skills/stickman-do-futuro ~/.claude/skills/
npm run stickman-sheet                      # folha do Kip (PNG) desenhada pelo código
npm run prompt-pack -- stickman-house-key   # pacote para Flow/Higgsfield em out/<slug>/prompt-pack/
```

**Episódio de exemplo: `stickman-house-key`** (45,5 s, 6 clipes). Kip acha uma chave de casa e descobre a fechadura de pinos: molas, pinos e a *shear line*. O exemplo já vem narrado e sincronizado, com `pesquisa.md`, `clips.json` e metadados.

**Episódio `stickman-electric-fan`** (47,5 s, 6 clipes): *"Why did they keep a propeller in a cage?"*. Kip acha um ventilador de coluna e descobre que ele nunca esfriou o ar: a brisa tira o ar morno da pele e acelera a evaporação do suor. Narrado (Kokoro `am_michael`), com dossiê de 8 fontes e metadados em inglês.

```bash
npm run render -- stickman-electric-fan && npm run finalize -- stickman-electric-fan
```

### Mini novela "Stuck in 2026" (6 episódios)

Kip fica preso em 2026 e, a cada episódio, transforma um objeto comum em peça de uma máquina do tempo. O plano do arco está em `.claude/skills/stickman-do-futuro/references/arco-preso-em-2026.md`.

- **Ep. 1 `stickman-stuck-01-crystal`** (56 s, 7 clipes): *"The Crystal That Counts Time"*. O Central Clock de Lumen atrasa; Kip vai a 2026, ganha o relógio do Ben e descobre o quartzo que vibra 32.768 vezes por segundo, dividido por 2 quinze vezes até virar um tique por segundo. No fim, a Chrono-Band racha e ele fica preso.

- **Ep. 2 `stickman-stuck-02-battery`** (56 s, 7 clipes): *"Power in a Pocket"*. A Chrono-Band está sem energia; o Ben empresta um power bank e o Kip descobre a bateria de lítio: íons atravessam o separador por dentro e os elétrons dão a volta pelo fio, alimentando o aparelho. A pulseira acende 3 s e mostra a planta da máquina do tempo, com 4 espaços vazios.

- **Ep. 3 `stickman-stuck-03-chip`** (60 s, 7 clipes): *"The Brain Made of Sand"*. O "cérebro" da Chrono-Band queimou; o Ben acha a placa de um celular velho e o chip entra no 3º encaixe da máquina, agora uma estrutura de verdade na garagem. O vídeo explica areia → silício → cristal → discos → luz que grava bilhões de transistores. No fim, a máquina pergunta onde e quando eles estão.

```bash
npm run render -- stickman-stuck-01-crystal && npm run finalize -- stickman-stuck-01-crystal
npm run render -- stickman-stuck-02-battery && npm run finalize -- stickman-stuck-02-battery
npm run render -- stickman-stuck-03-chip && npm run finalize -- stickman-stuck-03-chip
```

### Especial em pt-BR: `kip-ventilador-no-3`

Comédia curta (24 s, narrada em pt-BR pelo Piper `faber` com `npm run narrar-especial`) fora do formato da série: o Kip, com 40 °C, aperta o ventilador com o dedão do pé no 1 (*só faz barulho*), no 2 (*agora sim*) e no 3 (*MODO TURBO*). Ele é arremessado na parede (**POF!**), congela e o vídeo fecha com "E você? usa no 1, 2 ou 3?". O código fica em `src/especiais/kip-ventilador-no-3/` (os tempos em `timeline.ts`), e os sons saem de `npm run sfx`.

```bash
npx remotion render kip-ventilador-no-3 out/kip-ventilador-no-3/video.mp4
```

## Créditos e referências

- [Remotion](https://www.remotion.dev) e os [Agent Skills oficiais](https://github.com/remotion-dev/skills) (`npx skills add remotion-dev/skills`), que também podem ser instalados junto.
- Regras de movimento inspiradas em [haidrrrry/claude-remotion-skill](https://github.com/haidrrrry/claude-remotion-skill) (MIT).
- Fonte Montserrat, licença SIL OFL 1.1 (`assets/template/public/fonts/OFL.txt`).
- Narração grátis: [Piper](https://github.com/OHF-Voice/piper1-gpl) (vozes pt-BR faber/cadu/jeff, datasets CC0) e [Kokoro-82M](https://github.com/hexgrad/kokoro) via [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) (Apache 2.0), padrão para inglês (`am_michael`).
- Remotion é gratuito para pessoas físicas e empresas pequenas. Empresas maiores precisam de [licença](https://www.remotion.dev/license).
