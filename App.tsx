
import React, { useState, useRef } from 'react';
import { Layout } from './components/Layout.tsx';
import { TutorForm } from './components/TutorForm.tsx';
import { Quiz } from './components/Quiz.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { AppState, LearningContent } from './types.ts';
import { generateTutorial, generateVideo, generateQuiz } from './services/geminiService.ts';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('IDLE');
  const [content, setContent] = useState<LearningContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const checkAndSelectKey = async () => {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  };

  const handleStartSession = async (userTopic: string) => {
    try {
      await checkAndSelectKey();
      setState('PROCESSING');
      setError(null);

      // Prompt 1: Tutorial
      setLoadingStep('Step 1: Drafting Tutorial...');
      const tutorial = await generateTutorial(userTopic);

      // Prompt 2: Quiz
      setLoadingStep('Step 2: Building Quiz...');
      const quiz = await generateQuiz(userTopic);

      // Prompt 3: Video
      setLoadingStep('Step 3: Generating 10s AI Video (Veo)...');
      let videoUrl = null;
      try {
        videoUrl = await generateVideo(userTopic);
      } catch (videoError: any) {
        if (videoError.message === 'MODEL_NOT_AVAILABLE') {
          // Trigger key selection again if 404 occurred
          // @ts-ignore
          await window.aistudio.openSelectKey();
          setLoadingStep('Model access issue. Retrying video...');
          videoUrl = await generateVideo(userTopic).catch(() => null);
        }
      }

      setContent({
        topic: userTopic,
        explanation: tutorial,
        quizQuestions: quiz,
        videoUrl: videoUrl,
        funFacts: [] 
      });
      setState('RESULT');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please ensure you connected a valid project key.");
      setState('ERROR');
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetSession = () => {
    setContent(null);
    setState('IDLE');
    // The environment handles key disposal; we reset UI state to ensure no data persists.
  };

  return (
    <Layout>
      {state === 'IDLE' && (
        <>
          <LandingPage onStart={scrollToForm} />
          <div ref={formRef} className="mt-12">
            <TutorForm onSubmit={handleStartSession} isLoading={false} />
          </div>
        </>
      )}

      {state === 'PROCESSING' && (
        <div className="flex flex-col items-center justify-center py-32 space-y-12 animate-fadeIn">
          <div className="relative">
            <div className="w-32 h-32 border-[12px] border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🧠</span>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">{loadingStep}</h2>
            <p className="text-slate-500 max-w-xs mx-auto leading-relaxed">
              We're using your provided key to securely generate your custom mastery canvas. Your key will be discarded once the session ends.
            </p>
          </div>
        </div>
      )}

      {state === 'RESULT' && content && (
        <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-100 pb-8 gap-6">
            <div>
              <span className="text-sm font-black text-blue-600 uppercase tracking-widest mb-2 block">Mastery Canvas</span>
              <h2 className="text-5xl font-black text-slate-950 tracking-tighter capitalize">{content.topic}</h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button 
                onClick={resetSession}
                className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all hover:-translate-y-1 shadow-xl"
              >
                New Session
              </button>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Session context & Key cleared on reset</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            {/* Output 1: Tutorial */}
            <div className="lg:col-span-7 space-y-10">
              <section className="bg-white rounded-[3rem] p-10 lg:p-14 shadow-xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tight">Interactive Tutorial</h3>
                </div>
                <div className="prose prose-slate prose-xl max-w-none text-slate-700 leading-relaxed font-medium">
                  {content.explanation.split('\n').map((p, i) => p.trim() && (
                    <p key={i} className="mb-6">{p}</p>
                  ))}
                </div>
              </section>
            </div>

            {/* Output 2 & 3: Video & Quiz */}
            <div className="lg:col-span-5 space-y-10">
              {/* Output 2: Video */}
              <section className="bg-slate-950 rounded-[3rem] p-8 shadow-2xl text-white overflow-hidden relative group">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 text-white rounded-xl">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight">AI Explainer Video</h3>
                  </div>
                  <div className="px-3 py-1 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Veo 3.1</div>
                </div>
                
                {content.videoUrl ? (
                  <div className="aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                    <video src={content.videoUrl} className="w-full h-full object-cover" controls autoPlay loop />
                  </div>
                ) : (
                  <div className="aspect-video rounded-2xl bg-slate-900 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 p-8 text-center space-y-4">
                    <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <p className="text-slate-500 text-sm font-bold">Video generation unavailable. Your project may need billing enabled for Veo models.</p>
                  </div>
                )}
              </section>

              {/* Output 3: Quiz */}
              <section className="bg-emerald-50 rounded-[3rem] p-10 border border-emerald-100 shadow-xl shadow-emerald-50">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Mastery Quiz</h3>
                </div>
                <Quiz 
                  questions={content.quizQuestions} 
                  onComplete={(res) => console.log("Mastery Check:", res)} 
                />
              </section>
            </div>
          </div>
        </div>
      )}

      {state === 'ERROR' && (
        <div className="max-w-lg mx-auto bg-white border border-slate-100 rounded-[3rem] p-12 text-center shadow-2xl mt-12 animate-fadeIn">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Access Error</h2>
          <p className="text-slate-500 mb-10 text-lg leading-relaxed">{error}</p>
          <button 
            onClick={resetSession}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
          >
            Reset Session
          </button>
        </div>
      )}
    </Layout>
  );
};

export default App;
