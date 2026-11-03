# Aprendizados (leia antes de cada vídeo)

A skill registra aqui as correções pedidas pelo usuário e o que deu certo, para não repetir erros.
Formato: `- [AAAA-MM-DD] contexto → regra`. Acrescente no fim da seção certa; não apague regras antigas (se uma ficar obsoleta, risque com ~~ ~~ e explique).

## Legendas
- [2026-11-03] No modo "reveal", as palavras ainda não faladas reservam espaço e uma palavra sozinha fica fora do centro → o padrão é o modo "page" (página inteira visível, pop na palavra ativa).
- [2026-11-03] Palavras coladas ("BURACOLIGADO") porque o contorno grosso come o espaço → espaço entre palavras de 0,42em e tamanho calculado com `measureText` (nada de estimar por nº de letras).
- [2026-11-03] Página quebrando em 2 linhas com palavra órfã ("ÁGUA TAMPA / O") → limite de ~15 letras por página e fonte ajustada para caber numa linha.

## Cenas 2.5D
- [2026-11-03] Seta desenhada sobre o mesmo path do cano "embranquece" a água → setas ficam AO LADO do cano (path paralelo), nunca em cima.
- [2026-11-03] Rótulos perto da borda são cortados com zoom ≥ 1,3 → com câmera em close, mantenha rótulos com x entre 300 e 800 no espaço da cena.
- [2026-11-03] Selo cobre o topo do objeto quando a câmera abre → no plano final, centralize a câmera mais baixo (y ≈ 820) para o objeto descer.
- [2026-11-03] Funcionou bem: um diagrama paramétrico único (Toilet.tsx) animado por estado em todas as cenas, com continuidade e correções rápidas.

## Cenas 3D
- [2026-11-03] Em 9:16 a câmera ficou perto demais (o objeto estourou a largura) → fov 50 e distância de 9 a 15 para objetos de 2 a 3 unidades.
- [2026-11-03] "Água" em caixa dentro de copo parece um cubo → use `Water3D shape="cylinder"` em recipientes redondos.
- [2026-11-03] Texto dentro do WebGL é trabalhoso → `ScreenLabel` por cima do canvas.
- [2026-11-03] O render 3D na CPU (swangle) é lento (~1 frame/s) → faça o QA com stills antes e só depois o render completo.

## Narração
- [2026-11-03] As vírgulas do Kokoro quase nunca viram silêncio total (só 2/9 frases eram detectadas por limiar) → localizar cada vírgula pelo vale de energia mais próximo da posição esperada; com isso foram 9/9.
- [2026-11-03] Sintetizar frase por frase (quebra em . ! ? e cena) mantém a entonação e deixa o início de cada frase exato; não quebrar nas vírgulas (a fala fica picotada).
- [2026-11-03] Narração real (46,7 s) saiu bem mais curta que a estimativa (63 s) → só ajuste a duração do roteiro depois de gerar a voz de verdade.
- [2026-11-03] Sempre rodar `npm run check-sync` depois da voz: ele pegou na hora a legenda deslocada em 400 ms (teste de controle).

## Roteiro / pesquisa
- [2026-11-03] Estatística sem fonte quase entrou num texto → só números com fonte no dossiê; na dúvida, corte.

## Render / ambiente
- [2026-11-03] O Google Fonts falhou no render atrás de um proxy (certificado) → fontes embutidas em `public/fonts` (render offline e determinístico).
