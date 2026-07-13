---
name: test-skill
description: usar sempre que for escrever, revisar, refatorar ou avaliar testes de componente React (.tsx). cobre o que testar, o que NÃO testar, a escada de queries, a diferença entre getBy / queryBy / findBy, e os padrões de interação e asserção do projeto. usar também quando a pessoa colar um teste pedindo opinião, perguntar "esse teste tá bom?", "como testo esse formulário / loading / estado de erro?" ou "por que esse teste quebrou no refactor?" — mesmo que ela não diga a palavra "teste".
---

# como escrevo teste de componente aqui

> esse arquivo é skill e é aula ao mesmo tempo. quando você seguir ele pra
> escrever ou revisar um teste, não despeja só o código. explica em uma linha o
> porquê das escolhas que não são óbvias — quem tá do outro lado quase sempre tá
> aprendendo a testar direito, e o objetivo é que da próxima vez essa pessoa
> escreva o teste sozinha. mostra o teste ruim ao lado do bom quando isso deixar
> a lição mais clara.

## a regra de ouro

teste comportamento, não implementação. o teste faz o que o usuário faz e
confere o que o usuário vê. se ele menciona state interno, nome de função ou
"chamou tal hook", tá errado — você acoplou no COMO em vez do O QUÊ.

o cheiro pra reconhecer isso na hora: se eu trocar a tripa do componente por
dentro mantendo o mesmo comportamento e seu teste quebra, ele tava testando a
coisa errada. teste bom só reclama quando o comportamento muda.

## sempre

- alcançar os elementos por papel e label, na ordem: `getByRole` →
  `getByLabelText` → `getByText`. `data-testid` é último recurso.
  > o motivo não é purismo: `getByRole('button', { name: /salvar/i })` acha o
  > botão do mesmo jeito que um leitor de tela e um usuário acham. se o botão
  > saiu da árvore acessível, o teste quebra — e é exatamente isso que você quer
  > saber.
- simular interação com `userEvent`, nunca `fireEvent` nem chamar o handler na
  mão. e desde a v14 é `setup()` antes do render, com `await` em cada ação:

  ```tsx
  const user = userEvent.setup()
  render(<Form />)
  await user.type(screen.getByLabelText(/email/i), 'a@b.com')
  await user.click(screen.getByRole('button', { name: /enviar/i }))
  ```
  > `userEvent` simula o usuário de verdade — foco, sequência de teclas, eventos
  > na ordem certa. `fireEvent` dispara um evento sintético solto que o usuário
  > nunca produziria.

- ter pelo menos UMA asserção de comportamento. renderizar e checar que apareceu
  não conta como teste:

  ```tsx
  // ❌ só prova que o react renderiza um botão (já sabíamos)
  render(<Botao />)
  expect(screen.getByRole('button')).toBeInTheDocument()

  // ✅ prova que clicar FAZ alguma coisa — o motivo do componente existir
  const user = userEvent.setup()
  const onSave = vi.fn()
  render(<Botao onSave={onSave} />)
  await user.click(screen.getByRole('button', { name: /salvar/i }))
  expect(onSave).toHaveBeenCalledOnce()
  ```

- cobrir o caminho de erro explicitamente, não só o caminho feliz. metade dos
  bugs reais mora ali.
- mockar rede com MSW no nível do request, nunca mockar `fetch` na mão:

  ```tsx
  server.use(
    http.get('/api/items', () =>
      HttpResponse.json({ erro: 'falhou' }, { status: 500 })
    )
  )
  render(<Lista />)
  expect(await screen.findByRole('alert'))
    .toHaveTextContent(/não foi possível carregar/i)
  ```
  > mockando no request, o componente faz a chamada de verdade e você testa o
  > que ele faz quando a rede te trai. mockando o `fetch` você testa o seu mock.

> nos exemplos uso `vi.fn()` (vitest). se o projeto roda jest, é `jest.fn()` —
> o resto é igual.

## getBy vs queryBy vs findBy

aqui é onde quase todo teste flaky nasce, então presta atenção:

- **`getBy...`** → existe AGORA e eu sei que existe. estoura na hora se não
  achar. uso padrão pra coisa síncrona.
- **`queryBy...`** → o único que devolve `null` sem estourar. é a ferramenta
  pra afirmar que algo NÃO está na tela:

  ```tsx
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  ```
- **`findBy...`** → vai aparecer, mas depois de algo assíncrono (um fetch, um
  estado que resolve). retorna promise, então `await`:

  ```tsx
  await user.click(screen.getByRole('button', { name: /carregar/i }))
  expect(await screen.findByText(/3 resultados/i)).toBeInTheDocument()
  ```

> regra prática: usou `getBy` pra esperar algo que ainda não chegou? ele estoura
> antes da tela atualizar e você vai culpar o teste de "instável". o certo era
> `findBy`. e nunca espera com tempo fixo (`setTimeout`, delay arbitrário) —
> `findBy` e `waitFor` esperam o quanto precisar e nem um ms a mais.

## nunca

- testar `useState`, `useEffect` ou qualquer coisa que é responsabilidade do
  react. você não escreve teste pra biblioteca dos outros.
- asserção única de `toBeInTheDocument` sem verificar comportamento.
- mockar o componente que tá sendo testado — aí o teste passa porque o mock
  passa, e o componente real pode estar quebrado.
- snapshot gigante de árvore inteira. ninguém revisa, todo mundo roda `-u` no
  automático e ele para de pegar bug. snapshot pequeno e proposital, se for o
  caso.
- usar `data-testid` como primeira escolha. quando você precisa dele, geralmente
  é sinal de que falta semântica (ou acessibilidade) no componente.

## o teste tá pronto quando

- ele falharia se eu introduzisse um bug de verdade na lógica.
- ele NÃO falharia só por um refactor interno que preserva comportamento.
- alguém que não escreveu o componente entende o que ele faz só de ler o teste.
  teste bom também é documentação.

> resumindo a ópera: se o teste sofre quando você refatora e dorme quando você
> quebra a lógica, ele tá de cabeça pra baixo. a gente quer o contrário.