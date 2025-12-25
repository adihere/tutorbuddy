
import React from 'react';
import { ParentReport, QuizResult } from '../types';

interface ParentReportViewProps {
  report: ParentReport;
  quizResult: QuizResult;
}

export const ParentReportView: React.FC<ParentReportViewProps> = ({ report, quizResult }) => {
  const percentage = Math.round((quizResult.score / quizResult.total) * 100);

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
        <div className="gradient-bg p-10 text-white text-center">
          <h2 className="text-3xl font-bold mb-2">Learning Session Complete! 🎊</h2>
          <p className="opacity-90">Great job today. Here's how the learner performed.</p>
        </div>

        <div className="p-10">
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            <div className="bg-indigo-50 p-6 rounded-2xl text-center border border-indigo-100">
              <span className="block text-gray-500 text-sm font-semibold uppercase tracking-wide mb-1">Final Score</span>
              <span className="text-4xl font-black text-indigo-600">{quizResult.score}/{quizResult.total}</span>
            </div>
            <div className="bg-green-50 p-6 rounded-2xl text-center border border-green-100">
              <span className="block text-gray-500 text-sm font-semibold uppercase tracking-wide mb-1">Percentage</span>
              <span className="text-4xl font-black text-green-600">{percentage}%</span>
            </div>
            <div className="bg-purple-50 p-6 rounded-2xl text-center border border-purple-100">
              <span className="block text-gray-500 text-sm font-semibold uppercase tracking-wide mb-1">Level Up</span>
              <span className="text-4xl font-black text-purple-600">Master</span>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Session Summary
              </h3>
              <p className="text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-100">
                {report.summary}
              </p>
            </section>

            <div className="grid md:grid-cols-2 gap-8">
              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
                  Highlights
                </h3>
                <ul className="space-y-3">
                  {report.highlights.map((h, i) => (
                    <li key={i} className="flex gap-3 items-start bg-yellow-50 p-4 rounded-xl text-yellow-900 text-sm border border-yellow-100">
                      <span className="text-yellow-400 font-bold">✨</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Next Steps
                </h3>
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-sm text-blue-900 leading-relaxed">
                  {report.recommendations}
                </div>
              </section>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <button 
              onClick={() => window.print()} 
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print Report for Guardian
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
