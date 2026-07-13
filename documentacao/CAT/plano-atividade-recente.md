# Plano: Refatorar "Catálogo" → "Atividade Recente" (frontend)

## Contexto

A home hoje renderiza um box chamado **"No catálogo"** (organism `CatalogCollection`) que deveria listar a coleção de jogos do usuário. Porém o endpoint que alimenta esse box (`GET /games/collection`) está retornando array vazio e ainda não existem tabelas de coleção/reviews no backend.

Vamos reaproveitar esse mesmo box para virar um **feed de atividade recente**, com três filtros (jogos adicionados, finalizados, reviews). O escopo combinado é **somente frontend** — backend permanece retornando vazio, e cada filtro mostrará o mesmo empty state por enquanto. Quando o backend evoluir, a UI já estará pronta.

Mudanças visíveis ao usuário:
- Título da seção interna do box muda de **"No catálogo"** para **"ATIVIDADE RECENTE"**.
- Surgem três tabs de filtro abaixo do título: **Jogos adicionados / Finalizados / Reviews**.
- O botão **"Adicionar jogo"** do empty state é removido.
- O hero da página (`CatalogHero` com "Seu diário de jogos.") **não muda**.

---

## Arquivos a modificar

### 1. `frontend/src/constants/texts.ts` — bloco `catalog`

- `sectionTitle`: `'No catálogo'` → `'ATIVIDADE RECENTE'`
- Remover a chave `emptyAction` (o botão sai).
- Trocar `emptyTitle` / `emptyDescription` para cópia neutra de "sem atividade":
  - `emptyTitle: 'Nenhuma atividade ainda'`
  - `emptyDescription: 'Adicione, finalize ou avalie um jogo para começar.'`
- Manter `heroTitle`, `heroSubtitle`, `counterLabel`, `loadError` como estão.
- Adicionar sub-objeto `catalog.activityFilters` com os rótulos das tabs:
  ```ts
  activityFilters: {
    added: 'Jogos adicionados',
    finished: 'Finalizados',
    reviews: 'Reviews',
  }
  ```

### 2. Nova molécula: `frontend/src/components/molecules/ActivityFilters/`

Arquivos:
- `ActivityFilters.tsx`
- `index.ts` (re-export, seguindo o padrão de `AuthTabs/`)

Reusar o padrão visual de `AuthTabs.tsx` (MUI `Tabs` dentro de um `Wrapper` styled, indicador escondido, `Mui-selected` com fundo escuro).

```ts
export type ActivityFilterValue = 'added' | 'finished' | 'reviews'

interface ActivityFiltersProps {
  value: ActivityFilterValue
  onChange: (value: ActivityFilterValue) => void
}
```

Três `<Tab>` com `label` vindo de `texts.catalog.activityFilters`.

**Atenção a convenções do projeto:**
- Cor de fundo do wrapper: não usar literal `#1a1b21` (como faz `AuthTabs`). Reusar token de `src/theme/colors.ts` (ex.: `colors.backgroundPaper` ou equivalente). Se nenhum token servir, adicionar um novo token nomeado em `colors.ts` antes de usar.
- Texto dos labels: sempre via `texts.catalog.activityFilters`, nunca literal no JSX.

### 3. `frontend/src/components/organisms/CatalogCollection/CatalogCollection.tsx`

- Importar `ActivityFilters` e `ActivityFilterValue`.
- Adicionar estado local: `const [filter, setFilter] = useState<ActivityFilterValue>('added')`. O filtro fica local — não precisa subir pra `CatalogPage` enquanto a API estiver vazia.
- Renderizar `<ActivityFilters value={filter} onChange={setFilter} />` logo abaixo do `SectionHeader` e acima do bloco de loading.
- No `SectionHeader`, o título continua vindo de `texts.catalog.sectionTitle` (agora "ATIVIDADE RECENTE"). Manter o `Counter` à direita.
- Empty state: remover `actionLabel` e `onAction` da chamada de `<EmptyState>`.
- Remover o `import { useNavigate } from 'react-router-dom'` e a variável `navigate`.
- Não filtrar `items` por enquanto — backend sempre vazio.

### 4. Testes

- Atualizar/criar teste de `CatalogCollection` cobrindo: presença do título "ATIVIDADE RECENTE", presença das três tabs, ausência do botão "Adicionar jogo".
- Criar teste mínimo de `ActivityFilters`: render dos três rótulos + dispara `onChange` ao clicar.
- Se algum teste antigo referencia "No catálogo" ou "Adicionar jogo", ajustar.

---

## Arquivos que NÃO mudam

- `CatalogHero.tsx` — hero "Seu diário de jogos." fica intacto.
- `CatalogPage.tsx` — continua chamando `getCollection()` e passando `items` pro organism.
- `services/games.ts` e qualquer arquivo de backend — nenhuma alteração.
- `Header.tsx` — o link de navegação continua "Catálogo" (não estava no escopo do pedido).

---

## Verificação

1. `cd frontend && npm run dev`, abrir `http://localhost:5173/` autenticado.
2. Conferir no box: título "ATIVIDADE RECENTE", três tabs visíveis, sem botão "Adicionar jogo".
3. Clicar nas três tabs — a tab ativa muda de visual; o empty state continua o mesmo.
4. `npm run build` — checagem de tipos.
5. `npm run lint`.
6. Rodar a suíte de testes do frontend e validar os ajustes em `CatalogCollection` e `ActivityFilters`.

---

## Sugestão de commit

`refactor(catalog): replace catalog box with recent activity feed and filters`
