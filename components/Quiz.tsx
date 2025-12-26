import React, { useState } from 'react';
import { QuizQuestion, QuizResult } from '../types';

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (result: QuizResult) => void;
}

export const Quiz: React.FC<QuizProps> = ({ questions, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [shake, setShake] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleCheck = () => {
    if (!selectedOption || isAnswered) return;
    
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(s => s + 1);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    setIsAnswered(true);
  };

  const handleNext = () => {
    setIsAnswered(false);
    setSelectedOption(null);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
      onComplete({ score, total: questions.length });
    }
  };

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="text-center py-8 animate-fadeIn">
        <div className="relative inline-block mb-6">
          <div className="text-7xl animate-bounce">
            {percentage >= 80 ? '🏆' : percentage >= 50 ? '🥈' : '📚'}
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg">
            {score}/{questions.length}
          </div>
        </div>
        <h4 className="text-3xl font-black text-slate-900 mb-2">Quiz Complete!</h4>
        <p className="text-slate-500 text-lg mb-8">
          {percentage >= 80 
            ? "Excellent! You've mastered this topic." 
            : percentage >= 50 
              ? "Good job! You're getting there." 
              : "Keep studying! Practice makes perfect."}
        </p>
        
        <div className="relative w-full bg-slate-100 h-6 rounded-full overflow-hidden mb-10 border-2 border-slate-50 shadow-inner">
          <div 
            className={`h-full transition-all duration-1000 ease-out flex items-center justify-end px-4 ${
              percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${percentage}%` }}
          >
            <span className="text-[10px] font-black text-white">{percentage}%</span>
          </div>
        </div>

        <button 
          onClick={() => {
            setCurrentIndex(0);
            setScore(0);
            setIsFinished(false);
            setSelectedOption(null);
            setIsAnswered(false);
          }}
          className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-slate-800 transition-all shadow-xl hover:-translate-y-1 active:scale-95"
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className={`animate-fadeIn transition-transform duration-500 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        @keyframes success-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Level {currentIndex + 1}</span>
            <span className="text-2xl font-black text-slate-900">Mastery Check</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400">Progress</span>
            <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden mt-1 border border-slate-50 shadow-inner">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <h3 className="text-xl font-bold text-slate-800 leading-snug">{currentQuestion.question}</h3>
        </div>
      </div>

      <div className="space-y-3 mb-10">
        {currentQuestion.options.map((option, i) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === currentQuestion.correctAnswer;
          
          let stateStyles = 'border-white bg-white hover:border-emerald-200 hover:bg-emerald-50/30 text-slate-700';
          if (isAnswered) {
            if (isCorrect) {
              stateStyles = 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md ring-2 ring-emerald-500/20 animate-[success-pop_0.5s_ease-out]';
            } else if (isSelected) {
              stateStyles = 'border-rose-500 bg-rose-50 text-rose-900 shadow-md ring-2 ring-rose-500/20';
            } else {
              stateStyles = 'border-slate-100 bg-white text-slate-400 opacity-60';
            }
          } else if (isSelected) {
            stateStyles = 'border-blue-600 bg-blue-50 text-blue-900 shadow-md ring-2 ring-blue-500/10';
          }

          return (
            <button
              key={i}
              disabled={isAnswered}
              onClick={() => setSelectedOption(option)}
              className={`w-full text-left p-5 rounded-3xl border-2 transition-all duration-200 flex items-center justify-between group ${stateStyles}`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black transition-colors ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                } ${isAnswered && isCorrect ? 'bg-emerald-500 text-white' : ''} ${isAnswered && isSelected && !isCorrect ? 'bg-rose-500 text-white' : ''}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="font-bold text-lg">{option}</span>
              </div>
              
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected || (isAnswered && isCorrect)
                  ? 'scale-110 shadow-lg' 
                  : 'border-slate-100 group-hover:border-emerald-200'
              }`}>
                {isAnswered ? (
                  isCorrect ? (
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                  ) : isSelected ? (
                    <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : null
                ) : isSelected ? (
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-4">
        {!isAnswered ? (
          <button
            onClick={handleCheck}
            disabled={!selectedOption}
            className={`w-full py-5 rounded-[2rem] font-black text-xl shadow-xl transition-all flex items-center justify-center gap-3 ${
              selectedOption 
              ? 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'
            }`}
          >
            <span>Verify Answer</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4" /></svg>
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-slate-800 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 animate-fadeIn"
          >
            <span>{currentIndex === questions.length - 1 ? 'Finish & Review' : 'Next Challenge'}</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        )}
      </div>
    </div>
  );
};