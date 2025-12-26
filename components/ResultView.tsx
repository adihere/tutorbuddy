import React, { useState, useRef } from 'react';
import { LearningContent, QuizResult } from '../types.ts';
import { ImageSlideshow } from './ImageSlideshow.tsx';
import { Quiz } from './Quiz.tsx';
import { ParentReportView } from './ParentReportView.tsx';
import { marked } from 'marked';
import { generateSpeech } from '../services/geminiService.ts';
// @ts-ignore
import JSZip from 'jszip';

interface ResultViewProps {
  content: LearningContent;
  onReset: () => void;
  onDownloadTutorial: () => void;
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const FACT_ICONS = [
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.642.316a6 6 0 01-3.86.517l-2.388-.477a2 2 0 00-1.022.547l-1.168 1.168a2 2 0 00.556 3.212 9.035 9.035 0 007.146 0 2 2 0 00.556-3.212l-1.168-1.168z" /></svg>,
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
];

const FACT_COLORS = [
  'bg-blue-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-violet-500'
];

export const ResultView: React.FC<ResultViewProps> = ({
  content,
  onReset,
  onDownloadTutorial
}) => {
  const [viewMode, setViewMode] = useState<'PREVIEW' | 'RAW'>('PREVIEW');
  const [isCopied, setIsCopied] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [showGuardianReport, setShowGuardianReport] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const hasAudio = content.outputMode !== 'TEXT';
  const hasImages = content.outputMode === 'TEXT_AUDIO_IMAGES';

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(content.explanation);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    if (!content.images || content.images.length === 0 || isZipping) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      content.images.forEach((imgBase64, index) => {
        const base64Data = imgBase64.split(',')[1];
        zip.file(`image-${index + 1}.png`, base64Data, { base64: true });
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tutorbuddy-gallery-${content.topic.toLowerCase().replace(/\s+/g, '-')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP creation failed:", err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleToggleAudio = async () => {
    if (isAudioPlaying) {
      audioSourceRef.current?.stop();
      setIsAudioPlaying(false);
      return;
    }

    setIsAudioLoading(true);
    try {
      const audioData = await generateSpeech(content.explanation, content.topic, 10);
      if (!audioData) throw new Error("No audio data returned");

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = ctx;
      
      const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsAudioPlaying(false);
      
      audioSourceRef.current = source;
      source.start();
      setIsAudioPlaying(true);
    } catch (err) {
      console.error("Audio playback error:", err);
      alert("Failed to play audio dialogue.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  const isImagesLoading = (content.images as any) === 'LOADING';
  const isFactsLoading = (content.funFacts as any) === 'LOADING';
  const isQuizLoading = content.quizQuestions.length === 0;
  const isReportLoading = (content.parentReport as any) === 'LOADING';

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32 animate-fadeIn">
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
              {showGuardianReport ? 'Back to Lesson' : 'Guardian Insights'}
            </button>
          )}
          <button
            onClick={onReset}
            className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all hover:-translate-y-1 shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            New Lesson
          </button>
        </div>
      </div>

      {showGuardianReport && content.parentReport && !isReportLoading ? (
        <ParentReportView report={content.parentReport} quizResult={quizResult} />
      ) : (
        <div className="grid lg:grid-cols-12 gap-10">
          <div className={`${hasImages ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-10`}>
            <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-100 flex flex-col h-[850px] overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex bg-slate-200 p-1 rounded-xl">
                  <button onClick={() => setViewMode('PREVIEW')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'PREVIEW' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Preview</button>
                  <button onClick={() => setViewMode('RAW')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'RAW' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Markdown</button>
                </div>
                
                <div className="flex items-center gap-3">
                  {hasAudio && (
                    <button
                      onClick={handleToggleAudio}
                      disabled={isAudioLoading}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2 ${isAudioPlaying ? 'bg-rose-50 border-rose-200 text-rose-600 ring-4 ring-rose-500/10' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'}`}
                    >
                      {isAudioLoading ? (
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 14.828a1 1 0 11-1.414-1.414 5 5 0 000-7.072 1 1 0 011.414-1.414 7 7 0 010 9.9z" clipRule="evenodd" /></svg>
                      )}
                      {isAudioPlaying ? 'Stop Audio' : 'Buddy Dialogue'}
                    </button>
                  )}
                  <button onClick={onDownloadTutorial} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md">Download .md</button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-12 custom-scrollbar">
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

          <div className={`${hasImages ? 'lg:col-span-5' : 'hidden'} space-y-8`}>
            {hasImages && (
              <section className="bg-white rounded-[2.5rem] p-6 shadow-lg border border-slate-100">
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Visual mastery Gallery (5 Images)</h3>
                  {!isImagesLoading && content.images && content.images.length > 0 && (
                    <button
                      onClick={handleDownloadZip}
                      disabled={isZipping}
                      className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
                    >
                      {isZipping ? 'Zipping...' : 'Download All (.zip)'}
                    </button>
                  )}
                </div>
                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm relative">
                  {isImagesLoading ? <div className="absolute inset-0 shimmer"></div> : <ImageSlideshow images={content.images || []} topic={content.topic} />}
                </div>
              </section>
            )}

            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
              <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                Mind-Blowing Facts
              </h3>
              <div className="space-y-6 relative z-10">
                {isFactsLoading ? (
                  [1,2,3].map(i => <div key={i} className="h-20 shimmer rounded-3xl opacity-40"></div>)
                ) : (
                  (content.funFacts || []).map((fact, idx) => {
                    const colorClass = FACT_COLORS[idx % FACT_COLORS.length];
                    const icon = FACT_ICONS[idx % FACT_ICONS.length];
                    return (
                      <div 
                        key={idx} 
                        className="group flex gap-5 p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-md transition-all duration-300"
                      >
                        <div className={`flex-shrink-0 w-12 h-12 ${colorClass} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          {icon}
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Discovery #{idx + 1}</span>
                          <p className="text-slate-700 font-semibold leading-relaxed text-sm group-hover:text-slate-900 transition-colors">
                            {fact}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100 shadow-xl">
              <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">🎯</div>
                Mastery Check
              </h3>
              {isQuizLoading ? <div className="h-24 shimmer rounded-2xl opacity-40"></div> : <Quiz questions={content.quizQuestions} onComplete={(res) => setQuizResult(res)} />}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};