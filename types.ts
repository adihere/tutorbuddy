
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export type OutputMode = 'TEXT' | 'TEXT_AUDIO' | 'TEXT_AUDIO_IMAGES' | 'ALL';

export type Loadable<T> = T | 'LOADING' | 'ERROR';

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface LearningContent {
  explanation: string;
  groundingSource?: GroundingChunk[]; 
  images: Loadable<string[]>;
  diagram: Loadable<string>; 
  quizQuestions: Loadable<QuizQuestion[]>;
  topic: string;
  subject: string;
  funFacts: Loadable<string[]>;
  parentReport: Loadable<ParentReport>;
  outputMode: OutputMode;
  ageGroup: number;
  contextImage?: string;
  deepDiveSuggestions?: string[]; // New
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

export interface HistoryItem {
  id: string;
  timestamp: number;
  topic: string;
  subject: string;
  content: LearningContent;
}

export type AppState = 'IDLE' | 'PROCESSING' | 'RESULT' | 'ERROR' | 'ABOUT';
