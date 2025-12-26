
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types.ts";

// Helper to initialize GenAI client - using process.env.API_KEY as required
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const SAFETY_DIRECTIVE = `
CRITICAL SAFETY & NEUTRALITY DIRECTIVE:
- You are a neutral, objective, and safe educational assistant.
- Do not express opinions on controversial social or political issues.
- Use strictly age-appropriate language.
- If a topic is scientific, stick to consensus-based facts.
- If a topic is historical, provide a balanced, objective overview without bias.
- Absolutely no harmful, violent, or adult themes.
`;

export async function validateTopicSafety(topic: string, subject: string, ageGroup: number) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Evaluate if the topic "${topic}" is safe for a ${ageGroup}-year-old learner in ${subject}.
      STRICT PROHIBITION: No politics, adult themes, violence, hate speech, or medical advice.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafe: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ["isSafe"]
        }
      }
    });

    return JSON.parse(response.text || '{"isSafe": true}');
  } catch (error) {
    console.warn("Safety check failed, falling back to permissive mode:", error);
    return { isSafe: true };
  }
}

export async function generateTutorial(topic: string, subject: string, ageGroup: number): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `${SAFETY_DIRECTIVE}
    You are an expert ${subject} tutor teaching a ${ageGroup}-year-old about "${topic}". 
    Use clear Markdown, professional analogies, and field-specific terminology adjusted for their age.`,
  });

  // Fixed: Use .text property instead of assuming it's always defined
  return response.text || "";
}

export async function generateVideo(topic: string, subject: string, ageGroup: number): Promise<string | null> {
  const ai = getAI();
  const style = ageGroup < 10 ? "bright, 3D animated, cartoonish" : "sophisticated cinematic 3D visualizer";

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Educational ${style} animation for ${subject}: ${topic}. For a ${ageGroup} year old. Strictly safe.`,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });

    let attempts = 0;
    // Increased attempts slightly for better reliability
    while (!operation.done && attempts < 15) {
      await new Promise(r => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
      attempts++;
    }

    const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
    return uri ? `${uri}&key=${process.env.API_KEY}` : null;
  } catch (err) {
    console.error("Veo Video Error:", err);
    return null;
  }
}

export async function generateImages(topic: string, subject: string, ageGroup: number): Promise<string[]> {
  const ai = getAI();
  const prompts = [
    `Safe educational ${subject} illustration: ${topic}. For age ${ageGroup}.`,
    `Scientific diagram of ${topic} for a ${ageGroup} year old student.`,
    `3D conceptual visualization of ${topic}, academic and clean.`
  ];

  try {
    const results = await Promise.all(prompts.map(prompt => 
      ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      })
    ));

    return results
      .map(res => res.candidates?.[0]?.content?.parts.find(p => p.inlineData))
      .filter((p): p is any => !!p)
      .map(p => `data:image/png;base64,${p.inlineData.data}`);
  } catch {
    return [];
  }
}

export async function generateQuiz(topic: string, subject: string, ageGroup: number): Promise<QuizQuestion[]> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${SAFETY_DIRECTIVE} Generate a 5-question multiple choice quiz for "${topic}" (${subject}) for age ${ageGroup}.`,
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

    return JSON.parse(response.text || '[]');
  } catch {
    return [];
  }
}

// Fixed: Added missing generateFunFacts function as imported by App.tsx
export async function generateFunFacts(topic: string, subject: string, ageGroup: number): Promise<string[]> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${SAFETY_DIRECTIVE} Generate 3-5 unique, mind-blowing fun facts about "${topic}" in the context of ${subject} for a ${ageGroup}-year-old. Keep each fact under 20 words.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch {
    return [];
  }
}
