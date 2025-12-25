
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { TutorForm } from './components/TutorForm';
import { ContentDisplay } from './components/ContentDisplay';
import { Quiz } from './components/Quiz';
import { ParentReportView } from './components/ParentReportView';
import { 
  AppState, 
  LearningContent, 
  QuizResult, 
  ParentReport 
} from './types';
import { 
  orchestrateTutor, 
  validateContent, 
  generateParentReport,
  generateVideo 
} from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('IDLE');
  const [content, setContent] = useState<LearningContent | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [report, setReport] = useState<ParentReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  // Mandatory check for selected API key on mount for high-quality models and video generation
  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        const has = await aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        // Assume key is provided externally if not in the selection environment
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  // Trigger the API key selection dialog
  const handleOpenKeySelection = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
      // Assume success to mitigate race condition between key selection and state update
      setHasApiKey(true);
    }
  };

  const handleStartSession = async (topic: string, images: string[]) => {
    setState('PROCESSING');
    setError(null);
    try {
      // Agent 1: Orchestrator
      const rawContent = await orchestrateTutor(topic, images);
      
      // Agent 2: Validator
      const validated = await validateContent(rawContent);
      
      setContent(validated);
      setState('LEARNING');

      // Start video generation in background using Veo model
      generateAndSetVideo(validated.videoScript);
    } catch (err: any) {
      console.error(err);
      // Reset key selection state if the request fails due to missing resources/key
      if (err?.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }
      setError("Failed to generate learning material. Please try again.");
      setState('ERROR');
    }
  };

  const generateAndSetVideo = async (script: string) => {
    setIsVideoLoading(true);
    try {
      const url = await generateVideo(script);
      setVideoUrl(url);
    } catch (err: any) {
      console.error("Video generation failed", err);
      if (err?.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }
    } finally {
      setIsVideoLoading(false);
    }
  };

  const handleQuizComplete = async (result: QuizResult) => {
    setQuizResult(result);
    setState('PROCESSING');
    try {
      if (content) {
        // Agent 3: Reporter
        const parentReport = await generateParentReport(content, result);
        setReport(parentReport);
        setState('REPORT');
      }
    } catch (err) {
      setError("Failed to generate progress report.");
      setState('ERROR');
    }
  };

  // Render selection screen if mandatory API key is missing
  if (hasApiKey === false) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100 my-10 animate-fadeIn">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">API Key Required</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            To generate high-quality lessons and AI animations, you must select an API key from a <strong>paid Google Cloud project</strong>.
          </p>
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
            <h4 className="font-bold text-gray-900 mb-2">Instructions:</h4>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
              <li>Click the button below to open the key selector.</li>
              <li>Select a key associated with a project that has billing enabled.</li>
              <li>Refer to the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold hover:underline">billing documentation</a> for setup details.</li>
            </ul>
          </div>
          <button
            onClick={handleOpenKeySelection}
            className="w-full py-4 gradient-bg text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-200 transform transition-all active:scale-95"
          >
            Select API Key to Start
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {state === 'IDLE' && (
        <TutorForm onSubmit={handleStartSession} isLoading={false} />
      )}

      {state === 'PROCESSING' && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Agents are working...</h2>
            <p className="text-gray-500 mt-2">Personalizing your lesson, validating facts, and building your report.</p>
          </div>
        </div>
      )}

      {state === 'LEARNING' && content && (
        <div className="space-y-12">
          {videoUrl && (
            <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-black border-4 border-white">
              <video src={videoUrl} controls className="w-full aspect-video" />
            </div>
          )}
          {isVideoLoading && !videoUrl && (
            <div className="max-w-4xl mx-auto bg-gray-900 aspect-video rounded-3xl flex flex-col items-center justify-center text-white p-12">
               <svg className="animate-spin h-10 w-10 mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-lg font-medium">Generating your animated learning video...</p>
              <p className="text-sm opacity-60">This usually takes about a minute with Veo.</p>
            </div>
          )}
          <ContentDisplay 
            content={content} 
            onNext={() => setState('QUIZ')} 
          />
        </div>
      )}

      {state === 'QUIZ' && content && (
        <Quiz 
          questions={content.quizQuestions} 
          onComplete={handleQuizComplete} 
        />
      )}

      {state === 'REPORT' && report && quizResult && (
        <ParentReportView report={report} quizResult={quizResult} />
      )}

      {state === 'ERROR' && (
        <div className="max-w-lg mx-auto bg-red-50 border border-red-200 rounded-3xl p-10 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-red-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <button 
            onClick={() => setState('IDLE')}
            className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </Layout>
  );
};

export default App;
