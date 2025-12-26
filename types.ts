
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface LearningContent {
  explanation: string;
  videoUrl: string | null;
  images: string[] | null;
  quizQuestions: QuizQuestion[];
  topic: string;
  subject: string;
  funFacts: string[];
  parentReport: ParentReport | null;
}

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
