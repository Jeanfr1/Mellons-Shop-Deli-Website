# Mellon's Shop & Deli

**Direção de arte, roteiro de movimento e mapa de conteúdo · 24/11/2026**

Propostas para o novo site em inglês, com o sistema de pedidos que a Mellon's já utiliza. As três pranchas são composições para escolha; a implementação começa com a opção selecionada.

## O que vem dos vídeos

| Referência | Gesto observado | Adaptação para a Mellon's |
| --- | --- | --- |
| `siteconcept.mov` · 15,7 s | Campo vermelho, letras grossas em sequência e mãos com sanduíches atravessando o quadro. A cena termina com um enquadramento limpo do produto. | Vermelho da marca, título branco em blocos e recortes de comida real em profundidades diferentes. O hero termina numa imagem estável, com os botões disponíveis desde o primeiro quadro. |
| `siteanimationidea.mov` · 12,5 s | Um ingrediente atravessa a linha entre dois campos de cor. Na passagem, um corte alinhado revela a versão preparada; as palavras acompanham o ritmo. | A mesma passagem de forma e posição, em vermelho e branco. Ingredientes e pratos têm relação visível; o corte não inventa uma receita. A linha vira a borda do balcão no início do menu. |

## Marca e escala

O PNG fornecido neste projeto vem do arquivo oficial do site: **675 × 649 px, fundo branco opaco**. Preservar disco vermelho, contorno escuro, lettering branco, a palavra *Shop* e o traço sob ela. Tratar datas históricas como texto do site, sem redesenhar ou editar a marca.

| Token | Valor | Aplicação |
| --- | --- | --- |
| Vermelho Mellon's | `#F31820` | Base aproximada da cor dominante do logo, campo do hero e acentos |
| Vermelho de contraste | `#AD1020` | Áreas sob texto branco e botões que precisam de contraste |
| Branco | `#FFFFFF` | Fundo do logo, texto sobre vermelho profundo |
| Papel de deli | `#FBF7F1` | Campo para fotografia, com luz neutra para destacar as cores dos pratos |
| Tinta | `#211A17` | Corpo de texto e bordas da prateleira |

Títulos com sans grossa, compacta e levemente irregular, próxima ao peso visual do vídeo. Iniciar estudo com Lilita One para o modelo 1, Passion One Bold para o 2 e uma grotesca de terminais suaves para o 3; testar as quebras com o texto real e incluir a licença da família escolhida no kit. Para a interface, usar uma sans limpa (por exemplo, Public Sans), corpo a partir de 16 px e rótulos de uso frequente a partir de 14 px. O logo tem seu próprio lettering.

**Base virtual centralizada: 1024 px.** H1 de partida em torno de 84 px; prato principal entre 450 e 580 px de largura lógica conforme a prancha escolhida. Fixar as medidas em tela larga, nunca multiplicar a página pela largura do PNG. Em 1440 e 1920 só os fundos podem expandir; não usar `cover` arbitrário no hero ou na macro de produto. No mobile, reorganizar título, botões e prato; não usar o board reduzido como página. Conferir 375, 768, 1024, 1440 e 1920 px na implementação.

## Três direções

| Modelo | Hero | Construção das seções |
| --- | --- | --- |
| **1 · The Deli Drop** | **BIG BITES. LOCAL ROOTS.** Lanches entram pelas bordas e passam na frente e atrás das letras. É o mais fiel à peça vermelha que você enviou. | Faixa horizontal vira balcão de menu; a dobra do papel revela o Grab & Go; a borda da travessa abre o catering. O fechamento troca a ilustração da lojinha pela fachada real. |
| **2 · The Lunch Cut** | **CUT TO LUNCH.** Italian Job atravessa uma linha entre vermelho e branco; o enquadramento mantém as metades em posição durante o corte. | Menu intercalado em duas metades retangulares, uma faixa curta para o combo e outra larga para a travessa do catering. A história e o endereço fecham ao lado da fachada. |
| **3 · The Ringsend Counter** | **GOOD FOOD. GOOD NEIGHBOURS.** Mãos e lanches enquadram a tipografia, como um pedido passando pelo balcão. | Balcão assimétrico do café da manhã ao almoço; uma comanda destaca o Grab & Go; vista de cima para catering; vitrine de loja e vouchers; foto da esquina encerra a visita. |

Recomendação: **1 · The Deli Drop**. É a aproximação mais direta dos dois vídeos e dá às fotos oficiais um papel central, do hero ao catering.

## Roteiro do hero · execução recomendada

| Tempo aproximado | Ação |
| --- | --- |
| 0,00–0,22 s | Começar com logo no seu fundo branco, título e CTA legíveis. A primeira linha assenta por máscara em cerca de 16 px. |
| 0,22–0,60 s | A segunda linha completa a leitura. Recortes de duas extremidades entram com atraso curto, um atrás das letras e outro na frente. Deslocamento de até 90 px e rotação inicial de até 7°. |
| 0,60–1,05 s | O sanduíche principal para no enquadramento final. Manter visível a secção do pão e recheio, com um retorno pequeno de 5–8 px. |
| 1,05–1,60 s | A faixa de cor dá o ponto de corte. Para o modelo 1, alinhar ingrediente e prato pela mesma posição até o cruzamento; no 2, alinhar o contorno das duas metades do sanduíche; no 3, usar o papel da comanda como máscara. |
| Depois de 1,60 s | Composição estável. Rolar segue nativo; nenhuma introdução bloqueia o pedido. |

Priorizar imagens WebP/AVIF a partir dos originais, máscaras em CSS/SVG e movimento por `transform`/opacidade. Preservar uma imagem real estática como primeiro quadro e fallback. Se for necessário um recorte de mão, separar prato e mão em camadas sem alterar o recheio. Limitar o cruzamento às bordas das letras, com ordem de leitura completa. Nunca incorporar título, logo ou botão no vídeo.

### Passagens entre as seções

1. **Hero → menu:** usar a linha vermelho/branco como eixo visual. Em um deslocamento curto, o sanduíche dá lugar ao prato no balcão. A passagem acontece uma vez; não sequestrar a rolagem.
2. **Menu → Grab & Go:** o papel de embrulho desliza sob a foto do combo por cerca de 450 ms. Texto e link entram juntos com a imagem, sem simular preço, timer ou compra.
3. **Grab & Go → catering:** aproveitar o alinhamento de duas bordas reais: papel do combo e travessa. A legenda entra depois da foto, em até 400 ms. O prato continua reconhecível.
4. **Catering → shop/vouchers:** abertura lateral curta, como uma prateleira que deixa aparecer o print e o voucher; cada ação é separada, com foco acessível.
5. **Shop → história e visita:** alinhar a linha do toldo na ilustração ao enquadramento da fachada real em um corte simples. Depois deixar horários e contato estáveis.

Ajustar o gesto ao modelo escolhido: painel cortado no 2, comanda no 3. Sem repetir a mesma máscara em toda a página. Em `prefers-reduced-motion`, mostrar enquadramentos finais imediatamente; oferecer pausa se houver trecho em loop. Não esconder conteúdo essencial durante o scroll.

### Veo 3 · uma tomada opcional

Fazer primeiro a abertura com as fotos e o movimento nativo. Usar Veo 3 apenas se a entrada da mão e a textura ficarem convincentes e acrescentarem algo que não seja possível com o recorte. Limite de produção: uma tomada, uma correção se houver ganho claro. Aproveitar apenas 3–4 s estáveis; o restante da página usa o CSS. O vídeo não é necessário para concluir o site.

> Locked food-advertising camera, close three-quarter view. Over a matte Mellon's red studio field, an adult hand brings the exact Classic Club sandwich in the supplied official reference gently into the lower-right of frame. Preserve the same bread, fillings, size and angle, crisp real texture and natural soft daylight. Settle with a tiny bounce, then hold. Leave the left half clean for live website typography. No text, logo, price, faces, additional ingredients, camera zoom or audio needed.

Trocar o nome e a referência do prato se o modelo escolhido pedir outro. Se a ferramenta disponível não preservar o aspecto do prato, usar a foto original e movimento nativo. Entregar um poster real; software de edição pode extrair o trecho e comprimi-lo. Nenhum vídeo foi gerado nesta etapa.

## Conteúdo a preservar no site

| Conteúdo | Tratamento e destino |
| --- | --- |
| Pedidos, menu e retirada | Todos os botões **Order Online** apontam para [Online Ordering](https://www.mellonsshop.ie/online-ordering). A página atual reúne oito grupos e 57 itens na consulta. Manter o menu completo acessível, com preços, disponibilidade, tempo e alergénios na fonte oficial. Não refazer carrinho ou pagamentos. |
| Café da manhã, almoço, dia todo, cafés e bolos | Navegação editorial com os nomes reais e fotos do menu. Priorizar Classic Club, Italian Job, granola, saladas, wraps e pastelaria. Café e bolos mantêm seu lugar na apresentação, sem inventar SKU online. |
| Grab & Go Meal Deal | House Sandwich com uma lata de Coca-Cola e um pacote de Keogh's; usar foto vinculada ao combo. A oferta vista online e a do [menu em PDF](https://www.mellonsshop.ie/_files/ugd/6b296e_6fb9cd21594a44d8b5d6f7fd1b765ff7.pdf) não têm a mesma composição/preço. Não misturar as duas. Deixar o valor atual no fluxo de pedido. |
| Catering | Preservar opções de breakfast e lunch, regras de antecedência e pagamento do [menu online](https://www.mellonsshop.ie/online-ordering). Mostrar travessas reais; orientar consulta de disponibilidade. Preservar também o PDF para consulta e impressão. |
| História | [Our Story](https://www.mellonsshop.ie/our-story): tradição familiar em Ringsend desde 1905, quatro gerações e a passagem de mercearia de bairro a deli. Usar foto verdadeira; recontar em inglês sem copiar os parágrafos. |
| Loja e vouchers | Acesso a [Irish Produce Shop](https://www.mellonsshop.ie/category/irish-produce-shop), [All Products](https://www.mellonsshop.ie/category/all-products) e [Physical Gift Card](https://www.mellonsshop.ie/product-page/physical-gift-card). Voucher para uso presencial; envio ou retirada conforme a página. Preservar print e produtos irlandeses; checkout permanece no catálogo original. |
| Contato | 56 South Lotts Road, Dublin 4, D04 K665 · [01 668 0166](tel:+35316680166) · [info@mellonsshop.ie](mailto:info@mellonsshop.ie). Horários publicados no site: seg.–qui. 7h–16h; sex. 7h–15h30; sábado e domingo fechados. Contato por telefone/e-mail e acesso ao formulário oficial na [homepage](https://www.mellonsshop.ie/). |
| Redes e app | [Instagram](https://www.instagram.com/mellonsshopdeli/) e [Facebook](https://www.facebook.com/MellonsShop/), links obtidos no site. Preservar o acesso secundário ao app Munchd ([iOS](https://apps.apple.com/us/app/munchd-online-food-ordering/id6504992687), [Android](https://play.google.com/store/apps/details?id=com.davydovconsulting.munchd)) sem competir com o pedido principal. Levar o visitante ao feed para promoções e novidades. Preservar o acesso à política de privacidade assim que o cliente fornecer o destino oficial: no rodapé atual o texto aparece sem link. |

Os horários de atendimento e os horários de pedido não são a mesma coisa. A consulta online indicava pedido de café da manhã até 11h15; o impresso descreve serviço de café da manhã até 11h30. Em produção, indicar o contexto e checar novamente no momento de publicar. Não usar preço ou condição de tempo da prévia gerada.

## Seleção de imagens reais

O recorte do hero recebe uma foto oficial em alta resolução. O restante usa originais, com permissão da empresa para a página final, e imagens fornecidas. As pranchas representam layout e enquadramento; seus pixels são de uma composição conceitual.

| Foto | Uso principal |
| --- | --- |
| [Classic Club](https://static.wixstatic.com/media/6b296e_d10f6495f9c54d87ac3cf3a4ddd62541~mv2.jpg) | Hero de mão e corte; pão e recheio em primeiro plano |
| [Italian Job](https://static.wixstatic.com/media/6b296e_5191a678a7b949de94a2772025804ce9~mv2.jpg) | Sanduíche em duas metades para visual de corte |
| [Greek Salad](https://static.wixstatic.com/media/6b296e_7cb9f7fbc8ca44c5ae3cb84026af93a1~mv2.jpg) | Bowl colorido no balcão |
| [Granola Protein Pot](https://static.wixstatic.com/media/6b296e_26f59ceade3c4aa9a345633ba04594e9~mv2.jpg) | Vista de cima para a passagem do café da manhã |
| [Pastry & Scone Platter](https://static.wixstatic.com/media/6b296e_ddff41a26a12489c80edfe741b5684d3~mv2.jpg) | Textura folhada no começo do dia e no catering |
| [Grab & Go](https://static.wixstatic.com/media/6b296e_4c4e55e44df44751b7e5914963f54f7d~mv2.jpeg) | Foto correspondente ao combo oficial |
| [Sandwich & Wrap Platter](https://static.wixstatic.com/media/6b296e_07e073608e6f49189be0aab6f0c3bf9e~mv2.jpg) | Panorama de catering |
| [Sweet Platter](https://static.wixstatic.com/media/6b296e_d86a3923d66841e595abb55562b80f43~mv2.jpg) | Detalhe de doce conforme a imagem associada pelo menu |
| Fotos fornecidas | Wrap cortado, bowls, bandejas de ingredientes, molhos e duas vistas da fachada. Usar cortes naturais para evitar a interface da captura; não atribuir o wrap ou bowl a um nome comercial sem confirmação. |
| [Fachada em alta resolução](https://static.wixstatic.com/media/6b296e_805c5af641b74b12809f2bb3a7925227~mv2.jpg) | Foto oficial da esquina, sem a interface da captura, para o capítulo de visita |

## Critério de aceite do próximo estágio

Modelo escolhido preservado; página em en-IE; fotos reais corretas em cada seção; links oficiais; pedido acessível desde o início; conteúdo legível com movimento reduzido; escala do hero estável nos cinco tamanhos; nenhuma oferta, ingrediente ou troca de fachada inventada. Validar visual, interações e arquivo final antes de entregar o kit.
