
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface LearningContent {
  explanation: string;
  funFacts: string[];
  videoScript: string;
  quizQuestions: QuizQuestion[];
}

export interface QuizResult {
  score: number;
  total: number;
  answers: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

export interface ParentReport {
  summary: string;
  highlights: string[];
  recommendations: string;
  performanceNote: string;
}

export type AppState = 'IDLE' | 'PROCESSING' | 'LEARNING' | 'QUIZ' | 'REPORT' | 'ERROR';
