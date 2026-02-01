
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export type OutputMode = 'TEXT' | 'TEXT_AUDIO' | 'TEXT_AUDIO_IMAGES' | 'ALL';

export interface LearningContent {
  explanation: string;
  images: string[] | null;
  quizQuestions: QuizQuestion[];
  topic: string;
  subject: string;
  funFacts: string[];
  parentReport: ParentReport | null;
  outputMode: OutputMode;
  ageGroup: number;
  contextImage?: string; // Base64 image of classwork
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

export type AppState = 'IDLE' | 'PROCESSING' | 'RESULT' | 'ERROR' | 'ABOUT';
