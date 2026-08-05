import React, { useEffect, useMemo, useRef, useState } from "react";
import { DateRange } from 'react-date-range';
import { ptBR, enUS, es as esLocale } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AdMob, BannerAdPosition, BannerAdSize, AdmobConsentStatus } from '@capacitor-community/admob';
import { AD_IDS, TESTING_DEVICE_IDS, deveMostrarIntersticial } from './ads';
import { temVersaoSemAnuncios, comprarSemAnuncios, restaurarCompras } from './purchases';
import { Lang, detectLang, saveLang, translations, interpolate, LANG_LABELS, LANG_FLAGS, SUPPORTED_LANGS, catLabel } from './i18n';
import { Currency, detectCurrency, saveCurrency, formatMoney, formatMoneyInput, parseMoneyInput, CURRENCY_INFO, SUPPORTED_CURRENCIES } from './currency';
// Icons (inline SVG to evitar libs externas)
const IconCalendar = ({dark, ...props}:any) => (
  <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke={dark ? "#38bdf8" : "#0ea5e9"} strokeWidth={2} {...props}>
    <rect x="3" y="5" width="18" height="16" rx="3" stroke={dark ? "#38bdf8" : "#0ea5e9"} fill={dark ? "#1a2230" : "#e0f2fe"}/>
    <path d="M16 3v4M8 3v4" stroke={dark ? "#38bdf8" : "#0ea5e9"}/>
    <line x1="3" y1="9" x2="21" y2="9" stroke={dark ? "#38bdf8" : "#0ea5e9"}/>
    <rect x="7" y="13" width="2" height="2" rx="0.5" fill={dark ? "#38bdf8" : "#0ea5e9"}/>
    <rect x="11" y="13" width="2" height="2" rx="0.5" fill={dark ? "#38bdf8" : "#0ea5e9"}/>
    <rect x="15" y="13" width="2" height="2" rx="0.5" fill={dark ? "#38bdf8" : "#0ea5e9"}/>
  </svg>
);
const IconPlus = (props:any)=> (
  <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} {...props}><path d="M12 5v14M5 12h14"/></svg>
);
const IconMenu = (props:any)=> (
  <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} {...props}><path d="M4 6h16M4 12h16M4 18h16"/></svg>
);
const IconDownload = (props:any)=> (
  <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
);
const IconUpload = (props:any)=> (
  <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5-5 5 5"/><path d="M12 5v12"/></svg>
);
const IconTrash = (props:any)=> (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} {...props}><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);
function IconMoney(props:any) {
  return (
    <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="2" y="6" width="20" height="12" rx="3" stroke="#0ea5e9" fill="#e0f2fe"/>
      <circle cx="12" cy="12" r="3.5" stroke="#0ea5e9" fill="#bae6fd"/>
      <path d="M6 10v4M18 10v4" stroke="#0ea5e9"/>
    </svg>
  );
}

// Minimal icons for sun and moon
const IconSun = (props:any) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
);
const IconMoon = (props:any) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>
);

// ---- Types ----
// Também inclui 'investimento' mas não entra no saldo do caixa por padrão
 type Tipo = 'despesa' | 'ganho' | 'investimento';
 type Overrides = Record<string, { nome?: string; valor?: number; categoria?: string; observacoes?: string }>;
 type Entry = {
  id: string;
  tipo: Tipo;
  nome: string;
  valor: number; // positivo (R$)
  data: string; // ISO yyyy-mm-dd — data de início da série (ou data única, se não recorrente)
  categoria?: string;
  subcategoria?: string; // Nova subcategoria: fixa, parcelada, variável, outros
  observacoes?: string;
  criadoEm: number;
  numParcelas?: number; // Só Parcelada: total de parcelas da série
  ateData?: string; // Só Fixa: se definido, a série para de gerar ocorrências a partir desta data (exclusive)
  overrides?: Overrides; // Edições pontuais por data de ocorrência (yyyy-mm-dd) — usado em "editar apenas esta"
  datasExcluidas?: string[]; // Ocorrências excluídas individualmente (yyyy-mm-dd)
 };

 // Uma ocorrência é uma linha exibida na tabela (uma por mês/parcela), já com overrides aplicados.
 // baseId aponta pro Entry real dentro de `entries` — é o que editar()/remover() devem usar.
 type Ocorrencia = Entry & {
  baseId: string;
  ocorrenciaData: string; // data desta ocorrência específica (yyyy-mm-dd)
  parcelaIndex?: number; // 1-based, só Parcelada
  totalParcelas?: number; // só Parcelada
 };

 type Periodo = 'mensal' | 'semanal';
 type Pagina = 'lancamentos' | 'resumo' | 'investimentos';

 // ---- Helpers ----
 const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
 // Sempre interpreta uma data yyyy-mm-dd no fuso LOCAL (nunca UTC) — corrige o bug de "um dia a menos/a mais"
 const parseISO = (iso:string) => new Date(iso + 'T00:00:00');
 // Inverso: converte um Date para yyyy-mm-dd usando os componentes LOCAIS (nunca toISOString, que é UTC)
 const toISODateLocal = (d:Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
 };
 const addMonths = (d:Date, n:number) => { const r = new Date(d); r.setMonth(r.getMonth()+n); return r; };
 const fmtDM = (iso:string)=> {
  const d = parseISO(iso);
  return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0');
 };
 function startOfWeek(date: Date) { const d = new Date(date); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); d.setHours(0,0,0,0); return d; }
 function endOfWeek(date: Date) { const s = startOfWeek(date); const e = new Date(s); e.setDate(s.getDate()+6); e.setHours(23,59,59,999); return e; }
 function startOfMonth(date: Date) { const d = new Date(date.getFullYear(), date.getMonth(), 1); d.setHours(0,0,0,0); return d; }
 function endOfMonth(date: Date) { const d = new Date(date.getFullYear(), date.getMonth()+1, 0); d.setHours(23,59,59,999); return d; }
 const withinRange = (iso:string, ini:Date, fim:Date)=>{ const t = parseISO(iso).getTime(); return t>=ini.getTime() && t<=fim.getTime(); };

 const STORAGE_KEY = 'simple-finance-v1';
 const VISIBILITY_KEY = 'simple-finance-v1-valores-visiveis';
 const LIGHT = {
  bg: 'bg-[#f7fbff]',
  card: 'bg-white',
  text: 'text-slate-800',
  sub: 'text-slate-500',
  primary: 'from-cyan-500 to-blue-600',
  pill: 'bg-cyan-50 text-cyan-700 border border-cyan-100',
  accent: '#0ea5e9', // sky-500
 };
 const DARK = {
  bg: 'bg-[#10151b]',
  card: 'bg-[#1a2230]',
  text: 'text-slate-200',
  sub: 'text-slate-400',
  primary: 'from-cyan-700 to-blue-900',
  pill: 'bg-cyan-900 text-cyan-100 border border-cyan-800',
  accent: '#38bdf8',
};
 const CAT_CORES = ['#06b6d4','#22d3ee','#38bdf8','#60a5fa','#93c5fd','#7dd3fc','#0ea5e9','#2563eb','#0891b2'];
 const CATS_PADRAO = ['Alimentação','Transporte','Moradia','Contas','Saúde','Educação','Lazer','Assinaturas','Impostos','Investimentos','Outros'];
 const CATS_INVEST = ['Renda Fixa','Ações','Fundos','ETF','Cripto','Tesouro','Caixa'];

export default function App() {
  // Modal customizado para erros e confirmações
  const [modal, setModal] = useState<{type: 'error'|'confirm', message: string, onConfirm?: ()=>void, onCancel?: ()=>void} | null>(null);
  const [pagina, setPagina] = useState<Pagina>('lancamentos');
  // Ref para o input de busca
  const buscaInputRef = useRef<HTMLInputElement>(null);
  // Track if search input was focused before re-render
  const wasFocusedRef = useRef(false);
  // Corrige bug de foco: só foca ao trocar de página, nunca em cada render
  useEffect(() => {
    if (pagina === 'lancamentos' && buscaInputRef.current) {
      buscaInputRef.current.focus();
    }
  }, [pagina]);
  // Estado global para semana selecionada
  const [semanaSelecionadaGlobal, setSemanaSelecionadaGlobal] = useState<{inicio: string, fim: string} | null>(null);
  // Estado para mostrar o calendário de mês
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  // Filtros e busca
  const [filtroTipo, setFiltroTipo] = useState<Tipo|''>('');
  const [busca, setBusca] = useState('');
  // Edição — editandoId guarda o ID REAL do lançamento base (nunca o ID de exibição da ocorrência expandida)
  const [editandoId, setEditandoId] = useState<string|null>(null);
  // Estado para edição — carrega baseId/ocorrenciaData/parcelaIndex junto (ver tipo Ocorrencia)
  const [editData, setEditData] = useState<Ocorrencia|null>(null);
  // Modal de confirmação de escopo de edição
  const [showEditScopeModal, setShowEditScopeModal] = useState(false);
  const [pendingEditData, setPendingEditData] = useState<Ocorrencia|null>(null);
  const [pendingScope, setPendingScope] = useState<'single'|'all'|null>(null);
  // ---- Estado base ----
  const [entries, setEntries] = useState<Entry[]>([]);

  // Período
  const [periodo, setPeriodo] = useState<Periodo>('mensal');
  const [mesRef, setMesRef] = useState<string>(()=>{
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });
  const [dataRef, setDataRef] = useState<string>(()=> toISODateLocal(new Date()));
  // Adicione estado para intervalo de meses
  const [intervaloMeses, setIntervaloMeses] = useState<{inicio:string, fim:string}|null>(null);

  // Modal + formulário
  const [showModal, setShowModal] = useState(false);
  const [tipo, setTipo] = useState<Tipo>('despesa');
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState<string>('');
  const [data, setData] = useState<string>(()=> toISODateLocal(new Date()));
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [numParcelas, setNumParcelas] = useState(12);
  const [observacoes, setObservacoes] = useState('');

  // Menus/inputs escondidos
  const [menuOpen, setMenuOpen] = useState(false);
  const fileImportRef = useRef<HTMLInputElement|null>(null);

  // Olho mágico: quando false, oculta TODOS os valores monetários exibidos no app
  // (não afeta os campos de edição — lá o valor real precisa continuar visível pra editar)
  const [valoresVisiveis, setValoresVisiveis] = useState(true);

  // Modo noturno
  const [darkMode, setDarkMode] = useState(false);

  // Idioma: detecta automaticamente do aparelho (Windows/Android/iOS) na primeira
  // abertura; se o usuário trocar manualmente depois, essa escolha é lembrada.
  const [lang, setLang] = useState<Lang>(() => detectLang());
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  function t(key: string, vars?: Record<string, string | number>): string {
    const str = translations[lang]?.[key] ?? translations['pt-BR'][key] ?? key;
    return interpolate(str, vars);
  }
  function trocarIdioma(l: Lang) { setLang(l); saveLang(l); setLangMenuOpen(false); }
  const DATE_FNS_LOCALES = { 'pt-BR': ptBR, en: enUS, es: esLocale };
  const dateFnsLocale = DATE_FNS_LOCALES[lang];

  // Moeda: símbolo e formato dos números (não faz conversão de câmbio, só muda como
  // os valores são exibidos/digitados). Chute inicial a partir do idioma do aparelho,
  // troca manual fica salva.
  const [currency, setCurrency] = useState<Currency>(() => detectCurrency());
  function trocarMoeda(c: Currency) {
    // Se já tem um valor em digitação no formulário de adicionar (string formatada na
    // moeda antiga), reconverte pro formato da nova moeda antes de trocar — senão o
    // separador decimal fica errado e o número se corrompe.
    if (valor) {
      const numerico = parseMoneyInput(valor, currency);
      if (!isNaN(numerico)) setValor(formatMoneyInput(Math.round(numerico * 100).toString(), c));
    }
    setCurrency(c);
    saveCurrency(c);
  }
  // Importa o CSS do calendário dark apenas quando darkMode estiver ativo
  useEffect(() => {
    // Alterna o CSS do calendário dark conforme o tema
    const id = 'calendar-dark-style';
    const css = `
      .calendar-dark .rdrMonthPicker, .calendar-dark .rdrYearPicker {
        background: #1a2230 !important;
        color: #38bdf8 !important;
      }
      .calendar-dark .rdrNextButton, .calendar-dark .rdrPprevButton, .calendar-dark .rdrButton {
        background: #334155 !important;
        color: #38bdf8 !important;
        border-radius: 8px !important;
        border: none !important;
      }
      .calendar-dark .rdrNextButton svg, .calendar-dark .rdrPprevButton svg {
        stroke: #38bdf8 !important;
      }
      .calendar-dark .rdrMonthAndYearPickers select {
        background: #1a2230 !important;
        color: #38bdf8 !important;
      }
      .rdrCalendarWrapper {
        background: #1a2230 !important;
        color: #cbd5e1 !important;
        border-radius: 16px !important;
      }
      .rdrDateDisplayWrapper, .rdrMonthAndYearPickers, .rdrMonthPicker, .rdrYearPicker {
        background: #1a2230 !important;
        color: #38bdf8 !important;
      }
      .rdrDayNumber span {
        color: #cbd5e1 !important;
      }
      .rdrDayToday .rdrDayNumber span {
        color: #38bdf8 !important;
      }
      .rdrDayPassive {
        background: #10151b !important;
        color: #64748b !important;
      }
      .rdrDaySelected {
        background: #38bdf8 !important;
        color: #fff !important;
      }
      .rdrDayStartPreview, .rdrDayEndPreview, .rdrDayInPreview {
        box-shadow: none !important;
        background: transparent !important;
        color: #cbd5e1 !important;
      }
      .calendar-dark .rdrDayInPreview.rdrDayStartPreview {
        outline: 1.5px solid #38bdf8 !important;
        outline-offset: -2px !important;
        border-radius: 8px !important;
      }
      .rdrMonthAndYearPickers select {
        background: #1a2230 !important;
        color: #38bdf8 !important;
      }
      .rdrDayHovered {
        background: #334155 !important;
      }
    `;
    if (darkMode) {
      if (!document.getElementById(id)) {
        const style = document.createElement('style');
        style.id = id;
        style.innerHTML = css;
        document.head.appendChild(style);
      }
    } else {
      const styleTag = document.getElementById(id);
      if (styleTag) styleTag.remove();
    }
  }, [darkMode]);

  // Barra de status do celular (Android/iOS) acompanhando o tema — só tem efeito
  // rodando como app nativo via Capacitor; no navegador essa chamada é ignorada.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    (async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: darkMode ? '#10151b' : '#f7fbff' });
        // Nomenclatura da própria lib: Style.Dark = texto/ícones claros (pra fundo escuro),
        // Style.Light = texto/ícones escuros (pra fundo claro) — é o estilo do CONTEÚDO,
        // não da barra em si.
        await StatusBar.setStyle({ style: darkMode ? Style.Dark : Style.Light });
      } catch {
        // Ignora silenciosamente se o plugin não estiver disponível nessa plataforma
      }
    })();
  }, [darkMode]);

  // Anúncios (AdMob) — só roda em Android/iOS nativo, só pra quem NÃO comprou a
  // versão sem anúncios, e nunca trava o app se falhar (sem internet, plugin não
  // configurado, conta AdMob/RevenueCat não criada ainda etc).
  const [bannerAtivo, setBannerAtivo] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [verificandoCompra, setVerificandoCompra] = useState(true);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) { setVerificandoCompra(false); return; }
    (async () => {
      const pro = await temVersaoSemAnuncios();
      setIsPro(pro);
      setVerificandoCompra(false);
    })();
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || verificandoCompra || isPro) return;
    (async () => {
      try {
        await AdMob.initialize({ initializeForTesting: true, testingDevices: TESTING_DEVICE_IDS });

        // Fluxo de consentimento (GDPR/UMP) — exigido pelo Google antes de mostrar
        // qualquer anúncio, mesmo fora da Europa (o SDK decide sozinho se precisa
        // mostrar o formulário, conforme a região do usuário).
        const consentInfo = await AdMob.requestConsentInfo();
        if (consentInfo.isConsentFormAvailable && consentInfo.status === AdmobConsentStatus.REQUIRED) {
          await AdMob.showConsentForm();
        }

        await AdMob.showBanner({
          adId: AD_IDS.banner,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
        });
        setBannerAtivo(true);

        // Intersticial (tela cheia) só a cada N aberturas do app — ver src/ads.ts
        if (deveMostrarIntersticial()) {
          await AdMob.prepareInterstitial({ adId: AD_IDS.interstitial });
          await AdMob.showInterstitial();
        }
      } catch (e) {
        console.warn('AdMob não pôde ser inicializado (app continua normal, sem anúncio):', e);
      }
    })();
  }, [verificandoCompra, isPro]);

  // Se a pessoa comprar a versão sem anúncios enquanto o banner já está na tela,
  // remove ele na hora (sem precisar reabrir o app)
  useEffect(() => {
    if (isPro && bannerAtivo) {
      AdMob.removeBanner().catch(() => {});
      setBannerAtivo(false);
    }
  }, [isPro, bannerAtivo]);

  const [comprandoPro, setComprandoPro] = useState(false);
  async function handleComprarSemAnuncios() {
    setComprandoPro(true);
    const resultado = await comprarSemAnuncios();
    setComprandoPro(false);
    if (resultado.sucesso) {
      setIsPro(true);
      setMenuOpen(false);
      setModal({ type: 'error', message: t('pro.compraConcluida') });
    } else if (resultado.mensagem) {
      setModal({ type: 'error', message: resultado.mensagem });
    }
    // se resultado.mensagem for undefined e sucesso for false, a pessoa só cancelou a compra — não precisa de aviso nenhum
  }

  async function handleRestaurarCompra() {
    setComprandoPro(true);
    const restaurado = await restaurarCompras();
    setComprandoPro(false);
    setMenuOpen(false);
    if (restaurado) {
      setIsPro(true);
      setModal({ type: 'error', message: t('pro.compraConcluida') });
    } else {
      setModal({ type: 'error', message: t('pro.nadaParaRestaurar') });
    }
  }

  // ---- Load/Save ----
  useEffect(()=>{ try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) setEntries(JSON.parse(raw)); }catch{} },[]);
  useEffect(()=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }catch{} },[entries]);
  useEffect(()=>{ try{ const raw = localStorage.getItem(VISIBILITY_KEY); if(raw!==null) setValoresVisiveis(raw==='true'); }catch{} },[]);
  useEffect(()=>{ try{ localStorage.setItem(VISIBILITY_KEY, String(valoresVisiveis)); }catch{} },[valoresVisiveis]);

  // ---- Período atual ----
  const { inicio, fim } = useMemo(()=>{
    if(periodo==='mensal'){
      const [y,m] = mesRef.split('-').map(Number); const base = new Date(y, m-1, 1);
      return { inicio: startOfMonth(base), fim: endOfMonth(base) };
    } else {
      // Se semana selecionada global, use ela
      if (semanaSelecionadaGlobal?.inicio && semanaSelecionadaGlobal?.fim) {
        return {
          inicio: new Date(semanaSelecionadaGlobal.inicio + 'T00:00:00'),
          fim: new Date(semanaSelecionadaGlobal.fim + 'T23:59:59')
        };
      }
      const base = new Date(dataRef); return { inicio: startOfWeek(base), fim: endOfWeek(base) };
    }
  },[periodo, mesRef, dataRef, semanaSelecionadaGlobal]);

  // Lançamentos fixos/parcelados: gera uma "ocorrência" por mês/parcela dentro do período [ini, fim].
  // Cada ocorrência carrega baseId (o id real dentro de `entries`) — é isso que editar()/remover() usam,
  // nunca o `id` de exibição (que só existe pra servir de key no React).
  function expandirFixos(entries: Entry[], ini: Date, fim: Date): Ocorrencia[] {
    const result: Ocorrencia[] = [];
    const LIMITE_ITER = 1200; // ~100 anos de margem, evita loop infinito em caso de dado corrompido
    for (const e of entries) {
      if (e.subcategoria === 'Fixa') {
        const inicioSerie = parseISO(e.data);
        const limite = e.ateData ? parseISO(e.ateData) : null;
        let d = new Date(inicioSerie);
        let guard = 0;
        while (d < ini && guard < LIMITE_ITER) { d = addMonths(d, 1); guard++; }
        guard = 0;
        while (d <= fim && guard < LIMITE_ITER) {
          if (d >= inicioSerie && (!limite || d < limite)) {
            const iso = toISODateLocal(d);
            if (!e.datasExcluidas?.includes(iso)) {
              const ov = e.overrides?.[iso];
              result.push({
                ...e,
                id: `${e.id}::${iso}`,
                baseId: e.id,
                ocorrenciaData: iso,
                data: iso,
                nome: ov?.nome ?? e.nome,
                valor: ov?.valor ?? e.valor,
                categoria: ov?.categoria ?? e.categoria,
                observacoes: ov?.observacoes ?? e.observacoes,
              });
            }
          }
          d = addMonths(d, 1);
          guard++;
        }
      } else if (e.subcategoria === 'Parcelada') {
        const total = e.numParcelas || 1;
        const inicioSerie = parseISO(e.data);
        for (let i = 0; i < total; i++) {
          const d = addMonths(inicioSerie, i);
          if (d >= ini && d <= fim) {
            const iso = toISODateLocal(d);
            if (!e.datasExcluidas?.includes(iso)) {
              const ov = e.overrides?.[iso];
              result.push({
                ...e,
                id: `${e.id}::${iso}`,
                baseId: e.id,
                ocorrenciaData: iso,
                data: iso,
                parcelaIndex: i + 1,
                totalParcelas: total,
                nome: ov?.nome ?? e.nome, // sufixo "i/total" é só de EXIBIÇÃO — ver nomeExibido()
                valor: ov?.valor ?? e.valor,
                categoria: ov?.categoria ?? e.categoria,
                observacoes: ov?.observacoes ?? e.observacoes,
              });
            }
          }
        }
      } else {
        if (withinRange(e.data, ini, fim)) {
          result.push({ ...e, baseId: e.id, ocorrenciaData: e.data });
        }
      }
    }
    return result;
  }
  // Nome exibido na tabela: acrescenta "i/total" só visualmente para Parceladas, sem sujar o campo editável
  function nomeExibido(oc: Ocorrencia) {
    return oc.subcategoria === 'Parcelada' && oc.parcelaIndex && oc.totalParcelas
      ? `${oc.nome} ${oc.parcelaIndex}/${oc.totalParcelas}`
      : oc.nome;
  }
  const visiveis = useMemo(()=> {
    let ini: Date, fim: Date;
    if (periodo === 'semanal' && semanaSelecionadaGlobal?.inicio && semanaSelecionadaGlobal?.fim) {
      // Filtro semanal: usa semanaSelecionadaGlobal
      const [iy, im, id] = semanaSelecionadaGlobal.inicio.split('-').map(Number);
      const [fy, fm, fd] = semanaSelecionadaGlobal.fim.split('-').map(Number);
      ini = new Date(iy, im-1, id);
      ini.setHours(0,0,0,0);
      fim = new Date(fy, fm-1, fd);
      fim.setHours(23,59,59,999);
    } else if (intervaloMeses?.inicio && intervaloMeses?.fim) {
      // Filtro por intervalo de datas
      const [iy, im, id] = intervaloMeses.inicio.split('-').map(Number);
      const [fy, fm, fd] = intervaloMeses.fim.split('-').map(Number);
      ini = new Date(iy, im-1, id);
      ini.setHours(0,0,0,0);
      fim = new Date(fy, fm-1, fd);
      fim.setHours(23,59,59,999);
    } else {
      // Se não há intervalo, mostra o mês inteiro do período atual
      ini = startOfMonth(inicio);
      fim = endOfMonth(inicio);
    }
    return expandirFixos(entries, ini, fim);
  }, [entries, inicio, fim, intervaloMeses]);
  // Filtro por tipo e busca
  const caixa = useMemo(()=> {
    let arr = visiveis.filter(e=> e.tipo!=='investimento');
    if (filtroTipo) arr = arr.filter(e=> e.tipo===filtroTipo);
    if (busca.trim()) {
      const b = busca.trim().toLowerCase();
      arr = arr.filter(e=>
        e.nome.toLowerCase().includes(b) ||
        (e.categoria||'').toLowerCase().includes(b) ||
        (e.subcategoria||'').toLowerCase().includes(b)
      );
    }
    return arr;
  }, [visiveis, filtroTipo, busca]);
  const invest = useMemo(()=> visiveis.filter(e=> e.tipo==='investimento'), [visiveis]);

  const totais = useMemo(()=>{
    const ganhos = caixa.filter(e=> e.tipo==='ganho').reduce((s,e)=> s+e.valor,0);
    const despesas = caixa.filter(e=> e.tipo==='despesa').reduce((s,e)=> s+e.valor,0);
    return { ganhos, despesas, saldo: ganhos - despesas };
  },[caixa]);

  // Saldo acumulado
  const saldoAcumulado = useMemo(() => {
    const ganhos = entries.filter(e => e.tipo === 'ganho').reduce((s, e) => s + e.valor, 0);
    const despesas = entries.filter(e => e.tipo === 'despesa').reduce((s, e) => s + e.valor, 0);
    return ganhos - despesas;
  }, [entries]);

  // Série diária para evolução (linha suave)
  const serieEvolucao = useMemo(()=>{
    const map = new Map<string, number>();
    const d = new Date(inicio);
    while(d.getTime()<=fim.getTime()){
      const iso = toISODateLocal(d); map.set(iso,0); d.setDate(d.getDate()+1);
    }
    for(const e of caixa){ const k=e.data; if(map.has(k)) map.set(k, (map.get(k)||0) + (e.tipo==='ganho'? e.valor : -e.valor)); }
    // acumular
    let acc = 0; const arr:{dia:string, saldo:number}[]=[];
    for(const [iso, net] of Array.from(map.entries()).sort()){
      acc += net; arr.push({ dia: fmtDM(iso), saldo: acc });
    }
    return arr;
  },[caixa, inicio, fim]);

  // Donut por categoria (despesas)
  const donutDespesas = useMemo(()=>{
    const map = new Map<string, number>();
    for(const e of caixa){ if(e.tipo==='despesa'){ const k=(e.categoria||'(sem)'); map.set(k,(map.get(k)||0)+e.valor);} }
    const arr = Array.from(map.entries()).map(([name, value])=>({ name, value }));
    arr.sort((a,b)=> b.value-a.value);
    return arr;
  },[caixa]);

  // Soma todos os investimentos dos meses anteriores (até o mês atual)
  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const totalInvestido = useMemo(() => {
    return entries.filter(e => e.tipo === 'investimento')
      .reduce((s, e) => s + e.valor, 0);
  }, [entries]);

  // Mostra o valor normalmente, ou uma máscara quando o olho mágico está fechado.
  // Usado em TODA exibição de valor monetário do app (cards, tabelas, gráficos).
  // Não é usado dentro do formulário/modal de edição — lá o valor real precisa
  // ficar visível pra dar pra editar.
  function toBRLMask(n:number){
    return valoresVisiveis ? formatMoney(n, currency) : (CURRENCY_INFO[currency].symbol + ' ••••••');
  }

  // ---- Ações ----
  function resetForm(){ setNome(''); setValor(''); setCategoria(''); setSubcategoria(''); setObservacoes(''); setTipo('despesa'); setData(toISODateLocal(new Date())); setNumParcelas(12); }

  // Permitir valor zero na adição também
  function addEntry(){
  // Aceita o valor formatado na convenção decimal da moeda escolhida (vírgula ou ponto)
  let v = parseMoneyInput(valor, currency);
  if(!nome.trim()) {
    setModal({ type: 'error', message: t('form.deNome') });
    return;
  }
  if(!data) {
    setModal({ type: 'error', message: t('form.informeData') });
    return;
  }
  if(isNaN(v) || v < 0) {
    setModal({ type: 'error', message: t('form.valorInvalido') });
    return;
  }
  const novo: Entry = { id: uid(), tipo, nome: nome.trim(), valor: v, data, categoria: categoria.trim()||undefined, subcategoria: subcategoria.trim()||undefined, observacoes: observacoes.trim()||undefined, criadoEm: Date.now(), numParcelas: subcategoria==='Parcelada' ? numParcelas : undefined };
  setEntries(prev=> [novo, ...prev]);
  setShowModal(false); resetForm();
}

  function fecharModalEdicao(){
    setShowModal(false);
    setEditandoId(null);
    setEditData(null);
    resetForm();
  }

  // Edição de lançamento — sempre opera sobre editData.baseId (o id real dentro de `entries`),
  // nunca sobre o id de exibição da ocorrência expandida (que tem sufixo "::yyyy-mm-dd" e nunca existe em `entries`).
  function salvarEdicao(){
    if(!editandoId || !editData) return;
    let v: number;
    if (typeof editData.valor === 'string') {
      v = parseMoneyInput(editData.valor as unknown as string, currency);
    } else {
      v = Number(editData.valor);
    }
    if(!editData.nome.trim()) {
      setModal({ type: 'error', message: t('form.deNome') });
      return;
    }
    if(isNaN(v) || v < 0) {
      setModal({ type: 'error', message: t('form.valorInvalido') });
      return;
    }
    // Se for Fixa ou Parcelada, pergunta o escopo antes de aplicar
    if(editData.subcategoria === 'Fixa' || editData.subcategoria === 'Parcelada') {
      setPendingEditData({ ...editData, valor: v });
      setShowEditScopeModal(true);
      return;
    }
    // Lançamento normal (não recorrente): edita direto pelo baseId
    setEntries(prev => prev.map(e => e.id === editandoId ? {
      ...e,
      nome: editData.nome.trim(),
      valor: v,
      data: editData.data,
      categoria: editData.categoria?.trim() || undefined,
      subcategoria: editData.subcategoria?.trim() || undefined,
      observacoes: editData.observacoes?.trim() || undefined,
    } : e));
    fecharModalEdicao();
  }

  // Aplica a edição de uma Fixa/Parcelada conforme o escopo escolhido no modal
  function aplicarEdicaoRecorrente(scope: 'single'|'all') {
    if(!pendingEditData) return;
    const { baseId, ocorrenciaData, parcelaIndex } = pendingEditData;
    const novosCampos = {
      nome: pendingEditData.nome.trim(),
      valor: pendingEditData.valor,
      categoria: pendingEditData.categoria?.trim() || undefined,
      observacoes: pendingEditData.observacoes?.trim() || undefined,
    };

    setEntries(prev => {
      const base = prev.find(e => e.id === baseId);
      if(!base) return prev;

      if(scope === 'single') {
        // Só esta ocorrência: grava um override pontual, a série continua igual pro resto
        return prev.map(e => e.id === baseId ? {
          ...e,
          overrides: { ...(e.overrides||{}), [ocorrenciaData]: novosCampos },
        } : e);
      }

      // scope === 'all' (editar esta e todas as seguintes)
      if(base.subcategoria === 'Fixa') {
        if(ocorrenciaData === base.data) {
          // é a própria primeira ocorrência da série: atualiza a série inteira, sem precisar dividir
          return prev.map(e => e.id === baseId ? { ...e, ...novosCampos } : e);
        }
        // Encerra a série antiga no dia anterior a esta ocorrência e começa uma nova série a partir dela
        const baseEncerrada: Entry = { ...base, ateData: ocorrenciaData };
        const novaSerie: Entry = {
          id: uid(), tipo: base.tipo, subcategoria: 'Fixa',
          data: ocorrenciaData, criadoEm: Date.now(),
          ...novosCampos,
        };
        return prev.map(e => e.id === baseId ? baseEncerrada : e).concat(novaSerie);
      }

      if(base.subcategoria === 'Parcelada') {
        const total = base.numParcelas || 1;
        const idx = parcelaIndex || 1;
        if(idx <= 1) {
          // é a primeira parcela: atualiza a série inteira
          return prev.map(e => e.id === baseId ? { ...e, ...novosCampos } : e);
        }
        // Encurta a série antiga até a parcela anterior e cria uma nova série a partir desta parcela
        const baseEncurtada: Entry = { ...base, numParcelas: idx - 1 };
        const novaSerie: Entry = {
          id: uid(), tipo: base.tipo, subcategoria: 'Parcelada',
          data: ocorrenciaData, numParcelas: total - idx + 1, criadoEm: Date.now(),
          ...novosCampos,
        };
        return prev.map(e => e.id === baseId ? baseEncurtada : e).concat(novaSerie);
      }

      return prev;
    });

    setShowEditScopeModal(false);
    setPendingEditData(null);
    setPendingScope(null);
    fecharModalEdicao();
  }

  // Exclusão de lançamento — para Fixa/Parcelada, remove só a ocorrência clicada (via datasExcluidas),
  // preservando o resto da série. Para lançamento normal, remove o registro inteiro.
  function remover(oc: Ocorrencia){
    const recorrente = oc.subcategoria === 'Fixa' || oc.subcategoria === 'Parcelada';
    setModal({
      type: 'confirm',
      message: recorrente ? t('modal.excluirOcorrencia') : t('modal.excluirLancamento'),
      onConfirm: () => {
        setEntries(prev => recorrente
          ? prev.map(e => e.id === oc.baseId
              ? { ...e, datasExcluidas: [...(e.datasExcluidas||[]), oc.ocorrenciaData] }
              : e)
          : prev.filter(e => e.id !== oc.baseId)
        );
        setModal(null);
      },
      onCancel: () => setModal(null)
    });
  }
  function limparTudo(){
    setModal({
      type: 'confirm',
      message: t('modal.removerTudo'),
      onConfirm: () => { setEntries([]); setModal(null); },
      onCancel: () => setModal(null)
    });
  }
  // Modal visual customizado
  const renderModal = () => {
    if (!modal) return null;
    return (
      <AnimatePresence>
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-slate-900/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={()=>setModal(null)}/>
          <motion.div className={`relative z-10 w-full max-w-xs rounded-2xl ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'} shadow-xl p-6 flex flex-col items-center`} initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
            <div className="mb-4 text-center text-lg font-semibold">{modal.type === 'error' ? t('modal.atencao') : t('modal.confirmacao')}</div>
            <div className="mb-6 text-center text-base">{modal.message}</div>
            {modal.type === 'error' ? (
              <button onClick={()=>setModal(null)} className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md">{t('btn.ok')}</button>
            ) : (
              <div className="flex gap-4 justify-center">
                <button onClick={()=>{modal.onConfirm && modal.onConfirm();}} className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-rose-500 to-rose-700 shadow-md">{t('btn.sim')}</button>
                <button onClick={()=>{modal.onCancel && modal.onCancel();}} className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-slate-500 to-slate-700 shadow-md">{t('btn.nao')}</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // ---- Exportar/Importar ----
  // Exporta TUDO (inclusive estrutura de recorrência) — é o formato de backup completo
  function exportarJSON(){
    const blob = new Blob([JSON.stringify(entries, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='simple-finance.json'; a.click();
    URL.revokeObjectURL(url);
  }

  // Escapa um campo pro padrão CSV: entre aspas se contiver ; " ou quebra de linha, dobrando aspas internas
  function csvEscape(v: string): string {
    if (v == null) return '';
    const precisaAspas = /[;"\n\r]/.test(v);
    const escapado = v.replace(/"/g, '""');
    return precisaAspas ? `"${escapado}"` : escapado;
  }

  const CSV_COLUNAS = ['id','tipo','nome','valor','data','categoria','subcategoria','numParcelas','ateData','observacoes','overrides','datasExcluidas','criadoEm'] as const;

  // CSV completo: dá pra abrir no Excel/Sheets normalmente (as colunas normais são legíveis);
  // "overrides" e "datasExcluidas" carregam JSON dentro da célula só pra permitir restaurar
  // 100% do estado depois — não precisam ser editadas manualmente.
  function exportarCSV(){
    const header = CSV_COLUNAS.join(';');
    const linhas = entries.map(e => CSV_COLUNAS.map(col => {
      switch(col){
        case 'valor': return String(e.valor).replace('.', ',');
        case 'numParcelas': return e.numParcelas != null ? String(e.numParcelas) : '';
        case 'overrides': return e.overrides ? JSON.stringify(e.overrides) : '';
        case 'datasExcluidas': return e.datasExcluidas?.length ? JSON.stringify(e.datasExcluidas) : '';
        case 'criadoEm': return String(e.criadoEm);
        default: return (e as any)[col] ?? '';
      }
    }).map(v => csvEscape(String(v))).join(';'));
    // \r\n é o padrão real de quebra de linha do CSV (RFC 4180) — antes o código usava
    // o texto literal "\n" (barra + letra n) em vez de uma quebra de linha de verdade,
    // o que corrompia o arquivo inteiro numa única linha.
    const csv = [header, ...linhas].join('\r\n');
    // BOM (\uFEFF) no início: sem isso o Excel abre acentuação (ç, ã, é...) corrompida
    const blob = new Blob(['\uFEFF' + csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='simple-finance.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  // Parser de CSV completo: processa o texto inteiro de uma vez (não linha por linha),
  // então um campo entre aspas pode conter ; ou até quebras de linha reais sem quebrar o parsing
  // (ex.: uma observação com múltiplas linhas). Retorna uma lista de linhas, cada uma já
  // dividida em colunas.
  function parseCSV(texto: string): string[][] {
    const text = texto.replace(/^\uFEFF/, '');
    const rows: string[][] = []; let row: string[] = []; let cur = ''; let dentroAspas = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (dentroAspas) {
        if (c === '"') { if (text[i+1] === '"') { cur += '"'; i++; } else dentroAspas = false; }
        else cur += c;
      } else {
        if (c === '"') dentroAspas = true;
        else if (c === ';') { row.push(cur); cur = ''; }
        else if (c === '\r') { /* ignora, \n cuida da quebra de linha */ }
        else if (c === '\n') { row.push(cur); cur = ''; rows.push(row); row = []; }
        else cur += c;
      }
    }
    if (cur.length > 0 || row.length > 0) { row.push(cur); rows.push(row); }
    return rows.filter(r => !(r.length === 1 && r[0].trim() === ''));
  }

  const TIPOS_VALIDOS: Tipo[] = ['despesa','ganho','investimento'];

  // Valida e converte um JSON exportado pelo app numa lista de Entry prontos pra importar.
  // IDs são sempre regenerados (uid()) pra nunca colidir com o que já existe.
  function parseImportJSON(texto: string): Entry[] {
    const raw = JSON.parse(texto);
    if (!Array.isArray(raw)) throw new Error(t('import.formatoInvalido'));
    const out: Entry[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      if (!TIPOS_VALIDOS.includes(item.tipo)) continue;
      if (typeof item.nome !== 'string' || !item.nome.trim()) continue;
      const valor = Number(item.valor);
      if (isNaN(valor) || valor < 0) continue;
      if (typeof item.data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.data)) continue;
      out.push({
        id: uid(),
        tipo: item.tipo,
        nome: String(item.nome).trim(),
        valor,
        data: item.data,
        categoria: item.categoria || undefined,
        subcategoria: item.subcategoria || undefined,
        observacoes: item.observacoes || undefined,
        criadoEm: typeof item.criadoEm === 'number' ? item.criadoEm : Date.now(),
        numParcelas: typeof item.numParcelas === 'number' ? item.numParcelas : undefined,
        ateData: typeof item.ateData === 'string' ? item.ateData : undefined,
        overrides: item.overrides && typeof item.overrides === 'object' ? item.overrides : undefined,
        datasExcluidas: Array.isArray(item.datasExcluidas) ? item.datasExcluidas : undefined,
      });
    }
    return out;
  }

  // Mesma ideia, lendo do CSV completo (com as colunas técnicas de overrides/datasExcluidas).
  // Também aceita um CSV "simples" (só tipo;nome;valor;data;categoria;...) — nesse caso os
  // lançamentos viram normais/não-recorrentes, já que a info de recorrência não existe nele.
  function parseImportCSV(texto: string): Entry[] {
    const linhas = parseCSV(texto);
    if (linhas.length < 2) return [];
    const header = linhas[0].map(h => h.trim());
    const idx = (col: string) => header.indexOf(col);
    const iTipo = idx('tipo'), iNome = idx('nome'), iValor = idx('valor'), iData = idx('data');
    if (iTipo < 0 || iNome < 0 || iValor < 0 || iData < 0) {
      throw new Error(t('import.csvSemColunas'));
    }
    const iCategoria = idx('categoria'), iSub = idx('subcategoria'), iNumParcelas = idx('numParcelas');
    const iAteData = idx('ateData'), iObs = idx('observacoes'), iOverrides = idx('overrides');
    const iDatasExcluidas = idx('datasExcluidas'), iCriadoEm = idx('criadoEm');

    const out: Entry[] = [];
    for (let i = 1; i < linhas.length; i++) {
      const cols = linhas[i];
      const tipo = cols[iTipo] as Tipo;
      if (!TIPOS_VALIDOS.includes(tipo)) continue;
      const nome = cols[iNome]?.trim();
      if (!nome) continue;
      const valor = parseFloat((cols[iValor]||'').replace(',', '.'));
      if (isNaN(valor) || valor < 0) continue;
      const data = cols[iData];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data||'')) continue;
      let overrides: Overrides|undefined;
      if (iOverrides >= 0 && cols[iOverrides]) { try { overrides = JSON.parse(cols[iOverrides]); } catch {} }
      let datasExcluidas: string[]|undefined;
      if (iDatasExcluidas >= 0 && cols[iDatasExcluidas]) { try { datasExcluidas = JSON.parse(cols[iDatasExcluidas]); } catch {} }
      out.push({
        id: uid(),
        tipo,
        nome,
        valor,
        data,
        categoria: (iCategoria >= 0 && cols[iCategoria]) || undefined,
        subcategoria: (iSub >= 0 && cols[iSub]) || undefined,
        numParcelas: (iNumParcelas >= 0 && cols[iNumParcelas]) ? Number(cols[iNumParcelas]) : undefined,
        ateData: (iAteData >= 0 && cols[iAteData]) || undefined,
        observacoes: (iObs >= 0 && cols[iObs]) || undefined,
        overrides,
        datasExcluidas,
        criadoEm: (iCriadoEm >= 0 && cols[iCriadoEm]) ? Number(cols[iCriadoEm]) : Date.now(),
      });
    }
    return out;
  }

  // Dispara a leitura do arquivo escolhido (.json ou .csv) e, se válido, pergunta antes de importar.
  // Importar sempre ADICIONA aos lançamentos existentes — nunca substitui (pra isso já existe "Limpar tudo").
  function handleImportFile(file: File){
    const nomeArquivo = file.name.toLowerCase();
    const isJSON = nomeArquivo.endsWith('.json');
    const isCSV = nomeArquivo.endsWith('.csv');
    if(!isJSON && !isCSV){
      setModal({ type: 'error', message: t('import.tipoInvalido') });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const texto = String(reader.result);
        const novos = isJSON ? parseImportJSON(texto) : parseImportCSV(texto);
        if(!novos.length){
          setModal({ type: 'error', message: t('import.nenhumValido') });
          return;
        }
        setModal({
          type: 'confirm',
          message: t('import.confirmacao', { count: novos.length }),
          onConfirm: () => { setEntries(prev => [...novos, ...prev]); setModal(null); },
          onCancel: () => setModal(null),
        });
      } catch (err: any) {
        setModal({ type: 'error', message: err?.message || t('import.erroLeitura') });
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  // ---- UI helpers ----
  const NavButton = ({active, children, onClick}:{active:boolean, children:any, onClick:()=>void}) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-2xl transition border-0 shadow-none
  ${active ? (darkMode ? 'bg-gradient-to-r from-cyan-700 to-blue-900 text-white scale-105 shadow-md' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white scale-105 shadow-md') : (darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white/70 text-slate-600 hover:bg-white')}`}>{children}</button>
  );

  const Pill = ({label, active, onClick}:{label:string, active:boolean, onClick:()=>void}) => (
  <button onClick={onClick} className={`px-3 py-1 rounded-full text-sm mr-2 mb-2 border-0 shadow-none transition-all duration-200 ease-in-out
  ${active? (darkMode ? 'bg-cyan-800 text-cyan-100 scale-105 shadow-md' : 'bg-cyan-600 text-white scale-105 shadow-md') : (darkMode ? DARK.pill : LIGHT.pill)+' hover:scale-105 hover:shadow'}`}>{label}</button>
  );

  const Card = ({children}:{children:any}) => (
    <div className={`rounded-2xl ${THEME.card} shadow-sm p-4 transition-colors duration-200`}>{children}</div>
  );

  // ---- Componentes de página ----
  function Header(){
    return (
      <div className="sticky top-0 z-20 w-full">
        <div className={`backdrop-blur supports-[backdrop-filter]:${darkMode ? 'bg-[#10151b] border-b border-slate-800' : 'bg-[#f7fbff] border-b'}`}> 
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="hidden md:flex gap-2">
                <NavButton active={pagina==='lancamentos'} onClick={()=>setPagina('lancamentos')}>{t('nav.lancamentos')}</NavButton>
                <NavButton active={pagina==='resumo'} onClick={()=>setPagina('resumo')}>{t('nav.resumo')}</NavButton>
                <NavButton active={pagina==='investimentos'} onClick={()=>setPagina('investimentos')}>{t('nav.investimentos')}</NavButton>
              </div>
              <div className="relative">
                <button onClick={()=>setMenuOpen(v=>!v)} className={`p-2 rounded-xl shadow border ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}> <IconMenu/> </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      className={`absolute left-0 mt-2 w-64 sm:w-56 rounded-2xl shadow-lg p-2 z-30 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border text-slate-800'}`}
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      style={{ minWidth: '200px', maxWidth: '90vw' }}
                    >
                      <div className="px-3 py-1 text-xs text-slate-500">{t('lang.idioma')}</div>
                      <div className="flex gap-1 px-2 pb-2">
                        {SUPPORTED_LANGS.map(l => (
                          <button key={l} onClick={()=>trocarIdioma(l)} title={LANG_LABELS[l]}
                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-sm border transition
                              ${lang===l
                                ? (darkMode ? 'bg-cyan-800 text-cyan-100 border-cyan-700' : 'bg-cyan-50 text-cyan-800 border-cyan-200')
                                : (darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50')}`}>
                            <span className="text-base leading-none">{LANG_FLAGS[l]}</span>
                          </button>
                        ))}
                      </div>
                      <hr className="my-2"/>
                      <div className="px-3 py-1 text-xs text-slate-500">{t('menu.moeda')}</div>
                      <div className="flex gap-1 px-2 pb-2">
                        {SUPPORTED_CURRENCIES.map(c => (
                          <button key={c} onClick={()=>trocarMoeda(c)} title={CURRENCY_INFO[c].label}
                            className={`flex-1 flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl text-xs border transition
                              ${currency===c
                                ? (darkMode ? 'bg-cyan-800 text-cyan-100 border-cyan-700' : 'bg-cyan-50 text-cyan-800 border-cyan-200')
                                : (darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50')}`}>
                            <span className="text-base leading-none font-semibold">{CURRENCY_INFO[c].symbol}</span>
                            <span className="leading-none">{c}</span>
                          </button>
                        ))}
                      </div>
                      <hr className="my-2"/>
                      <div className="px-3 py-1 text-xs text-slate-500">{t('menu.dados')}</div>
                      <button onClick={()=>{ setMenuOpen(false); fileImportRef.current?.click(); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}><IconDownload/> {t('menu.importar')}</button>
                      <button onClick={exportarJSON} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}><IconUpload/> {t('menu.exportarJson')}</button>
                      <button onClick={exportarCSV} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}><IconUpload/> {t('menu.exportarCsv')}</button>
                      <hr className="my-2"/>
                      {Capacitor.isNativePlatform() && (
                        <>
                          <hr className="my-2"/>
                          {isPro ? (
                            <div className={`px-3 py-2 text-sm flex items-center gap-2 ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                              💙 {t('pro.ativo')}
                            </div>
                          ) : (
                            <>
                              <button disabled={comprandoPro} onClick={handleComprarSemAnuncios} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} disabled:opacity-50`}>
                                💙 {t('menu.removerAnuncios')}
                              </button>
                              <button disabled={comprandoPro} onClick={handleRestaurarCompra} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'} disabled:opacity-50`}>
                                {t('menu.restaurarCompra')}
                              </button>
                            </>
                          )}
                        </>
                      )}
                      <hr className="my-2"/>
                      <button onClick={limparTudo} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-700"><IconTrash/> {t('menu.limparTudo')}</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {/* Botão modo claro/escuro dentro do header */}
            <button onClick={()=>setDarkMode(v=>!v)} className={`w-12 h-12 flex items-center justify-center rounded-full border shadow-lg transition-colors duration-200
              ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
              title={darkMode ? t('tema.claro') : t('tema.escuro')}>
              {darkMode ? <IconMoon/> : <IconSun/>}
            </button>
          </div>
        </div>
        {/* nav móvel */}
        <div className="md:hidden bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
          <div className="max-w-6xl mx-auto px-4 py-2 flex gap-2">
            <button onClick={()=>setPagina('lancamentos')} className={`px-3 py-2 rounded-xl ${pagina==='lancamentos'?'bg-white/20':''}`}>{t('nav.lancamentos')}</button>
            <button onClick={()=>setPagina('resumo')} className={`px-3 py-2 rounded-xl ${pagina==='resumo'?'bg-white/20':''}`}>{t('nav.resumo')}</button>
            <button onClick={()=>setPagina('investimentos')} className={`px-3 py-2 rounded-xl ${pagina==='investimentos'?'bg-white/20':''}`}>{t('nav.investimentos')}</button>
          </div>
        </div>
      </div>
    );
  }

  function SeletorPeriodo({ investimentos }: { investimentos?: boolean }) {
  const [showRangePicker, setShowRangePicker] = useState(false);
  // Semana temporária para seleção (semanal)
  const [semanaTemp, setSemanaTemp] = useState<{inicio: string, fim: string} | null>(null);
  // Intervalo de datas temporário (mensal)
  const [rangeTemp, setRangeTemp] = useState<{inicio: string, fim: string} | null>(null);
    const ganhos = investimentos ? 0 : totais.ganhos;
    const despesas = investimentos ? 0 : totais.despesas;
  const saldo = investimentos ? invest.reduce((s, e) => s + e.valor, 0) : totais.saldo;

    // Saldo acumulado acima do Card, alinhado à direita
    return (
      <>
        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">{t('resumo.saldoAcumulado')}</span>
            <button onClick={()=>setValoresVisiveis(v=>!v)} className={`p-1 rounded-full border shadow transition
  ${darkMode ? 'bg-slate-800 text-sky-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-sky-600 border-slate-200 hover:bg-slate-100'}`}
  title={valoresVisiveis ? t('olho.ocultar') : t('olho.exibir')}>
              {valoresVisiveis ? (
                <svg width="22" height="22" fill="none" stroke="#0ea5e9" strokeWidth="2"><ellipse cx="11" cy="11" rx="8" ry="6"/><circle cx="11" cy="11" r="2.5"/></svg>
              ) : (
                <svg width="22" height="22" fill="none" stroke="#94a3b8" strokeWidth="2"><ellipse cx="11" cy="11" rx="8" ry="6"/><line x1="4" y1="18" x2="18" y2="4"/></svg>
              )}
            </button>
              <span className={`font-bold text-lg ml-2 ${darkMode ? 'text-sky-300' : 'text-sky-600'}`}>
                {toBRLMask(saldoAcumulado)}
              </span>
          </div>
        </div>
        <Card>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <div className="text-sm text-slate-500">{t('periodo.periodo')}</div>
              <div className="mt-1 flex gap-2">
                <button
                  onClick={()=>setPeriodo('mensal')}
                  className={`px-3 py-2 rounded-xl border-0 shadow-none transition
                    ${periodo==='mensal' ? (darkMode ? 'bg-gradient-to-r from-cyan-700 to-blue-900 text-white' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white') : (darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-white')}`}
                >
                  {t('periodo.mensal')}
                </button>
                <button
                  onClick={()=>setPeriodo('semanal')}
                  className={`px-3 py-2 rounded-xl border-0 shadow-none transition
                    ${periodo==='semanal' ? (darkMode ? 'bg-gradient-to-r from-cyan-700 to-blue-900 text-white' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white') : (darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-white')}`}
                >
                  {t('periodo.semanal')}
                </button>
              </div>
            </div>
            {periodo==='mensal' ? (
              null
            ) : (
              <div>
                <div className="text-sm text-slate-500 mb-2">{t('periodo.semana')}</div>
                <div className="flex gap-2 items-center relative">
                  <button
                    className={`px-3 py-2 rounded-xl border w-[260px] text-left truncate flex items-center gap-2 ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-800 border-slate-200'}`}
                    onClick={()=>setShowRangePicker(v=>!v)}
                  >
                    <IconCalendar dark={darkMode}/>
                    <span>
                      {semanaSelecionadaGlobal?.inicio && semanaSelecionadaGlobal?.fim
                        ? `${semanaSelecionadaGlobal.inicio.split('-').reverse().join('/')} - ${semanaSelecionadaGlobal.fim.split('-').reverse().join('/')}`
                        : t('periodo.selecioneSemana')}
                    </span>
                  </button>
                  {showRangePicker && (
                    <div
                      className={darkMode ? 'calendar-dark' : ''}
                      style={{
                        position: 'absolute',
                        top: '110%',
                        left: 0,
                        zIndex: 20,
                        boxShadow: '0 4px 24px #0002',
                        background: darkMode ? '#1a2230' : '#fff',
                        borderRadius: '16px',
                        padding: '16px',
                        minWidth: '340px'
                      }}
                    >
                      <DateRange
                        ranges={[{
                          startDate: semanaTemp?.inicio ? new Date(semanaTemp.inicio + 'T12:00:00') : semanaSelecionadaGlobal?.inicio ? new Date(semanaSelecionadaGlobal.inicio + 'T12:00:00') : new Date(),
                          endDate: semanaTemp?.fim ? new Date(semanaTemp.fim + 'T12:00:00') : semanaSelecionadaGlobal?.fim ? new Date(semanaSelecionadaGlobal.fim + 'T12:00:00') : new Date(),
                          key: 'selection',
                        }]}
                        onChange={range => {
                          // Ao clicar em qualquer dia, define a semana (segunda a domingo) e destaca imediatamente
                          const base = range.selection.startDate;
                          const ini = startOfWeek(base);
                          const fim = new Date(ini); fim.setDate(ini.getDate()+6); // segunda até domingo
                          setSemanaTemp({
                            inicio: toISODateLocal(ini),
                            fim: toISODateLocal(fim)
                          });
                        }}
                        moveRangeOnFirstSelection={false}
                        months={1}
                        direction="horizontal"
                        color={darkMode ? '#38bdf8' : '#0ea5e9'}
                        showDateDisplay={false}
                        locale={dateFnsLocale}
                        showMonthAndYearPickers={true}
                        editableDateInputs={false}
                        rangeColors={[darkMode ? '#38bdf8' : '#0ea5e9']}
                        maxDate={new Date('2100-12-31')}
                        minDate={new Date('2000-01-01')}
                      />
                      <div className="flex gap-2 mt-4 justify-end">
                        <button onClick={() => { setSemanaTemp(null); setShowRangePicker(false); setSemanaSelecionadaGlobal(null); }}
                          className={`px-2 py-1 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}> 
                          Limpar
                        </button>
                        <button
                          onClick={() => {
                            if (semanaTemp?.inicio && semanaTemp?.fim) {
                              setSemanaSelecionadaGlobal({ inicio: semanaTemp.inicio, fim: semanaTemp.fim });
                              setDataRef(semanaTemp.inicio);
                            }
                            setShowRangePicker(false);
                          }}
                          className={`px-2 py-1 rounded-xl border text-xs ${darkMode ? 'bg-blue-800 text-blue-200 border-blue-700 hover:bg-blue-700' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Novo: intervalo de meses */}
            {periodo==='mensal' && (
              <div>
                <div className="text-sm text-slate-500 mb-2">{t('periodo.intervalo')}</div>
                <div className="flex gap-2 items-center relative">
                  <button
                    className={`px-3 py-2 rounded-xl border w-[260px] text-left truncate flex items-center gap-2 ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-800 border-slate-200'}`}
                    onClick={()=>setShowRangePicker(v=>!v)}
                  >
                    <IconCalendar dark={darkMode}/>
                    <span>
                      {intervaloMeses?.inicio && intervaloMeses?.fim
                        ? `${intervaloMeses.inicio.split('-').reverse().join('/')} - ${intervaloMeses.fim.split('-').reverse().join('/')}`
                        : t('periodo.selecioneIntervalo')}
                    </span>
                  </button>
                  {showRangePicker && (
                    <div style={{
                      position: 'absolute',
                      top: '110%',
                      left: 0,
                      zIndex: 20,
                      boxShadow: '0 4px 24px #0002',
                      background: darkMode ? '#1a2230' : '#fff',
                      borderRadius: '16px',
                      padding: '16px',
                      minWidth: '340px'
                    }}>
                      <DateRange
                        ranges={[{
                          startDate: rangeTemp?.inicio ? new Date(rangeTemp.inicio + 'T12:00:00') : intervaloMeses?.inicio ? new Date(intervaloMeses.inicio + 'T12:00:00') : new Date(),
                          endDate: rangeTemp?.fim ? new Date(rangeTemp.fim + 'T12:00:00') : intervaloMeses?.fim ? new Date(intervaloMeses.fim + 'T12:00:00') : new Date(),
                          key: 'selection',
                        }]}
                        onChange={range => {
                          // Salva exatamente o valor selecionado pelo usuário
                          const pad = (n:number) => String(n).padStart(2,'0');
                          const start = `${range.selection.startDate.getFullYear()}-${pad(range.selection.startDate.getMonth()+1)}-${pad(range.selection.startDate.getDate())}`;
                          const end = `${range.selection.endDate.getFullYear()}-${pad(range.selection.endDate.getMonth()+1)}-${pad(range.selection.endDate.getDate())}`;
                          setRangeTemp({ inicio: start, fim: end });
                        }}
                        moveRangeOnFirstSelection={false}
                        months={1}
                        direction="horizontal"
                        color={darkMode ? '#38bdf8' : '#0ea5e9'}
                        locale={dateFnsLocale}
                      />
                      <div className="flex gap-2 mt-4 justify-end">
                        <button onClick={() => { setRangeTemp(null); setIntervaloMeses(null); setShowRangePicker(false); }}
                          className={`px-2 py-1 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                          Limpar
                        </button>
                        <button
                          onClick={() => {
                            if (rangeTemp?.inicio && rangeTemp?.fim) {
                              setIntervaloMeses({ inicio: rangeTemp.inicio, fim: rangeTemp.fim });
                            }
                            setShowRangePicker(false);
                          }}
                          className={`px-2 py-1 rounded-xl border text-xs ${darkMode ? 'bg-blue-800 text-blue-200 border-blue-700 hover:bg-blue-700' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="ml-auto text-right">
              <div className="text-sm text-slate-500">
                {investimentos ? t('resumo.investimentosPeriodo') : t('resumo.totaisPeriodo')}
              </div>
              {/* Box Total Investido encaixado aqui */}
              {investimentos && (
                <div className={`rounded-xl p-2 ${darkMode ? 'bg-slate-800 text-blue-200 border-slate-700' : 'bg-blue-50 text-blue-700 border-blue-100'} min-w-[140px] mb-2`}>
                  <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('invest.totalInvestido')}</div>
                  <div className={`font-bold ${darkMode ? 'text-blue-300' : 'text-sky-500'}`}>{toBRLMask(saldo)}</div>
                </div>
              )}
              <div className="mt-1 grid grid-cols-3 gap-2">
                {investimentos ? (
                  <></>
                ) : (
                  <>
                    <div className={`rounded-xl p-2 ${THEME.card} col-span-1`}>
                      <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('resumo.ganhos')}</div>
                      <div className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>{toBRLMask(ganhos)}</div>
                    </div>
                    <div className={`rounded-xl p-2 ${THEME.card} col-span-1`}>
                      <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('resumo.despesas')}</div>
                      <div className={`font-bold ${darkMode ? 'text-red-400' : 'text-red-700'}`}>{toBRLMask(despesas)}</div>
                    </div>
                    <div className={`rounded-xl p-2 ${THEME.card} col-span-1`}>
                      <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('resumo.saldo')}</div>
                      <div className={`font-bold ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>{toBRLMask(saldo)}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      </>
    );
  }

  function PaginaLancamentos({busca, setBusca}:{busca:string, setBusca:(v:string)=>void}){
    // Filtro de busca: sempre filtra sobre a lista completa do período
    const vis = useMemo(() => {
      const termo = busca.trim().toLowerCase();
      let arr = caixa;
      if (termo) {
        arr = arr.filter(e =>
          e.nome.toLowerCase().includes(termo) ||
          (e.categoria||'').toLowerCase().includes(termo) ||
          (e.subcategoria||'').toLowerCase().includes(termo)
        );
      }
      return arr.sort((a, b) => parseISO(b.data).getTime() - parseISO(a.data).getTime() || b.criadoEm - a.criadoEm);
    }, [caixa, busca]);
    return (
      <div className="space-y-4">
        {/* Remover filtros daqui, deixar só Card e tabela */}
        <Card>
          <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
            <h3 className="font-semibold">{t('nav.lancamentos')} ({vis.length})</h3>
            <div className="flex gap-2">
              <button onClick={()=>setShowModal(true)} className={`px-2 py-1 rounded-full border text-xs shadow transition
                ${darkMode ? 'bg-cyan-800 text-white border-cyan-700 hover:bg-cyan-700' : 'bg-cyan-500 text-white border-cyan-500 hover:bg-cyan-600'}`}>+ Incluir</button>
            </div>
          </div>
          <div className="overflow-x-auto" style={{maxHeight:'400px', overflowY:'auto'}}>
            <table className="min-w-max w-full text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="text-left p-2">{t('form.data')}</th>
                  <th className="text-left p-2">{t('form.tipo')}</th>
                  <th className="text-left p-2">{t('form.nome')}</th>
                  <th className="text-left p-2 hidden sm:table-cell">{t('form.categoria')}</th>
                  <th className="text-left p-2 hidden sm:table-cell">{t('form.subcategoria')}</th>
                  <th className="text-right p-2">{t('form.valor')}</th>
                  <th className="p-2">{t('tabela.acoes')}</th>
                </tr>
              </thead>
              <tbody>
                {vis.length===0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-slate-400">{t('resumo.semLancamentos')}</td></tr>
                )}
                {vis.map(e=> (
                  <tr key={e.id} className="border-t">
                    <td className="p-2 whitespace-nowrap">{fmtDM(e.data)}</td>
                    <td className="p-2">
                      {/* Tag de tipo na tabela */}
                      <span className={`px-2 py-1 rounded-full text-xs border font-bold
    ${e.tipo==='ganho'
      ? 'bg-green-600 text-white border-green-700'
      : 'bg-red-600 text-white border-red-700'
    }`}>
                        {e.tipo}
                      </span>
                    </td>
                    <td className="p-2">{nomeExibido(e)}</td>
                    <td className="p-2 hidden sm:table-cell">{e.categoria||'—'}</td>
                    <td className="p-2 hidden sm:table-cell">{e.subcategoria||'—'}</td>
                    <td className={`p-2 text-right font-semibold ${e.tipo==='ganho'? (darkMode ? 'text-green-400' : 'text-green-700') : (darkMode ? 'text-red-400' : 'text-red-700')}`}>{toBRLMask(e.valor)}</td>
                    <td className="p-2 text-center flex gap-1 justify-center">
                      <button onClick={()=>remover(e)}
                        className={`px-2 py-1 rounded-xl border flex items-center justify-center transition
                          ${darkMode ? 'bg-slate-800 text-rose-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-rose-600 border-slate-200 hover:bg-rose-50'}`}
                        title={t('btn.excluir')}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="5" x2="13" y2="13"/><line x1="13" y1="5" x2="5" y2="13"/></svg>
                      </button>
                      <button onClick={()=>{setEditandoId(e.baseId); setEditData(e); setShowModal(true);}}
                        className={`px-2 py-1 rounded-xl border flex items-center justify-center transition
                          ${darkMode ? 'bg-slate-800 text-blue-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-blue-600 border-slate-200 hover:bg-blue-50'}`}
                        title={t('btn.editar')}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 13.5V15h1.5l8.1-8.1-1.5-1.5L3 13.5z"/><path d="M14.7 5.3a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0l-1.1 1.1 3 3 1.1-1.1z"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  function PaginaResumo(){
    return (
      <div className="space-y-4">
        <SeletorPeriodo/>
        {/* Linha suave de evolução */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{t('resumo.evolucaoPeriodo')}</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serieEvolucao} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                <XAxis dataKey="dia" hide={false} tickLine={false} axisLine={false}/>
                <Tooltip formatter={(v:any)=> toBRLMask(Number(v))} labelFormatter={()=>''}/>
                <Line type="monotone" dataKey="saldo" stroke="#06b6d4" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        {/* Donut de despesas por categoria */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{t('resumo.despesasPorCategoria')}</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutDespesas} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {donutDespesas.map((_, i)=> <Cell key={i} fill={CAT_CORES[i % CAT_CORES.length]} />)}
                </Pie>
                <Tooltip formatter={(v:any)=> toBRLMask(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 text-xs">
            {donutDespesas.map((d,i)=> (
              <span key={d.name} className={`inline-flex items-center gap-2 px-2 py-1 rounded-full border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <span className="w-3 h-3 rounded-full" style={{backgroundColor: CAT_CORES[i % CAT_CORES.length]}}/>
                {d.name}: <b>{toBRLMask(d.value)}</b>
              </span>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  function PaginaInvestimentos(){
    const lista = invest.sort((a,b)=> parseISO(b.data).getTime() - parseISO(a.data).getTime());
    const soma = lista.reduce((s,e)=> s+e.valor, 0);
    const porClasse = useMemo(()=>{
      const map = new Map<string, number>();
      for(const e of invest){ const k=(e.categoria||'Outros'); map.set(k,(map.get(k)||0)+e.valor); }
      const arr = Array.from(map.entries()).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
      return arr;
    },[invest]);

    return (
      <div className="space-y-4">
        <SeletorPeriodo investimentos />
        <Card>
          <div className="flex flex-wrap items-center justify-between mb-3">
            <h3 className="font-semibold">{t('resumo.investimentosPeriodo')}</h3>
            
          </div>
          <div className="overflow-x-auto mt-2">
            <table className="min-w-max w-full text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="text-left p-2">{t('form.data')}</th>
                  <th className="text-left p-2">{t('invest.ativoDescricao')}</th>
                  <th className="text-left p-2 hidden sm:table-cell">{t('invest.classe')}</th>
                  <th className="text-right p-2">{t('invest.aporte')}</th>
                  <th className="p-2">{t('tabela.acoes')}</th>
                </tr>
              </thead>
              <tbody>
                {lista.length===0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">{t('invest.semAportes')}</td></tr>}
                {lista.map(e=> (
                  <tr key={e.id} className="border-t">
                    <td className="p-2 whitespace-nowrap">{fmtDM(e.ocorrenciaData)}</td>
                    <td className="p-2">{nomeExibido(e)}</td>
                    <td className="p-2 hidden sm:table-cell">{e.categoria||'—'}</td>
                    <td className="p-2 text-right font-semibold text-blue-700">{toBRLMask(e.valor)}</td>
                    <td className="p-2 text-center">
                      <button onClick={()=>remover(e)}
                        className={`px-2 py-1 rounded-xl border transition
                          ${darkMode ? 'bg-slate-800 text-rose-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-rose-600 border-slate-200 hover:bg-rose-50'}`}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">{t('resumo.distribuicaoClasse')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={porClasse} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {porClasse.map((_, i)=> <Cell key={i} fill={CAT_CORES[i % CAT_CORES.length]} />)}
                </Pie>
                <Tooltip formatter={(v:any)=> toBRLMask(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    );
  }

  // ---- Layout principal ----
  const THEME = darkMode ? DARK : LIGHT;

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.text} ${darkMode ? 'scrollbar-dark' : ''}`} style={{fontFamily:'Montserrat, ui-sans-serif, system-ui'}}>
  <Header/>
  {renderModal()}
  {/* Fica aqui (direto no App), e não dentro do Header: Header é uma função recriada a
      cada render do App, então o React a remonta inteira sempre que algum estado muda —
      inclusive no instante entre abrir o diálogo nativo de arquivo e o usuário selecionar
      um arquivo. Isso destruía esse <input> (e o evento de seleção nunca chegava a
      lugar nenhum). Aqui, como faz parte do retorno do próprio App, ele nunca remonta. */}
  <input
    ref={fileImportRef}
    type="file"
    accept=".json,.csv"
    style={{ display: 'none' }}
    onChange={e => {
      const file = e.target.files?.[0];
      if (file) handleImportFile(file);
      e.target.value = ''; // permite selecionar o mesmo arquivo de novo depois
    }}
  />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4" style={bannerAtivo ? { paddingBottom: 80 } : undefined}>
        {/* Seletor de período e totais */}
        {pagina === 'lancamentos' && <SeletorPeriodo/>}
        {/* Div centralizada para filtros e busca */}
        {pagina === 'lancamentos' && (
          <div className="flex items-center justify-center mb-4" style={{gap: 16}}>
            <div className="flex gap-2 items-center flex-wrap">
              <button className={`px-3 py-1 rounded-full border text-xs transition
                ${filtroTipo==='' ? (darkMode ? 'bg-cyan-900 text-cyan-100 border-cyan-800' : 'bg-cyan-50 text-cyan-700 border-cyan-100') : (darkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-600 border-slate-200')}`} onClick={()=>setFiltroTipo('')}>{t('periodo.todos')}</button>
              <button className={`px-3 py-1 rounded-full border text-xs transition
                ${filtroTipo==='despesa' ? (darkMode ? 'bg-blue-900 text-blue-100 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-100') : (darkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-600 border-slate-200')}`} onClick={()=>setFiltroTipo('despesa')}>{t('resumo.despesas')}</button>
              <button className={`px-3 py-1 rounded-full border text-xs transition
                ${filtroTipo==='ganho' ? (darkMode ? 'bg-cyan-900 text-cyan-100 border-cyan-800' : 'bg-cyan-50 text-cyan-700 border-cyan-100') : (darkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-600 border-slate-200')}`} onClick={()=>setFiltroTipo('ganho')}>{t('resumo.ganhos')}</button>
            </div>
            <div style={{width: 140, minWidth: 0, position: 'relative'}}>
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder={t('form.buscar')}
                className={`pl-7 pr-2 py-1 rounded-full border text-sm w-full ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 placeholder-slate-500' : 'bg-white text-slate-800 border-slate-200 placeholder-slate-400'}`}
                autoComplete="on"
                style={{height:'32px'}}
              />
              <span style={{position:'absolute', left:'8px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', zIndex:2}}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign:'middle'}}><circle cx="6" cy="6" r="5"/><line x1="11" y1="11" x2="13" y2="13"/></svg>
              </span>
            </div>
          </div>
        )}
        {/* Tabela de movimentações sem filtros */}
        {pagina==='lancamentos' && <PaginaLancamentos busca={busca} setBusca={setBusca}/>} 
        {pagina==='resumo' && <PaginaResumo/>}
        {pagina==='investimentos' && <PaginaInvestimentos/>}
      </main>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.85, rotate: -10 }}
        onClick={()=>setShowModal(true)}
        className="fixed right-5 w-14 h-14 rounded-full shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center"
        style={{ bottom: bannerAtivo ? 90 : 20 }}
      >
        <IconPlus/>
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-40 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-slate-900/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={()=>{setShowModal(false); setEditandoId(null); setEditData(null);}}/>
            <motion.div className={`relative z-10 w-full max-w-xl sm:max-w-lg md:max-w-md rounded-3xl ${THEME.card} shadow-xl p-5 flex flex-col`} initial={{ scale: 0.95, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 40 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} style={{ maxHeight: '90vh', overflowY: 'auto', minHeight: '300px', minWidth: '0', }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{editandoId ? t('form.editarLancamento') : t('form.novoLancamento')}</h3>
                <button onClick={()=>{setShowModal(false); setEditandoId(null); setEditData(null);}} className={`px-3 py-1 rounded-xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>{t('btn.fechar')}</button>
              </div>
              <div className="mb-3">
      {/* Modal de escopo de edição para fixas/parceladas */}
      <AnimatePresence>
        {showEditScopeModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-slate-900/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={()=>setShowEditScopeModal(false)}/>
            <motion.div className={`relative z-10 w-full max-w-md rounded-3xl ${THEME.card} shadow-xl p-6 flex flex-col items-center`} initial={{ scale: 0.95, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 40 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
              <h3 className="font-semibold mb-4 text-center">{t('modal.escopoEdicao')}</h3>
              <div className="mb-4 text-center text-slate-500">{t('modal.escopoDetalhePre', { tipo: pendingEditData?.subcategoria === 'Fixa' ? t('form.fixaMin') : t('form.parceladaMin') })}<br/>{t('modal.escopoDetalhePos')}</div>
              <div className="flex gap-4 justify-center">
                <button onClick={()=>aplicarEdicaoRecorrente('single')} className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md">{t('modal.editarApenasEsta')}</button>
                <button onClick={()=>aplicarEdicaoRecorrente('all')} className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-md">{t('modal.editarTodasApartir')}</button>
              </div>
              <button onClick={()=>setShowEditScopeModal(false)} className={`mt-6 px-3 py-1 rounded-xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>{t('btn.cancelar')}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
                <div className="text-sm text-slate-500 mb-1">{t('form.oQueDeseja', { acao: (editandoId ? t('btn.editar') : t('btn.adicionar')).toLowerCase() })}</div>
                <div className="flex gap-2">
                  <button onClick={()=>setTipo('despesa')} className={`px-3 py-2 rounded-2xl border-0 shadow-none ${tipo==='despesa'?'bg-gradient-to-r from-cyan-500 to-blue-600 text-white':'hover:bg-slate-50'}`}>{t('form.despesa')}</button>
                  <button onClick={()=>setTipo('ganho')} className={`px-3 py-2 rounded-2xl border-0 shadow-none ${tipo==='ganho'?'bg-gradient-to-r from-cyan-500 to-blue-600 text-white':'hover:bg-slate-50'}`}>{t('form.ganho')}</button>
                  <button onClick={()=>setTipo('investimento')} className={`px-3 py-2 rounded-2xl border-0 shadow-none ${tipo==='investimento'?'bg-gradient-to-r from-cyan-500 to-blue-600 text-white':'hover:bg-slate-50'}`}>{t('form.investimento')}</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="text-sm text-slate-500">{t('form.nome')}</div>
                  <input
                    value={editandoId && editData ? editData.nome : nome}
                    onChange={e=>editandoId && editData ? setEditData({...editData, nome: e.target.value}) : setNome(e.target.value)}
                    placeholder={tipo==='despesa' ? t('form.placeholderDespesa') : tipo==='ganho' ? t('form.placeholderGanho') : t('form.placeholderInvestimento')}
                    className={`mt-1 w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 placeholder-slate-500' : 'bg-white text-slate-800 border-slate-200 placeholder-slate-400'}`}
                  />
                </div>
                <div>
                  <div className="text-sm text-slate-500">{t('form.valor')} ({CURRENCY_INFO[currency].symbol})</div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editandoId && editData ? (editData.valor !== undefined ? formatMoneyInput((Math.round(Number(editData.valor) * 100)).toString(), currency) : '') : formatMoneyInput(valor, currency)}
                    onChange={e => {
                      // Permite digitar normalmente, inclusive zero à esquerda e vírgula/ponto
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      const formatted = formatMoneyInput(raw, currency);
                      if (editandoId && editData) {
                        // Só atualiza se o valor for um número válido
                        const val = formatted ? parseMoneyInput(formatted, currency) : 0;
                        setEditData({ ...editData, valor: isNaN(val) ? 0 : val });
                      } else {
                        setValor(formatted);
                      }
                    }}
                    className={`mt-1 w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 placeholder-slate-500' : 'bg-white text-slate-800 border-slate-200 placeholder-slate-400'}`}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                    placeholder="0,00"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="text-sm text-slate-500">{t('form.categoria')}</div>
                  <div className="mt-1 flex flex-wrap">
                    {(tipo==='investimento'
  ? CATS_INVEST
  : tipo==='ganho'
    ? ['Salário','Bônus','Venda','Outros']
    : CATS_PADRAO
).map(cat=> (
                      <Pill key={cat} label={catLabel(cat, lang)} active={(editandoId && editData ? editData.categoria : categoria)===cat} onClick={()=> editandoId && editData ? setEditData({...editData, categoria: (editData.categoria===cat? '' : cat)}) : setCategoria(categoria===cat? '' : cat)} />
                    ))}
                  </div>
                  <input
                    value={editandoId && editData ? (editData.categoria||'') : categoria}
                    onChange={e=>editandoId && editData ? setEditData({...editData, categoria: e.target.value}) : setCategoria(e.target.value)}
                    placeholder={t('form.ouDigiteCategoria')}
                    className={`mt-2 w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 placeholder-slate-500' : 'bg-white text-slate-800 border-slate-200 placeholder-slate-400'}`}
                  />
                </div>
                <div>
                  <div className="text-sm text-slate-500">{t('form.data')}</div>
                  <input type="date" value={editandoId && editData ? editData.data : data} onChange={e=>editandoId && editData ? setEditData({...editData, data: e.target.value}) : setData(e.target.value)} className={`mt-1 w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 placeholder-slate-500' : 'bg-white text-slate-800 border-slate-200 placeholder-slate-400'}`}/>
                  <div className="mt-2">
                    <div className="text-sm text-slate-500">{t('form.recorrencia')} <span className="text-xs text-slate-400">({t('form.opcional')})</span></div>
                    <select value={editandoId && editData ? (editData.subcategoria||'') : subcategoria} onChange={e=>editandoId && editData ? setEditData({...editData, subcategoria: e.target.value}) : setSubcategoria(e.target.value)} className={`mt-1 w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-800 border-slate-200'}`}> 
                      <option value="">{t('form.nenhuma')}</option>
                      <option value="Fixa">{t('form.fixa')}</option>
                      <option value="Parcelada">{t('form.parcelada')}</option>
                    </select>
                    {(editandoId && editData ? editData.subcategoria : subcategoria) === 'Parcelada' && (
                      <div className="mt-2 flex items-center gap-2">
                        <label className="text-sm text-slate-500">{t('form.numParcelas')}</label>
                        <select
                          value={editandoId && editData ? (editData.numParcelas ?? 12) : numParcelas}
                          onChange={e => {
                            const val = Number(e.target.value);
                            if (editandoId && editData) setEditData({ ...editData, numParcelas: val });
                            else setNumParcelas(val);
                          }}
                          className={`px-2 py-1 rounded-xl border ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-800 border-slate-200'}`}
                        >
                          {Array.from(new Set([
                            ...(Array.from({ length: 20 }, (_, i) => i + 1)),
                            editandoId && editData ? (editData.numParcelas ?? 12) : numParcelas, // garante que um valor antigo (>20, de antes desse limite existir) continue aparecendo certo
                          ])).sort((a, b) => a - b).map(n => (
                            <option key={n} value={n}>{n}x</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('form.observacoes')}</div>
                  <textarea
                    value={editandoId && editData ? (editData.observacoes||'') : observacoes}
                    onChange={e=>editandoId && editData ? setEditData({...editData, observacoes: e.target.value}) : setObservacoes(e.target.value)}
                    rows={2}
                    className={`mt-1 w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 placeholder-slate-500' : 'bg-white text-slate-800 border-slate-200 placeholder-slate-400'}`}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button onClick={()=>{ resetForm(); setShowModal(false); setEditandoId(null); setEditData(null); }} className={`px-4 py-2 rounded-xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>{t('btn.cancelar')}</button>
                <button
                  onClick={() => {
                    if(editandoId && editData) {
                      salvarEdicao();
                    } else {
                      addEntry();
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 transition-transform duration-150 ease-in-out active:scale-95 hover:brightness-110 shadow-md"
                >
                  {editandoId ? t('btn.salvar') : t('btn.adicionar')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rodapé leve */}
      <footer className="text-center text-xs text-slate-400 py-4" style={bannerAtivo ? { paddingBottom: 60 } : undefined}>Simple Finance • {t('footer.dados')} • CROOMA Design Studio</footer>
    </div>
  );
}
