
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

// Added funFacts to resolve Property 'funFacts' does not exist errors
export interface LearningContent {
  explanation: string;
  videoUrl: string | null;
  quizQuestions: QuizQuestion[];
  topic: string;
  funFacts: string[];
}

// Added ParentReport interface to resolve Module has no exported member errors
export interface ParentReport {
  summary: string;
  highlights: string[];
  recommendations: string;
}

export interface QuizResult {
  score: number;
  total: number;
}

export type AppState = 'IDLE' | 'PROCESSING' | 'RESULT' | 'ERROR';
