# Plano — Ícone de visibilidade de senha + campo de confirmação no cadastro

## Contexto

Dois ajustes de UX nos formulários de autenticação:

1. **Ícone de olho** nos campos de senha do login (`LoginForm`) e do cadastro (`SignUpForm`) — permite ao usuário revelar o que está digitando.
2. **Campo "Confirmar senha"** apenas no cadastro — garante que o usuário não cometa erro de digitação ao criar a conta.

---

## Mudanças

### 1. `FormField` — adicionar suporte ao toggle de visibilidade

Arquivo: `frontend/src/components/molecules/FormField/FormField.tsx`

Adicionar prop opcional `showPasswordToggle?: boolean`. Quando `true` e `type` for `'password'` (ou estiver sendo revelado), renderiza um `InputAdornment` no final do `TextField` com `IconButton` + ícone `Visibility` / `VisibilityOff` do `@mui/icons-material`.

O `FormField` passa a gerenciar estado local `showPassword: boolean` (via `useState`). O `type` passado ao `TextField` será `showPassword ? 'text' : type`.

Interface final da prop:
```ts
showPasswordToggle?: boolean  // só faz efeito quando type="password"
```

**`FormField.test.tsx`** — adicionar dois casos:
- Campo com `showPasswordToggle` renderiza o botão de toggle.
- Clicar no toggle altera o tipo do input de `password` para `text`.

---

### 2. `SignUpForm` — ícone de olho + campo "Confirmar senha"

**`signUpSchema.ts`** — acrescentar campo `confirmPassword` e validação cruzada:

```ts
z.object({
  name: ...,
  email: ...,
  password: ...,
  confirmPassword: z.string().min(1, 'Confirme sua senha'),
})
.superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      code: 'custom',
      message: 'Senhas não coincidem',
      path: ['confirmPassword'],
    })
  }
})
```

**`SignUpForm.tsx`**:
- Adicionar `<FormField>` para `confirmPassword` (label "Confirmar senha", `type="password"`, `showPasswordToggle`, sem placeholder).
- Adicionar `showPasswordToggle` nos dois campos de senha existentes (`password` e `confirmPassword`).

**`SignUpForm.test.tsx`** — ajustes:
- Todos os testes que fazem submit agora precisam preencher `confirmPassword` também.
- Adicionar caso: senhas diferentes → erro "Senhas não coincidem" no campo de confirmação.
- Remover ou adaptar testes que falharem por causa do novo campo obrigatório.

---

### 3. `LoginForm` — ícone de olho

**`LoginForm.tsx`**: adicionar `showPasswordToggle` no `<FormField>` de senha. Sem outras mudanças.

**`LoginForm.test.tsx`** — o teste de submit válido usa `container.querySelector('input[name="password"]')` para digitar; isso continua funcionando independente do toggle (o `name` do input não muda).

---

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| `frontend/src/components/molecules/FormField/FormField.tsx` | Modificar — adicionar `showPasswordToggle` |
| `frontend/src/components/molecules/FormField/FormField.test.tsx` | Modificar — 2 novos casos |
| `frontend/src/components/organisms/SignUpForm/signUpSchema.ts` | Modificar — `confirmPassword` + `.superRefine` |
| `frontend/src/components/organisms/SignUpForm/SignUpForm.tsx` | Modificar — campo `confirmPassword` + `showPasswordToggle` |
| `frontend/src/components/organisms/SignUpForm/SignUpForm.test.tsx` | Modificar — preencher `confirmPassword` + novo cenário |
| `frontend/src/components/organisms/LoginForm/LoginForm.tsx` | Modificar — `showPasswordToggle` no campo senha |

Nenhum arquivo novo precisa ser criado.

---

## Fora de escopo

- "Esqueci minha senha"
- Validação de força de senha (barra de progresso)
- Integração com backend

---

## Verificação

1. **Login**: campo senha exibe ícone de olho; clicar revela o texto; clicar novamente oculta.
2. **Cadastro**: campos "Senha" e "Confirmar senha" exibem ícone de olho com o mesmo comportamento.
3. Submeter cadastro com senhas diferentes → erro "Senhas não coincidem" abaixo do campo de confirmação.
4. Submeter cadastro com senhas iguais e válidas → `console.log` com `{ name, email, password, confirmPassword }`.
5. `npm run test` — todos os testes verdes.
6. `npm run build` — type-check passa.
7. `npm run lint` — sem erros novos.
