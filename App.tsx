
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Layout } from './components/Layout.tsx';
import { TutorForm } from './components/TutorForm.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { ResultView } from './components/ResultView.tsx';
import { AppState, LearningContent, OutputMode } from './types.ts';
import {
  generateTutorial,
  generateQuiz,
  generateImages,
  generateFunFacts,
  generateParentReport,
  validateTopicSafety
} from './services/geminiService.ts';

const DAILY_LIMIT = 2;
const COOLDOWN_MS = 15000;
const VALID_CODES = ["BETA2025", "CLASS123"];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('IDLE');
  const [content, setContent] = useState<LearningContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  // Usage States for UI feedback
  const [runCount, setRunCount] = useState(0);
  const [hasSharedCode, setHasSharedCode] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [inputCode, setInputCode] = useState('');

  // Initialize and Sync Usage from LocalStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem('tb_runDate');
    const storedCount = parseInt(localStorage.getItem('tb_runCount') || '0');
    const storedHasCode = !!localStorage.getItem('tb_hasSharedCode');

    if (storedDate !== today) {
      localStorage.setItem('tb_runDate', today);
      localStorage.setItem('tb_runCount', '0');
      // Note: we don't necessarily reset tb_lastRunAt or tb_hasSharedCode across days
      // as shared code is a "soft identity" that persists.
      setRunCount(0);
    } else {
      setRunCount(storedCount);
    }

    setHasSharedCode(storedHasCode);
  }, []);

  // Cooldown timer logic
  useEffect(() => {
    let timer: number;
    if (cooldownRemaining > 0) {
      timer = window.setInterval(() => {
        setCooldownRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  /**
   * Strictly evaluates usage allowed based on localStorage to prevent bypass.
   */
  const checkUsageAllowed = (): { allowed: boolean; reason?: 'COOLDOWN' | 'LIMIT'; remainingSeconds?: number } => {
    const storedCount = parseInt(localStorage.getItem('tb_runCount') || '0');
    const lastRunAt = parseInt(localStorage.getItem('tb_lastRunAt') || '0');
    const storedHasCode = !!localStorage.getItem('tb_hasSharedCode');
    const now = Date.now();
    const elapsed = now - lastRunAt;

    // 1. Cooldown Check (Applies to all if at least one run was made)
    if (storedCount > 0 && elapsed < COOLDOWN_MS) {
      return { 
        allowed: false, 
        reason: 'COOLDOWN', 
        remainingSeconds: Math.ceil((COOLDOWN_MS - elapsed) / 1000) 
      };
    }

    // 2. Daily Limit Check (Only if no shared code)
    if (!storedHasCode && storedCount >= DAILY_LIMIT) {
      return { allowed: false, reason: 'LIMIT' };
    }

    return { allowed: true };
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
      alert("Invalid shared code. Please ask your teacher for the correct code.");
    }
  };

  const checkAndSelectKey = async () => {
    // @ts-ignore
    if (typeof window.aistudio === 'undefined') {
      throw new Error("API Key Manager not found. Please ensure you are logged in and have selected a valid Gemini API key to start learning.");
    }
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  };

  const handleStartSession = useCallback(async (
    userTopic: string,
    subject: string,
    ageGroup: number,
    outputMode: OutputMode,
    contextImage?: string
  ) => {
    // Behavioral Rule: Re-evaluate based on localStorage immediately before starting
    const usage = checkUsageAllowed();
    
    if (!usage.allowed) {
      if (usage.reason === 'COOLDOWN') {
        setCooldownRemaining(usage.remainingSeconds || 0);
        return;
      }
      if (usage.reason === 'LIMIT') {
        setShowCodeModal(true);
        return;
      }
    }

    try {
      await checkAndSelectKey();
      setState('PROCESSING');
      setError(null);

      setLoadingStep(`Running safety check...`);
      const safetyResult = await validateTopicSafety(userTopic, subject, ageGroup);
      if (!safetyResult.isSafe) {
        throw new Error(safetyResult.reason || "Topic unsuitable for our educational platform.");
      }

      setLoadingStep(`Drafting your ${subject} lesson...`);
      const tutorial = await generateTutorial(userTopic, subject, ageGroup, contextImage);

      const initialContent: LearningContent = {
        topic: userTopic,
        subject: subject,
        ageGroup: ageGroup,
        explanation: tutorial,
        quizQuestions: [],
        images: (outputMode === 'TEXT_AUDIO_IMAGES') ? 'LOADING' as any : null,
        funFacts: 'LOADING' as any,
        parentReport: 'LOADING' as any,
        outputMode: outputMode,
        contextImage: contextImage
      };
      
      setContent(initialContent);
      setState('RESULT');

      // Update Usage Stats
      const currentStoredCount = parseInt(localStorage.getItem('tb_runCount') || '0');
      const nextCount = currentStoredCount + 1;
      const now = Date.now();
      
      localStorage.setItem('tb_runCount', nextCount.toString());
      localStorage.setItem('tb_lastRunAt', now.toString());
      setRunCount(nextCount);

      const updateContent = (update: Partial<LearningContent>) => {
        setContent(prev => prev ? { ...prev, ...update } : null);
      };

      generateQuiz(userTopic, subject, ageGroup, contextImage).then(quiz => updateContent({ quizQuestions: quiz }));
      generateFunFacts(userTopic, subject, ageGroup).then(facts => updateContent({ funFacts: facts }));
      generateParentReport(userTopic, subject, ageGroup).then(report => updateContent({ parentReport: report }));
      
      if (outputMode === 'TEXT_AUDIO_IMAGES') {
        generateImages(userTopic, subject, ageGroup).then(images => updateContent({ images }));
      }

    } catch (err: any) {
      console.error("Session Generation Failed:", err);
      setError(err.message || "Failed to create lesson. Please check your API key.");
      setState('ERROR');
    }
  }, [hasSharedCode]); // Removed runCount and lastRunAt from deps to ensure we always read from storage

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

  return (
    <Layout>
      {/* Shared Code Modal Overlay */}
      {showCodeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-8 border-slate-50">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner">
              🔑
            </div>
            <h2 className="text-3xl font-black text-slate-950 mb-4 tracking-tight">Free Limit Reached</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              You’ve reached today’s free limit ({DAILY_LIMIT} lessons). Enter a shared classroom code from your teacher to continue, or come back tomorrow.
            </p>
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Enter Shared Code"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none text-xl text-center font-bold tracking-widest"
              />
              <button
                type="submit"
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
              >
                Submit Code
              </button>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
              >
                Maybe later
              </button>
            </form>
          </div>
        </div>
      )}

      {state === 'IDLE' && (
        <>
          <LandingPage onStart={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })} />
          <div ref={formRef} className="mt-12 space-y-6">
            {/* Cooldown Warning */}
            {cooldownRemaining > 0 && (
              <div className="max-w-4xl mx-auto px-8 py-4 bg-amber-50 border-2 border-amber-100 rounded-2xl text-amber-700 font-bold flex items-center justify-center gap-3 animate-fadeIn">
                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Please wait {cooldownRemaining} seconds before your next lesson
              </div>
            )}
            
            <TutorForm onSubmit={handleStartSession} isLoading={false} />
            
            {/* Usage Badge */}
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-100 px-4 py-2 rounded-full shadow-sm">
                {hasSharedCode 
                  ? "✓ Classroom Pass Active - Unlimited Daily Lessons" 
                  : `Free Daily Access: ${runCount}/${DAILY_LIMIT} lessons used`}
              </span>
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
            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">We're orchestrating your tailored mastery session using Gemini 3 Flash.</p>
          </div>
        </div>
      )}

      {state === 'RESULT' && content && (
        <ResultView 
          content={content}
          onReset={resetSession}
          onDownloadTutorial={downloadTutorial}
        />
      )}

      {state === 'ERROR' && (
        <div className="max-w-lg mx-auto bg-white border border-slate-100 rounded-[3rem] p-12 text-center shadow-2xl mt-12 animate-fadeIn">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">🛡️</div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">System Message</h2>
          <p className="text-slate-500 mb-10 text-lg leading-relaxed">{error}</p>
          <button onClick={resetSession} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl">Try Again</button>
        </div>
      )}
    </Layout>
  );
};

export default App;
