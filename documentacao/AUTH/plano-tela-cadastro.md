# Plano — Tela de Cadastro (Frontend)

## Contexto

O frontend (`frontend/`) é hoje apenas o scaffold default do Vite + React 19 + TS — `App.tsx` mostra o template de boas-vindas, não há roteamento, tema, MUI, styled-components, axios nem test runner. O objetivo é implementar a tela de cadastro do produto **playlogd** mostrada em `documentacao/cadastro.png`, estabelecendo ao mesmo tempo a fundação de UI (tema MUI dark + verde, Atomic Design, router, formulários, testes) sobre a qual as próximas telas serão construídas.

Decisões tomadas:
- **Escopo**: apenas a aba "Criar conta" funcional. A aba "Entrar" aparece (UI) mas fica placeholder/inativa.
- **Testes**: configurar Vitest + Testing Library agora (CLAUDE.md exige teste por componente).
- **Formulário**: `react-hook-form` + `zod` + `@hookform/resolvers`.
- **Roteamento**: `react-router-dom` — rota `/signup` renderiza a página; `/` redireciona para `/signup`.
- **Backend**: fora de escopo nesta iteração. O submit faz apenas `console.log` (placeholder).

---

## Stack a instalar

**Runtime**
```
@mui/material @mui/icons-material @emotion/react @emotion/styled
styled-components
react-router-dom
react-hook-form zod @hookform/resolvers
```

**Dev**
```
@types/styled-components
vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

---

## Passo a passo

### 1. Dependências e scripts
- Instalar todos os pacotes acima no `frontend/`.
- Adicionar scripts em `frontend/package.json`:
  - `"test": "vitest"`

### 2. Configuração de testes
- Em `frontend/vite.config.ts`, adicionar bloco `test: { globals: true, environment: 'jsdom', setupFiles: './src/setupTests.ts', css: true }`.
- Criar `frontend/src/setupTests.ts` com `import '@testing-library/jest-dom'`.
- Em `frontend/tsconfig.app.json`, adicionar `"types": ["vitest/globals", "@testing-library/jest-dom"]`.

### 3. Tema e tokens visuais
Criar `frontend/src/theme/theme.ts` com `createTheme` do MUI:

| Token | Valor |
|---|---|
| `mode` | `dark` |
| `background.default` | `#0a0b0f` |
| `background.paper` | `#131418` |
| `primary.main` | `#22c55e` |
| `text.primary` | `#ffffff` |
| `text.secondary` | `#9ca3af` |
| `shape.borderRadius` | `8` |

Overrides: `MuiTextField`, `MuiButton`, `MuiTab` alinhados com o visual do print.
`styled-components` é usado apenas para layouts/wrappers customizados (conforme CLAUDE.md).

### 4. Provedores globais
Reescrever `frontend/src/main.tsx` com a pilha de providers:
```
<BrowserRouter>
  <MuiThemeProvider theme={muiTheme}>
    <CssBaseline />
    <StyledThemeProvider theme={muiTheme}>
      <AppRoutes />
    </StyledThemeProvider>
  </MuiThemeProvider>
</BrowserRouter>
```

### 5. Rotas
Criar `frontend/src/routes/AppRoutes.tsx`:
- `GET /signup` → `<SignUpPage />`
- Qualquer outra rota → redirect para `/signup`

Remover `App.tsx`, `App.css`, `assets/hero.png`, `assets/react.svg` (lixo do scaffold).

### 6. Atoms — `src/components/atoms/`

| Componente | Descrição |
|---|---|
| `Logo/Logo.tsx` | Caixa verde arredondada com `SportsEsportsIcon` + texto "playlogd". Props: `size?: 'sm' \| 'md'`. |

**Testes:** `Logo.test.tsx` — verifica que texto "playlogd" está presente.

### 7. Molecules — `src/components/molecules/`

| Componente | Descrição |
|---|---|
| `AuthTabs/AuthTabs.tsx` | Tabs MUI controlado ("Entrar" / "Criar conta"). Props: `value`, `onChange`. |
| `FormField/FormField.tsx` | Label + `<TextField>` MUI + mensagem de erro. Props: `label`, `name`, `register`, `error?`, `type?`, `placeholder?`. |
| `GoogleButton/GoogleButton.tsx` | Botão outlined com ícone Google. Props: `onClick?`. |

**Testes:**
- `AuthTabs.test.tsx` — clicar na aba chama `onChange`
- `FormField.test.tsx` — renderiza label; mostra erro quando passado
- `GoogleButton.test.tsx` — renderiza label "Continuar com Google"

### 8. Organisms — `src/components/organisms/`

**`SignUpForm/signUpSchema.ts`**
```ts
z.object({
  name: z.string().min(1, 'Informe seu nome'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
```

**`SignUpForm/SignUpForm.tsx`** — `useForm` com `zodResolver`. Renderiza três `FormField` + botão "Criar conta" + `<Divider>OU</Divider>` + `<GoogleButton />`. Submit faz `console.log(data)` (placeholder).

**`AuthCard/AuthCard.tsx`** — wrapper visual (`<Paper>` MUI) com `<AuthTabs>` no topo. Mantém estado da aba ativa; aba `login` renderiza placeholder "Em breve".

**Testes `SignUpForm.test.tsx`** (3 cenários):
1. Submit vazio → 3 mensagens de erro
2. Senha curta → erro de senha
3. Dados válidos → handler chamado com `{ name, email, password }`

### 9. Templates — `src/components/templates/`

| Componente | Descrição |
|---|---|
| `AuthTemplate/AuthTemplate.tsx` | Tela cheia centralizada (vertical + horizontal). Renderiza `<Logo />` no topo e `children` abaixo. Layout via `styled-components`. |

**Teste:** `AuthTemplate.test.tsx` — renderiza logo e children.

### 10. Pages — `src/components/pages/`

| Componente | Descrição |
|---|---|
| `SignUpPage/SignUpPage.tsx` | Compõe `<AuthTemplate><AuthCard /></AuthTemplate>`. Sem lógica própria. |

**Teste:** `SignUpPage.test.tsx` — smoke test, renderiza "playlogd" e aba "Criar conta".

---

## Estrutura final de pastas

```
frontend/src/
├── components/
│   ├── atoms/
│   │   └── Logo/{Logo.tsx, Logo.test.tsx, index.ts}
│   ├── molecules/
│   │   ├── AuthTabs/{AuthTabs.tsx, AuthTabs.test.tsx, index.ts}
│   │   ├── FormField/{FormField.tsx, FormField.test.tsx, index.ts}
│   │   └── GoogleButton/{GoogleButton.tsx, GoogleButton.test.tsx, index.ts}
│   ├── organisms/
│   │   ├── SignUpForm/{SignUpForm.tsx, signUpSchema.ts, SignUpForm.test.tsx, index.ts}
│   │   └── AuthCard/{AuthCard.tsx, AuthCard.test.tsx, index.ts}
│   ├── templates/
│   │   └── AuthTemplate/{AuthTemplate.tsx, AuthTemplate.test.tsx, index.ts}
│   └── pages/
│       └── SignUpPage/{SignUpPage.tsx, SignUpPage.test.tsx, index.ts}
├── routes/AppRoutes.tsx
├── theme/theme.ts
├── setupTests.ts
└── main.tsx
```

Cada pasta de componente tem `index.ts` reexportando via named export.

---

## Fora de escopo (próxima iteração)

- Integração com backend (`POST /auth/signup`, `src/services/api.ts` com axios)
- OAuth real do Google
- Aba "Entrar" funcional
- Persistência de sessão / `AuthContext`
- Redirect pós-cadastro

---

## Verificação

1. `npm install` — sem erros
2. `npm run dev` → `/signup` visualmente compatível com `documentacao/cadastro.png`
3. Acessar `/` → redireciona para `/signup`
4. Submit vazio → 3 erros de validação visíveis
5. Submit válido → `console.log` no DevTools com `{ name, email, password }`
6. `npm run test` — todos os testes verdes
7. `npm run build` — type-check passa
8. `npm run lint` — sem erros novos
