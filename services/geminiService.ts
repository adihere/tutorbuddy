import { GoogleGenAI, Type, Modality } from "@google/genai";
import { QuizQuestion, ParentReport } from "../types.ts";

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
      model: 'gemini-2.5-flash-lite-latest',
      contents: `Evaluate safety for topic "${topic}" (Subject: ${subject}, Age: ${ageGroup}). No politics/adult themes. Return JSON with isSafe (bool) and reason (string).`,
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
    model: 'gemini-2.5-flash-lite-latest',
    contents: `
      ${SAFETY_DIRECTIVE}
      Expert ${subject} tutor for age ${ageGroup} on "${topic}".
      
      CRITICAL FORMATTING INSTRUCTIONS for SUPERIOR READABILITY:
      - Use clear, descriptive Markdown headers (## and ###).
      - Keep paragraphs short (3-4 sentences maximum).
      - Use bullet points or numbered lists frequently to break up text.
      - Add a "Concept Spotlight" blockquote for the most important part.
      - Use bold text for essential terminology.
      - Ensure a smooth flow from "What is it?" to "Why does it matter?"
    `,
  });
  return response.text || "";
}

async function generateDialogueText(tutorialText: string, topic: string, ageGroup: number): Promise<string> {
  const ai = getAI();
  const prompt = `
    Transform the following tutorial about "${topic}" for a ${ageGroup}-year-old into a short, high-energy, and emotional educational dialogue between two characters.
    
    Characters:
    - Buddy: A wise, encouraging, and enthusiastic tutor.
    - Sam: A curious, energetic student who asks insightful questions.
    
    Guidelines:
    - Use expressive markers for emotions (e.g., "(Sam, with wide eyes)", "(Buddy, chuckling warmly)", "(Sam, gasping in surprise)").
    - Focus on the coolest part of the lesson.
    - Keep it under 200 words.
    
    Tutorial Content: ${tutorialText.slice(0, 1500)}
    
    Output Format:
    Buddy: (enthusiastically) [Text]
    Sam: (curiously) [Text]
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite-latest',
    contents: prompt,
  });

  return response.text || "";
}

export async function generateSpeech(tutorialText: string, topic: string, ageGroup: number): Promise<string | null> {
  try {
    const ai = getAI();
    const dialogue = await generateDialogueText(tutorialText, topic, ageGroup);
    
    const ttsPrompt = `TTS the following conversation between Buddy and Sam with natural emotional expression and perfect educational pacing:
    ${dialogue}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: ttsPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Buddy',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
              },
              {
                speaker: 'Sam',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
              }
            ]
          }
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (err) {
    console.error("Multi-Speaker TTS Error:", err);
    return null;
  }
}

export async function generateImages(topic: string, subject: string, ageGroup: number): Promise<string[]> {
  const ai = getAI();
  const prompts = [
    `Educational illustration of ${topic} for ${subject}, age ${ageGroup}. High detail, pedagogical style.`,
    `Conceptual 3D visualization explaining the core principle of ${topic}.`,
    `Detailed scientific or historical diagram for ${topic}.`,
    `Atmospheric cinematic scene showing ${topic} in action or its impact.`,
    `Infographic-style visual summary of ${topic} key components.`
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
  } catch (err) {
    console.error("Image generation failed:", err);
    return [];
  }
}

export async function generateQuiz(topic: string, subject: string, ageGroup: number): Promise<QuizQuestion[]> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest',
      contents: `${SAFETY_DIRECTIVE} Generate 5 MCQ questions for "${topic}" (${subject}) for age ${ageGroup}. Include 4 options and 1 correctAnswer.`,
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
      model: 'gemini-2.5-flash-lite-latest',
      contents: `${SAFETY_DIRECTIVE} Generate 3-5 unique, mind-blowing fun facts about "${topic}" in the context of ${subject} for a ${ageGroup}-year-old. Keep facts under 20 words each.`,
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
      model: 'gemini-2.5-flash-lite-latest',
      contents: `You are an educational consultant for parents. Topic: "${topic}" (${subject}) for a ${ageGroup}-year-old. 
      Generate a professional report:
      1. Summary: Educational value.
      2. Highlights: 3 key focus areas.
      3. Recommendations: How to support learning at home.`,
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