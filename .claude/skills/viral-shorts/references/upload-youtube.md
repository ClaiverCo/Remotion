# Upload e agendamento no YouTube (Data API v3)

## Configuração (uma vez)
1. Acesse **console.cloud.google.com** → crie um projeto (ex.: "viral-shorts").
2. **APIs e serviços → Biblioteca** → ative **YouTube Data API v3**.
3. **Tela de consentimento OAuth** → tipo **Externo** → preencha nome/e-mail → em **Usuários de teste**, adicione o e-mail da conta dona do canal.
4. **Credenciais → Criar credenciais → ID do cliente OAuth → Tipo: App para computador** → baixe o JSON.
5. Salve como `.secrets/client_secret.json` no projeto (a pasta `.secrets/` está no `.gitignore`; nunca suba isso para o git).
6. `npm run youtube -- auth` abre o navegador. Entre na conta do canal e autorize. O token fica em `.secrets/youtube-token.json`.

> Se aparecer "o Google não verificou este app": clique em **Avançado → Acessar** (o app é seu e você está nos usuários de teste).

## Uso
```bash
# 1 vídeo: mostra o que será enviado (nada sobe)
npm run youtube -- upload <slug>
# envia de verdade
npm run youtube -- upload <slug> --confirmar

# Lote com agendamento (1 por dia ao meio-dia de Brasília)
npm run youtube -- fila add slug-a slug-b slug-c --inicio 2026-11-10T12:00:00-03:00 --intervalo-horas 24
npm run youtube -- fila ver
npm run youtube -- fila run --confirmar
```
- O agendamento usa `privacyStatus: private` + `publishAt`: o YouTube publica sozinho na data.
- Sem data, usa `privacidade` do `metadata.json` (padrão `private`, para você revisar no Studio antes).
- O vídeo precisa estar em `out/<slug>/video.mp4` (`npm run render` + `npm run finalize`).
- Cada upload salva `out/<slug>/youtube-upload.json` com o link.

## Limites importantes
- **Auditoria:** projetos de API criados depois de 28/07/2020 e **não auditados** pelo YouTube têm **todo upload forçado como privado**, mesmo pedindo público. Para publicar direto pela API, solicite a auditoria ("YouTube API Services – Audit and Quota Extension Form"). Enquanto isso, suba como privado/agendado e publique manualmente no Studio, ou use a API só para preencher título/descrição.
- **Cota:** a cota padrão é diária. Até maio/2026, cada `videos.insert` custava 1.600 de 10.000 unidades (~6 uploads/dia). Relatos indicam que desde junho/2026 o `videos.insert` tem cota própria (~100 chamadas/dia). Confira em Console → APIs → YouTube Data API v3 → **Cotas**. Se acabar, `fila run` para e retoma na próxima execução.
- Shorts: vertical, até 3 minutos. O `#shorts` na descrição ajuda a classificar.
- `containsSyntheticMedia` (`midiaSintetica` no metadata): marque `true` quando a voz ou as imagens forem geradas por IA de forma realista (política do YouTube).

## Segurança
- Nunca cole a chave/token no chat. Ela fica só em `.secrets/` e `.env`.
- O Claude **sempre** mostra o resumo e pede confirmação antes de `--confirmar`.
- Para revogar o acesso: myaccount.google.com → Segurança → Apps de terceiros.

## TikTok e Instagram
O upload automático nessas plataformas exige apps aprovados nas APIs oficiais (TikTok Content Posting API / Instagram Graph API com conta profissional). Esta skill gera `tiktok.txt` e `reels.txt` prontos para colar. Poste pelo app ou por um agendador (Meta Business Suite para Reels).
