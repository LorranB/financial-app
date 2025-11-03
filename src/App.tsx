import React, { useEffect, useMemo, useRef, useState } from "react";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
// REMOVE this duplicate App function and its code block (including the useEffect above).
// The correct App function starts after the type and helper declarations.
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
 type Entry = {
  id: string;
  tipo: Tipo;
  nome: string;
  valor: number; // positivo (R$)
  data: string; // ISO yyyy-mm-dd
  categoria?: string;
  subcategoria?: string; // Nova subcategoria: fixa, parcelada, variável, outros
  observacoes?: string;
  criadoEm: number;
  numParcelas?: number; // Para recorrência parcelada
  _editScope?: 'single' | 'all'; // escopo de edição temporário
 };

 type Periodo = 'mensal' | 'semanal';
 type Pagina = 'lancamentos' | 'resumo' | 'investimentos';

 // ---- Helpers ----
 const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
 const toBRL = (n:number)=> 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 const fmtDM = (iso:string)=> {
  // Corrige bug do dia: considera fuso local
  const d = new Date(iso + 'T00:00:00');
  return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0');
 };
 function startOfWeek(date: Date) { const d = new Date(date); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); d.setHours(0,0,0,0); return d; }
 function endOfWeek(date: Date) { const s = startOfWeek(date); const e = new Date(s); e.setDate(s.getDate()+6); e.setHours(23,59,59,999); return e; }
 function startOfMonth(date: Date) { const d = new Date(date.getFullYear(), date.getMonth(), 1); d.setHours(0,0,0,0); return d; }
 function endOfMonth(date: Date) { const d = new Date(date.getFullYear(), date.getMonth()+1, 0); d.setHours(23,59,59,999); return d; }
 const withinRange = (iso:string, ini:Date, fim:Date)=>{ const t = new Date(iso).getTime(); return t>=ini.getTime() && t<=fim.getTime(); };

 const STORAGE_KEY = 'finance-bruno-v2';
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
  // Edição
  const [editandoId, setEditandoId] = useState<string|null>(null);
  // Estado para edição
  const [editData, setEditData] = useState<Entry|null>(null);
  // Modal de confirmação de escopo de edição
  const [showEditScopeModal, setShowEditScopeModal] = useState(false);
  const [pendingEditData, setPendingEditData] = useState<Entry|null>(null);
  const [pendingEditId, setPendingEditId] = useState<string|null>(null);
  const [pendingScope, setPendingScope] = useState<'single'|'all'|null>(null);
  // ---- Estado base ----
  const [entries, setEntries] = useState<Entry[]>([]);

  // Período
  const [periodo, setPeriodo] = useState<Periodo>('mensal');
  const [mesRef, setMesRef] = useState<string>(()=>{
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });
  const [dataRef, setDataRef] = useState<string>(()=> new Date().toISOString().slice(0,10));
  // Adicione estado para intervalo de meses
  const [intervaloMeses, setIntervaloMeses] = useState<{inicio:string, fim:string}|null>(null);

  // Modal + formulário
  const [showModal, setShowModal] = useState(false);
  const [tipo, setTipo] = useState<Tipo>('despesa');
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState<string>('');
  const [data, setData] = useState<string>(()=> new Date().toISOString().slice(0,10));
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [numParcelas, setNumParcelas] = useState(12);
  const [observacoes, setObservacoes] = useState('');

  // Menus/inputs escondidos
  const [menuOpen, setMenuOpen] = useState(false);
  const fileXLSXRef = useRef<HTMLInputElement|null>(null);
  const fileJSONRef = useRef<HTMLInputElement|null>(null);

  // Saldo acumulado
  const [showSaldoAcumulado, setShowSaldoAcumulado] = useState(true);

  // Modo noturno
  const [darkMode, setDarkMode] = useState(false);
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

  // ---- Load/Save ----
  useEffect(()=>{ try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) setEntries(JSON.parse(raw)); }catch{} },[]);
  useEffect(()=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }catch{} },[entries]);

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

  // Lançamentos fixos: repetir em todos os meses após a data original
  function expandirFixos(entries: Entry[], ini: Date, fim: Date) {
    const result: Entry[] = [];
    for (const e of entries) {
      if (e.subcategoria === 'Fixa') {
        // Cada mês gera uma movimentação única, editável/excluível
        const dataOrig = new Date(e.data);
        let d = new Date(dataOrig);
        if (d < ini) {
          d = new Date(ini);
          d.setDate(dataOrig.getDate());
          if (d < dataOrig) d = new Date(dataOrig);
        }
        while (d <= fim) {
          if (d >= ini && d >= dataOrig && d <= fim) {
            // id único para cada mês
            const uniqueId = e.id + '-fixa-' + d.getFullYear() + '-' + (d.getMonth()+1);
            result.push({ ...e, data: d.toISOString().slice(0,10), id: uniqueId });
          }
          d.setMonth(d.getMonth() + 1);
        }
      } else if (e.subcategoria === 'Parcelada') {
        // Repete pelo número de parcelas definido
        const parcelas = e.numParcelas || 12;
        const dataOrig = new Date(e.data);
        for (let i = 0; i < parcelas; i++) {
          const parcelaDate = new Date(dataOrig);
          parcelaDate.setMonth(parcelaDate.getMonth() + i);
          if (parcelaDate >= ini && parcelaDate <= fim) {
            result.push({
              ...e,
              data: parcelaDate.toISOString().slice(0,10),
              id: e.id + '-parcelada-' + (i+1),
              nome: `${e.nome} ${i+1}/${parcelas}`,
              observacoes: (e.observacoes||'') + ` Parcela ${i+1}/${parcelas}`
            });
          }
        }
      } else {
        if (withinRange(e.data, ini, fim)) result.push(e);
      }
    }
    return result;
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
      const iso = d.toISOString().slice(0,10); map.set(iso,0); d.setDate(d.getDate()+1);
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

  // ---- Ações ----
  function resetForm(){ setNome(''); setValor(''); setCategoria(''); setSubcategoria(''); setObservacoes(''); setTipo('despesa'); setData(new Date().toISOString().slice(0,10)); }

  // Permitir valor zero na adição também
  function addEntry(){
  // Aceita valor com ponto ou vírgula, converte para float corretamente
  let vstr = valor.replace(/\./g, '').replace(/,/, '.');
  // Se o usuário digitar 50.000,44, vstr vira '50000.44'
  let v = parseFloat(vstr);
  if(!nome.trim()) {
    setModal({ type: 'error', message: 'Dê um nome.' });
    return;
  }
  if(!data) {
    setModal({ type: 'error', message: 'Informe a data.' });
    return;
  }
  if(isNaN(v) || v < 0) {
    setModal({ type: 'error', message: 'Valor inválido.' });
    return;
  }
  const novo: Entry = { id: uid(), tipo, nome: nome.trim(), valor: v, data, categoria: categoria.trim()||undefined, subcategoria: subcategoria.trim()||undefined, observacoes: observacoes.trim()||undefined, criadoEm: Date.now(), numParcelas: subcategoria==='Parcelada' ? numParcelas : undefined };
  setEntries(prev=> [novo, ...prev]);
  setShowModal(false); resetForm();
}

  // Corrigir edição de lançamento
  function salvarEdicao(){
    if(editandoId && editData) {
    // Se editando, pega o valor do input formatado
    let vstr = '';
    if (typeof editData.valor === 'string') {
      vstr = (editData.valor as string).replace(/\./g, '').replace(/,/, '.');
    } else if (typeof editData.valor === 'number') {
      vstr = editData.valor.toString();
    } else {
      vstr = String(editData.valor);
    }
    let v = parseFloat(vstr);
      if(isNaN(v) || v < 0) {
        setModal({ type: 'error', message: 'Valor inválido.' });
        return;
      }
      // Se for Fixa ou Parcelada, pede escopo
      if(editData.subcategoria === 'Fixa' || editData.subcategoria === 'Parcelada') {
        setShowEditScopeModal(true);
  setPendingEditData({...editData, valor: v});
        setPendingEditId(editandoId);
      } else {
        // Normal: só edita este
  setEntries(prev=> prev.map(e=> e.id===editandoId ? {...e, ...editData, valor: v, numParcelas: editData.subcategoria==='Parcelada' ? numParcelas : undefined } : e));
        setShowModal(false); setEditandoId(null); setEditData(null); resetForm();
      }
    }
  }

  // Aplica edição conforme escopo escolhido
  function aplicarEdicaoRecorrente(scope: 'single'|'all') {
    if(!pendingEditId || !pendingEditData) return;
    if(scope === 'single') {
      setEntries(prev=> prev.map(e=> {
        if(e.id === pendingEditId) {
          // Parcelada: mantém nome com sufixo da parcela
          if(e.subcategoria === 'Parcelada') {
            const sufixo = e.nome.match(/\d+\/\d+$/) ? e.nome.match(/\d+\/\d+$/)[0] : '';
            const nomeBase = pendingEditData.nome.replace(/ \d+\/\d+$/, '');
            return {
              ...e,
              ...pendingEditData,
              nome: sufixo ? `${nomeBase} ${sufixo}` : nomeBase,
              valor: pendingEditData.valor,
              numParcelas: pendingEditData.numParcelas
            };
          }
          // Fixa: permite editar qualquer ocorrência
          if(e.subcategoria === 'Fixa') {
            return { ...e, ...pendingEditData, valor: pendingEditData.valor };
          }
          return { ...e, ...pendingEditData, valor: pendingEditData.valor, numParcelas: pendingEditData.subcategoria==='Parcelada' ? pendingEditData.numParcelas : undefined };
        }
        return e;
      }));
    } else {
      // Editar todas a partir desta
      setEntries(prev=> prev.map(e=> {
        // Fixa: aplica edição em todas a partir da data selecionada
        if(pendingEditData.subcategoria === 'Fixa') {
          if(e.subcategoria === 'Fixa' && new Date(e.data) >= new Date(pendingEditData.data)) {
            return { ...e, ...pendingEditData, valor: pendingEditData.valor };
          }
        }
        // Parcelada: aplica edição em todas a partir da parcela selecionada
        else if(pendingEditData.subcategoria === 'Parcelada') {
          const baseId = pendingEditId.split('-parcelada-')[0];
          if(e.subcategoria === 'Parcelada' && e.id.startsWith(baseId)) {
            const parcelaAtual = Number(pendingEditId.split('-parcelada-')[1]);
            const parcelaE = Number(e.id.split('-parcelada-')[1]);
            if(parcelaE >= parcelaAtual) {
              const nomeBase = pendingEditData.nome.replace(/ \d+\/\d+$/, '');
              const sufixo = e.nome.match(/\d+\/\d+$/) ? e.nome.match(/\d+\/\d+$/)[0] : '';
              return {
                ...e,
                ...pendingEditData,
                nome: sufixo ? `${nomeBase} ${sufixo}` : nomeBase,
                valor: pendingEditData.valor,
                numParcelas: pendingEditData.numParcelas
              };
            }
          }
        }
        return e;
      }));
    }
    setShowEditScopeModal(false);
    setShowModal(false);
    setEditandoId(null);
    setEditData(null);
    setPendingEditData(null);
    setPendingEditId(null);
    setPendingScope(null);
    resetForm();
  }

  function remover(id:string){
    setModal({
      type: 'confirm',
      message: 'Excluir este lançamento?',
      onConfirm: () => { setEntries(prev=> prev.filter(e=> e.id!==id)); setModal(null); },
      onCancel: () => setModal(null)
    });
  }
  function limparTudo(){
    setModal({
      type: 'confirm',
      message: 'Remover TODOS os dados?',
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
            <div className="mb-4 text-center text-lg font-semibold">{modal.type === 'error' ? 'Atenção' : 'Confirmação'}</div>
            <div className="mb-6 text-center text-base">{modal.message}</div>
            {modal.type === 'error' ? (
              <button onClick={()=>setModal(null)} className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md">OK</button>
            ) : (
              <div className="flex gap-4 justify-center">
                <button onClick={()=>{modal.onConfirm && modal.onConfirm();}} className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-rose-500 to-rose-700 shadow-md">Sim</button>
                <button onClick={()=>{modal.onCancel && modal.onCancel();}} className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-slate-500 to-slate-700 shadow-md">Não</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Exportar/Importar
  function exportarJSON(){ const blob = new Blob([JSON.stringify(entries,null,2)], {type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='financeiro.json'; a.click(); URL.revokeObjectURL(url); }
  function exportarCSV(){ const header='tipo;nome;valor;data;categoria;observacoes\\n'; const rows = entries.map(e=>[e.tipo,e.nome,String(e.valor).replace('.',','),e.data,e.categoria||'',(e.observacoes||'').replace(/\\n/g,' ')].join(';')).join('\\n'); const blob = new Blob([header+rows],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='financeiro.csv'; a.click(); URL.revokeObjectURL(url); }

  // Importar JSON
  // ...existing code...

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
                <NavButton active={pagina==='lancamentos'} onClick={()=>setPagina('lancamentos')}>Lançamentos</NavButton>
                <NavButton active={pagina==='resumo'} onClick={()=>setPagina('resumo')}>Resumo</NavButton>
                <NavButton active={pagina==='investimentos'} onClick={()=>setPagina('investimentos')}>Investimentos</NavButton>
              </div>
              <div className="relative">
                <button onClick={()=>setMenuOpen(v=>!v)} className={`p-2 rounded-xl shadow border ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}> <IconMenu/> </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      className={`absolute right-0 mt-2 w-64 sm:w-56 rounded-2xl shadow-lg p-2 z-30 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border text-slate-800'}`}
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      style={{ minWidth: '200px', maxWidth: '90vw' }}
                    >
                      <div className="px-3 py-1 text-xs text-slate-500">Dados</div>
                      {/* Corrige ícones de importação/exportação
                          Importar: IconDownload
                      */}
                      {/* Botões de importação removidos */}
                      {/* Exportar: IconUpload
                      */}
                      <button onClick={exportarJSON} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50"><IconUpload/> Exportar JSON</button>
                      <button onClick={exportarCSV} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50"><IconUpload/> Exportar CSV</button>
                      <hr className="my-2"/>
                      <button onClick={limparTudo} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-700"><IconTrash/> Limpar tudo</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {/* Botão modo claro/escuro dentro do header */}
            <button onClick={()=>setDarkMode(v=>!v)} className={`w-12 h-12 flex items-center justify-center rounded-full border shadow-lg transition-colors duration-200
              ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
              title={darkMode ? 'Modo claro' : 'Modo escuro'}>
              {darkMode ? <IconMoon/> : <IconSun/>}
            </button>
          </div>
        </div>
        {/* nav móvel */}
        <div className="md:hidden bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
          <div className="max-w-6xl mx-auto px-4 py-2 flex gap-2">
            <button onClick={()=>setPagina('lancamentos')} className={`px-3 py-2 rounded-xl ${pagina==='lancamentos'?'bg-white/20':''}`}>Lançamentos</button>
            <button onClick={()=>setPagina('resumo')} className={`px-3 py-2 rounded-xl ${pagina==='resumo'?'bg-white/20':''}`}>Resumo</button>
            <button onClick={()=>setPagina('investimentos')} className={`px-3 py-2 rounded-xl ${pagina==='investimentos'?'bg-white/20':''}`}>Investimentos</button>
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
            <span className="text-slate-500 text-sm">Saldo acumulado</span>
            <button onClick={()=>setShowSaldoAcumulado(v=>!v)} className={`p-1 rounded-full border shadow transition
  ${darkMode ? 'bg-slate-800 text-sky-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-sky-600 border-slate-200 hover:bg-slate-100'}`}
  title={showSaldoAcumulado? 'Ocultar saldo' : 'Exibir saldo'}>
              {showSaldoAcumulado ? (
                <svg width="22" height="22" fill="none" stroke="#0ea5e9" strokeWidth="2"><ellipse cx="11" cy="11" rx="8" ry="6"/><circle cx="11" cy="11" r="2.5"/></svg>
              ) : (
                <svg width="22" height="22" fill="none" stroke="#94a3b8" strokeWidth="2"><ellipse cx="11" cy="11" rx="8" ry="6"/><line x1="4" y1="18" x2="18" y2="4"/></svg>
              )}
            </button>
              <span
                className="font-bold text-sky-600 text-lg ml-2"
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  minWidth: '120px',
                  height: '1.8em',
                  background: showSaldoAcumulado ? undefined : (darkMode ? '#1a2230' : '#e0e7ef'),
                  borderRadius: '8px',
                  border: showSaldoAcumulado ? undefined : `1.5px solid ${darkMode ? '#334155' : '#cbd5e1'}`,
                  color: showSaldoAcumulado ? (darkMode ? '#38bdf8' : '#0ea5e9') : 'transparent',
                  textAlign: 'center',
                  transition: 'background 0.2s, color 0.2s',
                  boxSizing: 'border-box',
                  verticalAlign: 'middle',
                  lineHeight: '1.8em',
                  userSelect: showSaldoAcumulado ? 'text' : 'none',
                }}
              >
                {toBRL(saldoAcumulado)}
              </span>
          </div>
        </div>
        <Card>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <div className="text-sm text-slate-500">Período</div>
              <div className="mt-1 flex gap-2">
                <button
                  onClick={()=>setPeriodo('mensal')}
                  className={`px-3 py-2 rounded-xl border-0 shadow-none transition
                    ${periodo==='mensal' ? (darkMode ? 'bg-gradient-to-r from-cyan-700 to-blue-900 text-white' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white') : (darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-white')}`}
                >
                  Mensal
                </button>
                <button
                  onClick={()=>setPeriodo('semanal')}
                  className={`px-3 py-2 rounded-xl border-0 shadow-none transition
                    ${periodo==='semanal' ? (darkMode ? 'bg-gradient-to-r from-cyan-700 to-blue-900 text-white' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white') : (darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-white')}`}
                >
                  Semanal
                </button>
              </div>
            </div>
            {periodo==='mensal' ? (
              null
            ) : (
              <div>
                <div className="text-sm text-slate-500 mb-2">Semana</div>
                <div className="flex gap-2 items-center relative">
                  <button
                    className={`px-3 py-2 rounded-xl border w-[260px] text-left truncate flex items-center gap-2 ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-800 border-slate-200'}`}
                    onClick={()=>setShowRangePicker(v=>!v)}
                  >
                    <IconCalendar dark={darkMode}/>
                    <span>
                      {semanaSelecionadaGlobal?.inicio && semanaSelecionadaGlobal?.fim
                        ? `${semanaSelecionadaGlobal.inicio.split('-').reverse().join('/')} - ${semanaSelecionadaGlobal.fim.split('-').reverse().join('/')}`
                        : 'Selecione a semana'}
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
                            inicio: ini.toISOString().slice(0,10),
                            fim: fim.toISOString().slice(0,10)
                          });
                        }}
                        moveRangeOnFirstSelection={false}
                        months={1}
                        direction="horizontal"
                        color={darkMode ? '#38bdf8' : '#0ea5e9'}
                        showDateDisplay={false}
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
                <div className="text-sm text-slate-500 mb-2">Intervalo de datas</div>
                <div className="flex gap-2 items-center relative">
                  <button
                    className={`px-3 py-2 rounded-xl border w-[260px] text-left truncate flex items-center gap-2 ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-800 border-slate-200'}`}
                    onClick={()=>setShowRangePicker(v=>!v)}
                  >
                    <IconCalendar dark={darkMode}/>
                    <span>
                      {intervaloMeses?.inicio && intervaloMeses?.fim
                        ? `${intervaloMeses.inicio.split('-').reverse().join('/')} - ${intervaloMeses.fim.split('-').reverse().join('/')}`
                        : 'Selecione o intervalo'}
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
                {investimentos ? "Investimentos do período" : "Totais do período"}
              </div>
              {/* Box Total Investido encaixado aqui */}
              {investimentos && (
                <div className={`rounded-xl p-2 ${darkMode ? 'bg-slate-800 text-blue-200 border-slate-700' : 'bg-blue-50 text-blue-700 border-blue-100'} min-w-[140px] mb-2`}>
                  <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total investido</div>
                  <div className={`font-bold ${darkMode ? 'text-blue-300' : 'text-sky-500'}`}>{toBRL(saldo)}</div>
                </div>
              )}
              <div className="mt-1 grid grid-cols-3 gap-2">
                {investimentos ? (
                  <></>
                ) : (
                  <>
                    <div className={`rounded-xl p-2 ${THEME.card} col-span-1`}>
                      <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ganhos</div>
                      <div className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>{toBRL(ganhos)}</div>
                    </div>
                    <div className={`rounded-xl p-2 ${THEME.card} col-span-1`}>
                      <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Despesas</div>
                      <div className={`font-bold ${darkMode ? 'text-red-400' : 'text-red-700'}`}>{toBRL(despesas)}</div>
                    </div>
                    <div className={`rounded-xl p-2 ${THEME.card} col-span-1`}>
                      <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Saldo</div>
                      <div className={`font-bold ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>{toBRL(saldo)}</div>
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
      return arr.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime() || b.criadoEm - a.criadoEm);
    }, [caixa, busca]);
    return (
      <div className="space-y-4">
        {/* Remover filtros daqui, deixar só Card e tabela */}
        <Card>
          <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
            <h3 className="font-semibold">Lançamentos ({vis.length})</h3>
            <div className="flex gap-2">
              <button onClick={()=>setShowModal(true)} className={`px-2 py-1 rounded-full border text-xs shadow transition
                ${darkMode ? 'bg-cyan-800 text-white border-cyan-700 hover:bg-cyan-700' : 'bg-cyan-500 text-white border-cyan-500 hover:bg-cyan-600'}`}>+ Incluir</button>
            </div>
          </div>
          <div className="overflow-x-auto" style={{maxHeight:'400px', overflowY:'auto'}}>
            <table className="min-w-max w-full text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Nome</th>
                  <th className="text-left p-2 hidden sm:table-cell">Categoria</th>
                  <th className="text-left p-2 hidden sm:table-cell">Subcategoria</th>
                  <th className="text-right p-2">Valor</th>
                  <th className="p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {vis.length===0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-slate-400">Sem lançamentos no período selecionado.</td></tr>
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
                    <td className="p-2">{e.nome}</td>
                    <td className="p-2 hidden sm:table-cell">{e.categoria||'—'}</td>
                    <td className="p-2 hidden sm:table-cell">{e.subcategoria||'—'}</td>
                    <td className={`p-2 text-right font-semibold ${e.tipo==='ganho'? (darkMode ? 'text-green-400' : 'text-green-700') : (darkMode ? 'text-red-400' : 'text-red-700')}`}>{toBRL(e.valor)}</td>
                    <td className="p-2 text-center flex gap-1 justify-center">
                      <button onClick={()=>remover(e.id)}
                        className={`px-2 py-1 rounded-xl border flex items-center justify-center transition
                          ${darkMode ? 'bg-slate-800 text-rose-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-rose-600 border-slate-200 hover:bg-rose-50'}`}
                        title="Excluir">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="5" x2="13" y2="13"/><line x1="13" y1="5" x2="5" y2="13"/></svg>
                      </button>
                      <button onClick={()=>{setEditandoId(e.id); setEditData(e); setShowModal(true);}}
                        className={`px-2 py-1 rounded-xl border flex items-center justify-center transition
                          ${darkMode ? 'bg-slate-800 text-blue-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-blue-600 border-slate-200 hover:bg-blue-50'}`}
                        title="Editar">
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
            <h3 className="font-semibold">Evolução no período</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serieEvolucao} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                <XAxis dataKey="dia" hide={false} tickLine={false} axisLine={false}/>
                <Tooltip formatter={(v:any)=> toBRL(Number(v))} labelFormatter={()=>''}/>
                <Line type="monotone" dataKey="saldo" stroke="#06b6d4" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        {/* Donut de despesas por categoria */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Despesas por categoria</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutDespesas} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {donutDespesas.map((_, i)=> <Cell key={i} fill={CAT_CORES[i % CAT_CORES.length]} />)}
                </Pie>
                <Tooltip formatter={(v:any)=> toBRL(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 text-xs">
            {donutDespesas.map((d,i)=> (
              <span key={d.name} className="inline-flex items-center gap-2 px-2 py-1 rounded-full border">
                <span className="w-3 h-3 rounded-full" style={{backgroundColor: CAT_CORES[i % CAT_CORES.length]}}/>
                {d.name}: <b>{toBRL(d.value)}</b>
              </span>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  function PaginaInvestimentos(){
    const lista = invest.sort((a,b)=> new Date(b.data).getTime() - new Date(a.data).getTime());
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
            <h3 className="font-semibold">Investimentos do período</h3>
            
          </div>
          <div className="overflow-x-auto mt-2">
            <table className="min-w-max w-full text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Ativo/Descrição</th>
                  <th className="text-left p-2 hidden sm:table-cell">Classe</th>
                  <th className="text-right p-2">Aporte</th>
                  <th className="p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.length===0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">Sem aportes no período.</td></tr>}
                {lista.map(e=> (
                  <tr key={e.id} className="border-t">
                    <td className="p-2 whitespace-nowrap">{new Date(e.data).toLocaleDateString()}</td>
                    <td className="p-2">{e.nome}</td>
                    <td className="p-2 hidden sm:table-cell">{e.categoria||'—'}</td>
                    <td className="p-2 text-right font-semibold text-blue-700">{toBRL(e.valor)}</td>
                    <td className="p-2 text-center"><button onClick={()=>remover(e.id)} className="px-2 py-1 rounded-xl border hover:bg-slate-50">Excluir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">Distribuição por classe</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={porClasse} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {porClasse.map((_, i)=> <Cell key={i} fill={CAT_CORES[i % CAT_CORES.length]} />)}
                </Pie>
                <Tooltip formatter={(v:any)=> toBRL(Number(v))} />
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
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Seletor de período e totais */}
        {pagina === 'lancamentos' && <SeletorPeriodo/>}
        {/* Div centralizada para filtros e busca */}
        {pagina === 'lancamentos' && (
          <div className="flex items-center justify-center mb-4" style={{gap: 16}}>
            <div className="flex gap-2 items-center flex-wrap">
              <button className={`px-3 py-1 rounded-full border text-xs transition
                ${filtroTipo==='' ? (darkMode ? 'bg-cyan-900 text-cyan-100 border-cyan-800' : 'bg-cyan-50 text-cyan-700 border-cyan-100') : (darkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-600 border-slate-200')}`} onClick={()=>setFiltroTipo('')}>Todos</button>
              <button className={`px-3 py-1 rounded-full border text-xs transition
                ${filtroTipo==='despesa' ? (darkMode ? 'bg-blue-900 text-blue-100 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-100') : (darkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-600 border-slate-200')}`} onClick={()=>setFiltroTipo('despesa')}>Despesas</button>
              <button className={`px-3 py-1 rounded-full border text-xs transition
                ${filtroTipo==='ganho' ? (darkMode ? 'bg-cyan-900 text-cyan-100 border-cyan-800' : 'bg-cyan-50 text-cyan-700 border-cyan-100') : (darkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-600 border-slate-200')}`} onClick={()=>setFiltroTipo('ganho')}>Ganhos</button>
            </div>
            <div style={{width: 140, minWidth: 0, position: 'relative'}}>
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar..."
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
        className="fixed bottom-5 right-5 w-14 h-14 rounded-full shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center"
      >
        <IconPlus/>
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-40 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-slate-900/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={()=>{setShowModal(false); setEditandoId(null); setEditData(null);}}/>
            <motion.div className={`relative z-10 w-full max-w-xl sm:max-w-lg md:max-w-md rounded-3xl ${THEME.card} shadow-xl p-5 flex flex-col`} initial={{ scale: 0.95, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 40 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} style={{ maxHeight: '90vh', overflowY: 'auto', minHeight: '300px', minWidth: '0', }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{editandoId ? 'Editar lançamento' : 'Novo lançamento'}</h3>
                <button onClick={()=>{setShowModal(false); setEditandoId(null); setEditData(null);}} className="px-3 py-1 rounded-xl border">Fechar</button>
              </div>
              <div className="mb-3">
      {/* Modal de escopo de edição para fixas/parceladas */}
      <AnimatePresence>
        {showEditScopeModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-slate-900/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={()=>setShowEditScopeModal(false)}/>
            <motion.div className={`relative z-10 w-full max-w-md rounded-3xl ${THEME.card} shadow-xl p-6 flex flex-col items-center`} initial={{ scale: 0.95, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 40 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
              <h3 className="font-semibold mb-4 text-center">Como deseja aplicar a edição?</h3>
              <div className="mb-4 text-center text-slate-500">Esta movimentação é {pendingEditData?.subcategoria === 'Fixa' ? 'fixa' : 'parcelada'}.<br/>Deseja editar apenas esta movimentação ou todas a partir desta?</div>
              <div className="flex gap-4 justify-center">
                <button onClick={()=>aplicarEdicaoRecorrente('single')} className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md">Editar apenas esta</button>
                <button onClick={()=>aplicarEdicaoRecorrente('all')} className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-md">Editar todas a partir desta</button>
              </div>
              <button onClick={()=>setShowEditScopeModal(false)} className="mt-6 px-3 py-1 rounded-xl border">Cancelar</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
                <div className="text-sm text-slate-500 mb-1">O que deseja {editandoId ? 'editar' : 'adicionar'}?</div>
                <div className="flex gap-2">
                  <button onClick={()=>setTipo('despesa')} className={`px-3 py-2 rounded-2xl border-0 shadow-none ${tipo==='despesa'?'bg-gradient-to-r from-cyan-500 to-blue-600 text-white':'hover:bg-slate-50'}`}>Despesa</button>
                  <button onClick={()=>setTipo('ganho')} className={`px-3 py-2 rounded-2xl border-0 shadow-none ${tipo==='ganho'?'bg-gradient-to-r from-cyan-500 to-blue-600 text-white':'hover:bg-slate-50'}`}>Ganho</button>
                  <button onClick={()=>setTipo('investimento')} className={`px-3 py-2 rounded-2xl border-0 shadow-none ${tipo==='investimento'?'bg-gradient-to-r from-cyan-500 to-blue-600 text-white':'hover:bg-slate-50'}`}>Investimento</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="text-sm text-slate-500">Nome</div>
                  <input
                    value={editandoId && editData ? editData.nome : nome}
                    onChange={e=>editandoId && editData ? setEditData({...editData, nome: e.target.value}) : setNome(e.target.value)}
                    placeholder={tipo==='despesa' ? 'Ex.: Mercado, Luz, Transporte' : tipo==='ganho' ? 'Ex.: Salário, Bônus, Venda' : 'Ex.: Tesouro Selic, Ações, Cripto'}
                    className={`mt-1 w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 placeholder-slate-500' : 'bg-white text-slate-800 border-slate-200 placeholder-slate-400'}`}
                  />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Valor (R$)</div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editandoId && editData ? (editData.valor !== undefined ? formatBRLInput((Math.round(Number(editData.valor) * 100)).toString()) : '') : formatBRLInput(valor)}
                    onChange={e => {
                      // Permite digitar normalmente, inclusive zero à esquerda e vírgula
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      const formatted = formatBRLInput(raw);
                      if (editandoId && editData) {
                        // Só atualiza se o valor for um número válido
                        const val = formatted ? parseFloat(formatted.replace(/\./g, '').replace(/,/, '.')) : 0;
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
                  <div className="text-sm text-slate-500">Categoria</div>
                  <div className="mt-1 flex flex-wrap">
                    {(tipo==='investimento'
  ? CATS_INVEST
  : tipo==='ganho'
    ? ['Salário','Bônus','Venda','Outros']
    : CATS_PADRAO
).map(cat=> (
                      <Pill key={cat} label={cat} active={(editandoId && editData ? editData.categoria : categoria)===cat} onClick={()=> editandoId && editData ? setEditData({...editData, categoria: (editData.categoria===cat? '' : cat)}) : setCategoria(categoria===cat? '' : cat)} />
                    ))}
                  </div>
                  <input
                    value={editandoId && editData ? (editData.categoria||'') : categoria}
                    onChange={e=>editandoId && editData ? setEditData({...editData, categoria: e.target.value}) : setCategoria(e.target.value)}
                    placeholder="ou digite uma categoria"
                    className={`mt-2 w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 placeholder-slate-500' : 'bg-white text-slate-800 border-slate-200 placeholder-slate-400'}`}
                  />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Data</div>
                  <input type="date" value={editandoId && editData ? editData.data : data} onChange={e=>editandoId && editData ? setEditData({...editData, data: e.target.value}) : setData(e.target.value)} className={`mt-1 w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 placeholder-slate-500' : 'bg-white text-slate-800 border-slate-200 placeholder-slate-400'}`}/>
                  <div className="mt-2">
                    <div className="text-sm text-slate-500">Recorrência <span className="text-xs text-slate-400">(opcional)</span></div>
                    <select value={editandoId && editData ? (editData.subcategoria||'') : subcategoria} onChange={e=>editandoId && editData ? setEditData({...editData, subcategoria: e.target.value}) : setSubcategoria(e.target.value)} className={`mt-1 w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-800 border-slate-200'}`}> 
                      <option value="">Nenhuma</option>
                      <option value="Fixa">Fixa</option>
                      <option value="Parcelada">Parcelada</option>
                    </select>
                    {(editandoId && editData ? editData.subcategoria : subcategoria) === 'Parcelada' && (
                      <div className="mt-2 flex items-center gap-2">
                        <label className="text-sm text-slate-500">Nº de parcelas:</label>
                        <input type="number" min={1} max={60} value={editandoId && editData ? (editData.numParcelas || numParcelas) : numParcelas} onChange={e => {
                          const val = Math.max(1, Math.min(60, Number(e.target.value)));
                          if (editandoId && editData) setEditData({ ...editData, numParcelas: val });
                          else setNumParcelas(val);
                        }} className={`w-20 px-2 py-1 rounded-xl border ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-800 border-slate-200'}`}/>
                      </div>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Observações</div>
                  <textarea
                    value={editandoId && editData ? (editData.observacoes||'') : observacoes}
                    onChange={e=>editandoId && editData ? setEditData({...editData, observacoes: e.target.value}) : setObservacoes(e.target.value)}
                    rows={2}
                    className={`mt-1 w-full px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-800 text-slate-200 border-slate-700 placeholder-slate-500' : 'bg-white text-slate-800 border-slate-200 placeholder-slate-400'}`}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button onClick={()=>{ resetForm(); setShowModal(false); setEditandoId(null); setEditData(null); }} className="px-4 py-2 rounded-xl border">Cancelar</button>
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
                  {editandoId ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rodapé leve */}
      <footer className="text-center text-xs text-slate-400 py-4">Dados locais (localStorage). Use o menu (≡) para importar/exportar. • Bruno Lorran • Criado a partir do CHAT GPT • Build 1.2</footer>
    </div>
  );
}

// Adicione este helper para formatar o valor digitado como moeda brasileira
function formatBRLInput(value: string): string {
  // Remove tudo que não for número
  const onlyDigits = value.replace(/\D/g, '');
  if (!onlyDigits) return '';
  // Converte para centavos
  const number = parseInt(onlyDigits, 10);
  const formatted = (number / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return formatted;
}
