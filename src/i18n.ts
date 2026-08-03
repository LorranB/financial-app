// ---- Internacionalização (i18n) ----
// Funciona igual no Electron (Windows) e no Capacitor (Android/iOS): os dois rodam
// sobre um webview comum, então `navigator.language` já reflete o idioma configurado
// no sistema operacional do aparelho, sem precisar de nenhum plugin nativo extra.

export type Lang = 'pt-BR' | 'en' | 'es';

export const SUPPORTED_LANGS: Lang[] = ['pt-BR', 'en', 'es'];

export const LANG_LABELS: Record<Lang, string> = {
  'pt-BR': 'Português',
  en: 'English',
  es: 'Español',
};

export const LANG_FLAGS: Record<Lang, string> = {
  'pt-BR': '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
};

const LANG_STORAGE_KEY = 'simple-finance-v1-idioma';

// Detecta o idioma do aparelho e escolhe o suportado mais próximo.
// Se o usuário já escolheu um idioma manualmente antes, isso tem prioridade.
// Qualquer idioma não suportado ainda cai em português (idioma nativo do app).
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved && (SUPPORTED_LANGS as string[]).includes(saved)) return saved as Lang;
  } catch {}
  const navLang =
    (typeof navigator !== 'undefined' &&
      (navigator.language || (navigator as any).userLanguage || (navigator.languages && navigator.languages[0]))) ||
    'pt-BR';
  const lower = navLang.toLowerCase();
  if (lower.startsWith('pt')) return 'pt-BR';
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('en')) return 'en';
  return 'pt-BR';
}

export function saveLang(lang: Lang) {
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch {}
}

// Substitui {variavel} dentro da string traduzida por um valor real.
// Ex.: interpolate("Encontrados {count} itens", {count: 5}) -> "Encontrados 5 itens"
export function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

type Dict = Record<string, string>;

export const translations: Record<Lang, Dict> = {
  'pt-BR': {
    'nav.lancamentos': 'Lançamentos',
    'nav.resumo': 'Resumo',
    'nav.investimentos': 'Investimentos',

    'menu.dados': 'Dados',
    'menu.importar': 'Importar JSON/CSV',
    'menu.exportarJson': 'Exportar JSON',
    'menu.exportarCsv': 'Exportar CSV',
    'menu.limparTudo': 'Limpar tudo',

    'btn.adicionar': 'Adicionar',
    'btn.editar': 'Editar',
    'btn.excluir': 'Excluir',
    'btn.salvar': 'Salvar',
    'btn.cancelar': 'Cancelar',
    'btn.fechar': 'Fechar',
    'btn.sim': 'Sim',
    'btn.nao': 'Não',
    'btn.ok': 'OK',

    'modal.atencao': 'Atenção',
    'modal.confirmacao': 'Confirmação',
    'modal.escopoEdicao': 'Como deseja aplicar a edição?',
    'modal.escopoDetalhePre': 'Esta movimentação é {tipo}.',
    'modal.escopoDetalhePos': 'Deseja editar apenas esta movimentação ou todas a partir desta?',
    'modal.editarApenasEsta': 'Editar apenas esta',
    'modal.editarTodasApartir': 'Editar todas a partir desta',
    'modal.excluirOcorrencia': 'Excluir apenas esta ocorrência?',
    'modal.excluirLancamento': 'Excluir este lançamento?',
    'modal.removerTudo': 'Remover TODOS os dados?',

    'form.novoLancamento': 'Novo lançamento',
    'form.editarLancamento': 'Editar lançamento',
    'form.oQueDeseja': 'O que deseja {acao}?',
    'form.valorReais': 'Valor (R$)',
    'form.tipo': 'Tipo',
    'form.despesa': 'Despesa',
    'form.ganho': 'Ganho',
    'form.investimento': 'Investimento',
    'form.nome': 'Nome',
    'form.valor': 'Valor',
    'form.data': 'Data',
    'form.categoria': 'Categoria',
    'form.subcategoria': 'Subcategoria',
    'form.opcional': 'opcional',
    'form.observacoes': 'Observações',
    'form.recorrencia': 'Recorrência',
    'form.nenhuma': 'Nenhuma',
    'form.fixa': 'Fixa',
    'form.fixaMin': 'fixa',
    'form.parcelada': 'Parcelada',
    'form.parceladaMin': 'parcelada',
    'form.numParcelas': 'Nº de parcelas:',
    'form.ouDigiteCategoria': 'ou digite uma categoria',
    'form.placeholderDespesa': 'Ex.: Mercado, Luz, Transporte',
    'form.placeholderGanho': 'Ex.: Salário, Bônus, Venda',
    'form.placeholderInvestimento': 'Ex.: Tesouro Selic, Ações, Cripto',
    'form.informeData': 'Informe a data.',
    'form.deNome': 'Dê um nome.',
    'form.valorInvalido': 'Valor inválido.',
    'form.buscar': 'Buscar...',

    'periodo.periodo': 'Período',
    'periodo.mensal': 'Mensal',
    'periodo.semanal': 'Semanal',
    'periodo.semana': 'Semana',
    'periodo.intervalo': 'Intervalo de datas',
    'periodo.selecioneSemana': 'Selecione a semana',
    'periodo.selecioneIntervalo': 'Selecione o intervalo',
    'periodo.todos': 'Todos',

    'resumo.ganhos': 'Ganhos',
    'resumo.despesas': 'Despesas',
    'resumo.saldo': 'Saldo',
    'resumo.saldoAcumulado': 'Saldo acumulado',
    'resumo.evolucaoPeriodo': 'Evolução no período',
    'resumo.despesasPorCategoria': 'Despesas por categoria',
    'resumo.investimentosPeriodo': 'Investimentos do período',
    'resumo.totaisPeriodo': 'Totais do período',
    'resumo.distribuicaoClasse': 'Distribuição por classe',
    'resumo.semLancamentos': 'Sem lançamentos no período selecionado.',

    'invest.ativoDescricao': 'Ativo/Descrição',
    'invest.classe': 'Classe',
    'invest.aporte': 'Aporte',
    'invest.totalInvestido': 'Total investido',
    'invest.semAportes': 'Sem aportes no período.',
    'tabela.acoes': 'Ações',

    'tema.claro': 'Modo claro',
    'tema.escuro': 'Modo escuro',

    'olho.ocultar': 'Ocultar todos os valores',
    'olho.exibir': 'Exibir valores',

    'import.tipoInvalido': 'Selecione um arquivo .json ou .csv exportado pelo Simple Finance.',
    'import.nenhumValido': 'Nenhum lançamento válido encontrado nesse arquivo.',
    'import.confirmacao': 'Encontrados {count} lançamento(s) no arquivo. Isso vai ADICIONAR aos lançamentos que você já tem (não substitui nada). Continuar?',
    'import.erroLeitura': 'Não foi possível ler esse arquivo. Confira se é um export válido do Simple Finance.',
    'import.formatoInvalido': 'Formato inválido: esperava uma lista de lançamentos.',
    'import.csvSemColunas': 'Esse CSV não parece ser um export do Simple Finance (faltam colunas obrigatórias).',

    'lang.idioma': 'Idioma',
    'menu.moeda': 'Moeda',
    'footer.dados': 'Dados salvos localmente no aparelho. Use o menu (≡) para importar/exportar.',

    'ganho.salario': 'Salário',
    'ganho.bonus': 'Bônus',
    'ganho.venda': 'Venda',
    'ganho.outros': 'Outros',
  },

  en: {
    'nav.lancamentos': 'Transactions',
    'nav.resumo': 'Summary',
    'nav.investimentos': 'Investments',

    'menu.dados': 'Data',
    'menu.importar': 'Import JSON/CSV',
    'menu.exportarJson': 'Export JSON',
    'menu.exportarCsv': 'Export CSV',
    'menu.limparTudo': 'Clear all',

    'btn.adicionar': 'Add',
    'btn.editar': 'Edit',
    'btn.excluir': 'Delete',
    'btn.salvar': 'Save',
    'btn.cancelar': 'Cancel',
    'btn.fechar': 'Close',
    'btn.sim': 'Yes',
    'btn.nao': 'No',
    'btn.ok': 'OK',

    'modal.atencao': 'Attention',
    'modal.confirmacao': 'Confirmation',
    'modal.escopoEdicao': 'How do you want to apply this edit?',
    'modal.escopoDetalhePre': 'This transaction is {tipo}.',
    'modal.escopoDetalhePos': 'Do you want to edit only this one, or this and all future ones?',
    'modal.editarApenasEsta': 'Edit only this one',
    'modal.editarTodasApartir': 'Edit this and all future ones',
    'modal.excluirOcorrencia': 'Delete only this occurrence?',
    'modal.excluirLancamento': 'Delete this transaction?',
    'modal.removerTudo': 'Remove ALL data?',

    'form.novoLancamento': 'New transaction',
    'form.editarLancamento': 'Edit transaction',
    'form.oQueDeseja': 'What do you want to {acao}?',
    'form.valorReais': 'Amount (R$)',
    'form.tipo': 'Type',
    'form.despesa': 'Expense',
    'form.ganho': 'Income',
    'form.investimento': 'Investment',
    'form.nome': 'Name',
    'form.valor': 'Amount',
    'form.data': 'Date',
    'form.categoria': 'Category',
    'form.subcategoria': 'Subcategory',
    'form.opcional': 'optional',
    'form.observacoes': 'Notes',
    'form.recorrencia': 'Recurrence',
    'form.nenhuma': 'None',
    'form.fixa': 'Fixed',
    'form.fixaMin': 'fixed',
    'form.parcelada': 'Installments',
    'form.parceladaMin': 'in installments',
    'form.numParcelas': 'Number of installments:',
    'form.ouDigiteCategoria': 'or type a category',
    'form.placeholderDespesa': 'E.g.: Groceries, Electricity, Transport',
    'form.placeholderGanho': 'E.g.: Salary, Bonus, Sale',
    'form.placeholderInvestimento': 'E.g.: Treasury bonds, Stocks, Crypto',
    'form.informeData': 'Enter a date.',
    'form.deNome': 'Give it a name.',
    'form.valorInvalido': 'Invalid amount.',
    'form.buscar': 'Search...',

    'periodo.periodo': 'Period',
    'periodo.mensal': 'Monthly',
    'periodo.semanal': 'Weekly',
    'periodo.semana': 'Week',
    'periodo.intervalo': 'Date range',
    'periodo.selecioneSemana': 'Select the week',
    'periodo.selecioneIntervalo': 'Select the range',
    'periodo.todos': 'All',

    'resumo.ganhos': 'Income',
    'resumo.despesas': 'Expenses',
    'resumo.saldo': 'Balance',
    'resumo.saldoAcumulado': 'Accumulated balance',
    'resumo.evolucaoPeriodo': 'Trend over the period',
    'resumo.despesasPorCategoria': 'Expenses by category',
    'resumo.investimentosPeriodo': 'Investments in the period',
    'resumo.totaisPeriodo': 'Totals for the period',
    'resumo.distribuicaoClasse': 'Distribution by class',
    'resumo.semLancamentos': 'No transactions in the selected period.',

    'invest.ativoDescricao': 'Asset/Description',
    'invest.classe': 'Class',
    'invest.aporte': 'Contribution',
    'invest.totalInvestido': 'Total invested',
    'invest.semAportes': 'No contributions in the period.',
    'tabela.acoes': 'Actions',

    'tema.claro': 'Light mode',
    'tema.escuro': 'Dark mode',

    'olho.ocultar': 'Hide all amounts',
    'olho.exibir': 'Show amounts',

    'import.tipoInvalido': 'Select a .json or .csv file exported by Simple Finance.',
    'import.nenhumValido': 'No valid transactions found in this file.',
    'import.confirmacao': 'Found {count} transaction(s) in the file. This will ADD to your existing transactions (nothing is replaced). Continue?',
    'import.erroLeitura': "Could not read this file. Make sure it's a valid Simple Finance export.",
    'import.formatoInvalido': 'Invalid format: expected a list of transactions.',
    'import.csvSemColunas': "This CSV doesn't look like a Simple Finance export (missing required columns).",

    'lang.idioma': 'Language',
    'menu.moeda': 'Currency',
    'footer.dados': 'Data saved locally on this device. Use the menu (≡) to import/export.',

    'ganho.salario': 'Salary',
    'ganho.bonus': 'Bonus',
    'ganho.venda': 'Sale',
    'ganho.outros': 'Other',
  },

  es: {
    'nav.lancamentos': 'Transacciones',
    'nav.resumo': 'Resumen',
    'nav.investimentos': 'Inversiones',

    'menu.dados': 'Datos',
    'menu.importar': 'Importar JSON/CSV',
    'menu.exportarJson': 'Exportar JSON',
    'menu.exportarCsv': 'Exportar CSV',
    'menu.limparTudo': 'Borrar todo',

    'btn.adicionar': 'Agregar',
    'btn.editar': 'Editar',
    'btn.excluir': 'Eliminar',
    'btn.salvar': 'Guardar',
    'btn.cancelar': 'Cancelar',
    'btn.fechar': 'Cerrar',
    'btn.sim': 'Sí',
    'btn.nao': 'No',
    'btn.ok': 'OK',

    'modal.atencao': 'Atención',
    'modal.confirmacao': 'Confirmación',
    'modal.escopoEdicao': '¿Cómo querés aplicar la edición?',
    'modal.escopoDetalhePre': 'Esta transacción es {tipo}.',
    'modal.escopoDetalhePos': '¿Querés editar solo esta transacción o esta y todas las siguientes?',
    'modal.editarApenasEsta': 'Editar solo esta',
    'modal.editarTodasApartir': 'Editar esta y todas las siguientes',
    'modal.excluirOcorrencia': '¿Eliminar solo esta ocurrencia?',
    'modal.excluirLancamento': '¿Eliminar esta transacción?',
    'modal.removerTudo': '¿Eliminar TODOS los datos?',

    'form.novoLancamento': 'Nueva transacción',
    'form.editarLancamento': 'Editar transacción',
    'form.oQueDeseja': '¿Qué querés {acao}?',
    'form.valorReais': 'Monto (R$)',
    'form.tipo': 'Tipo',
    'form.despesa': 'Gasto',
    'form.ganho': 'Ingreso',
    'form.investimento': 'Inversión',
    'form.nome': 'Nombre',
    'form.valor': 'Monto',
    'form.data': 'Fecha',
    'form.categoria': 'Categoría',
    'form.subcategoria': 'Subcategoría',
    'form.opcional': 'opcional',
    'form.observacoes': 'Notas',
    'form.recorrencia': 'Recurrencia',
    'form.nenhuma': 'Ninguna',
    'form.fixa': 'Fija',
    'form.fixaMin': 'fija',
    'form.parcelada': 'En cuotas',
    'form.parceladaMin': 'en cuotas',
    'form.numParcelas': 'Número de cuotas:',
    'form.ouDigiteCategoria': 'o escribí una categoría',
    'form.placeholderDespesa': 'Ej.: Supermercado, Luz, Transporte',
    'form.placeholderGanho': 'Ej.: Salario, Bono, Venta',
    'form.placeholderInvestimento': 'Ej.: Bonos del tesoro, Acciones, Cripto',
    'form.informeData': 'Ingresá la fecha.',
    'form.deNome': 'Poné un nombre.',
    'form.valorInvalido': 'Monto inválido.',
    'form.buscar': 'Buscar...',

    'periodo.periodo': 'Período',
    'periodo.mensal': 'Mensual',
    'periodo.semanal': 'Semanal',
    'periodo.semana': 'Semana',
    'periodo.intervalo': 'Rango de fechas',
    'periodo.selecioneSemana': 'Seleccioná la semana',
    'periodo.selecioneIntervalo': 'Seleccioná el rango',
    'periodo.todos': 'Todos',

    'resumo.ganhos': 'Ingresos',
    'resumo.despesas': 'Gastos',
    'resumo.saldo': 'Saldo',
    'resumo.saldoAcumulado': 'Saldo acumulado',
    'resumo.evolucaoPeriodo': 'Evolución en el período',
    'resumo.despesasPorCategoria': 'Gastos por categoría',
    'resumo.investimentosPeriodo': 'Inversiones del período',
    'resumo.totaisPeriodo': 'Totales del período',
    'resumo.distribuicaoClasse': 'Distribución por clase',
    'resumo.semLancamentos': 'Sin transacciones en el período seleccionado.',

    'invest.ativoDescricao': 'Activo/Descripción',
    'invest.classe': 'Clase',
    'invest.aporte': 'Aporte',
    'invest.totalInvestido': 'Total invertido',
    'invest.semAportes': 'Sin aportes en el período.',
    'tabela.acoes': 'Acciones',

    'tema.claro': 'Modo claro',
    'tema.escuro': 'Modo oscuro',

    'olho.ocultar': 'Ocultar todos los montos',
    'olho.exibir': 'Mostrar montos',

    'import.tipoInvalido': 'Seleccioná un archivo .json o .csv exportado por Simple Finance.',
    'import.nenhumValido': 'No se encontraron transacciones válidas en este archivo.',
    'import.confirmacao': 'Se encontraron {count} transacción(es) en el archivo. Esto va a AGREGAR a las transacciones que ya tenés (no reemplaza nada). ¿Continuar?',
    'import.erroLeitura': 'No se pudo leer este archivo. Verificá que sea una exportación válida de Simple Finance.',
    'import.formatoInvalido': 'Formato inválido: se esperaba una lista de transacciones.',
    'import.csvSemColunas': 'Este CSV no parece ser una exportación de Simple Finance (faltan columnas obligatorias).',

    'lang.idioma': 'Idioma',
    'menu.moeda': 'Moneda',
    'footer.dados': 'Datos guardados localmente en el dispositivo. Usá el menú (≡) para importar/exportar.',

    'ganho.salario': 'Salario',
    'ganho.bonus': 'Bono',
    'ganho.venda': 'Venta',
    'ganho.outros': 'Otros',
  },
};

// Rótulos de exibição das categorias PADRÃO (só visual — o valor gravado no
// lançamento continua sempre o texto canônico em português, pra não quebrar
// filtros/dados já existentes nem a compatibilidade com o formato de import/export).
// Categorias digitadas livremente pelo usuário não são traduzidas (não tem como
// saber a tradução de um texto livre).
export const CATEGORIA_LABELS: Record<Lang, Dict> = {
  'pt-BR': {},
  en: {
    'Alimentação': 'Food',
    'Transporte': 'Transport',
    'Moradia': 'Housing',
    'Contas': 'Bills',
    'Saúde': 'Health',
    'Educação': 'Education',
    'Lazer': 'Leisure',
    'Assinaturas': 'Subscriptions',
    'Impostos': 'Taxes',
    'Investimentos': 'Investments',
    'Outros': 'Other',
    'Renda Fixa': 'Fixed Income',
    'Ações': 'Stocks',
    'Fundos': 'Funds',
    'Cripto': 'Crypto',
    'Tesouro': 'Treasury',
    'Caixa': 'Cash',
    'Salário': 'Salary',
    'Bônus': 'Bonus',
    'Venda': 'Sale',
  },
  es: {
    'Alimentação': 'Alimentación',
    'Transporte': 'Transporte',
    'Moradia': 'Vivienda',
    'Contas': 'Cuentas',
    'Saúde': 'Salud',
    'Educação': 'Educación',
    'Lazer': 'Ocio',
    'Assinaturas': 'Suscripciones',
    'Impostos': 'Impuestos',
    'Investimentos': 'Inversiones',
    'Outros': 'Otros',
    'Renda Fixa': 'Renta Fija',
    'Ações': 'Acciones',
    'Fundos': 'Fondos',
    'Cripto': 'Cripto',
    'Tesouro': 'Tesoro',
    'Caixa': 'Efectivo',
    'Salário': 'Salario',
    'Bônus': 'Bono',
    'Venda': 'Venta',
  },
};

export function catLabel(cat: string, lang: Lang): string {
  return CATEGORIA_LABELS[lang]?.[cat] ?? cat;
}
