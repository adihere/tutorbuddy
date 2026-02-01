
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

// Helper to sanitize error messages for the UI
function handleGenAIError(err: any): never {
  console.error("Gemini API Error:", err);
  const msg = err.message || '';
  
  if (msg.includes('429') || msg.includes('quota')) {
    throw new Error("We're experiencing high traffic. Please try again in a minute.");
  }
  if (msg.includes('503') || msg.includes('overloaded')) {
    throw new Error("TutorBuddy is currently overloaded. Please try again shortly.");
  }
  if (msg.includes('SAFETY') || msg.includes('blocked')) {
    throw new Error("The content could not be generated due to safety guidelines.");
  }
  
  throw new Error("Connection failed. Please check your internet or try again.");
}

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
  } catch (err: any) {
    // If it's a strict blocking error, respect it.
    if (err.message?.includes('SAFETY')) {
       return { isSafe: false, reason: "Safety filters blocked this topic." };
    }
    // Fail open for connectivity issues to allow the robust main generation to handle it, 
    // but log the check failure.
    console.warn("Safety check network bypass:", err);
    return { isSafe: true };
  }
}

export async function generateTutorial(topic: string, subject: string, ageGroup: number, contextImage?: string): Promise<string> {
  try {
    const ai = getAI();
    const promptParts: any[] = [
      { text: `${SAFETY_DIRECTIVE} Expert ${subject} tutor for age ${ageGroup} on "${topic}".` },
      { text: `
        CRITICAL FORMATTING INSTRUCTIONS for SUPERIOR READABILITY:
        - Use clear, descriptive Markdown headers (## and ###).
        - Keep paragraphs short (3-4 sentences maximum).
        - Use bullet points or numbered lists frequently to break up text.
        - Add a "Concept Spotlight" blockquote for the most important part.
        - Use bold text for essential terminology.
        - Ensure a smooth flow from "What is it?" to "Why does it matter?"
      ` }
    ];

    if (contextImage) {
      promptParts.push({ text: "CONTEXT: Prioritize concepts shown in the attached schoolwork image to align with current curriculum focus." });
      promptParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: contextImage.split(',')[1]
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: promptParts },
    });
    
    if (!response.text) throw new Error("Empty response generated.");
    return response.text;
  } catch (err) {
    handleGenAIError(err);
  }
}

export async function askBuddy(history: {role: 'user' | 'model', text: string}[], userMessage: string, topic: string, subject: string, ageGroup: number): Promise<string> {
  try {
    const ai = getAI();
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `${SAFETY_DIRECTIVE} You are Buddy, a wise and encouraging tutor for a ${ageGroup}-year-old. Socratic method: guide, don't just tell.`
      }
    });
    const response = await chat.sendMessage({ message: userMessage });
    return response.text || "I'm having trouble thinking right now. Ask me again?";
  } catch (err) {
    console.error("Chat error", err);
    return "Connection issue. Please try again.";
  }
}

async function generateDialogueText(tutorialText: string, topic: string, ageGroup: number): Promise<string> {
  const ai = getAI();
  const prompt = `Convert this lesson about "${topic}" into a short, emotional dialogue between 'Buddy' (Tutor) and 'Sam' (Student). Focus on the core wonder. Content: ${tutorialText.slice(0, 1000)}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  return response.text || "";
}

export async function generateSpeech(tutorialText: string, topic: string, ageGroup: number): Promise<string | null> {
  try {
    const ai = getAI();
    const dialogue = await generateDialogueText(tutorialText, topic, ageGroup);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `TTS conversation:\n${dialogue}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { speaker: 'Buddy', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
              { speaker: 'Sam', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
            ]
          }
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (err) {
    console.error("Speech Generation Error:", err);
    return null;
  }
}

export async function generateImages(topic: string, subject: string, ageGroup: number): Promise<string[]> {
  const ai = getAI();
  const prompts = [
    `Detailed educational illustration of ${topic} (${subject}), age ${ageGroup}.`,
    `Scientific conceptual visualization of ${topic}.`,
    `Informative diagram of ${topic} for students.`,
    `Atmospheric scene depicting ${topic}.`,
    `Core component of ${topic} explained visually.`
  ];

  try {
    const results = await Promise.all(prompts.map(prompt => 
      ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      })
    ));
    const images = results
      .map(res => res.candidates?.[0]?.content?.parts.find(p => p.inlineData))
      .filter((p): p is any => !!p)
      .map(p => `data:image/png;base64,${p.inlineData.data}`);
      
    if (images.length === 0) throw new Error("No images generated");
    return images;
  } catch (err) {
    console.error("Image Gen Error:", err);
    throw err; // Propagate to let UI handle "ERROR" state
  }
}

export async function generateQuiz(topic: string, subject: string, ageGroup: number, contextImage?: string): Promise<QuizQuestion[]> {
  try {
    const ai = getAI();
    const promptParts: any[] = [{ text: `Generate 5 friendly MCQ questions for "${topic}" (${subject}) age ${ageGroup}. Include explanations.` }];
    if (contextImage) {
      promptParts.push({ inlineData: { mimeType: 'image/jpeg', data: contextImage.split(',')[1] } });
    }
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: promptParts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });
    const data = JSON.parse(response.text || '[]');
    if (!Array.isArray(data) || data.length === 0) throw new Error("Invalid quiz data");
    return data;
  } catch (err) {
    console.error("Quiz Gen Error:", err);
    throw err;
  }
}

export async function generateFunFacts(topic: string, subject: string, ageGroup: number): Promise<string[]> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 3-5 mind-blowing short facts about "${topic}" for age ${ageGroup}. JSON array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    const data = JSON.parse(response.text || '[]');
    if (!Array.isArray(data) || data.length === 0) throw new Error("Invalid facts data");
    return data;
  } catch (err) {
     console.error("Facts Gen Error:", err);
     throw err;
  }
}

export async function generateParentReport(topic: string, subject: string, ageGroup: number): Promise<ParentReport | null> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a parent report for ${topic} (${subject}), age ${ageGroup}. JSON format.`,
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
  } catch (err) {
    console.error("Report Gen Error:", err);
    throw err;
  }
}
