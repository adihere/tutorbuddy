
import React, { useEffect } from 'react';

interface AboutPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const techStack = [
    { 
      title: 'Gemini 3 Flash', 
      icon: '⚡', 
      desc: 'Powers the pedagogical reasoning engine, real-time safety classifiers, and adaptive quiz generation with ultra-low latency.', 
      styles: 'bg-blue-50 border-blue-100 text-blue-900' 
    },
    { 
      title: 'Gemini 2.5 Audio', 
      icon: '🎧', 
      desc: 'Generates lifelike, multi-speaker emotional dialogues to help auditory learners grasp complex concepts through conversation.', 
      styles: 'bg-indigo-50 border-indigo-100 text-indigo-900' 
    },
    { 
      title: 'Gemini 2.5 Image', 
      icon: '🎨', 
      desc: 'Creates context-aware educational illustrations and scientific diagrams on the fly to support visual learning.', 
      styles: 'bg-violet-50 border-violet-100 text-violet-900' 
    },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn pb-16">
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-bold group px-4 py-2 rounded-xl hover:bg-white"
      >
        <div className="p-2 rounded-full bg-slate-100 group-hover:bg-blue-50 transition-colors">
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </div>
        <span>Back to Learning</span>
      </button>

      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-100 space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-block p-4 bg-blue-50 rounded-3xl mb-2 shadow-sm">
             <div className="text-4xl">🧠</div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Reimagining Education with <span className="text-blue-600">Agentic AI</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed font-medium">
            TutorBuddy isn't just a chatbot. It's a multi-modal pedagogical engine designed to adapt to every student's unique learning style, powered by Google's most advanced models.
          </p>
        </div>

        {/* Mission */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl shadow-sm">🚀</span>
                    Our Mission
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed font-medium">
                    We believe every student deserves a world-class tutor. By leveraging the latest breakthroughs in Generative AI, we provide personalized, safe, and engaging learning experiences that empower students to master any subject at their own pace—whether they learn best by reading, listening, or seeing.
                </p>
            </div>
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-inner">
                <h3 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-sm">Core Principles</h3>
                <ul className="space-y-4">
                    {['Safety-First Architecture', 'Pedagogical Accuracy', 'Emotional Intelligence', 'Global Accessibility'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-700 font-bold">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                            </div>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        {/* Technology Stack */}
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900 mb-4">Powered by Google Gemini</h2>
                <p className="text-slate-500 font-medium">Built on the frontier of multi-modal AI capabilities.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
                {techStack.map((tech, i) => (
                    <div key={i} className={`p-8 rounded-[2rem] border transition-transform hover:-translate-y-1 ${tech.styles}`}>
                        <div className="text-4xl mb-6">{tech.icon}</div>
                        <h3 className="text-lg font-black mb-3">{tech.title}</h3>
                        <p className="text-sm leading-relaxed opacity-90 font-medium">{tech.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Safety */}
        <div className="bg-amber-50 rounded-[2.5rem] p-8 md:p-12 border border-amber-100">
            <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 space-y-4">
                    <h2 className="text-2xl font-black text-amber-900 flex items-center gap-3">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Guardrails & Safety
                    </h2>
                    <p className="text-amber-800 leading-relaxed font-medium text-lg">
                        We prioritize the safety of young learners above all. Every user topic is pre-screened by a dedicated AI safety classifier before any content is generated. Our models are rigorously instructed to remain neutral, objective, and supportive, strictly avoiding inappropriate, political, or harmful themes.
                    </p>
                </div>
                <div className="flex-shrink-0">
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-amber-100 text-center transform rotate-3">
                        <div className="text-4xl font-black text-amber-500 mb-2">100%</div>
                        <div className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Automated<br/>Screening</div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
