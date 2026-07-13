# Decisões de Projeto — playlogd

Documento consolidado das decisões técnicas e de produto tomadas até agora. Cada item registra **a escolha** e **a motivação**, para servir como referência rápida e evitar discussões repetidas. Atualize ao fechar uma nova decisão.

> Documentos relacionados:
> - [modelagem-banco-v1.md](modelagem-banco-v1.md) — esquema do banco.
> - Planos de história em [documentacao/plano-*.md](.).

---

## 1. Arquitetura geral

| Decisão | Motivação |
|---|---|
| **Monorepo com `backend/` e `frontend/` independentes.** | Permite versionar contrato e implementação juntos sem acoplamento de build. |
| **Backend Python (FastAPI) + Frontend React (Vite).** | Stack moderna, type-safe nos dois lados, comunidade ampla. |
| **CORS restrito a `http://localhost:5173`.** | Frontend e backend rodam em portas distintas; o navegador exige a liberação explícita. Em produção, será ajustado para o domínio real. |
| **Comunicação via REST + cookies.** | Sessão por cookie `httpOnly` (decisão de auth — ver §4); REST é suficiente para o produto, sem precisar de GraphQL/WS nesta fase. |

## 2. Backend — padrões e convenções

| Decisão | Motivação |
|---|---|
| **Clean Architecture + arquitetura modular** (`modules/<dominio>/{domain,application,api,infrastructure}`). | Inverte dependências (infra depende de domínio, nunca o contrário). Cada módulo é autocontido — não há imports cruzados entre módulos. |
| **Nomes em inglês** (identificadores, arquivos, rotas). | Padrão de mercado; evita misturar idioma com termos técnicos. |
| **Pastas `application/` e `api/`** em vez de `use_cases/` / `interfaces/` do CLAUDE.md original. | Convenção real adotada nos primeiros módulos; o CLAUDE.md descreve a intenção, o código mostra o nome. |
| **SQLAlchemy 2.0 síncrono.** | Carga baixa; reduz cerimônia. FastAPI roda rotas síncronas em threadpool. |
| **Sem ORM em ambiente de domínio.** | Entities são `@dataclass` puras; conversão `Model ↔ Entity` é feita no repositório via métodos privados `_to_entity` / `_to_model`. |
| **Repositórios via `Protocol`** (não classe abstrata). | Duck typing nativo; reduz boilerplate, mantém o domínio limpo. |
| **HTTP verbs / status codes seguindo REST padrão.** | `201` criado, `204` sem corpo, `401` não autenticado, `404` não encontrado, `409` conflito, `422` validação, `502` provider externo fora, `503` provider não configurado. |
| **Erros de domínio são exceções tipadas**, mapeadas no controller via `try/except` para `HTTPException`. | Mantém o use case agnóstico do transporte. |

## 3. Banco de dados

| Decisão | Motivação |
|---|---|
| **PostgreSQL como banco primário.** | Suporta JSONB, índices ricos, transações fortes. |
| **Alembic para migrations**, escritas manualmente. | Autogenerate é usado como ponto de partida, mas o resultado é sempre revisado (índices, FKs, defaults). |
| **PK `BIGSERIAL` numérica em toda tabela.** | Simplifica joins, FKs e tabelas de relacionamento futuras (amigos, listas). |
| **Sem soft delete.** | Exclusões são reais; histórico relevante vai para `activity_events`. |
| **Timestamps `created_at` / `updated_at` em `TIMESTAMPTZ` (UTC).** | UTC evita ambiguidade de fuso; conversão para timezone do usuário é responsabilidade do frontend. |
| **Tabela `activity_events` append-only desde a v1.** | Permite implementar feed/timeline na v2 sem migration destrutiva — eventos já estão sendo gravados. Escrita feita na mesma transação da mudança de estado. |
| **`metadata` em `JSONB` em `activity_events`.** | Flexibilidade para novos tipos de evento sem nova migration. |
| **Gêneros, plataformas e desenvolvedores como `JSONB` inline em `games`.** | Fase atual (CAT-02) só exibe — não filtra nem agrega. Normalizar antes do use case é especulação. Migração para tabelas N:N entra junto com a história de filtros. |
| **Senha armazenada como hash, nunca em texto.** | `password_hash` é `NULL` para suportar contas só-OAuth. |
| **Unicidade `username` case-insensitive** (armazenado em lowercase). | Evita `Erik` e `erik` como contas diferentes. |
| **OAuth Google via coluna `users.google_id`** (não tabela `oauth_accounts`). | Um único provedor não justifica o overhead. Migração para tabela separada é puramente aditiva se vier um segundo provedor. |
| **SQLite in-memory nos testes.** | Models atuais não usam JSONB; testes ficam rápidos e sem container. Alembic continua apontando para Postgres. |

## 4. Autenticação e segurança

### Cadastro (AUTH-01)

| Decisão | Motivação |
|---|---|
| **Hash de senha com `bcrypt`** (cost 12). | Projeto educacional com 8 GB de RAM; `argon2id` default usa 64 MB/hash — pesado demais. Trocar depois é substituir o `pwd_context`. |
| **Senha: 8–128 chars + pelo menos um caractere especial.** | 128 chars protege contra DoS de hash. Caractere especial é exigência do backlog. |
| **Username: 3–30 chars, regex `^[a-zA-Z0-9_]+$`.** | Compatível com URL e mention; descarta unicode/emoji que complicam unicidade. |
| **Mensagens de conflito específicas** (`"E-mail já cadastrado"`, `"Username já em uso"`). | Produto não é de risco alto; UX > defesa contra enumeração. |
| **Login permitido sem e-mail verificado.** | Verificação restringirá features sensíveis (review, lista) em tickets futuros. |
| **E-mail de verificação por console logger.** | Isolado atrás de `EmailSender` Protocol; trocar por SMTP/SES depois é um único arquivo novo. |
| **Token de verificação: `secrets.token_urlsafe(32)` + `sha256` no banco, TTL 24h.** | Token em claro nunca persiste; TTL configurável via env. |
| **Link de verificação aponta para o frontend** (`{FRONTEND_BASE_URL}/verify-email?token=...`). | O frontend é o "owner" da URL final; chama o backend após validar. |

### Login (AUTH-02)

| Decisão | Motivação |
|---|---|
| **JWT único em cookie `httpOnly` + `Secure` + `SameSite=Lax`.** | `localStorage` é exfiltrável via XSS; cookie `httpOnly` nunca é exposto ao JS. |
| **Sem refresh token.** | Reduz complexidade (sem tabela, sem endpoint extra). Mitigado por TTL curto. |
| **Sem revogação server-side.** | Consequência aceita do JWT stateless. Logout só apaga o cookie. |
| **"Lembrar de mim" controla `Max-Age` do cookie e `exp` do JWT.** | Marcado → 30 dias. Desmarcado → cookie de sessão + `exp` 12h. |
| **Algoritmo do JWT: HS256.** | Um único serviço; sem necessidade de par de chaves. |
| **Claims mínimos**: `sub`, `iat`, `exp`. | Sem dados sensíveis no payload. |
| **`JWT_SECRET` obrigatório no boot**, sem default. | App falha rápido se faltar. |
| **Mensagem de erro genérica** (`"E-mail ou senha inválidos."`). | Idêntica para e-mail inexistente e senha errada; reduz enumeração de contas. |
| **`verify_password` defensivo contra hash dummy** quando o e-mail não existe. | Evita que o tempo de resposta denuncie a existência da conta. |
| **Endpoint `/auth/me`** para reidratar sessão. | JS não consegue ler o cookie `httpOnly`; o frontend pergunta ao backend no boot. |
| **Sem CSRF token dedicado por ora.** | `SameSite=Lax` + front/back same-site (`localhost`) já cobre. Token anti-CSRF entra quando os domínios divergirem em produção. |

### Login com Google (AUTH-03)

| Decisão | Motivação |
|---|---|
| **ID token via componente oficial `<GoogleLogin>`** do `@react-oauth/google`. | Fluxo mais simples; sem client secret no backend. |
| **Backend valida o JWT do Google offline** via `google-auth`. | Sem chamada extra de rede; valida assinatura, `iss` e `aud`. |
| **`email_verified=False` do Google → rejeita.** | Impede sequestro de conta por e-mail não verificado. |
| **Username de contas auto-criadas: derivado do e-mail, sufixo numérico em colisão.** | Determinístico e ergonômico. |
| **Vinculação automática quando o e-mail já existe.** | Evita duplicação silenciosa de contas. |
| **Sem "remember me" no Google.** | Usa TTL padrão de 12h. |

## 5. Frontend — padrões e convenções

| Decisão | Motivação |
|---|---|
| **React 19 + TypeScript + Vite.** | Stack moderna; HMR rápido; bundle leve. |
| **Atomic Design** (`atoms/`, `molecules/`, `organisms/`, `templates/`, `pages/`). | Hierarquia clara de responsabilidade; favorece reuso. |
| **Material UI** como biblioteca de componentes. | Cobre 90% das necessidades sem reinventar input/dialog/etc. |
| **`styled-components` para layouts e wrappers customizados.** | Onde o MUI não cobre; sem CSS modules ou inline styles. |
| **`react-router-dom`** para roteamento. | Padrão da comunidade; suporta rotas aninhadas e proteção. |
| **`react-hook-form` + `zod` + `@hookform/resolvers`** para formulários. | Validação tipada, performance, ergonomia. |
| **Vitest + Testing Library + jsdom** para testes. | Roda no Vite sem ponte; API igual ao Jest. |
| **Cobertura: ao menos um teste por componente cobrindo o comportamento essencial.** Cobertura total não é exigência. | Custo/benefício; foca em prevenção de regressão real. |
| **Nomes em inglês** (identificadores, arquivos, rotas — `/profile`, `/add-game`, não `/perfil`). | Mesma razão do backend. |
| **Tokens de cor centralizados em [src/theme/colors.ts](../frontend/src/theme/colors.ts).** | Proíbe cor hardcoded em componentes ou `theme.ts`. Tema MUI consome esses tokens. |
| **Textos centralizados em [src/constants/texts.ts](../frontend/src/constants/texts.ts).** | Toda string user-facing é importada; nada inline em componentes. Prepara o terreno para i18n futura. |
| **Tema: dark mode + verde primário** (`#22c55e`). | Look-and-feel do produto; combina com identidade gamer. |
| **Cookies `credentials: 'include'` no wrapper `http`.** | Necessário para enviar/receber o cookie de sessão (cross-port é cross-origin para o browser). |
| **`AbortController` no cleanup de hooks de fetch.** | Evita que respostas obsoletas sobrescrevam o estado atual (race conditions em buscas/debounce). |
| **Debounce 300ms na busca.** | Reduz tráfego sem prejudicar percepção de fluidez. |
| **Performance**: `useMemo` / `useCallback` **só onde há custo real.** | Não usar como default; reduz ruído. |
| **Estado de loading derivado, não setado dentro do effect.** | Evita o aviso `react-hooks/set-state-in-effect`; segue o padrão do `useGameSearch`. |

## 6. Catálogo de jogos (CAT-01 + CAT-02)

| Decisão | Motivação |
|---|---|
| **Provedor externo: RAWG.** | API key única; setup mais simples que IGDB. Trocar é local à camada `infrastructure/`. |
| **Cache local em PostgreSQL via padrão cache-aside.** | Primeira requisição busca no RAWG e persiste; chamadas seguintes leem do banco. Reduz latência e protege a cota da API externa. |
| **`games.id` no formato `<provider>-<external_id>`** (ex.: `rawg-3498`). | Provider e id externo codificados na URL pública; PK numérica interna nunca aparece na API. Permite trocar de provider sem migration destrutiva. |
| **Validação de `q`**: `q` vazia → 422; `q` com < 2 chars → 200 com `results: []` (sem chamar provider). | Reduz ruído e economiza cota. |
| **Duas notas exibidas: `rawgRating` e `platformAverageRating`.** | `platformAverageRating` é sempre `null` por ora — espaço já reservado no contrato e na UI para quando o módulo de avaliações da plataforma existir. |
| **TTL/invalidação do cache fora de escopo nesta fase.** | Coluna `cached_at` existe para suportar a lógica quando entrar. |
| **Tabela de coleção do usuário ainda não implementada.** | Endpoint `GET /games/collection` retorna `{items: []}` como stub (declarado **antes** de `/games/{game_id}` para vencer o match dinâmico). Quando o use case real existir, basta substituir o corpo do endpoint — o contrato permanece. |
| **Botão "Quero jogar" na tela de detalhes — estático por ora.** | UI já mostra a intenção; o handler conecta ao endpoint quando a feature de wishlist for implementada. |

## 7. Modelagem futura (deferida)

| Decisão | Motivação |
|---|---|
| **Normalizar gêneros / plataformas / tags em tabelas separadas** quando entrar a história de filtros. | Migração aditiva: cria as tabelas, popula a partir do JSON existente, frontend migra, depois remove o JSON. |
| **Tabela `oauth_accounts`** se houver um segundo provedor OAuth. | Migração aditiva a partir de `users.google_id`. |
| **Tabelas da v2 (rede social) são puramente aditivas.** | `user_follows`, `feed_items`, `notifications`, `comments`. Feed lê de `activity_events` filtrando por `user_id IN (seguidos)`. |
| **`feed_items` materializado** se o volume crescer. | Job assíncrono derivado de `activity_events`. |

## 8. UX — decisões de produto

| Decisão | Motivação |
|---|---|
| **Ícone de olho nos campos de senha** (login e cadastro). | Evita erro de digitação sem comprometer segurança (estado local, nunca persistido). |
| **Confirmação de senha no cadastro.** | Reduz frustração na primeira tentativa de login. |
| **Empty state com CTA na coleção vazia** ("Nenhum jogo ainda" + botão "Adicionar jogo"). | Empurra o usuário para a próxima ação relevante em vez de mostrar tela em branco. |
| **Dropdown de busca acessível em qualquer página** (no `Header` global). | Aderência ao protótipo; permite buscar sem voltar para o catálogo. |
| **Tela de detalhes acessível tanto da busca quanto do card do catálogo.** | Dois pontos de entrada naturais; nenhuma navegação fica morta. |
| **404 no detalhe usa `EmptyState`**, não tela de erro genérica. | Comunicação mais clara: "este jogo não existe" ≠ "algo quebrou". |
| **Mensagens de erro de login não denunciam se o e-mail existe.** | Defesa contra enumeração de contas (decisão de segurança aplicada na UX). |

## 9. Infraestrutura e operações

| Decisão | Motivação |
|---|---|
| **`docker-compose` para stack local** (API + Postgres). | Setup zero-friction para devs. |
| **AWS como alvo de deploy futuro.** | Definido como direção; detalhes em `infra/` quando entrar. |
| **`.env` único na raiz, sem `.env.example` versionado.** | Evita drift entre exemplo e real; o usuário acrescenta variáveis ao `.env` existente. |
| **Vite lê o `.env` da raiz via `envDir: '..'`** e expõe apenas variáveis com prefixo `VITE_`. | Single source of truth, sem duplicação. |
| **Commits seguindo Conventional Commits** (`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`). | Histórico legível, base para changelog automático. |
| **Hooks do git nunca são ignorados** (sem `--no-verify`). | Falhas de hook indicam algo a corrigir, não a contornar. |

## 10. Testes — padrão único

| Decisão | Motivação |
|---|---|
| **Pytest para backend, Vitest para frontend.** | Padrões da comunidade de cada stack. |
| **Fakes in-memory, nunca mocks** quando o objeto é uma dependência do domínio. | Mocks acoplam ao detalhe da implementação; fakes verificam comportamento. |
| **Sem testes de integração** (sem banco real, sem HTTP real) nesta fase. | Os testes de rota usam SQLite in-memory com overrides; cobre o suficiente sem complexidade extra. |
| **`pytest-mock` apenas para infraestrutura externa** (ex.: `requests.get` no provider RAWG). | A única coisa que se mocka é o limite do sistema (rede). |

## 11. Convenções de comunicação

| Decisão | Motivação |
|---|---|
| **Planos em `documentacao/plano-*.md` antes da implementação.** | Alinhamento antes de codificar; o usuário aprova o plano antes da execução. |
| **Implementação direta quando o usuário pede explicitamente** ("implemente X"). | Plano só é gerado quando o usuário pede planejamento. |
| **Comandos de teste/build/lint ficam para o usuário rodar.** | Claude não roda; apenas lista os comandos ao final. |
| **TODOs no código são proibidos** (lint warning). | Se algo não está pronto, o estado do código deve dizer isso — sem comentário pendurado. |
| **Comentários: só onde o *porquê* não é óbvio.** | Identificadores bem nomeados já contam o "o quê"; comentário só agrega quando explica intenção, invariante ou workaround. |

---

## Apêndice — Decisões pendentes / explicitamente fora de escopo

Itens reconhecidos como necessários mas adiados para tickets futuros:

- **Rate limiting** em endpoints de auth (brute force).
- **Refresh token** e revogação server-side de sessão.
- **CSRF token dedicado** (quando domínios em produção divergirem).
- **Reset de senha** (AUTH-04).
- **Reenvio de e-mail de verificação.**
- **Provider de e-mail real** (SMTP/SES) — hoje é console logger.
- **Restrição de features para contas com e-mail não verificado.**
- **TTL/invalidação de cache de jogos.**
- **Normalização de gêneros/plataformas/tags** (entra com filtros).
- **Tabela de coleção do usuário** + endpoint funcional para wishlist / status.
- **Módulo de avaliações da plataforma** (preenche `platformAverageRating`).
- **Rede social v2**: follows, feed materializado, notificações, comentários em reviews.
