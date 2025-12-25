
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types.ts";

/**
 * Guardrail: Pre-validates the topic to ensure it is safe, educational, and non-controversial.
 */
export async function validateTopicSafety(topic: string, subject: string, ageGroup: number): Promise<{ isSafe: boolean; reason?: string }> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Evaluate if the following topic is appropriate for an educational AI tutor for a ${ageGroup}-year-old.
      
      Topic: "${topic}"
      Subject Area: ${subject}
      
      STRICT PROHIBITION CRITERIA:
      1. No partisan politics or polarizing current political figures.
      2. No adult content, sexual themes, or mature/NSFW topics.
      3. No glorification of violence, crime, or illegal substances.
      4. No hate speech, discrimination, or dehumanizing language.
      5. No sensitive religious controversy or polarizing social issues.
      6. No medical advice or mental health diagnostic requests.
      
      The goal is to keep the platform strictly focused on academic or constructive hobby learning.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafe: { type: Type.BOOLEAN },
            reason: { type: Type.STRING, description: "A friendly explanation if the topic is unsafe." }
          },
          required: ["isSafe"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"isSafe": true}');
    return result;
  } catch (error) {
    console.error("Safety Check Error:", error);
    return { isSafe: true }; // Fallback to true if check fails, secondary guards are in the prompts
  }
}

const SAFETY_DIRECTIVE = `
CRITICAL SAFETY & NEUTRALITY DIRECTIVE:
- You are a neutral, objective, and safe educational assistant.
- Do not express opinions on controversial social or political issues.
- Use strictly age-appropriate language.
- If a topic is scientific, stick to consensus-based facts.
- If a topic is historical, provide a balanced, objective overview without bias.
- Absolutely no harmful, violent, or adult themes.
`;

/**
 * Prompt 1: Generates a high-quality educational tutorial with strict safety guardrails.
 */
export async function generateTutorial(topic: string, subject: string, ageGroup: number): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${SAFETY_DIRECTIVE}
      
      You are an expert ${subject} tutor teaching a ${ageGroup}-year-old. Provide a clear, structured, and engaging tutorial on the specific topic: "${topic}". 
      
      Since this is a ${subject} lesson, ensure your language and examples are field-specific.
      Adjust your tone, complexity, and analogies to be perfectly suited for a ${ageGroup}-year-old learner.
      Use clean Markdown.`,
    });

    if (!response.text) {
      throw new Error("The AI returned an empty response for the tutorial.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Tutorial Generation Error:", error);
    throw new Error(error.message || "Failed to generate lesson content.");
  }
}

/**
 * Prompt 2: Generates a 10-second educational video with strict safety guardrails.
 */
export async function generateVideo(topic: string, subject: string, ageGroup: number): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const visualStyle = ageGroup < 10 
    ? "friendly, bright, 3D animated, cartoon-style, clear character-led storytelling" 
    : "sophisticated, cinematic 3D renders, professional scientific visualization style, informative and technical";

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `STRICTLY SAFE EDUCATIONAL CONTENT. A 10-second ${visualStyle} educational animation for a ${subject} lesson visualizing ${topic} for a ${ageGroup}-year-old. No violence, no sensitive themes, focus on academic clarity.`,
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
    return null;
  }
}

/**
 * Generates three images using the nano banana model with strict safety context.
 */
export async function generateImages(topic: string, subject: string, ageGroup: number): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompts = [
    `A safe, academic, educational ${subject} illustration of ${topic} for a ${ageGroup} year old child. No controversial or harmful visuals.`,
    `A detailed scientific diagram or conceptual map of ${topic} for ${ageGroup} year olds. Professional and objective.`,
    `A 3D render of ${topic} for school students aged ${ageGroup}. Clean, bright, and strictly educational.`
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
 * Prompt 3: Generates a mastery quiz with strict safety guardrails.
 */
export async function generateQuiz(topic: string, subject: string, ageGroup: number): Promise<QuizQuestion[]> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${SAFETY_DIRECTIVE}
      
      Generate a 5-question multiple choice quiz to test mastery of "${topic}" in ${subject} for a ${ageGroup}-year-old. 
      Ensure all questions and distractors are safe, objective, and purely educational.`,
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
