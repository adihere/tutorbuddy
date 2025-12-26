import React, { useState, useRef, useCallback } from 'react';
import { Layout } from './components/Layout.tsx';
import { TutorForm } from './components/TutorForm.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { ResultView } from './components/ResultView.tsx';
import { AppState, LearningContent, OutputMode } from './types.ts';
import {
  generateTutorial,
  generateVideo,
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
  const [isVideoDownloading, setIsVideoDownloading] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const checkAndSelectKey = async () => {
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
    outputMode: OutputMode
  ) => {
    try {
      await checkAndSelectKey();
      setState('PROCESSING');
      setError(null);

      // Phase 0: Guardrails
      setLoadingStep(`Running safety check...`);
      const safetyResult = await validateTopicSafety(userTopic, subject, ageGroup);
      if (!safetyResult.isSafe) {
        throw new Error(safetyResult.reason || "Topic unsuitable for our educational platform.");
      }

      // Phase 1: Core Tutorial (Sequential dependency)
      setLoadingStep(`Drafting your ${subject} lesson...`);
      const tutorial = await generateTutorial(userTopic, subject, ageGroup);

      // Transition to ResultView immediately with Tutorial
      // Quiz, Fun Facts, and Parent Report are now available for ALL modes
      const initialContent: LearningContent = {
        topic: userTopic,
        subject: subject,
        explanation: tutorial,
        quizQuestions: [],
        videoUrl: outputMode === 'ALL' ? 'LOADING' : null,
        images: (outputMode === 'ALL' || outputMode === 'TEXT_AUDIO_IMAGES') ? 'LOADING' as any : null,
        funFacts: 'LOADING' as any,
        parentReport: 'LOADING' as any,
        outputMode: outputMode
      };
      
      setContent(initialContent);
      setState('RESULT');

      // Phase 2: Parallel background asset generation
      const updateContent = (update: Partial<LearningContent>) => {
        setContent(prev => prev ? { ...prev, ...update } : null);
      };

      // Core features available for ALL experience levels
      generateQuiz(userTopic, subject, ageGroup).then(quiz => updateContent({ quizQuestions: quiz }));
      generateFunFacts(userTopic, subject, ageGroup).then(facts => updateContent({ funFacts: facts }));
      generateParentReport(userTopic, subject, ageGroup).then(report => updateContent({ parentReport: report }));
      
      // Conditionally gated visual assets
      if (outputMode === 'ALL' || outputMode === 'TEXT_AUDIO_IMAGES') {
        generateImages(userTopic, subject, ageGroup).then(images => updateContent({ images }));
      }
      
      if (outputMode === 'ALL') {
        generateVideo(userTopic, subject, ageGroup).then(videoUrl => updateContent({ videoUrl }));
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

  const downloadVideo = async () => {
    if (!content?.videoUrl || content.videoUrl === 'LOADING') return;
    setIsVideoDownloading(true);
    try {
      const response = await fetch(content.videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `video-${content.topic.toLowerCase().replace(/\s+/g, '-')}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Video download failed:", err);
    } finally {
      setIsVideoDownloading(false);
    }
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
            <p className="text-slate-500 max-w-xs mx-auto leading-relaxed">
              We're orchestrating your personalized Mastery Canvas.
            </p>
          </div>
        </div>
      )}

      {state === 'RESULT' && content && (
        <ResultView 
          content={content}
          onReset={resetSession}
          onDownloadTutorial={downloadTutorial}
          onDownloadVideo={downloadVideo}
          isVideoDownloading={isVideoDownloading}
        />
      )}

      {state === 'ERROR' && (
        <div className="max-w-lg mx-auto bg-white border border-slate-100 rounded-[3rem] p-12 text-center shadow-2xl mt-12 animate-fadeIn">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">🛡️</div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Safety Notice</h2>
          <p className="text-slate-500 mb-10 text-lg leading-relaxed">{error}</p>
          <button 
            onClick={resetSession} 
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 transition-all"
          >
            Try Another Topic
          </button>
        </div>
      )}
    </Layout>
  );
};

export default App;