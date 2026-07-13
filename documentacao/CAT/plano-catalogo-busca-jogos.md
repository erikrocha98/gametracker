# Plano — Frontend do Catálogo + Busca de Jogos (CAT-01)

## Context

A história **CAT-01** ("Como usuário, quero buscar jogos pelo nome para encontrar títulos
específicos") precisa de uma barra de busca acessível em qualquer página, com busca em
tempo real (debounce 300ms), resultados vindos de uma API externa (IGDB/RAWG) e exibição
de capa, nome, plataformas e ano por resultado.

Hoje o frontend só tem o fluxo de autenticação: a rota `/` renderiza uma `HomePage`
placeholder (saudação + botão sair) e **não existe nenhum header/layout compartilhado**.
O protótipo (`documentacao/catalogo_jogos.png`) mostra a página de Catálogo completa:
header global (logo + nav + busca), hero "Seu diário de jogos." e a seção "No catálogo"
com contador e estado vazio.

Decisões confirmadas com o usuário:
1. O endpoint de busca é **dependência do backend** — o backend será planejado e
   implementado primeiro. Este plano define o contrato esperado e marca como pré-requisito.
2. Os resultados da busca aparecem num **dropdown ancorado abaixo da barra de busca** no
   header global (funciona em qualquer página).
3. O escopo cobre a **página de Catálogo inteira**, incluindo o carregamento da coleção
   de jogos salvos do usuário (também dependente de endpoint de backend).

Resultado pretendido: substituir a `HomePage` placeholder pela `CatalogPage` real, com um
header global que hospeda a busca, mantendo os padrões de Atomic Design, tema e textos
centralizados do projeto.

## Dependências de Backend (PRÉ-REQUISITO — bloqueiam só a integração final)

Os componentes são 100% desenvolvíveis/testáveis com o service mockado; apenas o passo de
integração final depende destes endpoints. Consumidos via `http` (`src/services/http.ts`).

**A — Busca de jogos:** `GET /games/search?q={termo}` (auth por cookie)
```json
{ "results": [
  { "id": "rawg-3498", "name": "Grand Theft Auto V",
    "coverUrl": "https://.../cover.jpg" ,
    "platforms": ["PlayStation 5", "PC"], "releaseYear": 2013 }
] }
```
`coverUrl` e `releaseYear` podem ser `null`. O backend é o dono das credenciais
IGDB/RAWG e da normalização — a escolha do provider não afeta o frontend.

**B — Coleção do usuário:** `GET /games/collection` (auth por cookie)
```json
{ "items": [
  { "id": 12, "gameId": "rawg-3498", "name": "Grand Theft Auto V",
    "coverUrl": "https://.../cover.jpg",
    "platforms": ["PlayStation 5", "PC"], "releaseYear": 2013 }
] }
```

## Arquivos

### Novos
- `src/types/game.ts` — `GameSearchResult`, `GameSearchResponse`, `CollectionGame`, `CollectionResponse`, `SearchStatus`.
- `src/services/games.ts` — `searchGames(q, signal?)`, `getCollection()` (espelha `auth.ts`).
- `src/hooks/useDebounce.ts` — `useDebounce<T>(value, delayMs): T`.
- `src/hooks/useGameSearch.ts` — máquina de estado da busca (`idle|loading|success|empty|error`).
- `src/utils/game.ts` — `formatPlatforms()`, `formatYear()`.
- `src/components/atoms/GameCover/` — capa com fallback (placeholder via `SportsEsportsIcon`).
- `src/components/atoms/NavLink/` — link de navegação do header, com estado ativo.
- `src/components/molecules/SearchBar/` — input com ícone de busca + botão limpar (apresentacional).
- `src/components/molecules/SearchResultItem/` — linha do dropdown (capa/nome/plataformas/ano).
- `src/components/molecules/EmptyState/` — card de estado vazio reutilizável.
- `src/components/molecules/GameCard/` — card da grade da coleção.
- `src/components/organisms/SearchDropdown/` — painel flutuante com os estados da busca.
- `src/components/organisms/Header/` — header global (logo, nav, busca, sair).
- `src/components/organisms/CatalogHero/` — bloco hero (título + subtítulo).
- `src/components/organisms/CatalogCollection/` — seção "No catálogo" (contador + grade/vazio).
- `src/components/templates/MainTemplate/` — shell de páginas autenticadas (Header + `<main>`).
- `src/components/pages/CatalogPage/` — a página de Catálogo.
- `src/components/pages/ComingSoonPage/` — stub para `/adicionar` e `/perfil`.
- Cada componente acompanha `Component.test.tsx` + `index.ts` (convenção do projeto).

### Modificados
- `src/services/http.ts` — `get` passa a aceitar `init?: RequestInit` (encaminhar `AbortSignal`).
- `src/routes/AppRoutes.tsx` — `/` passa a renderizar `CatalogPage`; novas rotas `/adicionar` e `/perfil`.
- `src/theme/colors.ts` — novos tokens (ver abaixo).
- `src/constants/texts.ts` — novas chaves de copy (ver abaixo).

### Removidos
- `src/components/pages/HomePage/` (e seu teste) — substituída pela `CatalogPage`.

## Camada de dados

`http.ts`: estender `get` para `get: <T>(path, init?) => request<T>(path, { method:'GET', ...init })`
— mudança mínima que habilita cancelamento real de requisições obsoletas.

`games.ts` (espelha `auth.ts`):
```ts
export const searchGames = (q: string, signal?: AbortSignal): Promise<GameSearchResponse> =>
  http.get(`/games/search?q=${encodeURIComponent(q)}`, { signal })
export const getCollection = (): Promise<CollectionResponse> => http.get('/games/collection')
```

`useGameSearch(query)`: query vazia/em branco → `idle` (sem request); a cada mudança →
`loading` + `searchGames(query, signal)`; um `AbortController` por requisição, o cleanup do
efeito aborta a requisição anterior (evita resposta lenta antiga sobrescrever a nova);
sucesso → `success` ou `empty`; erro não-abort → `error`. O `Header` consome
`useDebounce(query, 300)` antes de passar para `useGameSearch`.

## Componente Header (núcleo da CAT-01)

`Header` (organism) compõe `Logo size="sm"`, três `NavLink` (Catálogo/Adicionar/Perfil),
`SearchBar`, `SearchDropdown` e `IconButton` de logout. Mantém:
`query` (input cru) → `useDebounce` → `useGameSearch` → `{status, results}`; `open` controla
o dropdown (abre no foco com query não-vazia; fecha em `Escape`, clique fora, seleção de
resultado e ao limpar). Logout reusa o padrão da `HomePage` (`logout()` + `navigate('/login')`).
Recomendado um `<header>` estilizado em vez de MUI `AppBar` (controle total de layout).

## Roteamento (`AppRoutes.tsx`)

- `/` (protegida) → `CatalogPage` dentro de `MainTemplate`.
- `/adicionar` e `/perfil` (protegidas) → `ComingSoonPage` dentro de `MainTemplate` —
  evita links mortos no header; as telas reais são histórias separadas.
- Mantém o catch-all `* → /`.

## Tokens de cor (`colors.ts`)

Adicionar apenas os efetivamente usados: `headerBackground`, `headerBorder`, `cardHover`,
`overlayScrim`, `placeholderBackground`. Reusar `primary`, `textSecondary`, `inputBorder`,
`backgroundPaper` onde couber. Nenhuma cor literal em componentes ou `theme.ts`.

## Textos (`texts.ts`)

- `header`: `navCatalog`, `navAdd`, `navProfile`, `logoutAriaLabel`, `searchPlaceholder` ("Buscar jogos..."), `searchClearAriaLabel`.
- `search`: `loading` ("Buscando..."), `noResults` ("Nenhum jogo encontrado."), `error`, `retry`.
- `catalog`: `heroTitle` ("Seu diário de jogos."), `heroSubtitle`, `sectionTitle` ("No catálogo"), `counterLabel` ("jogos"), `emptyTitle` ("Nenhum jogo ainda"), `emptyDescription`, `emptyAction` ("Adicionar jogo"), `loadError`.
- `comingSoon`: `title`, `description`.

## Estados da busca (renderizados pelo `SearchDropdown`)

`idle` (query vazia) não renderiza nada · `loading` → spinner + "Buscando..." ·
`success` → lista de `SearchResultItem` · `empty` → "Nenhum jogo encontrado." ·
`error` → mensagem + "Tentar novamente". Debounce de 300ms garante uma requisição por
termo estabilizado; `AbortController` descarta respostas obsoletas.

## Testes (Vitest + Testing Library, padrão `HomePage.test.tsx`)

`useDebounce`, `useGameSearch`, `games` service, `GameCover`, `NavLink`, `SearchBar`,
`SearchResultItem`, `EmptyState`, `GameCard`, `SearchDropdown`, `Header`, `CatalogHero`,
`CatalogCollection`, `MainTemplate`, `CatalogPage` — cada um cobrindo o comportamento
essencial (transições de estado, cliques, renderização condicional). `Header` e
`CatalogPage` usam `vi.mock` do service/`useGameSearch` e fake timers para o debounce.

## Ordem de implementação

1. Fundação: `types/game.ts`, tokens em `colors.ts`, chaves em `texts.ts`, `utils/game.ts`.
2. Dados: estender `http.ts`, `services/games.ts`, `useDebounce`, `useGameSearch` (+ testes).
3. Atoms: `GameCover`, `NavLink`.
4. Molecules: `SearchBar`, `SearchResultItem`, `EmptyState`, `GameCard`.
5. Organisms: `SearchDropdown` → `Header`; `CatalogHero`, `CatalogCollection`.
6. Template: `MainTemplate`. Page: `CatalogPage`, `ComingSoonPage`.
7. Roteamento: `AppRoutes.tsx`; remover `HomePage` + teste.
8. Integração: apontar o service para os endpoints reais quando o backend existir.

## Verificação

- `npm run lint` e `npm run build` sem erros; `npm test` com todos os testes verdes.
- Manual (`npm run dev`, backend no ar): login → cai no Catálogo (header, hero, seção
  "No catálogo"); coleção vazia → card de estado vazio com botão "Adicionar jogo"; digitar
  na busca → após ~300ms abre o dropdown com capa/nome/plataformas/ano; fecha em
  limpar/`Escape`/clique-fora; "Nenhum jogo encontrado" quando não há resultados; digitar
  rápido dispara uma única requisição (aba Network); busca funciona em qualquer rota;
  backend fora do ar → estados de erro na busca e no catálogo; logout redireciona p/ `/login`.
