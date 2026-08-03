# Changelog — correções de lógica (App.tsx)

## Bug raiz #1 — Edição usava o ID errado (causava quase todos os bugs de edição)

Antes: quando uma Fixa/Parcelada era expandida na tabela (uma linha por mês/parcela),
cada linha ganhava um ID temporário tipo `abc123-fixa-2025-6`. Ao editar, o código
procurava esse ID dentro da lista real de lançamentos — que só tem o ID base
(`abc123`, sem sufixo). Nunca batia. Resultado: edição não salvava, "editar todas a
partir desta" chegava a alterar Fixas erradas (qualquer uma com data posterior),
"editar apenas esta" não fazia nada.

**Correção:** todo lançamento expandido agora carrega um campo `baseId` (o ID real)
separado do `id` de exibição. Editar e excluir sempre operam sobre `baseId`.

Resolve:
- Consertar bugs na hora de editar
- Valor não alterava ao salvar edição (em Fixa/Parcelada)
- Travava/nada acontecia ao clicar em editar
- Edições no geral bugadas
- Parcela "indo direto pra 12" (o input de nº de parcelas também parou de usar um
  estado global que vazava entre o fluxo de adicionar e o de editar)

## Bug raiz #2 — Datas interpretadas em UTC em vez do fuso local

`new Date('2025-06-15')` (sem hora) é interpretado pelo JavaScript como meia-noite
**UTC**, não local. No Brasil (UTC-3) isso empurra a data pra trás em várias
comparações. O mesmo valia ao contrário: `date.toISOString()` sempre devolve a data em
UTC, então strings geradas a partir de um `Date` local também saíam erradas.

**Correção:** dois helpers novos, usados em todo o arquivo:
- `parseISO(iso)` → sempre lê a data como local (`+ 'T00:00:00'`)
- `toISODateLocal(date)` → sempre escreve a data usando os componentes locais
  (nunca `toISOString()`)

Resolve:
- Selecionar um dia só no calendário não mostrava só aquele dia
- Nome da data mostrando um dia certo, mas a seleção contando um dia a menos
- Também corrigido (não estava na lista, mas é o mesmo bug): o gráfico de evolução
  no Resumo e o seletor de Semana, que tinham o mesmo problema

## Escopo de edição (editar só esta / todas a partir desta)

O modal de escolha já existia, mas a lógica por trás dependia do Bug #1 (então nunca
funcionava direito). Reescrita do zero:
- **"Editar apenas esta"**: grava uma "exceção" pontual (`overrides`) só pra aquela
  data, sem afetar as outras ocorrências da série.
- **"Editar todas a partir desta"**: a série antiga é encerrada no dia anterior e uma
  nova série começa a partir da data editada, já com os novos valores.

## Exclusão de uma ocorrência (bônus — não estava na lista, mas é o mesmo tipo de bug)

O botão de excluir numa linha de Fixa/Parcelada também usava o ID de exibição, então
clicar em excluir não fazia nada (silenciosamente). Agora excluir uma ocorrência de
uma série recorrente remove só aquela data específica, preservando o resto da série.

## Botões com "tracinho escuro" nos cantos

Causa: no Tailwind v3, a classe `border` sozinha (sem `border-slate-200` etc.) usa
`currentColor` como cor da borda por padrão — ou seja, herda a cor do texto do botão.
Como o texto é escuro, aparece uma borda escura, mais visível nos cantos arredondados
por causa do antialiasing. Encontrados e corrigidos 4 botões/elementos com esse
padrão (Fechar, Cancelar × 2, legenda do gráfico de despesas, Excluir de
investimentos) + uma configuração no `tailwind.config.js` pra evitar regressão futura.

## Confirmado que já estavam OK (nenhuma mudança necessária)

- **Categoria "Mercado"**: nunca existiu nas listas de categoria (`CATS_PADRAO`,
  `CATS_INVEST`). Só aparece como texto de exemplo (placeholder) no campo Nome.
- **Janela de confirmação de exclusão**: já usa um modal customizado com a estética
  do app (`renderModal()`), não é mais o `confirm()` nativo do navegador.
- **Repetição de parceladas pelos meses**: a lógica já existia (`expandirFixos`) e
  sempre esteve correta na teoria — só "sumia" por causa do Bug raiz #2 (fuso
  horário empurrando datas pro dia/mês errado no filtro).

## Exportar/Importar (JSON e CSV) — bug crítico corrigido + importação criada do zero

**Bug encontrado no CSV:** o gerador usava `'\n'` (com dois `\`) em vez de uma quebra
de linha de verdade. Na prática, o JavaScript interpretava isso como o texto literal
`\n` (barra invertida + letra n), não como uma quebra de linha real — então o CSV
exportado saía inteiro numa única linha, praticamente ilegível no Excel/Sheets.
Confirmei isso lendo os bytes reais do arquivo antes de corrigir.

**Correções aplicadas:**
- Quebra de linha real (`\r\n`, padrão CSV) em vez do texto `\n` literal.
- Escaping de verdade: campos com `;`, aspas ou quebra de linha agora vêm entre aspas
  (com aspas internas dobradas), então nomes/observações com `;` não quebram mais o
  arquivo.
- BOM (`\uFEFF`) no início do CSV — sem isso o Excel abre acentuação (ç, ã, é...)
  corrompida.
- JSON e CSV agora exportam a estrutura **completa** (inclusive `subcategoria`,
  `numParcelas`, `ateData`, `overrides`, `datasExcluidas`) — antes só salvavam os
  campos básicos e perdiam toda a recorrência num backup/restauração.

**Importação (não existia — só tinha um comentário "`// ...existing code...`" órfão
no lugar):**
- Botão "Importar JSON/CSV" no menu (≡), com validação de cada lançamento antes de
  aceitar (tipo válido, nome, valor ≥ 0, data no formato certo).
- Detecta o formato pela extensão do arquivo.
- Sempre **adiciona** aos lançamentos existentes (nunca substitui) — pra recomeçar do
  zero, use "Limpar tudo" antes de importar.
- IDs são sempre regenerados na importação, pra nunca colidir com o que já existe.
- Testei manualmente a lógica de export→import de ida e volta com casos difíceis
  (nome com `;` e aspas, observação com quebra de linha real, JSON malformado,
  lançamentos com dados inválidos misturados) — todos passaram.

## Outros ajustes de identidade (não eram bugs, mas foram atualizados)

- Chave do `localStorage`: `finance-bruno-v2` → `simple-finance-v1`
- Rodapé: removida referência pessoal, atualizado pra "Simple Finance • CROOMA Design
  Studio"

> **Atenção:** como a chave do localStorage mudou, dados salvos numa build anterior
> do app não aparecem automaticamente nesta nova versão (ficam intactos sob a chave
> antiga, só não são lidos por padrão). Isso é esperado nesse ponto do projeto, já
> que é uma reestruturação pra virar produto novo — mas é bom você saber caso vá
> comparar com uma instalação anterior.
