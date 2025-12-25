
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { LearningContent, QuizQuestion, ParentReport, QuizResult } from "../types";

/**
 * Orchestrates the tutoring session by analyzing a topic and optional images.
 * Uses gemini-3-pro-preview for complex reasoning tasks.
 */
export async function orchestrateTutor(topic: string, base64Images: string[]): Promise<LearningContent> {
  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [{ text: `Topic: ${topic}` }];
  
  base64Images.forEach(img => {
    parts.push({
      inlineData: {
        data: img.split(',')[1],
        mimeType: 'image/jpeg'
      }
    });
  });

  const prompt = `You are a world-class educational tutor. Analyze the provided topic and images. 
  Generate:
  1. A clear, engaging explanation (Byte) suitable for a 12-year-old.
  2. 3-5 fun facts that relate the topic to the real world.
  3. A short video script (30-60s) describing the core concept visually.
  4. 5 multiple-choice quiz questions.
  
  Format the response as a JSON object matching this structure:
  {
    "explanation": "string",
    "funFacts": ["string"],
    "videoScript": "string",
    "quizQuestions": [
      { "question": "string", "options": ["string"], "correctAnswer": "string" }
    ]
  }`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [...parts, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          funFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
          videoScript: { type: Type.STRING },
          quizQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING }
              }
            }
          }
        },
        required: ["explanation", "funFacts", "videoScript", "quizQuestions"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

/**
 * Validates educational content for factual accuracy and age-appropriateness.
 */
export async function validateContent(content: LearningContent): Promise<LearningContent> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Act as a content validator for children's educational material. 
  Review the following content for factual accuracy and age-appropriateness. 
  If anything is incorrect, fix it. If it is fine, return it as is.
  
  Content: ${JSON.stringify(content)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || JSON.stringify(content));
}

/**
 * Generates an educational animation using Veo model.
 * Note: Requires a selected paid API key.
 */
export async function generateVideo(script: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use veo-3.1-fast-generate-preview for video generation
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `An educational animation based on this script: ${script}. Bright, friendly, clean 2D animation style.`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  // Append API key for downloading video bytes
  const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * Generates a report for parents based on student performance.
 */
export async function generateParentReport(content: LearningContent, quizResult: QuizResult): Promise<ParentReport> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `You are a parent-facing reporting agent. Summarize the student's learning session on the topic: ${content.explanation.substring(0, 50)}...
  Quiz Score: ${quizResult.score}/${quizResult.total}.
  
  Create a report with:
  1. A friendly summary of what was learned.
  2. 3 key highlights of their progress.
  3. A performance note based on the score.
  4. Personalized recommendations for further practice.
  
  Return JSON:
  {
    "summary": "string",
    "highlights": ["string"],
    "performanceNote": "string",
    "recommendations": "string"
  }`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || '{}');
}
