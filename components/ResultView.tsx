import React, { useState } from 'react';
import { LearningContent, QuizResult } from '../types.ts';
import { ImageSlideshow } from './ImageSlideshow.tsx';
import { Quiz } from './Quiz.tsx';
import { ParentReportView } from './ParentReportView.tsx';
import { marked } from 'marked';

interface ResultViewProps {
  content: LearningContent;
  onReset: () => void;
  onDownloadTutorial: () => void;
  onDownloadVideo: () => void;
  isVideoDownloading: boolean;
}

export const ResultView: React.FC<ResultViewProps> = ({
  content,
  onReset,
  onDownloadTutorial,
  onDownloadVideo,
  isVideoDownloading
}) => {
  const [viewMode, setViewMode] = useState<'PREVIEW' | 'RAW'>('PREVIEW');
  const [isCopied, setIsCopied] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [showGuardianReport, setShowGuardianReport] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(content.explanation);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isVideoLoading = content.videoUrl === 'LOADING';
  const isImagesLoading = (content.images as any) === 'LOADING';
  const isFactsLoading = (content.funFacts as any) === 'LOADING';
  const isQuizLoading = content.quizQuestions.length === 0;
  const isReportLoading = (content.parentReport as any) === 'LOADING';

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-100 pb-8 gap-6">
        <div>
          <span className="text-sm font-black text-blue-600 uppercase tracking-widest mb-2 block">
            {content.subject} Mastery Canvas
          </span>
          <h1 className="text-5xl lg:text-6xl font-black text-slate-950 tracking-tighter capitalize">
            {content.topic}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {content.parentReport && !isReportLoading && (
            <button
              onClick={() => setShowGuardianReport(!showGuardianReport)}
              className={`px-8 py-4 font-bold rounded-2xl transition-all shadow-lg flex items-center gap-2 ${
                showGuardianReport 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {showGuardianReport ? 'Back to Lesson' : 'Guardian Insights'}
            </button>
          )}
          <button
            onClick={onReset}
            className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all hover:-translate-y-1 shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Lesson
          </button>
        </div>
      </div>

      {showGuardianReport && content.parentReport && !isReportLoading ? (
        <ParentReportView report={content.parentReport} quizResult={quizResult} />
      ) : (
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Main Lesson (Left) */}
          <div className="lg:col-span-7 space-y-10">
            <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-100 flex flex-col h-[850px] overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex bg-slate-200 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('PREVIEW')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                      viewMode === 'PREVIEW' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setViewMode('RAW')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                      viewMode === 'RAW' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Markdown
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    {isCopied ? "Copied" : "Copy MD"}
                  </button>
                  <button
                    onClick={onDownloadTutorial}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md"
                  >
                    Download
                  </button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                {viewMode === 'PREVIEW' ? (
                  <div
                    className="prose prose-slate prose-xl max-w-none prose-headings:font-black prose-a:text-blue-600"
                    dangerouslySetInnerHTML={{ __html: marked.parse(content.explanation) }}
                  />
                ) : (
                  <textarea
                    readOnly
                    value={content.explanation}
                    className="w-full h-full font-mono text-lg text-slate-600 bg-transparent resize-none outline-none leading-relaxed"
                  />
                )}
              </div>
            </section>
          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-5 space-y-8">
            {content.videoUrl && (
              <section className="bg-slate-950 rounded-[2.5rem] p-6 shadow-2xl text-white overflow-hidden border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isVideoLoading ? 'bg-blue-500' : 'bg-rose-500'} animate-pulse`}></span>
                    {isVideoLoading ? 'RENDERING CINEMATIC VISUALS...' : 'AI CINEMATIC VISUALIZER'}
                  </h3>
                  {!isVideoLoading && (
                    <button
                      onClick={onDownloadVideo}
                      disabled={isVideoDownloading}
                      className="text-white/40 hover:text-white transition-colors disabled:opacity-30"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 shadow-inner flex items-center justify-center relative">
                  {isVideoLoading ? (
                    <div className="absolute inset-0 shimmer opacity-20 flex flex-col items-center justify-center gap-4">
                      <svg className="w-12 h-12 text-white/40 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-[10px] text-white/60 font-black tracking-[0.2em] uppercase">Veo AI is working...</span>
                    </div>
                  ) : (
                    <video
                      key={content.videoUrl}
                      src={content.videoUrl as string}
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  )}
                </div>
              </section>
            )}

            <section className="bg-white rounded-[2.5rem] p-6 shadow-lg border border-slate-100">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {isImagesLoading ? 'Generating Visuals...' : 'Visual Reference Gallery'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-black text-blue-600 uppercase tracking-tighter">
                  Gemini 2.5 Flash
                </span>
              </div>
              <div className="aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm relative">
                {isImagesLoading ? (
                  <div className="absolute inset-0 shimmer"></div>
                ) : (
                  <ImageSlideshow images={content.images || []} />
                )}
              </div>
            </section>

            {/* Fun Facts Section */}
            <section className="bg-violet-50 rounded-[2.5rem] p-8 border border-violet-100 shadow-xl shadow-violet-50/50">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-xl text-white ${isFactsLoading ? 'bg-violet-400 animate-pulse' : 'bg-violet-600'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {isFactsLoading ? 'Searching for Facts...' : 'Did You Know?'}
                </h3>
              </div>
              <ul className="space-y-4">
                {isFactsLoading ? (
                  [1, 2, 3].map(i => (
                    <li key={i} className="h-16 w-full shimmer rounded-2xl opacity-40"></li>
                  ))
                ) : (
                  (content.funFacts || []).map((fact, idx) => (
                    <li key={idx} className="flex gap-4 p-4 bg-white/60 rounded-2xl border border-violet-100/50 hover:bg-white transition-colors group">
                      <span className="text-violet-600 font-black text-sm mt-0.5">#{idx + 1}</span>
                      <p className="text-slate-700 font-medium leading-relaxed text-sm group-hover:text-slate-950 transition-colors">{fact}</p>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100 shadow-xl shadow-emerald-50/50">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-xl text-white ${isQuizLoading ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-600'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {isQuizLoading ? 'Analyzing Mastery...' : 'Mastery Check'}
                </h3>
              </div>
              {isQuizLoading ? (
                <div className="space-y-4">
                  <div className="h-24 w-full shimmer rounded-2xl opacity-40"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-12 shimmer rounded-xl opacity-40"></div>
                    <div className="h-12 shimmer rounded-xl opacity-40"></div>
                  </div>
                </div>
              ) : (
                <Quiz 
                  questions={content.quizQuestions} 
                  onComplete={(res) => {
                    setQuizResult(res);
                  }} 
                />
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};