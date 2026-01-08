
import React, { useState, useRef, useCallback } from 'react';
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

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('IDLE');
  const [content, setContent] = useState<LearningContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

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
  }, []);

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
      {state === 'IDLE' && (
        <>
          <LandingPage onStart={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })} />
          <div ref={formRef} className="mt-12">
            <TutorForm onSubmit={handleStartSession} isLoading={false} />
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
