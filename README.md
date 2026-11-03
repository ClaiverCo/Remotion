# viral-shorts: skill do Claude Code para Shorts virais com Remotion

Skill que transforma um **tema** num **Short/Reels/TikTok explicativo pronto para postar**, 100% por código. A partir do tema, ela:

1. faz uma **pesquisa detalhada na internet** e monta um dossiê com fontes checadas;
2. escreve um **roteiro que prende até o fim** e **para para você aprovar**;
3. gera a **narração**, pelo ElevenLabs ou pela sua voz transcrita com Whisper;
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

**Requisitos:** [Claude Code](https://claude.com/claude-code), Node.js 18+ (reinicie o PC depois de instalar), ffmpeg e git. No Windows, também o Git Bash.

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
| Voz ElevenLabs | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | `references/narracao.md` |
| Sua voz (Whisper local) | `WHISPER_MODEL` (padrão `medium`) | `references/narracao.md` |
| Upload YouTube | `.secrets/client_secret.json` + `npm run youtube -- auth` | `references/upload-youtube.md` |
| 3D sem GPU | `REMOTION_GL=swangle` | `references/visual-3d.md` |

### Comandos do projeto (o Claude roda por você)

```bash
npm run new -- <slug> [--estilo 2.5d|3d]   # cria src/videos/<slug>/
npm run estimate -- <slug>                 # legendas estimadas (rascunho sem voz)
npm run tts -- <slug>                      # narração ElevenLabs + legendas exatas
npm run transcribe -- <slug> --audio x.m4a # sua voz + Whisper + alinhamento com o roteiro
npm run studio                             # pré-visualização no navegador
npm run qa -- <slug>                       # um frame por cena + prancha
npm run render -- <slug> [--draft]         # MP4 1080×1920
npm run finalize -- <slug>                 # áudio -14 LUFS + legendas.srt
npm run export -- <slug>                   # pacote: video.mp4, youtube.txt, tiktok.txt, reels.txt…
npm run youtube -- upload <slug> --confirmar
npm run youtube -- fila add a b c --inicio 2026-11-10T12:00:00-03:00 --intervalo-horas 24
npm test                                   # testes das bibliotecas (legendas, alinhamento, metadados)
```

## Exemplos incluídos

- **`exemplo-vaso-sanitario`** (2.5D, ~60 s, modelo "parece fácil?"): sifão, fecho hídrico, efeito sifão e caixa acoplada. O dossiê tem 10 fontes, incluindo as normas ABNT NBR 8160 e 15097.
- **`exemplo-gelo-3d`** (3D, ~20 s, modelo "pergunta final"): densidade e rede hexagonal do gelo.

Os dois vêm com legendas **estimadas**, sem narração. Para ouvi-los, rode `npm run tts -- exemplo-vaso-sanitario` com a chave do ElevenLabs.

## Créditos e referências

- [Remotion](https://www.remotion.dev) e os [Agent Skills oficiais](https://github.com/remotion-dev/skills) (`npx skills add remotion-dev/skills`), que também podem ser instalados junto.
- Regras de movimento inspiradas em [haidrrrry/claude-remotion-skill](https://github.com/haidrrrry/claude-remotion-skill) (MIT).
- Fonte Montserrat, licença SIL OFL 1.1 (`assets/template/public/fonts/OFL.txt`).
- Remotion é gratuito para pessoas físicas e empresas pequenas. Empresas maiores precisam de [licença](https://www.remotion.dev/license).
