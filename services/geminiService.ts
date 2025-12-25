
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types.ts";

/**
 * Prompt 1: Generates a high-quality educational tutorial.
 */
export async function generateTutorial(topic: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are an expert tutor. Provide a clear, structured, and engaging tutorial on the topic: "${topic}". Use bullet points for key concepts and keep it under 400 words.`,
  });
  return response.text || "Tutorial generation failed.";
}

/**
 * Prompt 2: Generates a 10-second educational video using Veo.
 * Includes specific handling for the 404 'Requested entity was not found' error.
 */
export async function generateVideo(topic: string): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `A 10-second cinematic educational animation visualizing ${topic}. High-quality 3D renders, professional scientific visualization style, clear and informative visuals, bright studio lighting.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 8000));
      // Always create a fresh instance if polling takes long to ensure key is valid
      const pollAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
      operation = await pollAi.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;

    return `${downloadLink}&key=${process.env.API_KEY}`;
  } catch (error: any) {
    const errorString = JSON.stringify(error);
    console.error("Video Generation Detailed Error:", errorString);
    
    // Explicitly check for the 404 model/entity not found error
    if (errorString.includes("Requested entity was not found") || error.message?.includes("Requested entity was not found")) {
      throw new Error("MODEL_NOT_AVAILABLE");
    }
    return null;
  }
}

/**
 * Prompt 3: Generates a 5-question mastery quiz in JSON format.
 */
export async function generateQuiz(topic: string): Promise<QuizQuestion[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a 5-question multiple choice quiz to test mastery of "${topic}".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch {
    return [];
  }
}
