
import React from 'react';

interface HeaderProps {
  onGoHome: () => void;
  onGoApp: () => void;
  onGoHistory: () => void;
  onGoLogin: () => void;
  onLogout: () => void;
  activeTab: 'home' | 'app' | 'history' | 'login' | 'signup';
  isLoggedIn: boolean;
}

const Header: React.FC<HeaderProps> = ({ onGoHome, onGoApp, onGoHistory, onGoLogin, onLogout, activeTab, isLoggedIn }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
        <button 
          onClick={onGoHome}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="bg-slate-900 p-2 rounded-xl shadow-lg shadow-slate-200">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-left">
            <h1 className="text-lg font-black tracking-tighter text-slate-900 leading-none">NÚCLEO</h1>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Consultor IA</span>
          </div>
        </button>

        <nav className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={onGoHome}
            className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all ${activeTab === 'home' ? 'text-slate-900 bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Início
          </button>
          
          {isLoggedIn ? (
            <>
              <button 
                onClick={onGoHistory}
                className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all ${activeTab === 'history' ? 'text-slate-900 bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Histórico
              </button>
              <button 
                onClick={onGoApp}
                className={`px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-black transition-all shadow-sm ${activeTab === 'app' ? 'bg-slate-900 text-white shadow-slate-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
              >
                Analisar
              </button>
              <button 
                onClick={onLogout}
                className="ml-2 p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Sair"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </>
          ) : (
            <button 
              onClick={onGoLogin}
              className="px-6 py-2 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
            >
              Entrar
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
