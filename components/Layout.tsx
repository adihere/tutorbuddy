
import React from 'react';
import { AppState } from '../types.ts';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate?: (state: AppState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Universal Safety Banner */}
      <div className="bg-amber-50 border-b border-amber-100 py-2.5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 animate-fadeIn">
        ⚠️ AI generated content. Parental supervision is recommended for young learners.
      </div>
      
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => onNavigate?.('IDLE')}
          >
            <div className="p-2 gradient-bg rounded-xl shadow-xl shadow-blue-200 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">TutorBuddy</span>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={() => onNavigate?.('ABOUT')}
              className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors hidden md:block"
            >
              About
            </button>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 px-3 py-1 rounded-full">v3.1 Preview</span>
          </div>
        </div>
      </header>
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {children}
        </div>
      </main>
      <footer className="bg-white border-t border-slate-100 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-400 text-sm font-medium">TutorBuddy &bull; Powered by Google Gemini 3 and Veo</p>
          <div className="flex gap-6">
             <button onClick={() => onNavigate?.('ABOUT')} className="text-slate-400 hover:text-blue-600 text-sm font-bold transition-colors">About Us</button>
             <a href="#" className="text-slate-400 hover:text-blue-600 text-sm font-bold transition-colors">Privacy</a>
             <a href="#" className="text-slate-400 hover:text-blue-600 text-sm font-bold transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
