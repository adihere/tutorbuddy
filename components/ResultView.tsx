import React, { useState, useRef, useEffect } from 'react';
import { LearningContent, QuizResult } from '../types.ts';
import { ImageSlideshow } from './ImageSlideshow.tsx';
import { Quiz } from './Quiz.tsx';
import { ParentReportView } from './ParentReportView.tsx';
import { marked } from 'marked';
import { generateSpeech, askBuddy } from '../services/geminiService.ts';
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

/**
 * Wraps raw PCM data into a playable WAV file
 */
function createWavBlob(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 32 + pcmData.length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, 'data');
  view.setUint32(40, pcmData.length, true);

  return new Blob([header, pcmData], { type: 'audio/wav' });
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
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const lastGeneratedAudioRef = useRef<string | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isBuddyThinking, setIsBuddyThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const hasAudio = content.outputMode !== 'TEXT';
  const hasImages = content.outputMode === 'TEXT_AUDIO_IMAGES';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isBuddyThinking]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isBuddyThinking) return;

    const userMsg = userInput;
    setUserInput('');
    setChatMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setIsBuddyThinking(true);

    try {
      const buddyReply = await askBuddy(chatMessages, userMsg, content.topic, content.subject, content.ageGroup);
      setChatMessages(prev => [...prev, {role: 'model', text: buddyReply}]);
    } catch (err) {
      console.error("Chat Error:", err);
      setChatMessages(prev => [...prev, {role: 'model', text: "I'm having a little trouble connecting right now, but keep thinking about those great questions!"}]);
    } finally {
      setIsBuddyThinking(false);
    }
  };

  const handleDownloadFullPack = async () => {
    if (isZipping) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folderName = `TutorBuddy-${content.topic.replace(/\s+/g, '-')}`;
      const root = zip.folder(folderName);

      // 1. Tutorial Markdown
      const tutorialMd = `# ${content.topic} (${content.subject})\n\n${content.explanation}\n\n## Fun Facts\n${content.funFacts.map(f => `- ${f}`).join('\n')}`;
      root.file('lesson.md', tutorialMd);

      // 2. Quiz and Answers
      const quizMd = `# Quiz: ${content.topic}\n\n${content.quizQuestions.map((q, i) => (
        `### Question ${i + 1}\n${q.question}\n\nOptions:\n${q.options.map(o => `- ${o}`).join('\n')}\n\n**Correct Answer:** ${q.correctAnswer}\n\n**Buddy's Explanation:** ${q.explanation}\n\n---\n`
      )).join('\n')}`;
      root.file('quiz_and_answers.md', quizMd);

      // 3. Images
      if (content.images && Array.isArray(content.images)) {
        const imgFolder = root.folder('images');
        content.images.forEach((imgBase64, index) => {
          const base64Data = imgBase64.split(',')[1];
          imgFolder.file(`visual-aid-${index + 1}.png`, base64Data, { base64: true });
        });
      }

      // 4. Audio (WAV)
      let audioBase64 = lastGeneratedAudioRef.current;
      if (!audioBase64 && hasAudio) {
        // If user hasn't played audio yet, generate it for the zip
        audioBase64 = await generateSpeech(content.explanation, content.topic, content.ageGroup);
      }
      
      if (audioBase64) {
        const audioBlob = createWavBlob(decode(audioBase64));
        root.file('buddy_dialogue.wav', audioBlob);
      }

      // 5. Parent Report
      if (content.parentReport) {
        const reportTxt = `Guardian Insights: ${content.topic}\n\nSummary: ${content.parentReport.summary}\n\nHighlights:\n${content.parentReport.highlights.map(h => `- ${h}`).join('\n')}\n\nRecommendations: ${content.parentReport.recommendations}`;
        root.file('guardian_insights.txt', reportTxt);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${folderName}-MasteryPack.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP creation failed:", err);
      alert("Failed to create the mastery pack. Please try again.");
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
      let audioData = lastGeneratedAudioRef.current;
      if (!audioData) {
        audioData = await generateSpeech(content.explanation, content.topic, content.ageGroup);
        if (!audioData) throw new Error("No audio data returned");
        lastGeneratedAudioRef.current = audioData;
      }

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
          <button
            onClick={handleDownloadFullPack}
            disabled={isZipping}
            className={`px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center gap-2 hover:bg-blue-700 hover:-translate-y-1 ${isZipping ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isZipping ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            )}
            Download Full Mastery Pack (.zip)
          </button>
          
          <button
            onClick={onReset}
            className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all hover:-translate-y-1 shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            New Lesson
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-10">
          {/* Tutorial Section */}
          <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-100 flex flex-col h-[700px] overflow-hidden">
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

          {/* Socratic Chat Section */}
          <section className="bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[500px] border border-slate-800">
             <div className="px-8 py-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-white font-black tracking-tight">Ask Buddy</h3>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Socratic Assistant</p>
                  </div>
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Discussion History: {chatMessages.length}</div>
             </div>

             <div className="flex-grow overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-900/50">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                     <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Buddy&backgroundColor=6366f1" className="w-20 h-20 mb-4" alt="Buddy" />
                     <p className="text-white font-medium max-w-[200px]">"I'm here to help you master this! Ask me anything about the lesson."</p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                      <div className={`max-w-[85%] px-6 py-4 rounded-3xl text-sm font-medium ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white/10 text-slate-200 border border-white/5 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                {isBuddyThinking && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-white/10 text-slate-400 px-6 py-4 rounded-3xl text-sm font-bold flex items-center gap-2">
                      Buddy is thinking...
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
             </div>

             <form onSubmit={handleSendMessage} className="p-6 bg-slate-950 border-t border-white/10">
                <div className="relative">
                  <input 
                    type="text" 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask Buddy a question..."
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all pr-24"
                  />
                  <button 
                    type="submit"
                    disabled={isBuddyThinking || !userInput.trim()}
                    className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    Send
                  </button>
                </div>
             </form>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <section className="bg-white rounded-[2.5rem] p-6 shadow-lg border border-slate-100">
             <div className="flex justify-between items-center mb-4 px-2">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Mastery Gallery</h3>
             </div>
             <div className="aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm relative">
                {isImagesLoading ? <div className="absolute inset-0 shimmer"></div> : <ImageSlideshow images={content.images || []} topic={content.topic} />}
             </div>
          </section>

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

      {/* Guardian Insights at the bottom of the output window */}
      {content.parentReport && !isReportLoading && (
        <section className="mt-16 animate-fadeIn">
          <ParentReportView report={content.parentReport} quizResult={quizResult} />
        </section>
      )}
    </div>
  );
};