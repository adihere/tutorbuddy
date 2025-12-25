
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { TutorForm } from './components/TutorForm';
import { ContentDisplay } from './components/ContentDisplay';
import { Quiz } from './components/Quiz';
import { ParentReportView } from './components/ParentReportView';
import { LandingPage } from './components/LandingPage';
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
  const [state, setState] = useState<AppState>('LANDING');
  const [statusMessage, setStatusMessage] = useState('Personalizing your lesson...');
  const [content, setContent] = useState<LearningContent | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [report, setReport] = useState<ParentReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const handleStartSession = async (topic: string, images: string[]) => {
    setState('PROCESSING');
    setStatusMessage('Orchestrator Agent: Crafting lesson plan...');
    setError(null);
    try {
      // Agent 1: Orchestrator
      const rawContent = await orchestrateTutor(topic, images);
      
      // Agent 2: Validator
      setStatusMessage('Validator Agent: Verifying factual accuracy...');
      const validated = await validateContent(rawContent);
      
      setContent(validated);
      setState('LEARNING');

      // Start video generation in background using Veo model
      generateAndSetVideo(validated.videoScript);
    } catch (err: any) {
      console.error(err);
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
    } finally {
      setIsVideoLoading(false);
    }
  };

  const handleQuizComplete = async (result: QuizResult) => {
    setQuizResult(result);
    setState('PROCESSING');
    setStatusMessage('Reporter Agent: Generating parent highlights...');
    try {
      if (content) {
        const parentReport = await generateParentReport(content, result);
        setReport(parentReport);
        setState('REPORT');
      }
    } catch (err) {
      setError("Failed to generate progress report.");
      setState('ERROR');
    }
  };

  return (
    <Layout>
      {state === 'LANDING' && (
        <LandingPage onStart={() => setState('IDLE')} />
      )}

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
            <h2 className="text-2xl font-bold text-gray-900">{statusMessage}</h2>
            <p className="text-gray-500 mt-2 italic">Building a personalized learning path just for you.</p>
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
            <div className="max-w-4xl mx-auto bg-gray-900 aspect-video rounded-3xl flex flex-col items-center justify-center text-white p-12 text-center">
               <svg className="animate-spin h-10 w-10 mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-lg font-medium">Generating your animated learning video...</p>
              <p className="text-sm opacity-60">This usually takes about a minute with Veo. You can start reading below while you wait!</p>
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
