import React, { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
// Icons (inline SVG to evitar libs externas)
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
  observacoes?: string;
  criadoEm: number;
};

 type Periodo = 'mensal' | 'semanal';
 type Pagina = 'lancamentos' | 'resumo' | 'investimentos';

 // ---- Helpers ----
 const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
 const toBRL = (n:number)=> n.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
 const fmtDM = (iso:string)=> {
  const d = new Date(iso); return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0');
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
 const CAT_CORES = ['#06b6d4','#22d3ee','#38bdf8','#60a5fa','#93c5fd','#7dd3fc','#0ea5e9','#2563eb','#0891b2'];
 const CATS_PADRAO = ['Alimentação','Mercado','Transporte','Moradia','Contas','Saúde','Educação','Lazer','Assinaturas','Impostos','Investimentos','Outros'];
 const CATS_INVEST = ['Renda Fixa','Ações','Fundos','ETF','Cripto','Tesouro','Caixa'];

export default function App() {
  // ---- Estado base ----
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pagina, setPagina] = useState<Pagina>('lancamentos');

  // Período
  const [periodo, setPeriodo] = useState<Periodo>('mensal');
  const [mesRef, setMesRef] = useState<string>(()=>{
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });
  const [dataRef, setDataRef] = useState<string>(()=> new Date().toISOString().slice(0,10));

  // Modal + formulário
  const [showModal, setShowModal] = useState(false);
  const [tipo, setTipo] = useState<Tipo>('despesa');
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState<string>('');
  const [data, setData] = useState<string>(()=> new Date().toISOString().slice(0,10));
  const [categoria, setCategoria] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Menus/inputs escondidos
  const [menuOpen, setMenuOpen] = useState(false);
  const fileXLSXRef = useRef<HTMLInputElement|null>(null);
  const fileJSONRef = useRef<HTMLInputElement|null>(null);

  // ---- Load/Save ----
  useEffect(()=>{ try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) setEntries(JSON.parse(raw)); }catch{} },[]);
  useEffect(()=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }catch{} },[entries]);

  // ---- Período atual ----
  const { inicio, fim } = useMemo(()=>{
    if(periodo==='mensal'){
      const [y,m] = mesRef.split('-').map(Number); const base = new Date(y, m-1, 1);
      return { inicio: startOfMonth(base), fim: endOfMonth(base) };
    } else {
      const base = new Date(dataRef); return { inicio: startOfWeek(base), fim: endOfWeek(base) };
    }
  },[periodo, mesRef, dataRef]);

  const visiveis = useMemo(()=> entries.filter(e=> withinRange(e.data, inicio, fim)), [entries, inicio, fim]);
  const caixa = useMemo(()=> visiveis.filter(e=> e.tipo!=='investimento'), [visiveis]);
  const invest = useMemo(()=> visiveis.filter(e=> e.tipo==='investimento'), [visiveis]);

  const totais = useMemo(()=>{
    const ganhos = caixa.filter(e=> e.tipo==='ganho').reduce((s,e)=> s+e.valor,0);
    const despesas = caixa.filter(e=> e.tipo==='despesa').reduce((s,e)=> s+e.valor,0);
    return { ganhos, despesas, saldo: ganhos - despesas };
  },[caixa]);

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

  // ---- Ações ----
  function resetForm(){ setNome(''); setValor(''); setCategoria(''); setObservacoes(''); setTipo('despesa'); setData(new Date().toISOString().slice(0,10)); }

  function addEntry(){
    const v = Number(valor);
    if(!nome.trim()) return alert('Dê um nome.');
    if(!data) return alert('Informe a data.');
    if(!v || isNaN(v) || v<=0) return alert('Valor inválido.');
    const novo: Entry = { id: uid(), tipo, nome: nome.trim(), valor: v, data, categoria: categoria.trim()||undefined, observacoes: observacoes.trim()||undefined, criadoEm: Date.now() };
    setEntries(prev=> [novo, ...prev]);
    setShowModal(false); resetForm();
  }
  function remover(id:string){ if(!confirm('Excluir este lançamento?')) return; setEntries(prev=> prev.filter(e=> e.id!==id)); }
  function limparTudo(){ if(!confirm('Remover TODOS os dados?')) return; setEntries([]); }

  // Exportar/Importar
  function exportarJSON(){ const blob = new Blob([JSON.stringify(entries,null,2)], {type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='financeiro.json'; a.click(); URL.revokeObjectURL(url); }
  function exportarCSV(){ const header='tipo;nome;valor;data;categoria;observacoes\\n'; const rows = entries.map(e=>[e.tipo,e.nome,String(e.valor).replace('.',','),e.data,e.categoria||'',(e.observacoes||'').replace(/\\n/g,' ')].join(';')).join('\\n'); const blob = new Blob([header+rows],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='financeiro.csv'; a.click(); URL.revokeObjectURL(url); }

  // Importar JSON
  function importarJSON(file:File){ const reader = new FileReader(); reader.onload=()=>{ try{ const dados = JSON.parse(String(reader.result)); if(!Array.isArray(dados)) throw new Error('Formato inválido'); const sane:Entry[] = dados.map((d:any)=>({ id: String(d.id||uid()), tipo: d.tipo==='ganho'? 'ganho': d.tipo==='investimento'? 'investimento':'despesa', nome: String(d.nome||'Sem nome'), valor: Math.abs(Number(d.valor))||0, data: String(d.data||new Date().toISOString().slice(0,10)), categoria: d.categoria? String(d.categoria): undefined, observacoes: d.observacoes? String(d.observacoes): undefined, criadoEm: Number(d.criadoEm)||Date.now() })).filter(e=> e.valor>0); setEntries(sane); }catch(e){ alert('Falha ao importar JSON: '+(e as Error).message);} }; reader.readAsText(file); }

  // Importar Excel/CSV via SheetJS (XLSX) – mapeia colunas: tipo, nome, valor, data, categoria, observacoes
  async function importarXLSX(file:File){
    try{
      // @ts-ignore - import dinâmico
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type:'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
      const sane:Entry[] = (json as any[]).map((r:any)=>{
        const rawTipo = String((r.tipo||r.Tipo||r.TIPO||'despesa')).toLowerCase();
        const t:Tipo = rawTipo.includes('gan')? 'ganho' : rawTipo.includes('inv')? 'investimento' : 'despesa';
        const nome = String(r.nome||r.Nome||r.DESCRICAO||r.Descricao||'Sem nome');
        const valor = Math.abs(Number(String(r.valor||r.Valor||r.VALOR).replace(',','.')))||0;
        let data = String(r.data||r.Data||r.DATA||'').trim();
        if(!data){ data = new Date().toISOString().slice(0,10);} else {
          // tenta converter formatos comuns dd/mm/yyyy
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
            const [d,m,y] = data.split('/').map(Number); data = new Date(y, m-1, d).toISOString().slice(0,10);
          } else if(/\\d{4}-\\d{2}-\\d{2}/.test(data)) { /* já ISO */ }
          else { const d = new Date(data); if(!isNaN(d.getTime())) data = d.toISOString().slice(0,10); else data = new Date().toISOString().slice(0,10); }
        }
        const categoria = String(r.categoria||r.Categoria||'').trim()||undefined;
        const observacoes = String(r.observacoes||r.Observacoes||r.OBS||'').trim()||undefined;
        return { id: uid(), tipo: t, nome, valor, data, categoria, observacoes, criadoEm: Date.now() };
      }).filter(e=> e.valor>0);
      setEntries(sane);
    }catch(err){ alert('Falha ao importar Excel/CSV: '+(err as Error).message); }
  }

  // ---- UI helpers ----
  const NavButton = ({active, children, onClick}:{active:boolean, children:any, onClick:()=>void}) => (
    <button onClick={onClick} className={`px-4 py-2 rounded-2xl transition shadow-sm border ${active? 'bg-white text-slate-900' : 'bg-white/70 text-slate-600 hover:bg-white'}`}>{children}</button>
  );

  const Pill = ({label, active, onClick}:{label:string, active:boolean, onClick:()=>void}) => (
    <button onClick={onClick} className={`px-3 py-1 rounded-full text-sm mr-2 mb-2 border transition-all duration-200 ease-in-out
    ${active? 'bg-cyan-600 text-white border-cyan-600 scale-105 shadow-md' : LIGHT.pill+' hover:scale-105 hover:shadow'}`}>{label}</button>
  );

  const Card = ({children}:{children:any}) => (
    <div className={`rounded-2xl ${LIGHT.card} shadow-sm p-4`}>{children}</div>
  );

  // ---- Componentes de página ----
  function Header(){
    return (
      <div className="sticky top-0 z-20">
        <div className={`backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 border-b`}> 
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconMoney />
              <div>
                <div className="font-bold tracking-wide" style={{fontFamily:'Montserrat, ui-sans-serif'}}>Controle Financeiro</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex gap-2">
                <NavButton active={pagina==='lancamentos'} onClick={()=>setPagina('lancamentos')}>Lançamentos</NavButton>
                <NavButton active={pagina==='resumo'} onClick={()=>setPagina('resumo')}>Resumo</NavButton>
                <NavButton active={pagina==='investimentos'} onClick={()=>setPagina('investimentos')}>Investimentos</NavButton>
              </div>
              <div className="relative">
                <button onClick={()=>setMenuOpen(v=>!v)} className="p-2 rounded-xl bg-white shadow border hover:shadow-md"><IconMenu/></button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-64 sm:w-56 bg-white border rounded-2xl shadow-lg p-2 z-30"
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      style={{
                        minWidth: '200px',
                        maxWidth: '90vw',
                      }}
                    >
                      <div className="px-3 py-1 text-xs text-slate-500">Dados</div>
                      <button onClick={()=>fileXLSXRef.current?.click()} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50"><IconUpload/> Importar Excel / CSV</button>
                      <button onClick={()=>fileJSONRef.current?.click()} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50"><IconUpload/> Importar JSON</button>
                      <button onClick={exportarJSON} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50"><IconDownload/> Exportar JSON</button>
                      <button onClick={exportarCSV} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50"><IconDownload/> Exportar CSV</button>
                      <hr className="my-2"/>
                      <button onClick={limparTudo} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-700"><IconTrash/> Limpar tudo</button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <input ref={fileXLSXRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; if(f) importarXLSX(f); e.currentTarget.value=''; setMenuOpen(false); }}/>
                <input ref={fileJSONRef} type="file" accept="application/json" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; if(f) importarJSON(f); e.currentTarget.value=''; setMenuOpen(false); }}/>
              </div>
            </div>
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
    const ganhos = investimentos ? 0 : totais.ganhos;
    const despesas = investimentos ? 0 : totais.despesas;
    const saldo = investimentos
      ? invest.reduce((s, e) => s + e.valor, 0)
      : totais.saldo;

    return (
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="text-sm text-slate-500">Período</div>
            <div className="mt-1 flex gap-2">
              <button onClick={()=>setPeriodo('mensal')} className={`px-3 py-2 rounded-xl border ${periodo==='mensal'? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent':'bg-white hover:bg-slate-50'}`}>Mensal</button>
              <button onClick={()=>setPeriodo('semanal')} className={`px-3 py-2 rounded-xl border ${periodo==='semanal'? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent':'bg-white hover:bg-slate-50'}`}>Semanal</button>
            </div>
          </div>
          {periodo==='mensal' ? (
            <div>
              <div className="text-sm text-slate-500">Mês</div>
              <input type="month" value={mesRef} onChange={e=>setMesRef(e.target.value)} className="mt-1 px-3 py-2 rounded-xl border"/>
            </div>
          ) : (
            <div>
              <div className="text-sm text-slate-500">Dia dentro da semana</div>
              <input type="date" value={dataRef} onChange={e=>setDataRef(e.target.value)} className="mt-1 px-3 py-2 rounded-xl border"/>
              <div className="text-xs text-slate-400 mt-1">{startOfWeek(new Date(dataRef)).toLocaleDateString()} – {endOfWeek(new Date(dataRef)).toLocaleDateString()}</div>
            </div>
          )}
          <div className="ml-auto text-right">
            <div className="text-sm text-slate-500">
              {investimentos ? "Investimentos do período" : "Totais do período"}
            </div>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {investimentos ? (
                <>
                  <div className="rounded-xl bg-blue-50 p-2 col-span-3">
                    <div className="text-xs text-slate-500">Total investido</div>
                    <div className="font-bold text-sky-500">{toBRL(saldo)}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-blue-50 p-2">
                    <div className="text-xs text-slate-500">Ganhos</div>
                    <div className="font-bold text-blue-700">{toBRL(ganhos)}</div>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-2">
                    <div className="text-xs text-slate-500">Despesas</div>
                    <div className="font-bold text-rose-500">{toBRL(despesas)}</div>
                  </div>
                  <div className="rounded-xl bg-sky-50 p-2">
                    <div className="text-xs text-slate-500">Saldo</div>
                    <div className="font-bold text-sky-500">{toBRL(saldo)}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  function PaginaLancamentos(){
    const vis = caixa.sort((a,b)=> new Date(b.data).getTime() - new Date(a.data).getTime() || b.criadoEm - a.criadoEm);
    return (
      <div className="space-y-4">
        <SeletorPeriodo/>
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Lançamentos ({vis.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-max w-full text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Nome</th>
                  <th className="text-left p-2 hidden sm:table-cell">Categoria</th>
                  <th className="text-right p-2">Valor</th>
                  <th className="p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {vis.length===0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-400">Sem lançamentos no período selecionado.</td></tr>
                )}
                {vis.map(e=> (
                  <tr key={e.id} className="border-t">
                    <td className="p-2 whitespace-nowrap">{new Date(e.data).toLocaleDateString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs border ${e.tipo==='ganho'? 'bg-cyan-50 text-cyan-700 border-cyan-100':'bg-blue-50 text-blue-700 border-blue-100'}`}>{e.tipo}</span>
                    </td>
                    <td className="p-2">{e.nome}</td>
                    <td className="p-2 hidden sm:table-cell">{e.categoria||'—'}</td>
                    <td className={`p-2 text-right font-semibold ${e.tipo==='ganho'? 'text-cyan-700':'text-blue-700'}`}>{toBRL(e.valor)}</td>
                    <td className="p-2 text-center"><button onClick={()=>remover(e.id)} className="px-2 py-1 rounded-xl border hover:bg-slate-50">Excluir</button></td>
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
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Aportes ({lista.length})</h3>
            <div className="text-sm text-slate-500">Total aportado no período: <b className="text-slate-700">{toBRL(soma)}</b></div>
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
  return (
    <div className={`min-h-screen ${LIGHT.bg} ${LIGHT.text}`} style={{fontFamily:'Montserrat, ui-sans-serif, system-ui'}}>
      {/* Gradiente de topo suave */}
      <div className="pointer-events-none fixed inset-x-0 -top-24 h-48 bg-gradient-to-b from-cyan-100 to-transparent"/>
      <Header/>
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {pagina==='lancamentos' && <PaginaLancamentos/>}
        {pagina==='resumo' && <PaginaResumo/>}
        {pagina==='investimentos' && <PaginaInvestimentos/>}
      </main>

      {/* FAB */}
      <button onClick={()=>setShowModal(true)} className="fixed bottom-5 right-5 w-14 h-14 rounded-full shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center">
        <IconPlus/>
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-slate-900/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={()=>setShowModal(false)}
            />
            <motion.div
              className="relative z-10 w-full max-w-xl sm:max-w-lg md:max-w-md rounded-3xl bg-white shadow-xl p-5 flex flex-col"
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                maxHeight: '90vh',
                overflowY: 'auto',
                minHeight: '300px',
                minWidth: '0',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Novo lançamento</h3>
                <button onClick={()=>setShowModal(false)} className="px-3 py-1 rounded-xl border">Fechar</button>
              </div>
              <div className="mb-3">
                <div className="text-sm text-slate-500 mb-1">O que deseja adicionar?</div>
                <div className="flex gap-2">
                  <button onClick={()=>setTipo('despesa')} className={`px-3 py-2 rounded-2xl border ${tipo==='despesa'?'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent':'hover:bg-slate-50'}`}>Despesa</button>
                  <button onClick={()=>setTipo('ganho')} className={`px-3 py-2 rounded-2xl border ${tipo==='ganho'?'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent':'hover:bg-slate-50'}`}>Ganho</button>
                  <button onClick={()=>setTipo('investimento')} className={`px-3 py-2 rounded-2xl border ${tipo==='investimento'?'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent':'hover:bg-slate-50'}`}>Investimento</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-slate-500">Nome</div>
                  <input value={nome} onChange={e=>setNome(e.target.value)} placeholder={tipo==='investimento'? 'Ex.: Aporte em Tesouro Selic' : 'Ex.: Mercado, Salário'} className="mt-1 w-full px-3 py-2 rounded-xl border"/>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Valor (R$)</div>
                  <input type="number" step="0.01" value={valor} onChange={e=>setValor(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border"/>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Data</div>
                  <input type="date" value={data} onChange={e=>setData(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border"/>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Categoria</div>
                  <div className="mt-1 flex flex-wrap">
                    {(tipo==='investimento'? CATS_INVEST : CATS_PADRAO).map(cat=> (
                      <Pill key={cat} label={cat} active={categoria===cat} onClick={()=> setCategoria(categoria===cat? '' : cat)} />
                    ))}
                  </div>
                  <input value={categoria} onChange={e=>setCategoria(e.target.value)} placeholder="ou digite uma categoria" className="mt-2 w-full px-3 py-2 rounded-xl border"/>
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm text-slate-500">Observações</div>
                  <textarea value={observacoes} onChange={e=>setObservacoes(e.target.value)} rows={2} className="mt-1 w-full px-3 py-2 rounded-xl border"/>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button onClick={()=>{ resetForm(); setShowModal(false); }} className="px-4 py-2 rounded-xl border">Cancelar</button>
                <button
                  onClick={addEntry}
                  className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600
                    transition-transform duration-150 ease-in-out active:scale-95 hover:brightness-110 shadow-md"
                >
                  Adicionar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rodapé leve */}
      <footer className="text-center text-xs text-slate-400 py-4">Dados locais (localStorage). Use o menu (≡) para importar/exportar. • Bruno Lorran • Criado a partir do CHAT GPT</footer>
    </div>
  );
}
