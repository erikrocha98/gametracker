# Plano — Tela de Login (Frontend)

## Contexto

A fundação visual e de formulários já foi estabelecida pela tela de cadastro: atoms `Logo`, molecules `AuthTabs` / `FormField` / `GoogleButton`, organism `AuthCard` (que já alterna entre as abas), template `AuthTemplate`, tema MUI dark + verde, router e Vitest. Falta implementar o conteúdo funcional da aba "Entrar", hoje um placeholder `Em breve`, e expor a tela em uma URL própria `/login`.

A tela é praticamente idêntica à de cadastro: mesmo card, mesmas abas, divisor "OU" e botão Google. Muda apenas o conjunto de campos (e-mail + senha) e o rótulo do botão principal ("Entrar").

Decisões alinhadas:
- **Rota dedicada `/login`** — permite refresh sem perder a aba, bookmarks, redirect pós-logout, guards de rota e OAuth callback. O catch-all (`*`) passa a redirecionar para `/login` (era `/signup`).
- **Validação de senha leve no login** — apenas obrigatório + proteção anti SQL injection. A validação de política fica no backend.
- **Backend e OAuth real fora de escopo** — submit faz `console.log` como no signup.

---

## Arquivos a criar

### `frontend/src/components/organisms/LoginForm/`

**`loginSchema.ts`**

```ts
z.object({
  email: z.string().email('E-mail inválido').max(254).refine(noSqlInjection),
  password: z.string().min(1, 'Informe sua senha').max(128).refine(noSqlInjection),
})
```
Replica as constantes `SQL_INJECTION_REGEX`, `noSqlInjection` e `SQL_INJECTION_MSG` de `signUpSchema.ts` (sem extrair para arquivo compartilhado ainda — só vale a pena na terceira cópia).

**`LoginForm.tsx`**

Segue o esqueleto de `SignUpForm.tsx`:
- `useForm` com `zodResolver(loginSchema)`
- Dois `<FormField>`: e-mail (`placeholder="voce@exemplo.com"`) e senha (sem placeholder, igual ao print)
- Botão `Entrar` (variant contained, fullWidth)
- `<Divider>OU</Divider>` + `<GoogleButton />`
- Prop opcional `onSubmit?: (data: LoginFormData) => void`; fallback `console.log(data)`

**`LoginForm.test.tsx`** — três cenários:
1. Submit vazio → erros "E-mail inválido" e "Informe sua senha"
2. E-mail malformado → erro de e-mail
3. Dados válidos → handler chamado com `{ email, password }`

**`index.ts`** — `export { LoginForm } from './LoginForm'`

---

### `frontend/src/components/pages/LoginPage/`

**`LoginPage.tsx`**

```tsx
export function LoginPage() {
  return (
    <AuthTemplate>
      <AuthCard initialTab="login" />
    </AuthTemplate>
  )
}
```

**`LoginPage.test.tsx`** — smoke test: renderiza `playlogd` e aba "Entrar" ativa.

**`index.ts`** — named export.

---

## Arquivos a modificar

### `AuthCard.tsx` — `frontend/src/components/organisms/AuthCard/AuthCard.tsx`

- Adicionar prop opcional `initialTab?: AuthTabValue` (default `'signup'` para não quebrar `SignUpPage`).
- Inicializar `useState<AuthTabValue>(initialTab ?? 'signup')`.
- Substituir o bloco `Em breve` por `<LoginForm />` quando `activeTab === 'login'`.

### `AuthCard.test.tsx`

- Substituir o teste `'shows placeholder when login tab is selected'` (que espera "Em breve") por um que clica na aba "Entrar" e verifica que o campo e-mail do `LoginForm` aparece.
- Adicionar caso: monta com `initialTab="login"` e verifica diretamente que o campo e-mail está presente sem precisar clicar.

### `AppRoutes.tsx` — `frontend/src/routes/AppRoutes.tsx`

- Importar `LoginPage`.
- Adicionar `<Route path="/login" element={<LoginPage />} />`.
- Trocar o catch-all de `<Navigate to="/signup" replace />` para `<Navigate to="/login" replace />`.

---

## Estrutura final de pastas (incremento)

```
frontend/src/components/
├── organisms/
│   └── LoginForm/{LoginForm.tsx, loginSchema.ts, LoginForm.test.tsx, index.ts}  ← novo
└── pages/
    └── LoginPage/{LoginPage.tsx, LoginPage.test.tsx, index.ts}                  ← novo
```

---

## Fora de escopo

- Integração com backend (`POST /auth/login`) e axios
- OAuth real do Google
- "Esqueci minha senha"
- Persistência de sessão / `AuthContext`
- Redirect pós-login para área autenticada

---

## Verificação

1. `npm run dev` → `http://localhost:5173/login` visualmente compatível com `documentacao/login.png` (aba "Entrar" ativa, dois campos, botão verde, "OU", botão Google).
2. Clicar na aba "Criar conta" dentro de `/login` → exibe `SignUpForm`.
3. Acessar `/signup` → aba "Criar conta" ativa (sem regressão).
4. Acessar rota inexistente (ex.: `/foo`) → redireciona para `/login`.
5. Submit vazio → 2 erros visíveis.
6. Submit com e-mail inválido → erro de e-mail.
7. Submit válido → `console.log({ email, password })` no DevTools.
8. `npm run test` — todos os testes verdes.
9. `npm run build` — type-check passa.
10. `npm run lint` — sem erros novos.
