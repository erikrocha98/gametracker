# CAT-02 — Frontend: Tela de Detalhes do Jogo

## Contexto

A história **CAT-02** introduz uma tela onde o usuário visualiza todas as informações de um jogo específico. O backend desta mesma história (planejado em [plano-cat-02-backend-game-details.md](plano-cat-02-backend-game-details.md)) expõe `GET /games/{game_id}` retornando capa, descrição, data de lançamento, gêneros, plataformas, desenvolvedoras, screenshots e duas notas (`rawgRating` e `platformAverageRating`, esta sempre `null` por ora).

O frontend hoje tem:
- Busca de jogos no `Header` (`SearchDropdown` + `SearchResultItem`), onde clicar num resultado apenas fecha o dropdown.
- `CatalogPage` listando a coleção do usuário com `GameCard`s sem interação além do hover.

Nenhum dos dois leva a lugar nenhum. Este plano cria a tela de detalhes, define a rota `/games/:gameId`, e faz com que ambos os pontos de entrada (resultado da busca + card do catálogo) naveguem para ela.

**Decisões alinhadas com o usuário:**
1. Rota: `/games/:gameId` (espelha o caminho do endpoint da API).
2. Pontos de navegação: `SearchResultItem` **e** `GameCard`.
3. Nota da plataforma: bloco visível com texto **"Em breve"** (espaço já reservado no layout).

---

## Design da tela

Sem protótipo prévio. Layout proposto, todo em dark mode usando `colors.ts`, alinhado ao look-and-feel do catálogo:

```
┌───────────────────────────────────────────────────────────────┐
│ HEADER (já existente)                                         │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────┐   The Witcher 3: Wild Hunt                       │
│  │         │   2015 · CD Projekt Red                          │
│  │  COVER  │                                                  │
│  │  3:4    │   ┌──────────┐  ┌──────────┐                     │
│  │         │   │  RAWG    │  │Plataforma│                     │
│  │         │   │   4.6    │  │ Em breve │                     │
│  │         │   │  ★★★★★   │  │          │                     │
│  └─────────┘   └──────────┘  └──────────┘                     │
│                                                               │
│                [RPG] [Aventura] [Mundo aberto]                │
│                                                               │
│                Plataformas: PC, PS4, Xbox One, Switch         │
│                                                               │
│  ─────────────────────────────────────────────────────────    │
│                                                               │
│  Sobre                                                        │
│  Lorem ipsum dolor sit amet...                                │
│                                                               │
│  ─────────────────────────────────────────────────────────    │
│                                                               │
│  Screenshots                                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐                             │
│  │        │ │        │ │        │   (grid responsivo,         │
│  └────────┘ └────────┘ └────────┘    auto-fill 280px)         │
│  ┌────────┐ ┌────────┐ ┌────────┐                             │
│  │        │ │        │ │        │                             │
│  └────────┘ └────────┘ └────────┘                             │
└───────────────────────────────────────────────────────────────┘
```

- Topo em duas colunas (`grid-template-columns: 240px 1fr`, vira coluna única < 720px).
- Capa em 3:4, mesma proporção do `GameCard` para coerência visual.
- Duas "rating cards" lado a lado: mesmo container/borda do `EmptyState` (paper + borda sutil). O bloco da plataforma fica com texto secundário "Em breve" no lugar do número.
- Gêneros como `Chip`s do MUI (variant outlined, cor primária); plataformas como texto inline.
- Sem ações de catálogo/avaliação por ora — é uma tela read-only.

Estados:
- **Loading**: `CircularProgress` centralizado (mesmo padrão do `CatalogPage`).
- **Erro 502/503/genérico**: texto em `colors.error`, mesmo padrão do `CatalogCollection`.
- **404**: reutiliza `EmptyState` com mensagem específica (jogo não encontrado).

---

## Mudanças por camada

### 1. Tipos — [frontend/src/types/game.ts](../frontend/src/types/game.ts)

Adicionar interface espelhando `GameDetailResponse` do backend:

```ts
export interface GameDetailResponse {
  id: string
  name: string
  description: string | null
  releaseDate: string | null            // ISO date — frontend formata
  coverUrl: string | null
  genres: string[]
  platforms: string[]
  developers: string[]
  platformAverageRating: number | null  // sempre null por ora
  rawgRating: number | null
  screenshots: string[]
}

export type DetailsStatus = 'idle' | 'loading' | 'success' | 'not-found' | 'error'
```

### 2. Service — [frontend/src/services/games.ts](../frontend/src/services/games.ts)

Adicionar função simples ao módulo existente:

```ts
export function getGameDetails(gameId: string, signal?: AbortSignal): Promise<GameDetailResponse> {
  return http.get<GameDetailResponse>(`/games/${encodeURIComponent(gameId)}`, { signal })
}
```

O `http.ts` já lança a `Response` em erros não-2xx; a página vai inspecionar `err.status === 404` para distinguir `not-found` de erro genérico.

### 3. Hook — [frontend/src/hooks/useGameDetails.ts](../frontend/src/hooks/useGameDetails.ts) (novo)

Padrão simétrico ao [useGameSearch.ts](../frontend/src/hooks/useGameSearch.ts): controla `status`, `data`, faz `AbortController` no cleanup, distingue 404. Mantém a `GameDetailsPage` enxuta:

```ts
export function useGameDetails(gameId: string | undefined) {
  // returns: { status: DetailsStatus, data: GameDetailResponse | null, refetch: () => void }
}
```

### 4. Utils — [frontend/src/utils/game.ts](../frontend/src/utils/game.ts)

Adicionar:

```ts
export function formatReleaseDate(iso: string | null): string | null {
  // dd/MM/yyyy via Intl.DateTimeFormat('pt-BR'). null-safe.
}

export function formatRating(value: number | null): string {
  // 1 casa decimal ou '—'
}
```

`formatYear` continua sendo usado pelos cards.

### 5. Theme — [frontend/src/theme/colors.ts](../frontend/src/theme/colors.ts)

Reaproveita 100% dos tokens existentes. Nenhuma nova cor.

### 6. Textos — [frontend/src/constants/texts.ts](../frontend/src/constants/texts.ts)

Adicionar nova chave:

```ts
gameDetails: {
  ratingRawgLabel: 'RAWG',
  ratingPlatformLabel: 'Plataforma',
  ratingPlatformComingSoon: 'Em breve',
  aboutTitle: 'Sobre',
  noDescription: 'Sem descrição disponível.',
  screenshotsTitle: 'Screenshots',
  noScreenshots: 'Sem screenshots disponíveis.',
  developersLabel: 'Desenvolvedora',
  platformsLabel: 'Plataformas',
  releaseDateLabel: 'Lançamento',
  loadError: 'Não foi possível carregar os detalhes deste jogo.',
  notFoundTitle: 'Jogo não encontrado',
  notFoundDescription: 'Não conseguimos localizar este jogo.',
  retry: 'Tentar novamente',
}
```

### 7. Componentes novos

**Atomic Design** seguido estritamente. Cada arquivo no padrão `Component/Component.tsx` + `index.ts` re-exportando.

#### Atoms
Nenhum atom novo necessário. Reaproveita `Chip` direto do MUI (estilizado com `sx` mínimo só pra cor de borda).

**Ajuste em [frontend/src/components/atoms/GameCover/GameCover.tsx](../frontend/src/components/atoms/GameCover/GameCover.tsx)**: acrescentar entrada `lg: { width: '240px', height: '320px', iconSize: '48px' }` em `sizes` e atualizar o tipo de `size` para `'sm' | 'md' | 'lg'`. Evita duplicar o componente para a tela de detalhes.

#### Molecules

- **[frontend/src/components/molecules/RatingBadge/RatingBadge.tsx](../frontend/src/components/molecules/RatingBadge/RatingBadge.tsx)** (novo)
  - Props: `{ label: string; value: number | null; comingSoon?: boolean }`
  - Renderiza um card pequeno (paper + borda) com label no topo e número grande (ou "Em breve") abaixo.
  - Usado duas vezes na header do detail (RAWG e Plataforma).

#### Organisms

- **[frontend/src/components/organisms/GameDetailsHeader/GameDetailsHeader.tsx](../frontend/src/components/organisms/GameDetailsHeader/GameDetailsHeader.tsx)** (novo)
  - Props: `{ game: GameDetailResponse }`
  - Renderiza a parte superior: capa (`GameCover size="lg"`), nome (h1), meta inline (ano · desenvolvedores), duas `RatingBadge`s, chips de gêneros, linha de plataformas.

- **[frontend/src/components/organisms/GameDescription/GameDescription.tsx](../frontend/src/components/organisms/GameDescription/GameDescription.tsx)** (novo)
  - Props: `{ description: string | null }`
  - Seção "Sobre" com título + parágrafo. Fallback "Sem descrição disponível." quando `null`.

- **[frontend/src/components/organisms/GameScreenshots/GameScreenshots.tsx](../frontend/src/components/organisms/GameScreenshots/GameScreenshots.tsx)** (novo)
  - Props: `{ screenshots: string[] }`
  - Grid de imagens (`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`, gap 12px). Cada imagem em `aspect-ratio: 16/9`, `object-fit: cover`, border-radius 8px.
  - Estado vazio: mostra `texts.gameDetails.noScreenshots` em texto secundário (sem `EmptyState`, manter discreto).

#### Pages

- **[frontend/src/components/pages/GameDetailsPage/GameDetailsPage.tsx](../frontend/src/components/pages/GameDetailsPage/GameDetailsPage.tsx)** (novo)
  - Lê `gameId` via `useParams<{ gameId: string }>()`.
  - Chama `useGameDetails(gameId)`.
  - Renderiza por `status`:
    - `loading` → `CircularProgress` centralizado.
    - `error` → texto de erro + botão "Tentar novamente" (chama `refetch`).
    - `not-found` → `EmptyState` com `texts.gameDetails.notFoundTitle/Description`, ícone `SearchOff` ou `SportsEsports`.
    - `success` → `<GameDetailsHeader>` + `<GameDescription>` + `<GameScreenshots>`, separados por linhas divisórias sutis (`border-bottom: 1px solid ${colors.headerBorder}`).
  - Container: mesma `max-width: 1200px` já provida pelo `MainTemplate`, então a página só adiciona `padding: 32px 0`.

### 8. Roteamento — [frontend/src/routes/AppRoutes.tsx](../frontend/src/routes/AppRoutes.tsx)

Adicionar rota protegida nova:

```tsx
<Route
  path="/games/:gameId"
  element={
    <ProtectedRoute>
      <MainTemplate>
        <GameDetailsPage />
      </MainTemplate>
    </ProtectedRoute>
  }
/>
```

Inserir antes da rota catch-all `*`.

### 9. Pontos de navegação

#### SearchResultItem — [frontend/src/components/molecules/SearchResultItem/SearchResultItem.tsx](../frontend/src/components/molecules/SearchResultItem/SearchResultItem.tsx)

Trocar o `<button>` por `<Link to={`/games/${result.id}`}>` do `react-router-dom`, mantendo a estilização atual (`as={Link}` no styled-component). O `onClick` prop continua sendo chamado (para fechar o dropdown via `closeSearch` do `Header`). Resultado: navegação acontece naturalmente, dropdown fecha como side-effect.

#### GameCard — [frontend/src/components/molecules/GameCard/GameCard.tsx](../frontend/src/components/molecules/GameCard/GameCard.tsx)

Envolver o `Card` num `Link to={`/games/${game.gameId}`}` (nota: `CollectionGame.gameId` é o id externo tipo `"rawg-3498"`, não o `id` numérico interno). Aplicar `text-decoration: none; color: inherit` no link. Manter `cursor: pointer` e o hover existente.

---

## Testes

Vitest + React Testing Library já estão configurados ([useGameSearch.test.ts](../frontend/src/hooks/useGameSearch.test.ts), [GameCard.test.tsx](../frontend/src/components/molecules/GameCard/GameCard.test.tsx)). Para cada componente novo, um teste cobrindo o comportamento essencial — conforme convenção do projeto (não cobertura total).

Arquivos a criar:
- `frontend/src/hooks/useGameDetails.test.ts` — happy path, 404, abort.
- `frontend/src/components/molecules/RatingBadge/RatingBadge.test.tsx` — renderiza valor; mostra "Em breve" quando `comingSoon`.
- `frontend/src/components/organisms/GameDetailsHeader/GameDetailsHeader.test.tsx` — renderiza nome, capa, gêneros, ambas as ratings.
- `frontend/src/components/organisms/GameScreenshots/GameScreenshots.test.tsx` — renderiza N imagens; fallback quando vazio.
- `frontend/src/components/pages/GameDetailsPage/GameDetailsPage.test.tsx` — loading, success, 404 → empty state, retry após erro. Usa `MemoryRouter` + mock do `useGameDetails`.

Ajustes em testes existentes:
- `GameCard.test.tsx` — adicionar verificação de que o card é um link para `/games/:gameId`.
- (Não há teste de `SearchResultItem` ainda; criar um curto só verificando o link gerado seria coerente, mas opcional.)

---

## Verificação end-to-end

1. **Backend rodando com CAT-02 implementado** (`uvicorn app.main:app --reload` + migration aplicada).
2. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
3. **Fluxo via busca**: logar → abrir busca no header → digitar "witcher" → clicar num resultado → URL muda para `/games/rawg-XXXX` → tela renderiza com capa, ratings, descrição e screenshots.
4. **Fluxo via catálogo**: voltar para `/` → clicar em qualquer `GameCard` → mesma tela carrega.
5. **Cache hit (verificar segunda visita)**: voltar e clicar de novo no mesmo jogo. A resposta deve ser instantânea (cache do backend) — não é checagem do frontend, mas confirma a integração.
6. **404**: acessar manualmente `http://localhost:5173/games/rawg-999999999` → `EmptyState` "Jogo não encontrado".
7. **Erro de rede**: parar o backend, recarregar a página → mensagem de erro + botão "Tentar novamente". Religar backend e clicar no botão → sucesso.
8. **Plataforma "Em breve"**: confirmar visualmente que o bloco aparece com o texto, mesmo o backend retornando `platformAverageRating: null`.
9. **Testes / lint / build**:
   ```bash
   cd frontend
   npx vitest run
   npm run lint
   npm run build
   ```

---

## Arquivos críticos (resumo)

| Camada | Caminho | Ação |
|---|---|---|
| Types | [frontend/src/types/game.ts](../frontend/src/types/game.ts) | adicionar `GameDetailResponse`, `DetailsStatus` |
| Service | [frontend/src/services/games.ts](../frontend/src/services/games.ts) | adicionar `getGameDetails` |
| Hook | [frontend/src/hooks/useGameDetails.ts](../frontend/src/hooks/useGameDetails.ts) | novo |
| Utils | [frontend/src/utils/game.ts](../frontend/src/utils/game.ts) | adicionar `formatReleaseDate`, `formatRating` |
| Texts | [frontend/src/constants/texts.ts](../frontend/src/constants/texts.ts) | adicionar bloco `gameDetails` |
| Atoms | [frontend/src/components/atoms/GameCover/GameCover.tsx](../frontend/src/components/atoms/GameCover/GameCover.tsx) | adicionar size `'lg'` |
| Molecules | [frontend/src/components/molecules/RatingBadge/](../frontend/src/components/molecules/) | novo |
| Molecules | [frontend/src/components/molecules/SearchResultItem/SearchResultItem.tsx](../frontend/src/components/molecules/SearchResultItem/SearchResultItem.tsx) | trocar `<button>` por `<Link>` |
| Molecules | [frontend/src/components/molecules/GameCard/GameCard.tsx](../frontend/src/components/molecules/GameCard/GameCard.tsx) | envolver em `<Link>` |
| Organisms | [frontend/src/components/organisms/GameDetailsHeader/](../frontend/src/components/organisms/) | novo |
| Organisms | [frontend/src/components/organisms/GameDescription/](../frontend/src/components/organisms/) | novo |
| Organisms | [frontend/src/components/organisms/GameScreenshots/](../frontend/src/components/organisms/) | novo |
| Pages | [frontend/src/components/pages/GameDetailsPage/](../frontend/src/components/pages/) | novo |
| Routes | [frontend/src/routes/AppRoutes.tsx](../frontend/src/routes/AppRoutes.tsx) | adicionar rota `/games/:gameId` |
| Tests | múltiplos | conforme seção "Testes" |

---

## Sugestão de commit (ao final)

`feat(games): add game details page wired from search and catalog`
