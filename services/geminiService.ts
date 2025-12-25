
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types.ts";

/**
 * Prompt 1: Generates a high-quality educational tutorial tailored to a specific age and subject.
 */
export async function generateTutorial(topic: string, subject: string, ageGroup: number): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert ${subject} tutor teaching a ${ageGroup}-year-old. Provide a clear, structured, and engaging tutorial on the specific topic: "${topic}". 
      
      Since this is a ${subject} lesson, ensure your language and examples are field-specific.
      Adjust your tone, complexity, and analogies to be perfectly suited for a ${ageGroup}-year-old learner. 
      - For younger children, use simple words and fun storytelling.
      - For older teens, use more technical terms and real-world applications.
      
      Use bullet points for key concepts and keep it under 400 words. Format using clean Markdown.`,
    });

    if (!response.text) {
      throw new Error("The AI returned an empty response for the tutorial.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Tutorial Generation Error:", error);
    throw new Error(error.message || "Failed to generate lesson content. Please check your connection.");
  }
}

/**
 * Prompt 2: Generates a 10-second educational video using Veo with age and subject-appropriate visuals.
 */
export async function generateVideo(topic: string, subject: string, ageGroup: number): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const visualStyle = ageGroup < 10 
    ? "friendly, bright, 3D animated, cartoon-style, clear character-led storytelling" 
    : "sophisticated, cinematic 3D renders, professional scientific visualization style, informative and technical";

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `A 10-second ${visualStyle} educational animation for a ${subject} lesson visualizing ${topic} for a ${ageGroup}-year-old audience. High-quality visuals, bright lighting, focus on subject-specific accuracy and engagement.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    let attempts = 0;
    while (!operation.done && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      const pollAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
      operation = await pollAi.operations.getVideosOperation({ operation: operation });
      attempts++;
    }

    if (!operation.done) return null;

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;

    return `${downloadLink}&key=${process.env.API_KEY}`;
  } catch (error: any) {
    const errorString = JSON.stringify(error);
    if (errorString.includes("Requested entity was not found")) {
      throw new Error("MODEL_NOT_AVAILABLE");
    }
    return null;
  }
}

/**
 * Generates three images using the nano banana model with subject context.
 */
export async function generateImages(topic: string, subject: string, ageGroup: number): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompts = [
    `An educational ${subject} illustration of ${topic} for a ${ageGroup} year old, clear and high contrast.`,
    `A detailed ${subject} diagram or conceptual map of ${topic} suitable for ${ageGroup} year olds.`,
    `A 3D render or artistic depiction of ${topic} within the context of ${subject} to engage a ${ageGroup} year old student.`
  ];

  try {
    const imagePromises = prompts.map(prompt => 
      ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      })
    );

    const results = await Promise.all(imagePromises);
    const urls: string[] = [];

    for (const res of results) {
      const part = res.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        urls.push(`data:image/png;base64,${part.inlineData.data}`);
      }
    }

    return urls;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return [];
  }
}

/**
 * Prompt 3: Generates a 5-question mastery quiz tailored to the age and subject.
 */
export async function generateQuiz(topic: string, subject: string, ageGroup: number): Promise<QuizQuestion[]> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a 5-question multiple choice quiz to test mastery of "${topic}" within the field of ${subject} for a ${ageGroup}-year-old. 
      The difficulty of the questions, the subject-specific terminology, and the language used should be calibrated specifically for someone who is ${ageGroup} years old.`,
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

    const text = response.text;
    if (!text) return [];

    const cleanJson = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    return [];
  }
}
