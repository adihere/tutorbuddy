
import React from 'react';
import { LearningContent } from '../types.ts';

interface ContentDisplayProps {
  content: LearningContent;
  relatedImages: string[];
  isImagesLoading: boolean;
  onNext: () => void;
}

export const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, relatedImages, isImagesLoading, onNext }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fadeIn pb-20">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Main Lesson Content */}
        <div className="flex-1 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-10 lg:p-12 shadow-xl border border-gray-50 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">The Lesson</h3>
            </div>

            <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed text-lg space-y-6">
              {content.explanation.split('\n').filter(p => p.trim()).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* Fun Facts */}
          <div className="bg-teal-50 rounded-[2rem] p-8 border border-teal-100">
            <h4 className="text-xl font-bold text-teal-900 mb-4 flex items-center gap-2">
               <span className="p-1.5 bg-teal-200 rounded-lg text-teal-700">💡</span>
               Fast Facts
            </h4>
            <ul className="space-y-4">
              {content.funFacts.map((fact, i) => (
                <li key={i} className="flex gap-3 text-teal-800 items-start">
                  <span className="text-teal-400 font-bold">•</span>
                  <span className="leading-tight">{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar: Visual Aids */}
        <div className="lg:w-80 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
            <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
               <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">🖼️</span>
               Visual Aids
            </h4>
            
            <div className="space-y-4">
              {isImagesLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="aspect-square bg-gray-100 animate-pulse rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
                      Generating visual...
                    </div>
                  ))}
                </div>
              )}
              
              {!isImagesLoading && relatedImages.map((img, i) => (
                <div key={i} className="group relative rounded-2xl overflow-hidden shadow-md border-2 border-white ring-1 ring-gray-100 transition-transform hover:scale-105">
                  <img src={img} alt="Educational visual" className="w-full h-auto" />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onNext}
            className="w-full py-5 gradient-bg text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-indigo-200 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
          >
            Start Quiz
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
