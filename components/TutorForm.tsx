
import React, { useState } from 'react';

interface TutorFormProps {
  onSubmit: (topic: string, subject: string, ageGroup: number, videoEnabled: boolean) => void;
  isLoading: boolean;
}

export const TutorForm: React.FC<TutorFormProps> = ({ onSubmit, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('Science');
  const [ageGroup, setAgeGroup] = useState<number>(10);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const subjects = ["Math", "Science", "Latin", "English", "Geography"];
  const ages = Array.from({ length: 13 }, (_, i) => i + 5); // 5 to 17

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) {
      onSubmit(topic, subject, ageGroup, videoEnabled);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fadeIn">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Personalized Learning</h2>
        <p className="text-slate-500 text-lg">Choose your subject and topic to begin your tailored mastery session.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Topic Input */}
          <div className="md:col-span-6 relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Lesson Topic</label>
            <input
              type="text"
              className="w-full px-8 py-6 rounded-[2rem] border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-xl shadow-sm"
              placeholder="e.g., Quantum Physics or Roman Empire"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          {/* Subject Dropdown */}
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
            <div className="absolute right-6 top-[55px] -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Age Dropdown */}
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
            <div className="absolute right-6 top-[55px] -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* Output Mode Selector */}
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Visual Output Mode</label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setVideoEnabled(true)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${videoEnabled ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-white bg-white text-slate-500 grayscale hover:grayscale-0'}`}
            >
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
              <span className="font-bold text-sm">Video + Images</span>
              <span className="text-[10px] font-medium opacity-60">Full Multi-modal</span>
            </button>
            <button
              type="button"
              onClick={() => setVideoEnabled(false)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${!videoEnabled ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-white bg-white text-slate-500 grayscale hover:grayscale-0'}`}
            >
              <div className="p-3 bg-indigo-100 rounded-xl">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <span className="font-bold text-sm">Image Loop Only</span>
              <span className="text-[10px] font-medium opacity-60">Standard mode</span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="w-full max-w-2xl mx-auto py-6 rounded-[2rem] bg-blue-600 text-white font-black text-2xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-100 hover:-translate-y-1 active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Creating your canvas...</span>
            </>
          ) : (
            <>
              <span>Generate Mastery Canvas</span>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
