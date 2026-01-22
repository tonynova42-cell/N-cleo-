import React, { useState, useMemo } from 'react';
import { 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface AnalysisCardProps {
  content: string;
}

type TabType = 'visao' | 'diagnostico' | 'plano';

const AnalysisCard: React.FC<AnalysisCardProps> = ({ content }) => {
  const [activeTab, setActiveTab] = useState<TabType>('visao');

  const cleanContent = content.replace(/\*\*/g, '');
  const rawSections = cleanContent.split(/(?=###\s)/).filter(s => s.trim().length > 0);

  const sectionsMap = useMemo(() => {
    const map: Record<string, string> = {};
    rawSections.forEach(section => {
      const upper = section.toUpperCase();
      // Mapeamento Empresarial e Pessoal
      if (upper.includes("STATUS GERAL") || upper.includes("STATUS FINANCEIRO")) map['status'] = section;
      if (upper.includes("NÚMERO ÚNICO DE FOCO")) map['foco'] = section;
      if (upper.includes("DASHBOARD RESUMIDO") || upper.includes("RESUMO DO MÊS")) map['dashboard'] = section;
      if (upper.includes("LEITURA INTELIGENTE")) map['leitura'] = section;
      if (upper.includes("PRINCIPAIS GARGALOS")) map['gargalos_simples'] = section;
      if (upper.includes("AÇÕES RECOMENDADAS")) map['acoes_simples'] = section;
      if (upper.includes("ALERTA OU OPORTUNIDADE") || upper.includes("DICA DE OURO")) map['alerta'] = section;
      if (upper.includes("MELHORIA DO FLUXO FINANCEIRO")) map['fluxo'] = section;
      if (upper.includes("GARGALOS IDENTIFICADOS") || upper.includes("ONDE ESTÁ O DESPERDÍCIO")) map['gargalos_detalhado'] = section;
      if (upper.includes("AÇÕES PRIORITÁRIAS")) map['acoes_detalhado'] = section;
      if (upper.includes("PERGUNTA GUIADA")) map['pergunta'] = section;
    });
    return map;
  }, [rawSections]);

  const parseChartData = (text: string) => {
    const match = text.match(/\[DATASET:\s*(.*?)\]/);
    if (!match) return null;
    try {
      const points = match[1].split(';');
      return points.map(p => {
        const name = p.split('(')[0].trim();
        const vals = p.match(/\((.*?)\)/)?.[1] || '';
        const f = parseFloat(vals.match(/F:([\d.]+)/)?.[1] || '0');
        const l = parseFloat(vals.match(/L:([\d.]+)/)?.[1] || '0');
        const c = parseFloat(vals.match(/C:([\d.]+)/)?.[1] || '0');
        return { name, receita: f, lucratividade: l, custos: c };
      });
    } catch (e) { return null; }
  };

  const chartData = useMemo(() => parseChartData(cleanContent), [cleanContent]);

  const renderStatusHeader = () => {
    const statusText = sectionsMap['status'] || '';
    const focoText = sectionsMap['foco'] || '';
    
    const statusLines = statusText.split('\n').filter(l => l.trim().length > 0);
    const statusLine = statusLines[1] || '';
    const statusDesc = statusLines[2] || '';
    
    // Suporta status empresarial e pessoal
    const isHealthy = statusLine.includes('Saudável') || statusLine.includes('Equilibrado') || statusLine.includes('Confortável');
    const isRisk = statusLine.includes('Risco') || statusLine.includes('Crítico');
    
    const focoParts = focoText.split('\n').filter(l => l.trim().length > 0);
    const focoMain = focoParts[1] || '';
    const focoValue = focoMain.split(':')[1]?.trim() || focoMain;
    const focoLabel = focoMain.split(':')[0]?.trim() || 'Foco';

    return (
      <div className="mb-10 space-y-4">
        <div className={`p-6 rounded-[2.5rem] border-2 flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          isHealthy ? 'bg-emerald-50 border-emerald-100' : isRisk ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
        }`}>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Status Atual</span>
            <div className={`text-3xl font-black tracking-tighter ${
              isHealthy ? 'text-emerald-700' : isRisk ? 'text-red-700' : 'text-amber-700'
            }`}>
              {statusLine.replace('###', '').trim()}
            </div>
            <p className="text-sm font-medium text-slate-600 mt-1">{statusDesc.trim()}</p>
          </div>
          
          <div className="h-px md:h-12 md:w-px bg-slate-200 hidden md:block"></div>

          <div className="flex-1 md:text-right">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Número de Foco</span>
            <div className="text-3xl font-black text-slate-900 tracking-tighter">{focoValue}</div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-tighter mt-1">{focoLabel}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderVisao = () => {
    const dashText = sectionsMap['dashboard'] || '';
    const kpis = dashText.split('\n').filter(l => l.includes(':'));

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {kpis.map((kpi, i) => {
            const [label, val] = kpi.replace('-', '').split(':').map(s => s.trim());
            return (
              <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <div className="text-lg font-black text-slate-900 tracking-tight">{val}</div>
              </div>
            );
          })}
        </div>

        {chartData && (
          <div className="bg-slate-900 rounded-[2.5rem] p-6 md:p-10 shadow-xl border border-slate-800">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-blue-400 font-black text-[10px] uppercase tracking-[0.3em]">Fluxo Financeiro</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Evolução</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500/30"></div><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Faixa</span></div>
              </div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid #1e293b' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="receita" fill="#10b981" stroke="none" fillOpacity={0.15} name="Faixa Operacional" />
                  <Line type="monotone" dataKey="custos" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Ponto Mínimo" />
                  <Line type="monotone" dataKey="lucratividade" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} name="Evolução" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDiagnostico = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {sectionsMap['leitura'] && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm border-l-8 border-l-blue-600">
          <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4">LEITURA INTELIGENTE</h3>
          <p className="text-lg font-medium text-slate-700 leading-relaxed whitespace-pre-line">
            {sectionsMap['leitura']?.replace(/###.*?\n/, '').trim()}
          </p>
        </div>
      )}

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4">GARGALOS E PONTOS DE ATENÇÃO</h3>
        <div className="space-y-4">
          {sectionsMap['gargalos_detalhado']?.split('\n').filter(l => l.includes('|')).map((g, i) => {
            const parts = g.replace('-', '').split('|').map(p => p.trim());
            return (
              <div key={i} className="p-4 bg-red-50/50 rounded-2xl border border-red-100">
                <div className="font-black text-red-700 mb-1">{parts[0]}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-tight text-slate-500">
                  <span><span className="text-red-400">DETALHE:</span> {parts[1]?.split(':')[1]?.trim() || parts[1]}</span>
                  <span><span className="text-red-400">MOTIVO:</span> {parts[2]?.split(':')[1]?.trim() || parts[2]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderPlano = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {sectionsMap['fluxo'] && (
        <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100">
          <h3 className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-4">OTIMIZAÇÃO DO FLUXO</h3>
          <p className="text-slate-700 font-medium leading-relaxed">
            {sectionsMap['fluxo']?.replace(/###.*?\n/, '').trim()}
          </p>
        </div>
      )}

      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
        <h3 className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] mb-8">AÇÕES PRIORITÁRIAS</h3>
        <div className="space-y-6">
          {sectionsMap['acoes_detalhado']?.split('\n').filter(l => /^\d\./.test(l)).map((acao, i) => {
            const parts = acao.split('|').map(p => p.trim());
            return (
              <div key={i} className="group relative pl-12 border-b border-slate-800 pb-6 last:border-0">
                <div className="absolute left-0 top-0 w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-sm">{i+1}</div>
                <h4 className="text-lg font-black tracking-tight">{parts[0].replace(/^\d\.\s/, '')}</h4>
                <div className="flex flex-col md:flex-row gap-4 mt-2">
                  <div className="text-[10px] font-black uppercase text-blue-400 tracking-widest">
                    OBJETIVO: {parts[1]?.split(':')[1]?.trim() || parts[1]}
                  </div>
                  <div className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">
                    IMPACTO: {parts[2]?.split(':')[1]?.trim() || parts[2]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-lg">
        <h3 className="text-emerald-200 font-black text-[10px] uppercase tracking-widest mb-3">DICA ESTRATÉGICA</h3>
        <p className="text-xl font-black italic tracking-tight">
          "{sectionsMap['alerta']?.replace(/###.*?\n/, '').trim()}"
        </p>
      </div>

      {sectionsMap['pergunta'] && (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 border-dashed text-center">
          <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4">PRÓXIMO PASSO</h3>
          <p className="text-xl font-black text-slate-900 tracking-tight leading-snug">
            {sectionsMap['pergunta']?.replace(/###.*?\n/, '').trim()}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto mt-16 pb-20">
      {renderStatusHeader()}

      <div className="flex bg-white p-1.5 rounded-full border border-slate-100 shadow-sm mb-10 overflow-x-auto no-scrollbar">
        {(['visao', 'diagnostico', 'plano'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[100px] py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'visao' ? 'Visão Geral' : tab === 'diagnostico' ? 'Análise' : 'Estratégia'}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'visao' && renderVisao()}
        {activeTab === 'diagnostico' && renderDiagnostico()}
        {activeTab === 'plano' && renderPlano()}
      </div>
    </div>
  );
};

export default AnalysisCard;