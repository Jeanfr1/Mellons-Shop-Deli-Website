# Validação do kit — 24/11/2026

Verificação feita em HTML, CSS, JavaScript e arquivos finais. O kit inclui as medições em `scale-measurements.json` e os scripts para repetir os testes.

| Verificação | Evidência |
| --- | --- |
| Estrutura e navegação | Home, cardápio e guia com referências de arquivos e âncoras resolvidas. Oito botões com a etiqueta Order Online apontam ao pedido oficial. |
| Cardápio | 57 nomes e preços na ordem de oito categorias, iguais à captura da página oficial. Conta, disponibilidade, opções e checkout permanecem no serviço oficial. |
| Interações | Código executado em teste de comportamento: busca por nome, resposta sem resultados, limpeza, navegação compacta com Escape, controle de movimento reduzido e disparo único ao entrar na tela. |
| Imagens | 18 WebPs decodificados; originais preservados e assinaturas de arquivo conferidas. As máscaras principais foram renderizadas isoladamente para conferir seus recortes. |
| Marca e fontes | Logo idêntico ao PNG oficial, cantos brancos opacos, arquivos de fonte locais e licenças incluídas. |
| Escala | Medições calculadas das declarações CSS e métricas da fonte. Limitação central e enquadramentos independentes. |

| Janela | Base central | Título do hero | Foto principal |
| ---: | ---: | ---: | ---: |
| 375 px | 375 px | 50,4 px | 336,6 px |
| 768 px | 768 px | 72,8 px | 436 px |
| 1024 px | 1024 px | 92 px | 550 px |
| 1440 px | 1024 px | 92 px | 550 px |
| 1920 px | 1024 px | 92 px | 550 px |

A prévia no navegador não ficou disponível neste ambiente. As medidas acima são verificações do código, não capturas ou medições do navegador. Para completar o aceite visual, abra `dist/index.html`, percorra as seis cenas nas cinco larguras e teste teclado, busca, acionamento da emenda e movimento reduzido no navegador.

O ZIP inclui um manifest SHA-256. Depois de extrair, rode `python3 tools/verificar-hashes.py` se quiser conferir a cópia.
