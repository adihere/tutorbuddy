
import React, { useState, useRef } from 'react';
import { OutputMode, HistoryItem } from '../types.ts';

interface TutorFormProps {
  onSubmit: (topic: string, subject: string, ageGroup: number, outputMode: OutputMode, contextImage?: string) => void;
  isLoading: boolean;
  history?: HistoryItem[];
  onLoadHistory?: (item: HistoryItem) => void;
}

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; ring: string; iconBg: string }> = {
  slate: { 
    border: 'border-slate-600', 
    bg: 'bg-slate-50', 
    text: 'text-slate-700', 
    ring: 'ring-slate-500/10',
    iconBg: 'bg-slate-600'
  },
  rose: { 
    border: 'border-rose-600', 
    bg: 'bg-rose-50', 
    text: 'text-rose-700', 
    ring: 'ring-rose-500/10',
    iconBg: 'bg-rose-600'
  },
  indigo: { 
    border: 'border-indigo-600', 
    bg: 'bg-indigo-50', 
    text: 'text-indigo-700', 
    ring: 'ring-indigo-500/10',
    iconBg: 'bg-indigo-600'
  },
  blue: { 
    border: 'border-blue-600', 
    bg: 'bg-blue-50', 
    text: 'text-blue-700', 
    ring: 'ring-blue-500/10',
    iconBg: 'bg-blue-600'
  }
};

export const TutorForm: React.FC<TutorFormProps> = ({ onSubmit, isLoading, history = [], onLoadHistory }) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('Science');
  const [ageGroup, setAgeGroup] = useState<number>(10);
  const [outputMode, setOutputMode] = useState<OutputMode>('TEXT_AUDIO_IMAGES');
  const [contextImage, setContextImage] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjects = ["Math", "Science", "Latin", "English", "Geography"];
  const ages = Array.from({ length: 13 }, (_, i) => i + 5); // 5 to 17

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) {
      onSubmit(topic, subject, ageGroup, outputMode, contextImage);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setContextImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setContextImage(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const modeOptions: { id: OutputMode; title: string; desc: string; icon: React.ReactNode; color: string; disabled?: boolean }[] = [
    {
      id: 'TEXT',
      title: 'Text Only',
      desc: 'Minimalist lesson',
      color: 'slate',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    },
    {
      id: 'TEXT_AUDIO',
      title: 'Text & Audio',
      desc: 'Read + Listen',
      color: 'rose',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
    },
    {
      id: 'TEXT_AUDIO_IMAGES',
      title: 'Visual Tutor',
      desc: '5 Photos + Quiz',
      color: 'indigo',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    },
    {
      id: 'ALL',
      title: 'Multi-Modal',
      desc: 'Coming Soon',
      color: 'blue',
      disabled: true,
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fadeIn">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Personalized Learning</h2>
        <p className="text-slate-500 text-lg">Choose your subject and topic to begin your tailored mastery session.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Lesson Topic</label>
            <input
              type="text"
              className="w-full px-8 py-6 rounded-[2rem] border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-xl shadow-sm"
              placeholder="e.g., Quantum Physics"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="md:col-span-3 relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isLoading}
              className="w-full h-[78px] px-6 py-4 rounded-[2rem] border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-xl shadow-sm appearance-none bg-white cursor-pointer"
            >
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Learner Age</label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(parseInt(e.target.value))}
              disabled={isLoading}
              className="w-full h-[78px] px-6 py-4 rounded-[2rem] border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-xl shadow-sm appearance-none bg-white cursor-pointer"
            >
              {ages.map(age => (
                <option key={age} value={age}>Age {age}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200">
           <div className="flex flex-col items-center justify-center text-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Curriculum Context (Optional)</label>
              {!contextImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group cursor-pointer flex flex-col items-center p-8 transition-all hover:scale-105"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:border-blue-200 transition-colors mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <span className="text-slate-600 font-bold">Scan school classwork</span>
                  <span className="text-[10px] text-slate-400 font-medium">Add OCR context to align Buddy with your teacher</span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageChange}
                  />
                </div>
              ) : (
                <div className="relative group">
                  <img 
                    src={contextImage} 
                    className="h-32 rounded-2xl shadow-md border-4 border-white object-cover" 
                    alt="Classwork preview" 
                  />
                  <button 
                    onClick={clearImage}
                    type="button"
                    className="absolute -top-3 -right-3 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <div className="mt-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 justify-center">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Context Loaded
                  </div>
                </div>
              )}
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {modeOptions.map((mode) => {
              const active = outputMode === mode.id;
              const config = COLOR_MAP[mode.color];
              
              return (
                <button
                  key={mode.id}
                  type="button"
                  disabled={mode.disabled}
                  onClick={() => !mode.disabled && setOutputMode(mode.id)}
                  className={`flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all relative overflow-hidden group ${
                    mode.disabled 
                      ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed grayscale opacity-60'
                      : active 
                        ? `${config.border} ${config.bg} ${config.text} shadow-md ring-4 ${config.ring}` 
                        : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {mode.disabled && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-200 text-[8px] font-black uppercase tracking-tighter rounded-full text-slate-500">
                      Coming Soon
                    </div>
                  )}
                  <div className={`p-3 rounded-2xl ${
                    mode.disabled 
                      ? 'bg-slate-200 text-slate-400'
                      : active ? `${config.iconBg} text-white` : 'bg-slate-100 text-slate-400'
                  } transition-colors`}>
                    {mode.icon}
                  </div>
                  <div className="text-center">
                    <span className="block font-black text-sm uppercase tracking-tight leading-none mb-1">{mode.title}</span>
                    <span className="text-[10px] font-bold opacity-60 leading-none">{mode.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="w-full max-w-2xl mx-auto py-6 rounded-[2rem] bg-blue-600 text-white font-black text-2xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-100 hover:-translate-y-1 active:scale-[0.98]"
        >
          {isLoading ? (
            <div className="flex items-center gap-4">
               <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Creating your canvas...</span>
            </div>
          ) : (
            <>
              <span>Generate Mastery Canvas</span>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </>
          )}
        </button>
      </form>

      {history.length > 0 && (
        <div className="mt-16 animate-fadeIn">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-slate-200"></div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Sessions</span>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => onLoadHistory?.(item)}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors capitalize">{item.topic}</h4>
                  <p className="text-xs text-slate-500 font-medium">{item.subject} &bull; Age {item.content.ageGroup}</p>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
