
import React, { useState, useRef, useCallback } from 'react';
import { Layout } from './components/Layout.tsx';
import { TutorForm } from './components/TutorForm.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { ResultView } from './components/ResultView.tsx';
import { AppState, LearningContent } from './types.ts';
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
    // Note: We use process.env.API_KEY as per strict project guidelines
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
    videoEnabled: boolean
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

      // Phase 2: Asset Generation (Parallelized for performance)
      setLoadingStep(`Orchestrating multi-modal assets...`);
      
      const quizPromise = generateQuiz(userTopic, subject, ageGroup);
      const imagesPromise = generateImages(userTopic, subject, ageGroup);
      const factsPromise = generateFunFacts(userTopic, subject, ageGroup);
      const reportPromise = generateParentReport(userTopic, subject, ageGroup);
      
      let videoUrl: string | null = null;
      let quiz: any[] = [];
      let images: string[] = [];
      let facts: string[] = [];
      let report: any = null;

      if (videoEnabled) {
        setLoadingStep(`Finalizing cinematic visualizer...`);
        const [quizRes, imagesRes, factsRes, reportRes, videoRes] = await Promise.all([
          quizPromise,
          imagesPromise,
          factsPromise,
          reportPromise,
          generateVideo(userTopic, subject, ageGroup)
        ]);
        quiz = quizRes;
        images = imagesRes;
        facts = factsRes;
        report = reportRes;
        videoUrl = videoRes;
      } else {
        const [quizRes, imagesRes, factsRes, reportRes] = await Promise.all([quizPromise, imagesPromise, factsPromise, reportPromise]);
        quiz = quizRes;
        images = imagesRes;
        facts = factsRes;
        report = reportRes;
      }

      setContent({
        topic: userTopic,
        subject: subject,
        explanation: tutorial,
        quizQuestions: quiz,
        videoUrl: videoUrl,
        images: images,
        funFacts: facts,
        parentReport: report
      });
      setState('RESULT');
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
    if (!content?.videoUrl) return;
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
