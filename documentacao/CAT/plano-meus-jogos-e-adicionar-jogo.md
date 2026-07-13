# Plano: Menu de usuário + tela "Meus jogos" + fluxo de adicionar/remover jogo (frontend)

## Contexto

A app já tem dois lugares onde o usuário deve poder **adicionar um jogo** à sua lista pessoal:

1. **Página de detalhes** ([GameDetailsHeader.tsx:103-109](frontend/src/components/organisms/GameDetailsHeader/GameDetailsHeader.tsx#L103-L109)) — botão "Quero jogar" renderizado, **sem handler** hoje.
2. **Box "Atividade recente"** ([CatalogCollection.tsx:77-85](frontend/src/components/organisms/CatalogCollection/CatalogCollection.tsx#L77-L85)) — botão "Adicionar" que aparece no empty state quando o filtro é `'added'`, com `onAction: () => {}` stub.

Vamos:
- **Conectar** os dois botões ao mesmo fluxo lógico (adicionar à "lista de querer jogar").
- O botão de detalhes faz a ação direta (o jogo já está identificado).
- O botão do box abre um **modal de busca**: o usuário digita, vê resultados, clica em um → adiciona.
- Criar a tela `/my-games` ("Meus jogos") que lista os jogos adicionados, com paginação (5/10/15/20 por página) e **botão de remover** em cada card.
- Criar **menu dropdown** de usuário no header (substituindo o link "Perfil"), com 4 itens: Perfil, Minhas listas, Meus jogos, Reviews. Logout fica como está (ícone separado).

Escopo: **frontend somente**. As funções `addToWantToPlay` / `removeFromWantToPlay` em `services/games.ts` farão chamadas HTTP reais para endpoints que **ainda não existem no backend** — vão retornar 404 até o backend ser implementado. Isso é aceito ("primeiro frontend"). Quando o backend chegar, nenhum ajuste no frontend é necessário. Dados de `/my-games` continuam vindo de `getCollection()` (hoje retorna `items: []`).

---

## 1. Menu de usuário no header

### Nova molécula `UserMenu` (`frontend/src/components/molecules/UserMenu/`)

Padrão custom (não MUI Menu) seguindo o idiom de [SearchDropdown.tsx](frontend/src/components/organisms/SearchDropdown/SearchDropdown.tsx) — wrapper com `ref`, painel absoluto, click-outside via `document.mousedown`.

**Props:** `{ username: string }`.

**Gatilho:** `<button>` styled — `PermIdentityOutlinedIcon` (~20px) + `username` na mesma tipografia do `NavLink` (`0.875rem`, `500`). `aria-haspopup="menu"`, `aria-expanded`.

**Painel:** `position: absolute; top: calc(100% + 8px); right: 0; min-width: 200px;` com `background: colors.backgroundPaper`, borda `colors.inputBorder`, `border-radius: 8px`, `z-index: 100`. Itens são `<Link>` (react-router) estilizados (`padding: 10px 12px`, hover `colors.cardHover`), na ordem: **Perfil / Minhas listas / Meus jogos / Reviews**. Textos vêm de `texts.header.userMenu.*`. Clique em item fecha; clique fora também.

### Alterações no Header

[Header.tsx](frontend/src/components/organisms/Header/Header.tsx):
- Trocar o `<NavLink to="/profile">{texts.header.navProfile}</NavLink>` (linha 150) por `<UserMenu username={user?.username ?? ''} />`.
- Importar `useAuth` (de `contexts/AuthContext`) — o Header ainda não consome.
- `IconButton` de logout fica **inalterado**.

---

## 2. Modal de adicionar jogo

### Novo organism `AddGameModal` (`frontend/src/components/organisms/AddGameModal/`)

Reusa MUI `Dialog` (mesmo idiom de [FeedbackModal.tsx](frontend/src/components/molecules/FeedbackModal/FeedbackModal.tsx)).

**Props:**
```ts
interface AddGameModalProps {
  open: boolean
  onClose: () => void
  onAdded?: () => void
}
```

**Composição:**
- `<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>`.
- Título em `Typography` (`texts.addGame.modalTitle = 'Adicionar um jogo'`).
- `SearchBar` (molecule existente) controlado por estado local `query`.
- `useGameSearch(query)` retorna `{ status, results }`.
- Estados visuais (loading / empty / error) seguem o padrão de [SearchDropdown.tsx:52-79](frontend/src/components/organisms/SearchDropdown/SearchDropdown.tsx#L52-L79) — textos já existem em `texts.search.*`.
- Lista de resultados renderizada inline (não usa o `SearchDropdown` direto porque ele é absolute/anchored).

### Nova molécula `SelectableGameItem` (`frontend/src/components/molecules/SelectableGameItem/`)

Existe hoje [SearchResultItem.tsx](frontend/src/components/molecules/SearchResultItem/SearchResultItem.tsx) que renderiza um `<Link>` navegando pra detalhes. Para o modal, precisamos do mesmo visual mas com `onClick` em vez de navegação. Para não acoplar dois comportamentos numa molécula só, criar uma irmã:

**Props:** `{ result: GameSearchResult; onClick: () => void }`. Estrutura visual idêntica ao `SearchResultItem`, mas como `<button>`. Reusa o mesmo `GameCover` e tipografia.

**Comportamento no modal:** ao clicar num item, chama `addToWantToPlay(result.id)`. Em sucesso: fecha o modal, dispara `onAdded?()`, exibe `FeedbackModal` (sucesso é responsabilidade do parent). Em erro: exibe `FeedbackModal` (erro).

### Wiring na CatalogCollection

[CatalogCollection.tsx](frontend/src/components/organisms/CatalogCollection/CatalogCollection.tsx):
- Adicionar estado `const [addOpen, setAddOpen] = useState(false)`.
- Trocar `onAction={filter === 'added' ? () => {} : undefined}` por `onAction={filter === 'added' ? () => setAddOpen(true) : undefined}`.
- Renderizar `<AddGameModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={onItemAdded} />` no final.
- Aceitar nova prop opcional `onItemAdded?: () => void` para que `CatalogPage` rebusque `getCollection()` após sucesso.

[CatalogPage.tsx](frontend/src/components/pages/CatalogPage/CatalogPage.tsx):
- Implementar `handleItemAdded` que re-chama `getCollection()` e atualiza `items`.
- Passar `onItemAdded={handleItemAdded}` para `<CatalogCollection>`.

---

## 3. Botão "Quero jogar" na página de detalhes

[GameDetailsHeader.tsx](frontend/src/components/organisms/GameDetailsHeader/GameDetailsHeader.tsx):
- O botão na linha 103 não tem `onClick`. Adicionar:
  - Novas props no organism: `onAddToWantToPlay: () => void`, `addLoading: boolean`, `added: boolean`.
  - Botão usa essas props: `disabled={addLoading || added}`, `startIcon={addLoading ? <CircularProgress size={16}/> : <AddIcon/>}`, label muda para `texts.gameDetails.addedToWantToPlay = "Adicionado"` quando `added`.
- Fetch e estado ficam no `GameDetailsPage` (mantém organism puro):

[GameDetailsPage.tsx](frontend/src/components/pages/GameDetailsPage/GameDetailsPage.tsx):
- Estados novos: `addLoading: boolean`, `added: boolean`, `feedback: { type, message, open }`.
- Handler `handleAddToWantToPlay`: chama `addToWantToPlay(gameId)`; em sucesso seta `added=true` e mostra `FeedbackModal` de sucesso; em erro mostra `FeedbackModal` de erro.
- Renderiza `<FeedbackModal>` controlado pelo estado.

---

## 4. Tela "Meus jogos" (`/my-games`)

### Page `MyGamesPage` (`frontend/src/components/pages/MyGamesPage/`)

Análoga a [CatalogPage.tsx](frontend/src/components/pages/CatalogPage/CatalogPage.tsx):
- Chama `getCollection()` no mount.
- Mantém: `items: CollectionGame[]`, `loading`, `error`, `pageSize` (default `10`), `page` (default `1`), estado de `feedback`.
- `pagedItems` computado via slice em `useMemo`.
- Cabeçalho com `Typography h4` ("Meus jogos") — `texts.myGames.pageTitle`.
- Renderiza `<MyGamesGrid items={pagedItems} loading={loading} error={error} onRemove={handleRemove} />`.
- Renderiza `<PaginationControls />` quando `items.length > pageSize`.
- `handleRemove(gameId)`: chama `removeFromWantToPlay(gameId)`; em sucesso remove localmente do `items`; em erro mostra `FeedbackModal`.

### Organism `MyGamesGrid` (`frontend/src/components/organisms/MyGamesGrid/`)

- Grid idêntico ao de `CatalogCollection` (`repeat(auto-fill, minmax(160px, 1fr))`, `gap: 16px`).
- Loading: `CircularProgress`.
- Error: `Typography` com `texts.myGames.loadError`.
- Empty: `EmptyState` (sem botão).
- Para cada item: `<GameCard game={item} onRemove={() => onRemove(item.gameId)} />`.

### Modificação no `GameCard` para suportar remoção

[GameCard.tsx](frontend/src/components/molecules/GameCard/GameCard.tsx):
- Adicionar prop opcional `onRemove?: () => void`.
- Quando presente, renderizar pequeno `IconButton` (`DeleteOutlineIcon`) **sobreposto** no canto superior direito do `CoverWrapper` (`position: absolute; top: 8px; right: 8px;`). O botão fica **fora** do `Link`, então `onClick` precisa de `event.preventDefault()` + `event.stopPropagation()` para impedir navegação.
- Estilo: fundo translúcido — adicionar token `colors.overlayCardAction` em [theme/colors.ts](frontend/src/theme/colors.ts) (ex.: `'rgba(19, 20, 24, 0.85)'`); `color: colors.textPrimary`; hover muda `color` para `colors.error`.
- `aria-label` vem de `texts.myGames.removeAriaLabel`.
- **Sem confirmação** — clique direto remove. Erro mostra feedback. Re-adicionar é trivial.

### Molécula `PaginationControls` (`frontend/src/components/molecules/PaginationControls/`)

**Props:**
```ts
interface PaginationControlsProps {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}
```

**UI:** flex horizontal, `justify-content: space-between`, `margin-top: 24px`.
- **Esquerda:** label `texts.myGames.perPageLabel` + `ToggleButtonGroup` com 4 botões (`5 / 10 / 15 / 20`). Item selecionado: bg `colors.primary`, texto `colors.buttonPrimaryText`.
- **Direita:** MUI `Pagination` com `count = Math.ceil(totalItems / pageSize)`. Customização via `sx` para combinar com tema escuro (texto `colors.textSecondary`, `Mui-selected` em `colors.primary`).
- O handler `onPageSizeChange` no parent **reseta `page` para 1** quando o tamanho muda.

### Rotas

[AppRoutes.tsx](frontend/src/routes/AppRoutes.tsx):
- Adicionar (protegidas, dentro de `MainTemplate`):
  - `/my-games` → `MyGamesPage`
  - `/my-lists` → `ComingSoonPage`
  - `/reviews` → `ComingSoonPage`
- `/profile` permanece (já aponta para `ComingSoonPage`).

---

## 5. Serviços HTTP (frontend)

[services/games.ts](frontend/src/services/games.ts) — adicionar:
```ts
export function addToWantToPlay(gameId: string): Promise<void> {
  return http.post<void>('/games/want-to-play', { gameId })
}

export function removeFromWantToPlay(gameId: string): Promise<void> {
  return http.delete<void>(`/games/want-to-play/${encodeURIComponent(gameId)}`)
}
```

[services/http.ts](frontend/src/services/http.ts) — adicionar método `delete`:
```ts
export const http = {
  get: ...,
  post: ...,
  delete: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { method: 'DELETE', ...init }),
}
```

Esses endpoints **não existem no backend ainda**. Quando o backend não responder, o catch dos handlers exibirá `FeedbackModal` de erro. Isso é esperado até o backend chegar.

---

## 6. Textos novos em `frontend/src/constants/texts.ts`

- **`header.userMenu`** — `{ profile, myLists, myGames, reviews }`. **Remover** `header.navProfile` (não usado mais).
- **Novo bloco `addGame`**: `{ modalTitle, searchPlaceholder, successMessage, errorMessage }`.
- **Novo bloco `myGames`**: `{ pageTitle, emptyTitle, emptyDescription, loadError, perPageLabel, removeAriaLabel, removeSuccessMessage, removeErrorMessage }`.
- **Em `gameDetails`**: adicionar `addedToWantToPlay`, `addToWantToPlaySuccess`, `addToWantToPlayError`.

---

## 7. Resumo dos arquivos

### Novos
- `frontend/src/components/molecules/UserMenu/{UserMenu.tsx,index.ts,UserMenu.test.tsx}`
- `frontend/src/components/molecules/SelectableGameItem/{SelectableGameItem.tsx,index.ts,SelectableGameItem.test.tsx}`
- `frontend/src/components/molecules/PaginationControls/{PaginationControls.tsx,index.ts,PaginationControls.test.tsx}`
- `frontend/src/components/organisms/AddGameModal/{AddGameModal.tsx,index.ts,AddGameModal.test.tsx}`
- `frontend/src/components/organisms/MyGamesGrid/{MyGamesGrid.tsx,index.ts,MyGamesGrid.test.tsx}`
- `frontend/src/components/pages/MyGamesPage/{MyGamesPage.tsx,index.ts,MyGamesPage.test.tsx}`

### Modificados
- `frontend/src/components/organisms/Header/Header.tsx` — troca NavLink Perfil por `UserMenu`; usa `useAuth()`.
- `frontend/src/components/organisms/CatalogCollection/CatalogCollection.tsx` — abre `AddGameModal` no `onAction`; aceita prop `onItemAdded`.
- `frontend/src/components/pages/CatalogPage/CatalogPage.tsx` — implementa `onItemAdded` que rebusca `getCollection()`.
- `frontend/src/components/organisms/GameDetailsHeader/GameDetailsHeader.tsx` — botão "Quero jogar" com `onAddToWantToPlay`, `addLoading`, `added`.
- `frontend/src/components/pages/GameDetailsPage/GameDetailsPage.tsx` — estado e fetch da adição + `FeedbackModal`.
- `frontend/src/components/molecules/GameCard/GameCard.tsx` — prop opcional `onRemove` com botão sobreposto.
- `frontend/src/services/games.ts` — `addToWantToPlay`, `removeFromWantToPlay`.
- `frontend/src/services/http.ts` — método `delete`.
- `frontend/src/routes/AppRoutes.tsx` — rotas `/my-games`, `/my-lists`, `/reviews`.
- `frontend/src/constants/texts.ts` — blocos novos e remoção de `header.navProfile`.
- `frontend/src/theme/colors.ts` — token `overlayCardAction`.

### Reusados (zero duplicação)
- `GameCard` molecule (estendido com `onRemove`).
- `EmptyState` molecule.
- `SearchBar` molecule (dentro do `AddGameModal`).
- `useGameSearch` hook.
- `FeedbackModal` molecule (para sucessos/erros).
- `getCollection()` em services.

---

## 8. Convenções respeitadas

- Textos sempre via `texts.ts`.
- Cores via `colors.*`.
- Identifiers em inglês; rotas em inglês.
- Cada componente novo com teste mínimo.
- Atomic Design: dropdown e card-item-clicável são moléculas; modal e grid são organisms; tela é page.

---

## 9. Verificação

1. `cd frontend && npm run dev`, autenticado em `http://localhost:5173/`.
2. **Header dropdown**: clicar no nome → menu abre com 4 itens; ícone `PermIdentity` à esquerda do nome; fecha ao clicar fora.
3. **Navegação**: `/my-games` mostra a nova página (empty state, pois `getCollection()` retorna vazio). `/my-lists`, `/reviews`, `/profile` mostram `ComingSoonPage`.
4. **Adicionar via box vazio**: na home com filtro "Jogos adicionados" e empty state, clicar "Adicionar" abre o modal. Digitar nome → ver resultados. Clicar num resultado → modal fecha, `FeedbackModal` de erro aparece (esperado até backend existir).
5. **Adicionar via página de detalhes**: clicar "Quero jogar" → durante a chamada, botão fica em loading; `FeedbackModal` de erro aparece (esperado).
6. **Remover**: simular `items` injetados no `MyGamesPage` (ou alterar temporariamente o stub de `getCollection`) → botão de remover no canto do card aparece; clique chama service e mostra feedback.
7. **Paginação**: com items injetados (>20), trocar `pageSize` reseta para página 1; navegação numérica funciona; some quando `totalItems <= pageSize`.
8. `npm run build` (typecheck) e `npm run lint`.
9. Rodar testes — todos os componentes novos têm cobertura mínima.

---

## 10. Sugestões de commit

- `feat(header): replace profile link with user dropdown menu`
- `feat(add-game): add modal flow with search to add a game from empty state`
- `feat(game-details): wire add to want-to-play button`
- `feat(my-games): add my games page with pagination and remove action`
