
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout.tsx';
import { TutorForm } from './components/TutorForm.tsx';
import { Quiz } from './components/Quiz.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { AppState, LearningContent } from './types.ts';
import { generateTutorial, generateVideo, generateQuiz, generateImages } from './services/geminiService.ts';
import { marked } from 'marked';

const ImageSlideshow: React.FC<{ images: string[] }> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(interval);
  }, [images]);

  if (images.length === 0) return null;

  return (
    <div className="relative w-full h-full">
      {images.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt={`Educational aid ${idx + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentIndex ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, idx) => (
          <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/30'}`} />
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

      // 1. Generate Core Content (Tutorial)
      setLoadingStep(`Drafting your ${subject} lesson...`);
      const tutorial = await generateTutorial(userTopic, subject, ageGroup);

      // 2. Generate Secondary Content
      setLoadingStep(`Building mastery check...`);
      let quiz: any[] = [];
      try {
        quiz = await generateQuiz(userTopic, subject, ageGroup);
      } catch (qErr) {
        console.warn("Quiz generation failed", qErr);
      }

      let videoUrl = null;
      let images: string[] | null = null;

      if (videoEnabled) {
        setLoadingStep(`Rendering ${subject} visualizer...`);
        try {
          videoUrl = await generateVideo(userTopic, subject, ageGroup);
          if (!videoUrl) {
            setLoadingStep(`Video unavailable. Generating image loop instead...`);
            images = await generateImages(userTopic, subject, ageGroup);
          }
        } catch (videoError: any) {
          console.warn("Video failed, trying images fallback.");
          images = await generateImages(userTopic, subject, ageGroup);
        }
      } else {
        setLoadingStep(`Generating educational image loop...`);
        images = await generateImages(userTopic, subject, ageGroup);
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

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
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
              We're orchestrating multiple AI models to build your canvas. This usually takes 20-40 seconds.
            </p>
          </div>
        </div>
      )}

      {state === 'RESULT' && content && (
        <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-100 pb-8 gap-6">
            <div>
              <span className="text-sm font-black text-blue-600 uppercase tracking-widest mb-2 block">{content.subject} Mastery Canvas</span>
              <h2 className="text-5xl font-black text-slate-950 tracking-tighter capitalize">{content.topic}</h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button 
                onClick={resetSession}
                className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all hover:-translate-y-1 shadow-xl"
              >
                New Session
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            {/* Tutorial */}
            <div className="lg:col-span-7 space-y-10">
              <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-100 flex flex-col h-[700px] overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex bg-slate-200 p-1 rounded-xl">
                      <button onClick={() => setViewMode('PREVIEW')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'PREVIEW' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Preview</button>
                      <button onClick={() => setViewMode('RAW')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'RAW' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Markdown</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={copyToClipboard} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-all">{isCopied ? "Copied" : "Copy MD"}</button>
                    <button onClick={downloadTutorial} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md">Download</button>
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                  {viewMode === 'PREVIEW' ? (
                    <div className="prose prose-slate prose-xl max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(content.explanation) }} />
                  ) : (
                    <textarea readOnly value={content.explanation} className="w-full h-full font-mono text-lg text-slate-600 bg-transparent resize-none outline-none leading-relaxed" />
                  )}
                </div>
              </section>
            </div>

            {/* Visualizer & Quiz */}
            <div className="lg:col-span-5 space-y-10">
              <section className="bg-slate-950 rounded-[3rem] p-8 shadow-2xl text-white overflow-hidden relative group">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black uppercase tracking-tight">
                    {content.videoUrl ? 'AI Explainer Video' : 'AI Educational Loop'}
                  </h3>
                  {content.videoUrl && (
                    <button onClick={downloadVideo} disabled={isVideoDownloading} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                      {isVideoDownloading ? "..." : "↓"}
                    </button>
                  )}
                  {!content.videoUrl && (
                    <div className="px-3 py-1 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Banana v2.5</div>
                  )}
                </div>
                
                <div className="aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                  {content.videoUrl ? (
                    <video src={content.videoUrl} className="w-full h-full object-cover" controls autoPlay loop muted playsInline />
                  ) : content.images && content.images.length > 0 ? (
                    <ImageSlideshow images={content.images} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                      <p className="text-slate-500 text-sm font-bold">Visuals currently unavailable.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-emerald-50 rounded-[3rem] p-10 border border-emerald-100 shadow-xl shadow-emerald-50">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Mastery Quiz</h3>
                {content.quizQuestions.length > 0 ? (
                  <Quiz questions={content.quizQuestions} onComplete={(res) => console.log("Quiz Results:", res)} />
                ) : (
                  <p className="text-emerald-700 font-medium">No quiz available for this topic. Keep reading!</p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {state === 'ERROR' && (
        <div className="max-w-lg mx-auto bg-white border border-slate-100 rounded-[3rem] p-12 text-center shadow-2xl mt-12 animate-fadeIn">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">⚠️</div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Session Failed</h2>
          <p className="text-slate-500 mb-10 text-lg leading-relaxed">{error}</p>
          <button onClick={resetSession} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 transition-all">Try Again</button>
        </div>
      )}
    </Layout>
  );
};

export default App;
