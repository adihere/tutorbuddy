
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Layout } from './components/Layout.tsx';
import { TutorForm } from './components/TutorForm.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { ResultView } from './components/ResultView.tsx';
import { AboutPage } from './components/AboutPage.tsx';
import { AppState, LearningContent, OutputMode, HistoryItem } from './types.ts';
import {
  generateTutorial,
  generateQuiz,
  generateImages,
  generateFunFacts,
  generateParentReport,
  validateTopicSafety,
  generateDiagram
} from './services/geminiService.ts';

const FREE_LIMIT = 1;
const COOLDOWN_MS = 2000;
const VALID_CODES = ["BETA2025", "CLASS123", "JUDGE"]; // Legacy support
const DEBUG = true;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('IDLE');
  const [content, setContent] = useState<LearningContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const formRef = useRef<HTMLDivElement>(null);

  const [runCount, setRunCount] = useState(0);
  const [hasSharedCode, setHasSharedCode] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [isKeyConnected, setIsKeyConnected] = useState(false);

  // Sync initial state with localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem('tb_runDate');
    const storedHasCode = !!localStorage.getItem('tb_hasSharedCode');
    const storedHistory = localStorage.getItem('tb_history');

    if (storedDate !== today) {
      localStorage.setItem('tb_runDate', today);
      localStorage.setItem('tb_runCount', '0');
      setRunCount(0);
    } else {
      setRunCount(parseInt(localStorage.getItem('tb_runCount') || '0'));
    }
    setHasSharedCode(storedHasCode);

    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    
    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    try {
      // @ts-ignore
      const hasKey = typeof window.aistudio !== 'undefined' && await window.aistudio.hasSelectedApiKey();
      setIsKeyConnected(!!hasKey);
    } catch (e) {
      console.warn("Key check failed", e);
    }
  };

  useEffect(() => {
    let timer: number;
    if (cooldownRemaining > 0) {
      timer = window.setInterval(() => {
        setCooldownRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const saveToHistory = (newContent: LearningContent) => {
    if (DEBUG) console.log('[App] Saving session to history');
    const leanContent: LearningContent = {
      ...newContent,
      images: Array.isArray(newContent.images) ? null : newContent.images,
      diagram: newContent.diagram === 'LOADING' ? 'ERROR' : newContent.diagram,
      contextImage: undefined,
      quizQuestions: newContent.quizQuestions === 'LOADING' ? 'ERROR' : newContent.quizQuestions,
      funFacts: newContent.funFacts === 'LOADING' ? 'ERROR' : newContent.funFacts,
      parentReport: newContent.parentReport === 'LOADING' ? 'ERROR' : newContent.parentReport,
    };

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      topic: newContent.topic,
      subject: newContent.subject,
      content: leanContent
    };

    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, 5);
      localStorage.setItem('tb_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleLoadHistory = (item: HistoryItem) => {
    setContent(item.content);
    setState('RESULT');
  };

  const checkCooldown = (): number => {
    const lastRunAt = parseInt(localStorage.getItem('tb_lastRunAt') || '0');
    const elapsed = Date.now() - lastRunAt;
    if (elapsed < COOLDOWN_MS) {
      return Math.ceil((COOLDOWN_MS - elapsed) / 1000);
    }
    return 0;
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const upperCode = inputCode.trim().toUpperCase();
    if (VALID_CODES.includes(upperCode)) {
      localStorage.setItem('tb_hasSharedCode', upperCode);
      setHasSharedCode(true);
      setShowCodeModal(false);
      setError(null);
    } else {
      alert("Invalid classroom code.");
    }
  };

  const handleConnectKey = async () => {
    if (hasSharedCode || isKeyConnected) return;
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      await checkKeyStatus();
    } catch (e) {
      console.error("Failed to connect key", e);
    }
  };

  const handleStartSession = useCallback(async (
    userTopic: string,
    subject: string,
    ageGroup: number,
    outputMode: OutputMode,
    contextImage?: string
  ) => {
    const remainingCooldown = checkCooldown();
    if (remainingCooldown > 0) {
      setCooldownRemaining(remainingCooldown);
      return;
    }

    try {
      // Access Control Logic
      let shouldUseOwnKey = false;
      
      if (!hasSharedCode && runCount >= FREE_LIMIT) {
        shouldUseOwnKey = true;
      }

      if (shouldUseOwnKey) {
        // @ts-ignore
        const hasKey = typeof window.aistudio !== 'undefined' && await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
           // @ts-ignore
           await window.aistudio.openSelectKey();
           // Double check
           // @ts-ignore
           const keyAfterPrompt = await window.aistudio.hasSelectedApiKey();
           if (!keyAfterPrompt) return;
        }
        setIsKeyConnected(true);
      }

      setState('PROCESSING');
      setError(null);

      setLoadingStep(`Analyzing safety & age-appropriateness...`);
      const safety = await validateTopicSafety(userTopic, subject, ageGroup);
      if (!safety.isSafe) throw new Error(safety.reason || "Topic flagged by safety guidelines.");

      setLoadingStep(`Searching trusted sources & drafting lesson...`);
      const { text: tutorial, groundingChunks } = await generateTutorial(userTopic, subject, ageGroup, contextImage);

      const initialContent: LearningContent = {
        topic: userTopic,
        subject: subject,
        ageGroup: ageGroup,
        explanation: tutorial,
        groundingSource: groundingChunks,
        quizQuestions: 'LOADING',
        images: outputMode === 'TEXT_AUDIO_IMAGES' ? 'LOADING' : null,
        diagram: 'LOADING',
        funFacts: 'LOADING',
        parentReport: 'LOADING',
        outputMode: outputMode,
        contextImage: contextImage
      };
      
      setContent(initialContent);
      setState('RESULT');

      const nextCount = (parseInt(localStorage.getItem('tb_runCount') || '0')) + 1;
      localStorage.setItem('tb_runCount', nextCount.toString());
      localStorage.setItem('tb_lastRunAt', Date.now().toString());
      setRunCount(nextCount);

      const updateContent = (update: Partial<LearningContent>) => {
        setContent(prev => {
          if (!prev) return null;
          const updated = { ...prev, ...update };
          if (update.parentReport && update.parentReport !== 'LOADING') {
             saveToHistory(updated);
          }
          return updated;
        });
      };

      // Concurrent Generators
      generateQuiz(userTopic, subject, ageGroup, contextImage)
        .then(quiz => updateContent({ quizQuestions: quiz }))
        .catch(() => updateContent({ quizQuestions: 'ERROR' }));

      generateFunFacts(userTopic, subject, ageGroup)
        .then(facts => updateContent({ funFacts: facts }))
        .catch(() => updateContent({ funFacts: 'ERROR' }));

      generateParentReport(userTopic, subject, ageGroup)
        .then(report => updateContent({ parentReport: report }))
        .catch(() => updateContent({ parentReport: 'ERROR' }));
      
      generateDiagram(userTopic, subject)
        .then(svg => updateContent({ diagram: svg || 'ERROR' }))
        .catch(() => updateContent({ diagram: 'ERROR' }));
      
      if (outputMode === 'TEXT_AUDIO_IMAGES') {
        generateImages(userTopic, subject, ageGroup)
          .then(images => updateContent({ images }))
          .catch(() => updateContent({ images: 'ERROR' }));
      }

    } catch (err: any) {
      console.error("Session Generation Failed:", err);
      let msg = err.message || "An unexpected error occurred.";
      if (msg.includes("API key")) msg = "Invalid API Key. Please check your settings.";
      setError(msg);
      setState('ERROR');
    }
  }, [runCount, hasSharedCode]);

  const resetSession = () => {
    setContent(null);
    setState('IDLE');
  };

  const downloadTutorial = () => {
    if (!content) return;
    const blob = new Blob([content.explanation], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tutorial-${content.topic.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleNavigate = (page: AppState) => {
    if (page === 'RESULT' && !content) {
      setState('IDLE');
      return;
    }
    setState(page);
  };

  return (
    <Layout onNavigate={handleNavigate}>
      {showCodeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-8 border-slate-50">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner">🔑</div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Access Restricted</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">Enter a Classroom Code or close this to connect your own API Key.</p>
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Enter Code"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none text-xl text-center font-bold tracking-widest uppercase"
              />
              <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl">Submit Code</button>
              <button type="button" onClick={() => setShowCodeModal(false)} className="w-full py-4 text-slate-400 font-bold">Use Own API Key</button>
            </form>
          </div>
        </div>
      )}

      {state === 'ABOUT' && (
        <AboutPage onBack={() => handleNavigate(content ? 'RESULT' : 'IDLE')} />
      )}

      {state === 'IDLE' && (
        <>
          <LandingPage 
            onStart={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })} 
            isKeyConnected={isKeyConnected}
            onConnectKey={handleConnectKey}
          />
          <div ref={formRef} className="mt-8 md:mt-12 space-y-6">
            {cooldownRemaining > 0 && (
              <div className="max-w-4xl mx-auto px-8 py-4 bg-amber-50 border-2 border-amber-100 rounded-2xl text-amber-700 font-bold flex items-center justify-center gap-3 animate-fadeIn">
                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Please wait {cooldownRemaining} seconds before your next lesson
              </div>
            )}
            <TutorForm 
              onSubmit={handleStartSession} 
              isLoading={false} 
              history={history}
              onLoadHistory={handleLoadHistory}
            />
            <div className="text-center">
              <button 
                onClick={handleConnectKey}
                disabled={hasSharedCode || isKeyConnected}
                className={`text-[10px] font-black uppercase tracking-widest bg-white border px-4 py-2 rounded-full shadow-sm transition-all ${
                  hasSharedCode ? 'text-emerald-600 border-emerald-200 cursor-default' :
                  isKeyConnected ? 'text-emerald-600 border-emerald-200 cursor-default' :
                  runCount >= FREE_LIMIT ? 'text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer animate-pulse' : 'text-slate-400 border-slate-100 hover:border-blue-200 cursor-pointer'
                }`}
              >
                {hasSharedCode ? "✓ Classroom Pass Active" : 
                 isKeyConnected ? "✓ Unlimited Access (Key Linked)" :
                 runCount < FREE_LIMIT ? `Free Preview: ${runCount}/${FREE_LIMIT} • Click to Connect Key` : 
                 "Connect Key for Unlimited Access"}
              </button>
            </div>
          </div>
        </>
      )}

      {state === 'PROCESSING' && (
        <div className="flex flex-col items-center justify-center py-32 space-y-12 animate-fadeIn">
          <div className="relative">
            <div className="w-32 h-32 border-[12px] border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-3xl">🧠</div>
          </div>
          <div className="text-center">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">{loadingStep}</h2>
            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">We're orchestrating your tailored mastery session using power of Gemini 3.</p>
          </div>
        </div>
      )}

      {state === 'RESULT' && content && (
        <ResultView content={content} onReset={resetSession} onDownloadTutorial={downloadTutorial} />
      )}

      {state === 'ERROR' && (
        <div className="max-w-lg mx-auto bg-white border border-slate-100 rounded-[3rem] p-12 text-center shadow-2xl mt-12 animate-fadeIn">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-sm">⚠️</div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">System Message</h2>
          <p className="text-slate-500 mb-10 text-lg leading-relaxed">{error}</p>
          <button onClick={resetSession} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl">Try Again</button>
        </div>
      )}
    </Layout>
  );
};

export default App;
