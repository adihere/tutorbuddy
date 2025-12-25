
import React from 'react';
import { LearningContent } from '../types';

interface ContentDisplayProps {
  content: LearningContent;
  onNext: () => void;
}

export const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, onNext }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-indigo-50">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </span>
          The Big Picture (101 Explanation)
        </h3>
        <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed text-lg">
          {content.explanation}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-yellow-50 rounded-3xl p-8 border border-yellow-100">
          <h4 className="text-xl font-bold text-yellow-900 mb-4 flex items-center gap-2">
            💡 Fun Facts
          </h4>
          <ul className="space-y-4">
            {content.funFacts.map((fact, i) => (
              <li key={i} className="flex gap-3 text-yellow-800">
                <span className="text-yellow-400 font-bold">•</span>
                {fact}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100 flex flex-col justify-between">
          <div>
            <h4 className="text-xl font-bold text-blue-900 mb-4">Ready to test yourself?</h4>
            <p className="text-blue-800 mb-6">After reviewing the explanation and fun facts, you can take a short quiz to earn points!</p>
          </div>
          <button
            onClick={onNext}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            Go to Quiz
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
