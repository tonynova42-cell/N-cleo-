
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AnalysisCard from './components/AnalysisCard';
import { analyzeBusinessData, analyzePersonalData } from './services/geminiService';
import { HistoryRecord, BusinessData, PersonalData, StaffRole, AnalysisType, BusinessProfile } from './types';

const INITIAL_BUSINESS_DATA: BusinessData = {
  period: '',
  revenue: 0,
  directCosts: 0,
  fixedCosts: { energy: 0, water: 0, internet: 0, software: 0, rent: 0, maintenance: 0 },
  staff: { totalCount: 0, roles: [] },
  variableCosts: { taxes: 0, marketing: 0, commissions: 0, logistics: 0 },
  otherCosts: []
};

const INITIAL_PERSONAL_DATA: PersonalData = {
  period: '',
  income: 0,
  housing: 0,
  utilities: 0,
  food: 0,
  transport: 0,
  creditCard: 0,
  health: 0,
  education: 0,
  leisure: 0,
  other: 0
};

const INITIAL_BUSINESS_PROFILE: BusinessProfile = {
  general: { name: '', segment: '', yearsInBusiness: '', location: '' },
  structure: { type: '', hours: '', units: '1' },
  team: { total: 0, roles: [] },
  operation: { offerings: '', salesChannel: [], suppliers: '' },
  finance: { hasControl: false, method: '', frequency: '' }
};

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const YEARS = [2023, 2024, 2025, 2026, 2027];

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'app' | 'history' | 'login' | 'signup' | 'mode_selection' | 'business_profile'>('home');
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  
  // Perfil do Negócio (CNPJ)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(INITIAL_BUSINESS_PROFILE);
  const [profileStep, setProfileStep] = useState(1);

  // Estados do Fluxo Guiado de Coleta
  const [step, setStep] = useState(0);
  const [businessData, setBusinessData] = useState<BusinessData>(INITIAL_BUSINESS_DATA);
  const [personalData, setPersonalData] = useState<PersonalData>(INITIAL_PERSONAL_DATA);
  const [tempValue, setTempValue] = useState<string>('');
  const [tempRole, setTempRole] = useState<Partial<StaffRole>>({});
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  // Estados para o Passo 1 (Período)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[currentMonth]);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  useEffect(() => {
    const saved = localStorage.getItem('nucleo_history');
    if (saved) setHistory(JSON.parse(saved));
    
    const savedAuth = localStorage.getItem('nucleo_auth');
    if (savedAuth === 'true') setIsLoggedIn(true);

    const savedProfile = localStorage.getItem('nucleo_biz_profile');
    if (savedProfile) setBusinessProfile(JSON.parse(savedProfile));
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('nucleo_auth');
    setView('home');
    setAnalysisType(null);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    localStorage.setItem('nucleo_auth', 'true');
    setView('mode_selection');
  };

  const saveToHistory = (input: string, result: string, type: AnalysisType) => {
    const faturamentoMatch = result.match(/Faturamento:\s*(R\$\s*[\d.,]+)/) || result.match(/Renda Total:\s*(R\$\s*[\d.,]+)/);
    const lucroMatch = result.match(/Lucro Bruto:\s*(R\$\s*[\d.,]+)/) || result.match(/Sobra Real:\s*(R\$\s*[\d.,]+)/);
    const now = new Date();
    
    const newRecord: HistoryRecord = {
      id: crypto.randomUUID(),
      type,
      date: now.toISOString(),
      monthYear: (type === 'CNPJ' ? businessData.period : personalData.period) || 'Análise Avulsa',
      input,
      result,
      summary: {
        faturamento: faturamentoMatch ? faturamentoMatch[1] : 'N/A',
        lucroBruto: lucroMatch ? lucroMatch[1] : 'N/A'
      }
    };

    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('nucleo_history', JSON.stringify(updatedHistory));
  };

  const handleFinishCollection = async () => {
    setLoading(true);
    setError(null);

    let prompt = '';
    let responseText: string | null = null;

    if (analysisType === 'CNPJ') {
      const profileInfo = businessProfile.general.name ? `
        PERFIL ESTRATÉGICO DO NEGÓCIO:
        Nome: ${businessProfile.general.name}
        Segmento: ${businessProfile.general.segment}
        Tempo: ${businessProfile.general.yearsInBusiness}
        Localização: ${businessProfile.general.location}
        Estrutura: ${businessProfile.structure.type} | Unidades: ${businessProfile.structure.units}
        Operação: ${businessProfile.operation.offerings} | Vendas: ${businessProfile.operation.salesChannel.join(', ')}
        Gestão: ${businessProfile.finance.method} | Frequência: ${businessProfile.finance.frequency}
      ` : '';

      prompt = `
        ${profileInfo}
        DADOS FINANCEIROS PARA ANÁLISE EMPRESARIAL (CNPJ):
        Período: ${businessData.period}
        Faturamento: R$ ${businessData.revenue.toLocaleString('pt-BR')}
        Custos Diretos (Produtos/Insumos): R$ ${businessData.directCosts.toLocaleString('pt-BR')}
        
        CUSTOS FIXOS:
        - Energia: R$ ${businessData.fixedCosts.energy}
        - Água: R$ ${businessData.fixedCosts.water}
        - Internet/Tel: R$ ${businessData.fixedCosts.internet}
        - Sistemas/Software: R$ ${businessData.fixedCosts.software}
        - Aluguel: R$ ${businessData.fixedCosts.rent}
        - Manutenção: R$ ${businessData.fixedCosts.maintenance}

        EQUIPE:
        Total de Funcionários: ${businessData.staff.totalCount}
        Cargos e Salários:
        ${businessData.staff.roles.map(r => `- ${r.role}: ${r.count} pessoas, Total R$ ${r.totalSalary}`).join('\n')}

        CUSTOS VARIÁVEIS:
        - Impostos/Taxas: R$ ${businessData.variableCosts.taxes}
        - Marketing/Publicidade: R$ ${businessData.variableCosts.marketing}
        - Comissões/Terceiros: R$ ${businessData.variableCosts.commissions}
        - Logística/Entregas: R$ ${businessData.variableCosts.logistics}

        OUTROS GASTOS:
        ${businessData.otherCosts.map(o => `- ${o.description}: R$ ${o.value}`).join('\n')}
      `;
      responseText = await analyzeBusinessData(prompt);
    } else {
      prompt = `
        DADOS COLETADOS PARA ANÁLISE PESSOAL (CPF):
        Período: ${personalData.period}
        Renda Mensal Total: R$ ${personalData.income.toLocaleString('pt-BR')}
        
        GASTOS:
        - Moradia (Aluguel/Financiamento): R$ ${personalData.housing}
        - Utilidades (Energia/Água/Net): R$ ${personalData.utilities}
        - Alimentação: R$ ${personalData.food}
        - Transporte: R$ ${personalData.transport}
        - Cartão de Crédito: R$ ${personalData.creditCard}
        - Saúde: R$ ${personalData.health}
        - Educação: R$ ${personalData.education}
        - Lazer: R$ ${personalData.leisure}
        - Outros Gastos: R$ ${personalData.other}
      `;
      responseText = await analyzePersonalData(prompt);
    }

    try {
      if (responseText) {
        setResult(responseText);
        saveToHistory(prompt, responseText, analysisType!);
        setStep(100);
      } else {
        setError("Não foi possível processar os dados agora.");
      }
    } catch (err) {
      setError("Erro ao conectar com o NÚCLEO.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: string) => {
    if (val === 'não sei' || val === '') return 0;
    const clean = val.replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const renderLogin = () => (
    <div className="max-w-md mx-auto pt-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
        <div className="text-center mb-10">
          <div className="bg-slate-900 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Acesso NÚCLEO</h2>
          <p className="text-slate-500 font-medium mt-2">Consultoria executiva e pessoal</p>
        </div>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleLoginSuccess(); }}>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">E-mail</label>
            <input type="email" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold focus:border-blue-500 outline-none transition-all" placeholder="seu@email.com" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Senha</label>
            <input type="password" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold focus:border-blue-500 outline-none transition-all" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg shadow-xl hover:bg-slate-800 transition-all">Entrar</button>
        </form>
      </div>
    </div>
  );

  const renderSignup = () => (
    <div className="max-w-xl mx-auto pt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter text-center mb-8">Criar Conta</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); handleLoginSuccess(); }}>
          <div className="md:col-span-2"><input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" placeholder="Nome Completo" /></div>
          <div className="md:col-span-2 pt-4"><button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-lg shadow-xl">Cadastrar</button></div>
        </form>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="flex flex-col animate-in fade-in duration-700">
      <section className="pt-12 md:pt-24 pb-16 md:pb-32 px-4 text-center">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full mb-8">
            <span className="text-xs font-black text-blue-700 uppercase tracking-widest">IA Financeira Especializada</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8">
            Domine seu fluxo <br /> <span className="text-blue-600 italic">com precisão.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            Seja para sua empresa ou para sua vida pessoal, o NÚCLEO transforma dados complexos em decisões simples.
          </p>
          <button onClick={() => isLoggedIn ? setView('mode_selection') : setView('login')} className="px-12 py-7 bg-slate-900 text-white rounded-[2rem] text-xl font-black shadow-2xl hover:bg-slate-800 transition-all">Começar Agora</button>
        </div>
      </section>
    </div>
  );

  const renderModeSelection = () => (
    <div className="max-w-4xl mx-auto pt-16 animate-in fade-in slide-in-from-bottom-8 duration-700 px-4">
      <div className="text-center mb-16"><h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">Escolha seu Modo de Análise</h2><p className="text-lg text-slate-500 font-medium">Como o NÚCLEO deve agir agora?</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button onClick={() => { setAnalysisType('CNPJ'); setView('app'); setStep(1); setBusinessData(INITIAL_BUSINESS_DATA); }} className="group bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl hover:border-blue-500 hover:shadow-2xl transition-all text-left">
          <div className="bg-slate-900 w-16 h-16 rounded-3xl flex items-center justify-center mb-8"><svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" /></svg></div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Consultoria CNPJ</h3>
          <p className="text-blue-600 font-black uppercase text-[10px] tracking-[0.2em] mb-4">Modo Empresarial</p>
          <p className="text-slate-500 font-medium leading-relaxed">Diagnóstico de PMEs: CMV, Folha, Faturamento e Lucro Bruto.</p>
        </button>
        <button onClick={() => { setAnalysisType('CPF'); setView('app'); setStep(1); setPersonalData(INITIAL_PERSONAL_DATA); }} className="group bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl hover:border-emerald-500 hover:shadow-2xl transition-all text-left">
          <div className="bg-emerald-600 w-16 h-16 rounded-3xl flex items-center justify-center mb-8"><svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0" /></svg></div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Consultoria CPF</h3>
          <p className="text-emerald-600 font-black uppercase text-[10px] tracking-[0.2em] mb-4">Modo Pessoal</p>
          <p className="text-slate-500 font-medium leading-relaxed">Finanças Pessoais: Organização de gastos, excessos e saúde financeira.</p>
        </button>
      </div>
    </div>
  );

  const renderBusinessProfileForm = () => {
    const questionContainerClass = "bg-white p-8 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-xl max-w-2xl mx-auto relative overflow-hidden";
    const titleClass = "text-3xl font-black text-slate-900 mb-8 tracking-tighter";
    const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block";
    const inputClass = "w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:border-blue-300 outline-none transition-all";
    const selectClass = "w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:border-blue-300 outline-none cursor-pointer";

    const saveProfile = () => {
      localStorage.setItem('nucleo_biz_profile', JSON.stringify(businessProfile));
      setView('app');
    };

    switch(profileStep) {
      case 1:
        return (
          <div className={questionContainerClass}>
            <h2 className={titleClass}>1. Informações Gerais</h2>
            <div className="space-y-4">
              <div><label className={labelClass}>Nome Fantasia</label><input className={inputClass} value={businessProfile.general.name} onChange={e => setBusinessProfile({...businessProfile, general: {...businessProfile.general, name: e.target.value}})} /></div>
              <div><label className={labelClass}>Segmento</label><input className={inputClass} placeholder="Ex: Restaurante, Loja Roupas" value={businessProfile.general.segment} onChange={e => setBusinessProfile({...businessProfile, general: {...businessProfile.general, segment: e.target.value}})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Tempo de Negócio</label><input className={inputClass} placeholder="Ex: 2 anos" value={businessProfile.general.yearsInBusiness} onChange={e => setBusinessProfile({...businessProfile, general: {...businessProfile.general, yearsInBusiness: e.target.value}})} /></div>
                <div><label className={labelClass}>Cidade/UF</label><input className={inputClass} placeholder="Ex: São Paulo - SP" value={businessProfile.general.location} onChange={e => setBusinessProfile({...businessProfile, general: {...businessProfile.general, location: e.target.value}})} /></div>
              </div>
            </div>
            <button onClick={() => setProfileStep(2)} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg mt-8 shadow-xl">Próximo</button>
          </div>
        );
      case 2:
        return (
          <div className={questionContainerClass}>
            <h2 className={titleClass}>2. Estrutura e Operação</h2>
            <div className="space-y-4">
              <div><label className={labelClass}>Tipo de Loja</label>
                <select className={selectClass} value={businessProfile.structure.type} onChange={e => setBusinessProfile({...businessProfile, structure: {...businessProfile.structure, type: e.target.value as any}})}>
                  <option value="">Selecione...</option><option value="physical">Apenas Física</option><option value="online">Apenas Online</option><option value="both">Ambas</option>
                </select>
              </div>
              <div><label className={labelClass}>Horário de Funcionamento</label><input className={inputClass} placeholder="Ex: 09h às 18h" value={businessProfile.structure.hours} onChange={e => setBusinessProfile({...businessProfile, structure: {...businessProfile.structure, hours: e.target.value}})} /></div>
              <div><label className={labelClass}>Principais Produtos/Serviços</label><textarea className={inputClass} rows={3} value={businessProfile.operation.offerings} onChange={e => setBusinessProfile({...businessProfile, operation: {...businessProfile.operation, offerings: e.target.value}})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => setProfileStep(1)} className="py-5 bg-slate-100 text-slate-400 rounded-3xl font-black">Voltar</button>
              <button onClick={() => setProfileStep(3)} className="py-5 bg-slate-900 text-white rounded-3xl font-black shadow-xl">Próximo</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className={questionContainerClass}>
            <h2 className={titleClass}>3. Organização Financeira</h2>
            <div className="space-y-4">
              <div><label className={labelClass}>Método de Controle</label>
                <select className={selectClass} value={businessProfile.finance.method} onChange={e => setBusinessProfile({...businessProfile, finance: {...businessProfile.finance, method: e.target.value as any}})}>
                  <option value="">Selecione...</option><option value="spreadsheet">Planilhas</option><option value="system">Sistema (ERP)</option><option value="none">Nenhum controle formal</option>
                </select>
              </div>
              <div><label className={labelClass}>Frequência de Acompanhamento</label>
                <select className={selectClass} value={businessProfile.finance.frequency} onChange={e => setBusinessProfile({...businessProfile, finance: {...businessProfile.finance, frequency: e.target.value}})}>
                  <option value="">Selecione...</option><option value="Diário">Diário</option><option value="Semanal">Semanal</option><option value="Mensal">Mensal</option><option value="Raramente">Raramente</option>
                </select>
              </div>
              <div><label className={labelClass}>Principais Fornecedores</label><input className={inputClass} value={businessProfile.operation.suppliers} onChange={e => setBusinessProfile({...businessProfile, operation: {...businessProfile.operation, suppliers: e.target.value}})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => setProfileStep(2)} className="py-5 bg-slate-100 text-slate-400 rounded-3xl font-black">Voltar</button>
              <button onClick={saveProfile} className="py-5 bg-blue-600 text-white rounded-3xl font-black shadow-xl">Salvar Perfil</button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const renderStep = () => {
    const questionContainerClass = "bg-white p-8 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-xl max-w-2xl mx-auto relative overflow-hidden";
    const labelClass = "text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4 block";
    const titleClass = "text-3xl md:text-4xl font-black text-slate-900 mb-8 tracking-tighter leading-tight";
    const inputClass = "w-full p-6 text-2xl font-bold bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-blue-500 outline-none transition-all placeholder:text-slate-300";
    const selectClass = "w-full p-5 text-xl font-bold bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-blue-500 outline-none appearance-none cursor-pointer";
    const buttonClass = "w-full py-6 rounded-3xl font-black text-xl transition-all flex items-center justify-center gap-3";

    const updateBusiness = (field: string, val: any, isSubField?: string) => {
      if (isSubField) { setBusinessData(prev => ({ ...prev, [isSubField]: { ...prev[isSubField as keyof BusinessData] as any, [field]: val } })); }
      else { setBusinessData(prev => ({ ...prev, [field]: val })); }
    };

    const updatePersonal = (field: string, val: any) => { setPersonalData(prev => ({ ...prev, [field]: val })); };

    if (analysisType === 'CNPJ') {
      // FLOW COMPLEMENT: OPTIONAL PROFILE REMINDER
      if (step === 1 && !businessProfile.general.name) {
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-blue-600 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                <h3 className="text-2xl font-black tracking-tight mb-2">Potencialize sua Consultoria</h3>
                <p className="text-blue-100 font-medium mb-6">Complete o perfil do seu negócio para que a IA gere recomendações muito mais precisas e personalizadas.</p>
                <div className="flex gap-4">
                  <button onClick={() => { setView('business_profile'); setProfileStep(1); }} className="px-6 py-3 bg-white text-blue-600 rounded-2xl font-black text-sm uppercase">Configurar Agora</button>
                  <button onClick={() => setStep(2)} className="px-6 py-3 bg-blue-700/50 text-white rounded-2xl font-black text-sm uppercase">Pular por enquanto</button>
                </div>
               </div>
               <svg className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-blue-500/20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
            </div>
            
            <div className={questionContainerClass}>
              <span className={labelClass}>Início da Análise</span>
              <h2 className={titleClass}>Qual período você deseja analisar?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Mês</label><select className={selectClass} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Ano</label><select className={selectClass} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>{YEARS.map(y => <option key={y} value={y.toString()}>{y}</option>)}</select></div>
              </div>
              <button onClick={() => { updateBusiness('period', `${selectedMonth} ${selectedYear}`); setStep(2); }} className={`${buttonClass} mt-8 bg-slate-900 text-white shadow-xl`}>Próximo</button>
            </div>
          </div>
        );
      }

      switch(step) {
        case 1:
          return (
            <div className={questionContainerClass}>
              <span className={labelClass}>Passo 1 de 7 (Empresarial)</span>
              <h2 className={titleClass}>Qual período você deseja analisar?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Mês</label><select className={selectClass} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Ano</label><select className={selectClass} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>{YEARS.map(y => <option key={y} value={y.toString()}>{y}</option>)}</select></div>
              </div>
              <button onClick={() => { updateBusiness('period', `${selectedMonth} ${selectedYear}`); setStep(2); }} className={`${buttonClass} mt-8 bg-slate-900 text-white shadow-xl`}>Próximo</button>
              {businessProfile.general.name && <button onClick={() => setView('business_profile')} className="mt-4 text-xs font-black text-blue-600 uppercase w-full">Editar Perfil do Negócio</button>}
            </div>
          );
        case 2: return (<div className={questionContainerClass}><span className={labelClass}>Passo 2 de 7</span><h2 className={titleClass}>Faturamento Total</h2><input type="number" className={inputClass} placeholder="R$ 0,00" autoFocus onChange={(e) => updateBusiness('revenue', formatCurrency(e.target.value))} /><div className="flex gap-4 mt-8"><button onClick={() => setStep(1)} className={`${buttonClass} bg-slate-100 text-slate-400`}>Voltar</button><button onClick={() => setStep(3)} className={`${buttonClass} bg-slate-900 text-white`}>Próximo</button></div></div>);
        case 3: return (<div className={questionContainerClass}><span className={labelClass}>Passo 3 de 7</span><h2 className={titleClass}>Custo de Insumos/Estoque</h2><input type="number" className={inputClass} placeholder="R$ 0,00" autoFocus onChange={(e) => updateBusiness('directCosts', formatCurrency(e.target.value))} /><div className="flex gap-4 mt-8"><button onClick={() => setStep(2)} className={`${buttonClass} bg-slate-100 text-slate-400`}>Voltar</button><button onClick={() => setStep(4)} className={`${buttonClass} bg-slate-900 text-white`}>Próximo</button></div></div>);
        case 4: return (<div className={questionContainerClass}><span className={labelClass}>Passo 4 de 7</span><h2 className={titleClass}>Despesas Fixas Totais</h2><input type="number" className={inputClass} placeholder="Aluguel, Luz, Internet, etc" autoFocus onChange={(e) => updateBusiness('energy', formatCurrency(e.target.value), 'fixedCosts')} /><div className="flex gap-4 mt-8"><button onClick={() => setStep(3)} className={`${buttonClass} bg-slate-100 text-slate-400`}>Voltar</button><button onClick={() => setStep(5)} className={`${buttonClass} bg-slate-900 text-white`}>Próximo</button></div></div>);
        case 5: return (<div className={questionContainerClass}><span className={labelClass}>Passo 5 de 7</span><h2 className={titleClass}>Folha de Pagamento</h2><input type="number" className={inputClass} placeholder="Soma de Salários/Encargos" autoFocus onChange={(e) => updateBusiness('totalCount', 1, 'staff')} /><div className="flex gap-4 mt-8"><button onClick={() => setStep(4)} className={`${buttonClass} bg-slate-100 text-slate-400`}>Voltar</button><button onClick={() => setStep(6)} className={`${buttonClass} bg-slate-900 text-white`}>Próximo</button></div></div>);
        case 6: return (<div className={questionContainerClass}><span className={labelClass}>Passo 6 de 7</span><h2 className={titleClass}>Impostos/Variáveis</h2><input type="number" className={inputClass} placeholder="R$ 0,00" autoFocus onChange={(e) => updateBusiness('taxes', formatCurrency(e.target.value), 'variableCosts')} /><div className="flex gap-4 mt-8"><button onClick={() => setStep(5)} className={`${buttonClass} bg-slate-100 text-slate-400`}>Voltar</button><button onClick={() => setStep(7)} className={`${buttonClass} bg-slate-900 text-white`}>Próximo</button></div></div>);
        case 7: return (<div className={questionContainerClass}><span className={labelClass}>Revisão Final</span><h2 className={titleClass}>Confirmar dados?</h2><div className="flex gap-4 mt-8"><button onClick={() => setStep(6)} className={`${buttonClass} bg-slate-100 text-slate-400`}>Voltar</button><button onClick={handleFinishCollection} className={`${buttonClass} bg-slate-900 text-white`}>Analisar</button></div></div>);
        case 100: return (<div className="animate-in slide-in-from-bottom-12 duration-700"><button onClick={() => setView('mode_selection')} className="mb-8 text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">← Voltar à Escolha</button>{result && <AnalysisCard content={result} />}</div>);
      }
    } else {
      // PERSONAL FLOW (CPF)
      const personalQuestions = [
        { key: 'income', label: 'Renda Mensal Total', desc: 'Soma de todos os seus ganhos.' },
        { key: 'housing', label: 'Moradia', desc: 'Aluguel ou financiamento.' },
        { key: 'utilities', label: 'Energia, Água e Net', desc: 'Custos básicos de utilidades.' },
        { key: 'food', label: 'Alimentação', desc: 'Supermercado e refeições fora.' },
        { key: 'transport', label: 'Transporte', desc: 'Uber, combustível ou ônibus.' },
        { key: 'creditCard', label: 'Cartão de Crédito', desc: 'Valor total das faturas.' },
        { key: 'health', label: 'Saúde', desc: 'Plano, remédios ou consultas.' },
        { key: 'education', label: 'Educação', desc: 'Cursos, escola ou faculdade.' },
        { key: 'leisure', label: 'Lazer', desc: 'Saídas e entretenimento.' },
        { key: 'other', label: 'Outros Gastos', desc: 'Outras despesas relevantes.' },
      ];

      if (step === 1) {
        return (
          <div className={questionContainerClass}>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4 block">Passo 1 de 11 (Pessoal)</span>
            <h2 className={titleClass}>Qual período pessoal deseja organizar?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><select className={selectClass} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
              <div><select className={selectClass} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>{YEARS.map(y => <option key={y} value={y.toString()}>{y}</option>)}</select></div>
            </div>
            <button onClick={() => { updatePersonal('period', `${selectedMonth} ${selectedYear}`); setStep(2); }} className={`${buttonClass} mt-8 bg-emerald-600 text-white shadow-xl`}>Próximo</button>
          </div>
        );
      }

      const qIndex = step - 2;
      if (qIndex < personalQuestions.length) {
        const q = personalQuestions[qIndex];
        return (
          <div className={questionContainerClass}>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4 block">Passo {step} de 11</span>
            <h2 className={titleClass}>{q.label}</h2>
            <p className="text-slate-500 font-medium mb-6">{q.desc}</p>
            <div className="relative"><span className="absolute left-6 top-7 text-2xl font-black text-slate-400">R$</span><input type="number" className={`${inputClass} pl-16`} placeholder="0,00" autoFocus onChange={(e) => updatePersonal(q.key, formatCurrency(e.target.value))} /></div>
            <div className="flex gap-4 mt-8"><button onClick={() => setStep(step - 1)} className={`${buttonClass} bg-slate-100 text-slate-400`}>Voltar</button><button onClick={() => setStep(step + 1)} className={`${buttonClass} bg-emerald-600 text-white`}>Próximo</button></div>
          </div>
        );
      }

      if (step === 12) {
        return (
          <div className={questionContainerClass}>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4 block">Revisão Final</span>
            <h2 className={titleClass}>Gerar análise agora?</h2>
            <div className="bg-emerald-50 p-6 rounded-3xl mb-8 font-bold text-emerald-800 text-sm">Período: {personalData.period} | Renda: R$ {personalData.income.toLocaleString('pt-BR')}</div>
            <div className="flex gap-4"><button onClick={() => setStep(1)} className={`${buttonClass} bg-slate-100 text-slate-400`}>Recomeçar</button><button onClick={handleFinishCollection} className={`${buttonClass} bg-emerald-600 text-white`}>Gerar Diagnóstico CPF</button></div>
          </div>
        );
      }

      if (step === 100) {
        return (
          <div className="animate-in slide-in-from-bottom-12 duration-700"><button onClick={() => setView('mode_selection')} className="mb-8 text-xs font-black text-emerald-600 uppercase flex items-center gap-2">← Outra Consulta</button>{result && <AnalysisCard content={result} />}</div>
        );
      }
    }
    return null;
  };

  const renderHistory = () => (
    <div className="animate-in slide-in-from-bottom-12 duration-700 px-4 py-8 md:py-16 max-w-4xl mx-auto">
      <h2 className="text-4xl font-black text-slate-900 mb-10 tracking-tighter">Histórico</h2>
      {history.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-200 text-center text-slate-400 font-bold">Sem registros.</div>
      ) : (
        <div className="space-y-4">
          {!selectedRecord && history.map(record => (
            <div key={record.id} onClick={() => setSelectedRecord(record)} className={`group bg-white p-8 rounded-[2.5rem] border ${record.type === 'CPF' ? 'border-emerald-50' : 'border-slate-100'} flex items-center justify-between cursor-pointer hover:shadow-xl transition-all`}>
              <div className="flex gap-6 items-center">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${record.type === 'CPF' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{record.type}</div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{record.monthYear}</p><p className="text-xl font-black text-slate-900">{record.summary.faturamento}</p></div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setHistory(history.filter(h => h.id !== record.id)); }} className="p-3 text-slate-300 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
          ))}
        </div>
      )}
      {selectedRecord && (
        <div className="mt-10"><button onClick={() => setSelectedRecord(null)} className="mb-8 text-xs font-black text-slate-400 uppercase">← Voltar</button><AnalysisCard content={selectedRecord.result} /></div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header onGoHome={() => setView('home')} onGoApp={() => isLoggedIn ? setView('mode_selection') : setView('login')} onGoHistory={() => isLoggedIn ? setView('history') : setView('login')} onGoLogin={() => setView('login')} onLogout={handleLogout} activeTab={view === 'mode_selection' ? 'app' : (view as any)} isLoggedIn={isLoggedIn} />
      <main className="container mx-auto px-4 py-10">
        {loading && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center">
            <div className="bg-white p-12 rounded-[4rem] text-center shadow-2xl animate-in zoom-in-95"><div className={`w-20 h-20 border-[6px] ${analysisType === 'CPF' ? 'border-emerald-600' : 'border-blue-600'} border-t-transparent rounded-full animate-spin mx-auto mb-8`}></div><h3 className="font-black text-2xl text-slate-900 tracking-tighter mb-2">Analisando Dados</h3><p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">O NÚCLEO está processando...</p></div>
          </div>
        )}
        {view === 'home' && renderHome()}
        {view === 'login' && renderLogin()}
        {view === 'signup' && renderSignup()}
        {view === 'mode_selection' && renderModeSelection()}
        {view === 'business_profile' && renderBusinessProfileForm()}
        {view === 'app' && renderStep()}
        {view === 'history' && renderHistory()}
        {error && <div className="mt-10 max-w-md mx-auto bg-red-50 text-red-600 p-8 rounded-[2rem] text-center font-bold border border-red-100">{error}</div>}
      </main>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; } .no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default App;