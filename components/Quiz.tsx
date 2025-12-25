
import React, { useState } from 'react';
import { QuizQuestion, QuizResult } from '../types';

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (result: QuizResult) => void;
}

export const Quiz: React.FC<QuizProps> = ({ questions, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QuizResult['answers']>([]);

  const currentQuestion = questions[currentIndex];

  const handleNext = () => {
    if (selectedOption) {
      const isCorrect = selectedOption === currentQuestion.correctAnswer;
      const newAnswers = [
        ...answers,
        {
          question: currentQuestion.question,
          userAnswer: selectedOption,
          correctAnswer: currentQuestion.correctAnswer,
          isCorrect,
        },
      ];
      
      setAnswers(newAnswers);
      setSelectedOption(null);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        const score = newAnswers.filter(a => a.isCorrect).length;
        onComplete({
          score,
          total: questions.length,
          answers: newAnswers,
        });
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-indigo-600 tracking-wider uppercase">Question {currentIndex + 1} of {questions.length}</span>
          <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 leading-snug">{currentQuestion.question}</h3>
      </div>

      <div className="space-y-4 mb-8">
        {currentQuestion.options.map((option, i) => (
          <button
            key={i}
            onClick={() => setSelectedOption(option)}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between ${
              selectedOption === option
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md'
                : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <span className="font-medium text-lg">{option}</span>
            {selectedOption === option && (
              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={!selectedOption}
        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
          selectedOption ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
      </button>
    </div>
  );
};
