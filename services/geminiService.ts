
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types.ts";

/**
 * Prompt 1: Generates a high-quality educational tutorial tailored to a specific age.
 */
export async function generateTutorial(topic: string, ageGroup: number): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are an expert tutor teaching a ${ageGroup}-year-old. Provide a clear, structured, and engaging tutorial on the topic: "${topic}". 
    
    Adjust your tone, complexity, and analogies to be perfectly suited for a ${ageGroup}-year-old learner. 
    - For younger children, use simple words and fun storytelling.
    - For older teens, use more technical terms and real-world applications.
    
    Use bullet points for key concepts and keep it under 400 words. Format using clean Markdown.`,
  });
  return response.text || "Tutorial generation failed.";
}

/**
 * Prompt 2: Generates a 10-second educational video using Veo with age-appropriate visuals.
 */
export async function generateVideo(topic: string, ageGroup: number): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const visualStyle = ageGroup < 10 
    ? "friendly, bright, 3D animated, cartoon-style, clear character-led storytelling" 
    : "sophisticated, cinematic 3D renders, professional scientific visualization style, informative and technical";

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `A 10-second ${visualStyle} educational animation visualizing ${topic} for a ${ageGroup}-year-old audience. High-quality visuals, bright lighting, focus on clarity and engagement.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 8000));
      const pollAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
      operation = await pollAi.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;

    return `${downloadLink}&key=${process.env.API_KEY}`;
  } catch (error: any) {
    const errorString = JSON.stringify(error);
    console.error("Video Generation Detailed Error:", errorString);
    
    if (errorString.includes("Requested entity was not found") || error.message?.includes("Requested entity was not found")) {
      throw new Error("MODEL_NOT_AVAILABLE");
    }
    return null;
  }
}

/**
 * Prompt 3: Generates a 5-question mastery quiz tailored to the age group.
 */
export async function generateQuiz(topic: string, ageGroup: number): Promise<QuizQuestion[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a 5-question multiple choice quiz to test mastery of "${topic}" for a ${ageGroup}-year-old. 
    The difficulty of the questions and the language used should be calibrated specifically for someone who is ${ageGroup} years old.`,
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
