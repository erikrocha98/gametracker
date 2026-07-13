# Plano: Lógica de filtros no box Atividade Recente (server-side)

## Contexto

O box "Atividade Recente" na `CatalogPage` exibe três abas — **Jogos adicionados**, **Finalizados** e **Reviews** — mas trocar de aba não altera os itens exibidos. Isso acontece porque:

1. A tabela `user_games` no banco não possui campo `status`: todo jogo adicionado fica sem distinção de estado.
2. A `CatalogCollection` guarda o estado do filtro (`filter`), mas não o aplica à lista de itens.
3. Não existe nenhum conceito de "finalizado" ou "review" no domínio ainda.

---

## Diagnóstico — onde está o buraco

| Camada | Problema atual |
|--------|----------------|
| DB (`user_games`) | Sem coluna `status`; todo registro é implicitamente "adicionado" |
| Entidade `UserGame` | Sem campo `status` |
| Repositório `list_by_user` | Retorna todos os registros sem distinção, sem aceitar filtro |
| Use case `GetUserCollectionUseCase` | Não recebe filtro de status |
| Endpoint `GET /games/collection` | Não aceita query param de status |
| `CatalogPage` | Busca a coleção uma única vez, sem reagir à aba |
| `CatalogCollection` | Armazena o filtro mas não dispara nova busca |

---

## Decisão de design

Adicionar um campo `status` em `user_games` com dois valores por enquanto:

- `want_to_play` — jogo adicionado (comportamento atual de `/games/want-to-play`)
- `finished` — jogo marcado como finalizado (novo estado)

A filtragem será **server-side**: o endpoint `GET /games/collection` passa a aceitar um query param opcional `status`, e o repositório aplica o filtro diretamente na query SQL (`WHERE status = :status`). O frontend refaz a requisição ao trocar de aba, enviando o status correspondente.

Vantagens dessa abordagem:
- O backend nunca devolve mais dados do que a aba precisa.
- O banco faz o trabalho de filtragem (e pode ser indexado no futuro).
- A regra de "o que conta como finalizado/adicionado" fica num único lugar (servidor), não duplicada no cliente.

A aba **Reviews** ficará vazia por enquanto (o sistema de reviews é uma feature futura). Como não há status correspondente, o frontend **não dispara requisição** nessa aba — apenas exibe o empty state. Quando reviews existir, será uma query/endpoint próprio.

> Observação: como a filtragem é server-side, o campo `status` **não** precisa ser exposto na resposta da API nem no tipo TS — o frontend já sabe qual aba pediu. O `status` vive apenas no banco, no model e na entidade de domínio.

---

## Escopo desta implementação

- ✅ Backend: adicionar `status` ao banco, model e entidade; aceitar filtro no repositório, use case e endpoint
- ✅ Frontend: enviar `status` na requisição e refetch ao trocar de aba
- ❌ Fora de escopo: endpoint/UI para marcar um jogo como finalizado (será uma feature separada — por ora a aba "Finalizados" retorna lista vazia e mostra empty state correto)
- ❌ Fora de escopo: sistema de reviews

---

## Plano de execução

### Backend

#### Passo 1 — Migration: adicionar coluna `status` em `user_games`

Novo arquivo `alembic/versions/<hash>_add_status_to_user_games.py`:

```python
def upgrade():
    op.execute("CREATE TYPE user_game_status AS ENUM ('want_to_play', 'finished')")
    op.add_column(
        "user_games",
        sa.Column(
            "status",
            sa.Enum("want_to_play", "finished", name="user_game_status"),
            nullable=False,
            server_default="want_to_play",
        ),
    )

def downgrade():
    op.drop_column("user_games", "status")
    op.execute("DROP TYPE user_game_status")
```

O `server_default="want_to_play"` garante que registros já existentes recebam o valor correto sem migração de dados extra.

---

#### Passo 2 — `UserGameModel`: adicionar campo `status`

Arquivo: `backend/app/modules/games/infrastructure/user_game_model.py`

```python
import enum
from sqlalchemy import Enum as SAEnum

class UserGameStatus(enum.Enum):
    want_to_play = "want_to_play"
    finished = "finished"

# na classe UserGameModel:
status: Mapped[UserGameStatus] = mapped_column(
    SAEnum(UserGameStatus, name="user_game_status"),
    nullable=False,
    default=UserGameStatus.want_to_play,
)
```

---

#### Passo 3 — Entidade `UserGame` + enum de domínio

Arquivo: `backend/app/modules/games/domain/entities.py`

```python
from enum import Enum

class UserGameStatus(Enum):
    want_to_play = "want_to_play"
    finished = "finished"

@dataclass
class UserGame:
    # campos existentes...
    status: UserGameStatus  # novo
```

O enum de domínio é a fonte de verdade do filtro. O `_hydrate` (passo 5) converte o enum do ORM para este enum.

---

#### Passo 4 — Repositório: `list_by_user` aceita filtro de status

Arquivo: `backend/app/modules/games/infrastructure/sqlalchemy_user_game_repository.py`

A query passa a aplicar o `WHERE` quando um status é informado. Sem status, retorna tudo (comportamento usado por `MyGamesPage`):

```python
from app.modules.games.domain.entities import UserGame, UserGameStatus

def list_by_user(
    self, user_id: int, status: UserGameStatus | None = None
) -> list[UserGame]:
    query = self._session.query(UserGameModel).filter_by(user_id=user_id)
    if status is not None:
        query = query.filter(UserGameModel.status == UserGameModelStatus(status.value))
    rows = query.order_by(UserGameModel.added_at.desc()).all()
    return [self._hydrate(r) for r in rows]
```

E o `_hydrate` propaga o status para a entidade:

```python
def _hydrate(self, row: UserGameModel) -> UserGame:
    # ... campos existentes ...
    return UserGame(
        # ... campos existentes ...
        status=UserGameStatus(row.status.value),
    )
```

> Nota: o enum do ORM (`UserGameModelStatus`, definido no model) e o de domínio (`UserGameStatus`, definido na entidade) têm os mesmos valores; o repositório é o ponto de tradução entre eles.

---

#### Passo 5 — Interface `UserGameRepository`: refletir a nova assinatura

Arquivo: `backend/app/modules/games/domain/repositories.py`

```python
class UserGameRepository(Protocol):
    # ...
    def list_by_user(
        self, user_id: int, status: UserGameStatus | None = None
    ) -> list[UserGame]: ...
```

---

#### Passo 6 — Use case: `GetUserCollectionUseCase` repassa o filtro

Arquivo: `backend/app/modules/games/application/get_user_collection.py`

```python
def execute(
    self, user_id: int, status: UserGameStatus | None = None
) -> list[UserGame]:
    return self._repository.list_by_user(user_id, status)
```

---

#### Passo 7 — Endpoint `GET /games/collection`: aceitar query param `status`

Arquivo: `backend/app/modules/games/api/controllers.py`

O endpoint recebe um `status` opcional, valida contra os valores permitidos e converte para o enum de domínio antes de chamar o use case:

```python
from app.modules.games.domain.entities import UserGameStatus

@router.get("/collection", response_model=CollectionResponse, response_model_by_alias=True)
def get_collection(
    status: UserGameStatus | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    use_case: GetUserCollectionUseCase = Depends(get_user_collection_use_case),
):
    items = use_case.execute(current_user.id, status)
    return CollectionResponse(items=[_to_collection_response(i) for i in items])
```

Usar `UserGameStatus` como tipo do `Query` faz o FastAPI validar automaticamente: um valor fora de `want_to_play`/`finished` retorna **422** sem tocar no use case.

> O schema `CollectionGameResponse` e o `_to_collection_response` **não mudam** — o `status` não é exposto na resposta.

---

#### Passo 8 — Testes de backend

- Atualizar os fakes/in-memory de `UserGameRepository` para armazenar `status` e respeitar o filtro em `list_by_user`.
- Atualizar os testes existentes que criam `UserGame` para incluir o campo `status`.
- Novos casos no use case `GetUserCollectionUseCase`:
  - sem `status` → retorna todos os itens
  - `status=finished` → retorna apenas finalizados
  - `status=want_to_play` → retorna apenas adicionados

---

### Frontend

#### Passo 9 — Service `getCollection`: aceitar `status`

Arquivo: `src/services/games.ts`

```ts
export type CollectionStatus = 'want_to_play' | 'finished'

export function getCollection(status?: CollectionStatus): Promise<CollectionResponse> {
  const query = status ? `?status=${status}` : ''
  return http.get<CollectionResponse>(`/games/collection${query}`)
}
```

Sem argumento, mantém o comportamento atual (todos os itens) — `MyGamesPage` continua chamando `getCollection()` sem mudança.

---

#### Passo 10 — `CatalogPage`: subir o estado do filtro e refazer a busca

Arquivo: `src/components/pages/CatalogPage/CatalogPage.tsx`

A `CatalogPage` passa a ser dona da aba ativa e dispara a busca conforme ela muda. Mapeia a aba para o status e **não busca** na aba `reviews`:

```ts
const FILTER_TO_STATUS: Record<ActivityFilterValue, CollectionStatus | null> = {
  added: 'want_to_play',
  finished: 'finished',
  reviews: null,
}

const [filter, setFilter] = useState<ActivityFilterValue>('added')
// ...
useEffect(() => {
  const status = FILTER_TO_STATUS[filter]
  if (status === null) {
    setItems([])      // reviews: sem requisição
    setLoading(false)
    return
  }
  setLoading(true)
  getCollection(status)
    .then((data) => { setItems(data.items); setError(false) })
    .catch((err) => {
      if (err instanceof Response && err.status === 404) return
      setError(true)
    })
    .finally(() => setLoading(false))
}, [filter, refetchKey])
```

`filter` e `setFilter` são passados como props para `CatalogCollection`.

---

#### Passo 11 — `CatalogCollection`: virar controlada pelo filtro

Arquivo: `src/components/organisms/CatalogCollection/CatalogCollection.tsx`

- Receber `filter` e `onFilterChange` por props (remover o `useState` interno de `filter`).
- `ActivityFilters` passa a usar `value={filter}` e `onChange={onFilterChange}`.
- `items` já vem filtrado do servidor — a paginação, o contador (`items.length`) e o `pagedItems` continuam usando `items` direto, sem filtragem no cliente.
- Resetar a paginação para a página 1 quando o filtro mudar:

```ts
useEffect(() => { setPage(1) }, [filter])
```

- O empty state e o botão "adicionar" continuam condicionados a `filter === 'added'`.

---

#### Passo 12 — Testes de frontend

- Atualizar o mock de `getCollection` nos testes de `CatalogPage` para receber/ignorar o argumento `status`.
- Casos em `CatalogPage`:
  - trocar para a aba `finished` dispara `getCollection('finished')`
  - trocar para a aba `reviews` **não** chama o service e mostra empty state
  - aba `added` chama `getCollection('want_to_play')`
- `CatalogCollection`: garantir que `onFilterChange` é chamado ao clicar numa aba e que o contador reflete os `items` recebidos.

---

## Ordem de implementação recomendada

```
1.  Migration (passo 1)
2.  UserGameModel + enum do ORM (passo 2)
3.  Entidade UserGame + UserGameStatus (passo 3)
4.  Repositório list_by_user + _hydrate (passo 4)
5.  Interface UserGameRepository (passo 5)
6.  Use case GetUserCollectionUseCase (passo 6)
7.  Endpoint GET /games/collection (passo 7)
8.  Testes de backend (passo 8)
9.  Service getCollection (passo 9)
10. CatalogPage: filtro + refetch (passo 10)
11. CatalogCollection controlada (passo 11)
12. Testes de frontend (passo 12)
```

---

## O que NÃO muda

- O endpoint `/games/want-to-play` (POST) continua funcionando sem alteração — o `status` já recebe `want_to_play` como `server_default`.
- O schema `CollectionGameResponse` e o `_to_collection_response` permanecem iguais (status não é exposto na resposta).
- `MyGamesPage` continua chamando `getCollection()` sem status → recebe todos os itens, como hoje.
- A UI para marcar um jogo como "finalizado" não existe ainda — a aba "Finalizados" retornará lista vazia e mostrará o empty state correto.
- Nenhuma mudança de rotas ou autenticação.
