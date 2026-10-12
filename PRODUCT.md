# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Entregadores consultam campanhas, regras, premiações e sua posição no ranking.
- Gestores autenticados administram campanhas, importam dados operacionais e acompanham indicadores do site.

## Product Purpose

A Central de Promoções reúne campanhas de incentivo e os resultados importados da operação para que entregadores acompanhem sua participação e gestores mantenham campanhas e dados atualizados.

## Positioning

As campanhas e os rankings são calculados a partir dos dados operacionais importados e das regras configuradas para cada campanha.

## Operating Context

- O produto é um site responsivo usado em desktop e celular.
- Entregadores escolhem uma campanha, consultam o ranking por turno ou modalidade e podem pesquisar participantes.
- Gestores usam uma área autenticada para configurar campanhas, turnos e prêmios, importar planilhas `.xlsx`, revisar dados e consultar analytics.

## Capabilities and Constraints

- A interface pública inclui campanhas e a página ELITE.
- O estado de publicação da campanha é controlado manualmente; uma data final vencida não encerra a publicação automaticamente.
- ELITE permanece acessível mesmo quando ainda não há dados e precisa explicar como a base é carregada.
- No ranking público Faixa Preta, são necessários nome, praça, valor e prêmio; identificadores e linhas operacionais não são necessários.
- O login administrativo personalizado existente será mantido e fortalecido.
- O schema e as funções `xml_nfse` pertencem a outro projeto e não devem ser alterados.
- A linguagem visual aprovada para o redesenho é esportiva premium.

## Evidence on Hand

- O repositório contém os fluxos atuais de campanhas, ranking por turno, ELITE, administração, importação de planilhas e analytics.
- A base Supabase conectada contém campanhas e dados importados. Não há depoimentos, avaliações ou benchmarks aprovados para exibição.

## Product Principles

- Tornar campanhas, critérios e premiações fáceis de encontrar e entender.
- Apresentar resultados calculados sobre a base completa, sem sugerir precisão além dos dados disponíveis.
- Informar com clareza quando dados estão carregando, falharam ou ainda não foram importados.
- Limitar o acesso público aos dados necessários para acompanhar as campanhas.
