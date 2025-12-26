
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, ParentReport } from "./types.ts";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const SAFETY_DIRECTIVE = `
CRITICAL SAFETY & NEUTRALITY DIRECTIVE:
- You are a neutral, objective, and safe educational assistant.
- Do not express opinions on controversial social or political issues.
- Use strictly age-appropriate language.
- Stick to scientific consensus and balanced historical views.
- Absolutely no harmful or adult themes.
`;

export async function validateTopicSafety(topic: string, subject: string, ageGroup: number) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Evaluate safety for topic "${topic}" (Subject: ${subject}, Age: ${ageGroup}). No politics/adult themes.`,
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
  } catch {
    return { isSafe: true };
  }
}

export async function generateTutorial(topic: string, subject: string, ageGroup: number): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `${SAFETY_DIRECTIVE} Expert ${subject} tutor for age ${ageGroup} on "${topic}". Use Markdown.`,
  });
  return response.text || "";
}

export async function generateVideo(topic: string, subject: string, ageGroup: number): Promise<string | null> {
  const ai = getAI();
  const style = ageGroup < 10 ? "bright animation" : "cinematic 3D visualizer";

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Educational ${style} animation for ${subject}: ${topic}. Strictly safe for age ${ageGroup}. High quality.`,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });

    let attempts = 0;
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
    `Educational illustration of ${topic} for ${subject}, age ${ageGroup}.`,
    `Conceptual 3D visualization of ${topic}.`,
    `Scientific diagram explaining ${topic}.`
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
      contents: `${SAFETY_DIRECTIVE} Generate 5 MCQ questions for "${topic}" (${subject}) for age ${ageGroup}.`,
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

export async function generateParentReport(topic: string, subject: string, ageGroup: number): Promise<ParentReport | null> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an educational consultant for parents. Topic: "${topic}" (${subject}) for a ${ageGroup}-year-old. 
      Generate a professional, encouraging report for the parent.
      1. Summary: What was taught and its value.
      2. Highlights: 3 key cognitive or academic focus areas for this topic.
      3. Recommendations: How a parent can extend this learning at home.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.STRING }
          },
          required: ["summary", "highlights", "recommendations"]
        }
      }
    });
    return JSON.parse(response.text || 'null');
  } catch {
    return null;
  }
}
