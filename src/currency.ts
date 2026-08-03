// ---- Moeda ----
// Importante: isso troca só o SÍMBOLO e o FORMATO dos números (separador decimal/milhar),
// não faz conversão de câmbio nenhuma. Os valores continuam sendo os mesmos números que a
// pessoa digitou — só exibidos/digitados na convenção da moeda escolhida.

export type Currency = 'BRL' | 'USD' | 'EUR' | 'GBP';

export const SUPPORTED_CURRENCIES: Currency[] = ['BRL', 'USD', 'EUR', 'GBP'];

type CurrencyInfo = {
  symbol: string;
  locale: string; // usado só pra formatação de número (separador decimal/milhar), não é o idioma da interface
  decimalSep: ',' | '.';
  label: string;
};

export const CURRENCY_INFO: Record<Currency, CurrencyInfo> = {
  BRL: { symbol: 'R$', locale: 'pt-BR', decimalSep: ',', label: 'Real brasileiro' },
  USD: { symbol: '$', locale: 'en-US', decimalSep: '.', label: 'US Dollar' },
  EUR: { symbol: '€', locale: 'de-DE', decimalSep: ',', label: 'Euro' },
  GBP: { symbol: '£', locale: 'en-GB', decimalSep: '.', label: 'British Pound' },
};

const CURRENCY_STORAGE_KEY = 'simple-finance-v1-moeda';

// Chute inicial de moeda a partir do idioma detectado do aparelho — só pra não começar
// em branco; o usuário pode trocar a qualquer momento e essa escolha fica salva.
export function detectCurrency(): Currency {
  try {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (saved && (SUPPORTED_CURRENCIES as string[]).includes(saved)) return saved as Currency;
  } catch {}
  const navLang =
    (typeof navigator !== 'undefined' &&
      (navigator.language || (navigator as any).languages?.[0])) || 'pt-BR';
  const lower = navLang.toLowerCase();
  if (lower.startsWith('pt')) return 'BRL';
  if (lower.includes('gb')) return 'GBP';
  if (/^(de|fr|it|es-es|pt-pt|nl)/.test(lower)) return 'EUR';
  return 'USD';
}

export function saveCurrency(c: Currency) {
  try { localStorage.setItem(CURRENCY_STORAGE_KEY, c); } catch {}
}

// Formata um número pronto pra exibição: símbolo + separadores corretos da moeda.
export function formatMoney(n: number, currency: Currency): string {
  const info = CURRENCY_INFO[currency];
  return info.symbol + ' ' + n.toLocaleString(info.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Formata uma string de dígitos puros (ex.: "105050", que é 1050,50) enquanto a pessoa
// digita no campo de valor, já na convenção decimal da moeda escolhida.
export function formatMoneyInput(valorDigitado: string, currency: Currency): string {
  // Remove tudo que não for dígito — importante porque essa função recebe tanto o
  // texto "cru" (vindo do onChange, ex.: "10550") quanto o valor já formatado guardado
  // no estado (ex.: "1.050,50", quando o campo é redesenhado). Sem essa limpeza, o
  // parseInt abaixo para no primeiro caractere não-numérico e devolve um valor errado
  // — foi exatamente isso que quebrou a digitação depois que adicionamos suporte a moeda.
  const onlyDigits = valorDigitado.replace(/\D/g, '');
  if (!onlyDigits) return '';
  const number = parseInt(onlyDigits, 10);
  const info = CURRENCY_INFO[currency];
  return (number / 100).toLocaleString(info.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Caminho inverso: recebe o texto formatado (ex.: "1.050,50" ou "1,050.50" dependendo da
// moeda) e devolve o número de verdade, respeitando qual caractere é decimal e qual é milhar.
export function parseMoneyInput(formatted: string, currency: Currency): number {
  const info = CURRENCY_INFO[currency];
  let s = formatted;
  if (info.decimalSep === ',') {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }
  return parseFloat(s);
}
