# Mellon’s Shop & Deli — The Deli Drop

**Modelo 1 aprovado · BIG BITES. LOCAL ROOTS.**  
Kit navegável em inglês da Irlanda, com o board aprovado, arquivos de marca, fotos reais, cardápio, roteiros e código pronto para hospedar como site estático.

## Abrir o site

1. Extraia o ZIP inteiro, mantendo a estrutura de pastas.
2. Abra `dist/index.html` no navegador. Não precisa instalar dependências nem subir um servidor. O cardápio está em `dist/menu.html`.
3. Abra `GUIA-VISUAL.html` para comparar a sequência de cenas com o board e ver marca, tipografia e escala.

As duas páginas carregam textos, imagens, fontes e animações locais. Os links de pedido, loja, formulário, redes sociais e itinerário abrem os serviços originais com internet. **Order Online** vai sempre para [o pedido oficial](https://www.mellonsshop.ie/online-ordering). Não há checkout ou formulários simulados.

## O que está no kit

| Caminho | Conteúdo |
| --- | --- |
| `dist/` | Site final: home em seis cenas e cardápio com busca. Esta é a pasta para hospedagem. |
| `brand/` e `fonts/` | Logo oficial em PNG de fundo branco, paleta em tokens, fontes e licenças. |
| `images/` | Originais da empresa e referências reais enviadas no briefing; as versões otimizadas estão em `dist/assets/images/`. |
| `references/` | Board escolhido, direção de pré-produção e PDF original do menu impresso. |
| `roteiros/` e `motion/` | Direção de arte, sequência das cenas, transições, roteiro opcional para Veo 3 e regras de atualização. |
| `docs/` | Fontes verificadas, procedência das fotos, referência do cardápio, especificação e medições de escala e relatório de validação. |
| `MANIFEST.sha256` e `tools/` | Conferência do conteúdo extraído e atualização do cardápio. |

## Manutenção

- **Conteúdo:** atualize os nomes e preços em `docs/menu-snapshot.json` depois de conferi-los na [página de pedidos](https://www.mellonsshop.ie/online-ordering). Rode `python3 tools/render-menu.py` na raiz do kit. A data do cardápio indica quando os valores foram consultados; confira disponibilidade, opções e alergênicos com a loja.
- **Marca e enquadramento:** preserve o logo oficial sobre branco. Mantenha a composição central limitada a **1024 px**; acima disso só os fundos ocupam mais espaço. Em telas pequenas, reorganize as cenas. A foto do hero e a do Grab & Go têm enquadramentos próprios.
- **Movimento:** a home usa CSS, SVG e JavaScript local, sem vídeo obrigatório. A preferência de movimento reduzido do aparelho e o controle no rodapé deixam a composição em repouso.
- **Publicação:** este kit não altera o site em produção. Antes de publicar, valide a aparência em navegador nas larguras indicadas, confira os dados dinâmicos e confirme o destino correto da política de privacidade. Pedido, catálogo, voucher e formulário continuam em seus serviços originais.

Para verificar a extração: `python3 tools/verificar-hashes.py`. O teste detalhado do conteúdo requer Python com Pillow e lxml, além de Node.js; essas dependências servem apenas para QA, não para abrir o site.
