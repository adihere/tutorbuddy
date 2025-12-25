import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout.tsx';
import { TutorForm } from './components/TutorForm.tsx';
import { Quiz } from './components/Quiz.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { AppState, LearningContent } from './types.ts';
import { generateTutorial, generateVideo, generateQuiz, generateImages, validateTopicSafety } from './services/geminiService.ts';
import { marked } from 'marked';

const ImageSlideshow: React.FC<{ images: string[] }> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images]);

  if (images.length === 0) return null;

  return (
    <div className="relative w-full h-full group">
      {images.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt={`Educational aid ${idx + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentIndex ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full">
        {images.map((_, idx) => (
          <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('IDLE');
  const [content, setContent] = useState<LearningContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('');
  const [viewMode, setViewMode] = useState<'PREVIEW' | 'RAW'>('PREVIEW');
  const [isCopied, setIsCopied] = useState(false);
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

  const handleStartSession = async (userTopic: string, subject: string, ageGroup: number, videoEnabled: boolean) => {
    try {
      await checkAndSelectKey();
      setState('PROCESSING');
      setError(null);

      // 0. AI Guardrail Pre-Check
      setLoadingStep(`Running safety check...`);
      const safetyResult = await validateTopicSafety(userTopic, subject, ageGroup);
      if (!safetyResult.isSafe) {
        throw new Error(safetyResult.reason || "This topic is not suitable for our educational platform. Please try a different academic subject.");
      }

      // 1. Generate Core Content (Tutorial)
      setLoadingStep(`Drafting your ${subject} lesson...`);
      const tutorial = await generateTutorial(userTopic, subject, ageGroup);

      // 2. Generate Secondary Content in Parallel
      setLoadingStep(`Generating visual assets and quiz...`);
      
      const quizPromise = generateQuiz(userTopic, subject, ageGroup);
      const imagesPromise = generateImages(userTopic, subject, ageGroup);
      
      let videoUrl: string | null = null;
      let quiz: any[] = [];
      let images: string[] = [];

      if (videoEnabled) {
        setLoadingStep(`Rendering cinematic ${subject} visualizer...`);
        // We run video generation while waiting for others
        const [quizRes, imagesRes, videoRes] = await Promise.all([
          quizPromise,
          imagesPromise,
          generateVideo(userTopic, subject, ageGroup)
        ]);
        quiz = quizRes;
        images = imagesRes;
        videoUrl = videoRes;
      } else {
        const [quizRes, imagesRes] = await Promise.all([quizPromise, imagesPromise]);
        quiz = quizRes;
        images = imagesRes;
      }

      setContent({
        topic: userTopic,
        subject: subject,
        explanation: tutorial,
        quizQuestions: quiz,
        videoUrl: videoUrl,
        images: images,
        funFacts: [] 
      });
      setState('RESULT');
    } catch (err: any) {
      console.error("Session Generation Failed:", err);
      setError(err.message || "We couldn't create your lesson. Please check your API key and try again.");
      setState('ERROR');
    }
  };

  const resetSession = () => {
    setContent(null);
    setState('IDLE');
    setViewMode('PREVIEW');
  };

  const copyToClipboard = () => {
    if (content?.explanation) {
      navigator.clipboard.writeText(content.explanation);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const downloadTutorial = () => {
    if (content?.explanation) {
      const blob = new Blob([content.explanation], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tutorial-${content.topic.toLowerCase().replace(/\s+/g, '-')}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const downloadVideo = async () => {
    if (content?.videoUrl) {
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
        console.error("Failed to download video:", err);
      } finally {
        setIsVideoDownloading(false);
      }
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
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🧠</span>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">{loadingStep}</h2>
            <p className="text-slate-500 max-w-xs mx-auto leading-relaxed">
              Our safety guardrails are reviewing your topic and building your multi-modal mastery session.
            </p>
          </div>
        </div>
      )}

      {state === 'RESULT' && content && (
        <div className="max-w-7xl mx-auto space-y-12 pb-32 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-100 pb-8 gap-6">
            <div>
              <span className="text-sm font-black text-blue-600 uppercase tracking-widest mb-2 block">{content.subject} Mastery Canvas</span>
              <h1 className="text-5xl lg:text-6xl font-black text-slate-950 tracking-tighter capitalize">{content.topic}</h1>
            </div>
            <button 
              onClick={resetSession}
              className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all hover:-translate-y-1 shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              New Lesson
            </button>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            {/* Main Lesson Content (Left Column) */}
            <div className="lg:col-span-7 space-y-10">
              <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-100 flex flex-col h-[850px] overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex bg-slate-200 p-1 rounded-xl">
                    <button onClick={() => setViewMode('PREVIEW')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'PREVIEW' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Preview</button>
                    <button onClick={() => setViewMode('RAW')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'RAW' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Markdown</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={copyToClipboard} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-all">{isCopied ? "Copied" : "Copy MD"}</button>
                    <button onClick={downloadTutorial} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md">Download</button>
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                  {viewMode === 'PREVIEW' ? (
                    <div className="prose prose-slate prose-xl max-w-none prose-headings:font-black prose-a:text-blue-600" dangerouslySetInnerHTML={{ __html: marked.parse(content.explanation) }} />
                  ) : (
                    <textarea readOnly value={content.explanation} className="w-full h-full font-mono text-lg text-slate-600 bg-transparent resize-none outline-none leading-relaxed" />
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar: Visual Aids & Quiz (Right Column) */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* Featured Video Player */}
              {content.videoUrl && (
                <section className="bg-slate-950 rounded-[2.5rem] p-6 shadow-2xl text-white overflow-hidden border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                      AI CINEMATIC VISUALIZER
                    </h3>
                    <button onClick={downloadVideo} disabled={isVideoDownloading} className="text-white/40 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                  </div>
                  <div className="aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 shadow-inner">
                    <video 
                      key={content.videoUrl}
                      src={content.videoUrl} 
                      className="w-full h-full object-cover" 
                      controls 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                    />
                  </div>
                </section>
              )}

              {/* Educational Image Carousel */}
              {content.images && content.images.length > 0 && (
                <section className="bg-white rounded-[2.5rem] p-6 shadow-lg border border-slate-100">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Visual Reference Gallery
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-black text-blue-600 uppercase tracking-tighter">Gemini 2.5 Flash</span>
                  </div>
                  <div className="aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm">
                    <ImageSlideshow images={content.images} />
                  </div>
                </section>
              )}

              {/* Mastery Quiz */}
              <section className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100 shadow-xl shadow-emerald-50/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-600 rounded-xl text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Mastery Check</h3>
                </div>
                {content.quizQuestions.length > 0 ? (
                  <Quiz questions={content.quizQuestions} onComplete={(res) => console.log("Quiz Results:", res)} />
                ) : (
                  <div className="p-6 bg-white/50 rounded-2xl text-emerald-800 text-sm font-medium border border-emerald-100 italic">
                    The AI is skipping the quiz for this session. Use the tutorial for reference.
                  </div>
                )}
              </section>

            </div>
          </div>
        </div>
      )}

      {state === 'ERROR' && (
        <div className="max-w-lg mx-auto bg-white border border-slate-100 rounded-[3rem] p-12 text-center shadow-2xl mt-12 animate-fadeIn">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">🛡️</div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Safety Notice</h2>
          <p className="text-slate-500 mb-10 text-lg leading-relaxed">{error}</p>
          <button onClick={resetSession} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 transition-all">Try Another Topic</button>
        </div>
      )}
    </Layout>
  );
};

export default App;
