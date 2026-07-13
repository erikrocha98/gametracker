# Plano Frontend — INT-02: Escrever review sobre um jogo

## Contexto

Camada de UI da história INT-02 (o backend está em `plano-backend-int-02-review.md`). O usuário quer
escrever uma **review** (texto, até 5000 caracteres, com toggle de spoiler) sobre um jogo. A tela de
review é um **modal**, acionado a partir de:

- **Página de detalhes do jogo** — botão "Adicionar review" / "Editar review".
- **Tela "Meus jogos"** — cada card ganha um menu de **três pontinhos** (kebab) que substitui o ícone
  de lixeira atual.

Decisões de UX confirmadas com o usuário:
1. **Review só via modal** — a página de detalhes **não** renderiza a review inline; mostra apenas o
   botão. Todo o conteúdo (texto, data de criação, spoiler) aparece dentro do modal ao abrir. A "data
   de criação visível" é atendida exibindo `createdAt` no topo do modal quando já existe review.
2. **Spoiler: ocultar + "Mostrar spoiler"** — comportamento de blur/reveal escolhido para telas de
   **leitura** (listagens futuras: filtro "Reviews" do catálogo, perfil). No INT-02 o modal é apenas
   editor, então aqui o spoiler é o **toggle** que grava a flag; o componente de reveal fica registrado
   para a próxima história de leitura (não renderizado agora para não criar UI morta).
3. **Nota no card via popover** — o kebab dos três pontinhos **não** tem item "Dar nota". O popover
   exibe os **gamepads interativos** (`GamepadRating`) direto, para o usuário escolher a nota ali mesmo:
   sem nota → nova nota; com nota → edição; clicar na mesma nota → remove (estilo Letterboxd atual).
   O menu também tem "Adicionar review/Editar review" e "Remover".

Mantém os padrões do INT-01: `GamepadRating` (MUI Rating + `SportsEsportsIcon`), `FeedbackModal`,
tokens de `theme/colors.ts`, textos em `constants/texts.ts`, `styled-components`.

---

## 1. Camada de dados

**`types/game.ts`**:
```ts
export interface UserReview {
  text: string
  isSpoiler: boolean
  createdAt: string
  updatedAt: string
}
```
- `GameDetailResponse` — adicionar `userReview: UserReview | null`.

**`services/games.ts`** (espelha `rateGame`/`removeRating`; `http.put` já existe do INT-01):
```ts
export function writeReview(gameId: string, text: string, isSpoiler: boolean): Promise<UserReview> {
  return http.put<UserReview>(`/games/${encodeURIComponent(gameId)}/review`, { text, isSpoiler })
}
export function removeReview(gameId: string): Promise<void> {
  return http.delete<void>(`/games/${encodeURIComponent(gameId)}/review`)
}
```

**`constants/texts.ts`** — nova seção `review` (compartilhada pelo modal nas duas telas) + chaves nas
seções existentes:
```ts
review: {
  addTitle: 'Escrever review',
  editTitle: 'Editar review',
  placeholder: 'Compartilhe sua opinião sobre o jogo...',
  spoilerLabel: 'Contém spoiler',
  submit: 'Publicar',
  delete: 'Excluir review',
  createdAtPrefix: 'Criada em',
  loadError: 'Não foi possível carregar sua review.',
  success: 'Review publicada com sucesso!',
  error: 'Não foi possível publicar sua review. Tente novamente.',
  deletedSuccess: 'Review removida.',
  deleteError: 'Não foi possível remover sua review. Tente novamente.',
},
```
- `gameDetails` — `writeReviewButton: 'Adicionar review'`, `editReviewButton: 'Editar review'`.
- `myGames` — `menuAriaLabel: 'Opções do jogo'`, `menuAddReview: 'Adicionar review'`,
  `menuEditReview: 'Editar review'`, `menuRemove: 'Remover'`, `menuRatingLabel: 'Sua nota'`.
  (O contador de caracteres do textarea é `${n}/5000`, montado inline — número dinâmico, não é texto
  traduzível.)

---

## 2. Modal de review — `organisms/ReviewModal/` (novo)

Espelha o `AddGameModal` (organism que é **self-contained**: faz as chamadas de serviço e tem seu
próprio `FeedbackModal`). Arquivos: `ReviewModal.tsx`, `index.ts`, `ReviewModal.test.tsx`.

**Props:**
```ts
interface ReviewModalProps {
  open: boolean
  gameId: string
  initialReview?: UserReview | null   // se fornecido, evita o fetch (página de detalhes já tem)
  onClose: () => void
  onSaved?: (review: UserReview | null) => void  // null = excluída
}
```

**Comportamento:**
- Ao abrir: se `initialReview` veio por prop, usa-o; senão (caso "Meus jogos", que não carrega a review
  no `CollectionGame`) faz `getGameDetails(gameId)` e usa `userReview`, com spinner enquanto carrega
  (`texts.review.loadError` em falha). Centraliza a lógica no modal → comportamento idêntico nas duas
  telas.
- Estado do form: `text` (inicial = review?.text ?? ''), `isSpoiler` (inicial = review?.isSpoiler ?? false),
  `loading`. Resetar ao abrir/fechar.
- Layout (MUI `Dialog` + `DialogTitle` + `DialogContent`, `maxWidth="sm" fullWidth`):
  - Título: `addTitle` se não há review, `editTitle` caso contrário.
  - Se editando: linha discreta `texts.review.createdAtPrefix {data formatada}` usando o `createdAt`
    (formatar com util de data existente em `utils/game`; se necessário, criar `formatDateTime`).
    **Atende "data de criação visível".**
  - `TextField` multiline (rows ~6), `inputProps={{ maxLength: 5000 }}`, placeholder; contador
    `${text.length}/5000` abaixo (cor `textSecondary`, vira `error` se = 5000).
  - Toggle de spoiler: `FormControlLabel` + MUI `Switch`, label `spoilerLabel`.
  - Ações: botão `submit` (`variant="contained"`, desabilitado se `!text.trim()` ou `loading`); se
    editando, botão `delete` (texto/`color` de erro) que chama `removeReview`.
- Submit: `writeReview(gameId, text, isSpoiler)` → `onSaved?.(review)` → fecha → feedback de sucesso;
  catch → feedback de erro. Delete: `removeReview(gameId)` → `onSaved?.(null)` → fecha → feedback.
- Renderiza o próprio `<FeedbackModal>` (mesmo padrão do `AddGameModal`).

---

## 3. Menu kebab do card — `molecules/GameCardMenu/` (novo)

Substitui a lixeira do card. Arquivos: `GameCardMenu.tsx`, `index.ts`, `GameCardMenu.test.tsx`.
Como o popover contém um widget interativo (não só linhas de menu), usar **MUI `Popover`** (e não
`Menu`/`MenuItem`) ancorado a um `IconButton` com `MoreVertIcon`.

**Props:**
```ts
interface GameCardMenuProps {
  rating: number | null
  onRate: (value: number | null) => void
  onAddReview: () => void
  onRemove: () => void
}
```

**Layout do popover (conteúdo estilizado, paper escuro do tema):**
1. Bloco "Sua nota": label `myGames.menuRatingLabel` + `<GamepadRating value={rating} onChange={onRate} />`
   (interativo; escolher = nova/edita, mesma nota = remove).
2. Divisor.
3. Linha clicável `menuAddReview` → `onAddReview` (fecha o popover).
4. Linha clicável `menuRemove` (cor de erro no hover) → `onRemove`.

**Detalhes:**
- O `IconButton` (trigger) fica dentro do `Link` do card → `onClick` com `e.preventDefault()` +
  `e.stopPropagation()` (mesmo padrão da lixeira atual). O `Popover` renderiza em portal (fora do
  `Link`), então cliques nos gamepads/itens não disparam navegação.
- `aria-label={texts.myGames.menuAriaLabel}` no trigger.
- Estilo do botão reaproveita o visual do `RemoveButton` atual (posição `top/right: 8px`, fundo
  `overlayCardAction`, `color: textPrimary`).

---

## 4. Card e grid de "Meus jogos"

**`molecules/GameCard/GameCard.tsx`**:
- Remover o `RemoveButton` (lixeira/`DeleteOutlineIcon`).
- Trocar a prop `onRemove?` pelos handlers do menu:
  ```ts
  interface GameCardProps {
    game: CollectionGame
    onRemove?: () => void
    onRate?: (value: number | null) => void
    onAddReview?: () => void
  }
  ```
- Renderizar `<GameCardMenu>` no `CoverWrapper` **apenas quando** os handlers existem (presença de
  `onRemove`/`onRate`/`onAddReview`). Assim o **`CatalogCollection`**, que renderiza `GameCard` sem
  handlers, continua **sem** menu (comportamento atual preservado).
- Manter o `GamepadRating readOnly size="small"` na face do card quando `game.rating != null`.

**`organisms/MyGamesGrid/MyGamesGrid.tsx`** — repassar os novos handlers:
```ts
interface MyGamesGridProps {
  items: CollectionGame[]
  loading: boolean
  error: boolean
  onRemove: (gameId: string) => void
  onRate: (gameId: string, value: number | null) => void
  onAddReview: (game: CollectionGame) => void
}
```
No map: `onRemove={() => onRemove(game.gameId)}`, `onRate={(v) => onRate(game.gameId, v)}`,
`onAddReview={() => onAddReview(game)}`.

**`pages/MyGamesPage/MyGamesPage.tsx`**:
- `handleRemove` (existente, mantém).
- `handleRate(gameId, value)`: `value === null ? removeRating : rateGame`; ao concluir, atualizar
  `items` (setar `rating` do item) e disparar `FeedbackModal` (reusar mensagens de
  `texts.gameDetails.rateSuccess/ratingRemovedSuccess/rateError/removeRatingError`).
- `reviewTarget: CollectionGame | null` → `handleOpenReview(game)` abre o modal.
- Renderizar `<ReviewModal open={!!reviewTarget} gameId={reviewTarget?.gameId ?? ''}
  onClose={() => setReviewTarget(null)} onSaved={() => setReviewTarget(null)} />` (sem `initialReview`
  → o modal busca a review). Passar `onRate`/`onAddReview` ao `MyGamesGrid`.

---

## 5. Página de detalhes do jogo

**`organisms/GameDetailsHeader/GameDetailsHeader.tsx`** — novas props `userReview: UserReview | null`
e `onOpenReview: () => void`. Abaixo do bloco "Sua nota", adicionar um `Button`
(`variant="outlined"`, cor `primary`) com label `editReviewButton` se `userReview` existe, senão
`writeReviewButton`, chamando `onOpenReview`.

**`pages/GameDetailsPage/GameDetailsPage.tsx`** (espelha o override de rating já existente):
- Estado `reviewModalOpen` e `userReviewOverride: UserReview | null | undefined`; derivar
  `userReview = userReviewOverride !== undefined ? userReviewOverride : (data?.userReview ?? null)`.
- Passar `userReview` e `onOpenReview={() => setReviewModalOpen(true)}` ao header.
- Renderizar `<ReviewModal open={reviewModalOpen} gameId={gameId} initialReview={userReview}
  onClose={() => setReviewModalOpen(false)} onSaved={(r) => setUserReviewOverride(r)} />`.
  (Escrever review marca o jogo como finished/adicionado no backend; opcionalmente setar `added=true`
  no sucesso, como o `handleRate` faz.)

---

## 6. Arquivos afetados (resumo)

**Criar:** `components/organisms/ReviewModal/{ReviewModal.tsx,index.ts,ReviewModal.test.tsx}`,
`components/molecules/GameCardMenu/{GameCardMenu.tsx,index.ts,GameCardMenu.test.tsx}`.

**Modificar:** `types/game.ts`, `services/games.ts`, `constants/texts.ts`,
`components/molecules/GameCard/GameCard.tsx`, `components/organisms/MyGamesGrid/MyGamesGrid.tsx`,
`components/pages/MyGamesPage/MyGamesPage.tsx`,
`components/organisms/GameDetailsHeader/GameDetailsHeader.tsx`,
`components/pages/GameDetailsPage/GameDetailsPage.tsx`.
(`services/http.ts` já tem `put` — sem mudança.)

**Fora de escopo (registrado para história futura de leitura):** componente de spoiler com
blur/"Mostrar spoiler" e exibição de reviews em listagens (catálogo "Reviews", perfil).

---

## 7. Testes (Vitest + Testing Library)

Padrão de render: helper local envolvendo `MuiThemeProvider` + `StyledThemeProvider` com `theme`
(igual `GamepadRating.test.tsx`). Mockar serviços com `vi.mock('../../../services/games')`.

- **`ReviewModal.test.tsx`** — renderiza título add/edit; contador de caracteres; submit chama
  `writeReview` com `text`/`isSpoiler`; botão excluir (modo edição) chama `removeReview`; submit
  desabilitado com texto vazio.
- **`GameCardMenu.test.tsx`** — abre o popover no clique; renderiza `GamepadRating`; `onRate` ao
  selecionar nota; itens "Adicionar review" e "Remover" chamam os callbacks.
- Atualizar **`GameCard.test.tsx`** (lixeira removida → menu presente só com handlers),
  **`MyGamesGrid.test.tsx`** (novos handlers), **`GameDetailsHeader.test.tsx`** (botão de review),
  **`GameDetailsPage.test.tsx`** (abre o modal). Garantir que `CatalogCollection.test.tsx` segue
  passando (sem menu).

---

## 8. Verificação (comandos para o usuário rodar)

> O usuário roda lint/build/testes por conta própria.

```bash
cd frontend
npm run lint
npm run build      # type-check + bundle
npx vitest run
```

Checklist funcional (com backend INT-02 no ar):
1. Página do jogo → "Adicionar review" abre o modal; escrever texto + toggle spoiler + publicar →
   feedback de sucesso; reabrir mostra "Editar review", a data de criação e o texto.
2. Excluir review pelo modal → some; botão volta a "Adicionar review".
3. "Meus jogos": card tem três pontinhos (sem lixeira); abrir o popover → escolher nota nos gamepads
   atualiza o card; alterar e remover a nota funcionam.
4. Popover → "Adicionar review" abre o modal já com a review existente (busca via `getGameDetails`).
5. Popover → "Remover" remove o jogo (comportamento atual).
6. Catálogo (Atividade Recente) continua sem menu nos cards.

## Sugestão de commit
`feat(review): add review modal and game card kebab menu with inline rating`
