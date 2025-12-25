
import React, { useState } from 'react';
import { QuizQuestion, QuizResult } from '../types';

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (result: QuizResult) => void;
}

export const Quiz: React.FC<QuizProps> = ({ questions, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleNext = () => {
    if (selectedOption) {
      const isCorrect = selectedOption === currentQuestion.correctAnswer;
      if (isCorrect) setScore(s => s + 1);
      
      setSelectedOption(null);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsFinished(true);
        onComplete({ score: score + (isCorrect ? 1 : 0), total: questions.length });
      }
    }
  };

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="text-center py-8 animate-fadeIn">
        <div className="text-6xl mb-4">🎉</div>
        <h4 className="text-3xl font-black text-teal-900 mb-2">Quiz Complete!</h4>
        <p className="text-teal-700 text-xl mb-6">You scored {score} out of {questions.length}</p>
        <div className="w-full bg-teal-200 h-4 rounded-full overflow-hidden mb-8">
          <div className="bg-teal-600 h-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
        </div>
        <button 
          onClick={() => {
            setCurrentIndex(0);
            setScore(0);
            setIsFinished(false);
          }}
          className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-colors"
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-black text-teal-600 uppercase tracking-widest">Question {currentIndex + 1} / {questions.length}</span>
          <div className="h-1.5 w-24 bg-teal-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-600 transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-900 leading-snug">{currentQuestion.question}</h3>
      </div>

      <div className="space-y-3 mb-8">
        {currentQuestion.options.map((option, i) => (
          <button
            key={i}
            onClick={() => setSelectedOption(option)}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group ${
              selectedOption === option
                ? 'border-teal-600 bg-teal-100 text-teal-900 shadow-md'
                : 'border-white bg-white hover:border-teal-200 hover:bg-teal-50/50 text-slate-700'
            }`}
          >
            <span className="font-medium">{option}</span>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              selectedOption === option ? 'border-teal-600 bg-teal-600' : 'border-slate-200 group-hover:border-teal-300'
            }`}>
               {selectedOption === option && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={!selectedOption}
        className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${
          selectedOption ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        {currentIndex === questions.length - 1 ? 'Show Results' : 'Next Question'}
      </button>
    </div>
  );
};
