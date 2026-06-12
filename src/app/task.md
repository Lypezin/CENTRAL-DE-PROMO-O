# Tarefas - Tema Copa do Mundo no Hub e Páginas Internas 🏆⚽

## Infraestrutura
- `[x]` Criar tabela `configuracoes` no Supabase
- `[x]` Criar API route `/api/admin/configuracoes/route.ts` (GET/PUT)

## Componentes de Background
- `[x]` Criar `WorldCupBackground.tsx` (animações CSS puras)
- `[x]` Criar `DynamicBackground.tsx` (wrapper condicional)
- `[x]` Modificar `layout.tsx` (trocar LightningBackground por DynamicBackground)

## Admin Panel
- `[x]` Criar `SiteConfigPanel.tsx` (toggle de tema)
- `[x]` Modificar `admin/page.tsx` (integrar SiteConfigPanel)

## Estilos e Adaptações Visuais (Hub)
- `[x]` Modificar `globals.css` (variáveis Copa, keyframes, adaptações condicionais)
- `[x]` Modificar `HubContent.tsx` (adaptações visuais quando Copa ativo)

## Tema da Copa na Página de Detalhes da Promoção (/promo/[slug])
- `[x]` Criar `CopaThemeForcer.tsx` (componente cliente para forçar o tema Copa)
- `[x]` Modificar `DynamicBackground.tsx` (adicionar listener para force_theme_change)
- `[x]` Modificar `promo/[slug]/page.tsx` (adicionar CopaThemeForcer e classe .promo-page-copa)
- `[x]` Modificar `globals.css` (estilos escopados para cards, tabelas, filtros e pódios da Copa)

## Validação
- `[x]` Executar build de produção `npm run build` localmente ✅
- `[x]` Validar que não há erros de tipagem no TypeScript ou no build ✅
