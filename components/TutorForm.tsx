
import React, { useState } from 'react';

interface TutorFormProps {
  onSubmit: (topic: string, ageGroup: number) => void;
  isLoading: boolean;
}

export const TutorForm: React.FC<TutorFormProps> = ({ onSubmit, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [ageGroup, setAgeGroup] = useState<number>(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) {
      onSubmit(topic, ageGroup);
    }
  };

  const ages = Array.from({ length: 13 }, (_, i) => i + 5); // 5 to 17

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-fadeIn">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Personalized Learning</h2>
        <p className="text-slate-500 text-lg">Tell us your topic and age, and we'll tailor the perfect lesson for you.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow relative">
            <input
              type="text"
              className="w-full px-8 py-6 rounded-[2rem] border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-xl shadow-sm"
              placeholder="e.g., Quantum Physics or Dinosaurs"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="md:w-48 relative">
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(parseInt(e.target.value))}
              disabled={isLoading}
              className="w-full h-full px-6 py-6 rounded-[2rem] border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-xl shadow-sm appearance-none bg-white cursor-pointer"
            >
              {ages.map(age => (
                <option key={age} value={age}>Age {age}</option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="w-full py-6 rounded-[2rem] bg-blue-600 text-white font-black text-2xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-100 hover:-translate-y-1 active:scale-[0.98]"
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
