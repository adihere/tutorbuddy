
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { QuizQuestion, ParentReport, GroundingChunk } from "../types.ts";

const DEBUG = true;

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const SAFETY_DIRECTIVE = `
CRITICAL SAFETY & NEUTRALITY DIRECTIVE:
- You are a neutral, objective, and safe educational assistant.
- Do not express opinions on controversial social or political issues.
- Use strictly age-appropriate language.
- Stick to scientific consensus and balanced historical views.
- Absolutely no harmful or adult themes.
`;

function handleGenAIError(err: any): never {
  if (DEBUG) console.error("Gemini API Error (Raw):", err);
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
  if (DEBUG) console.log(`[GeminiService] validateTopicSafety: Checking "${topic}" (${subject}, Age: ${ageGroup})`);
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

    const result = JSON.parse(response.text || '{"isSafe": true}');
    if (DEBUG) console.log(`[GeminiService] validateTopicSafety Result:`, result);
    return result;
  } catch (err: any) {
    if (DEBUG) console.warn(`[GeminiService] validateTopicSafety failed, bypassing check:`, err);
    if (err.message?.includes('SAFETY')) {
       return { isSafe: false, reason: "Safety filters blocked this topic." };
    }
    return { isSafe: true };
  }
}

export async function generateTutorial(topic: string, subject: string, ageGroup: number, contextImage?: string): Promise<{ text: string, groundingChunks?: GroundingChunk[] }> {
  if (DEBUG) console.log(`[GeminiService] generateTutorial: Starting for "${topic}" with Search Grounding`);
  try {
    const ai = getAI();
    const promptParts: any[] = [
      { text: `${SAFETY_DIRECTIVE} Expert ${subject} tutor for age ${ageGroup} on "${topic}". Use Google Search to ensure facts are up-to-date.` },
      { text: `
        CRITICAL FORMATTING INSTRUCTIONS:
        - Use clear, descriptive Markdown headers.
        - Add a "Concept Spotlight" blockquote.
        - Ensure a smooth flow.
      ` }
    ];

    if (contextImage) {
      if (DEBUG) console.log(`[GeminiService] generateTutorial: Including context image`);
      promptParts.push({ text: "CONTEXT: Prioritize concepts shown in the attached schoolwork image." });
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
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    if (!response.text) throw new Error("Empty response generated.");
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    if (DEBUG) console.log(`[GeminiService] generateTutorial: Success. Citations found: ${groundingChunks.length}`);
    
    return { 
      text: response.text,
      groundingChunks: groundingChunks
    };
  } catch (err) {
    handleGenAIError(err);
  }
}

export async function askBuddy(history: {role: 'user' | 'model', text: string}[], userMessage: string, topic: string, subject: string, ageGroup: number): Promise<string> {
  if (DEBUG) console.log(`[GeminiService] askBuddy: Sending message "${userMessage}"`);
  try {
    const ai = getAI();
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `${SAFETY_DIRECTIVE} You are Buddy, a wise tutor for age ${ageGroup}.`
      }
    });
    
    const response = await chat.sendMessage({ message: userMessage });
    if (DEBUG) console.log(`[GeminiService] askBuddy: Response received`);
    return response.text || "I'm having trouble thinking right now. Ask me again?";
  } catch (err) {
    console.error("Chat error", err);
    return "Connection issue. Please try again.";
  }
}

export async function generateDeepDiveSuggestions(topic: string, subject: string, ageGroup: number): Promise<string[]> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify 3 fascinating sub-topics or complex terms related to "${topic}" (${subject}) that a ${ageGroup}-year-old student might want to "Deep Dive" into. Return a JSON array of strings (max 4 words each).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (err) {
    console.error("Deep Dive Suggestions Error", err);
    return [];
  }
}

export async function generateDeepDiveContent(subTopic: string, parentTopic: string, ageGroup: number): Promise<string> {
   try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a short, exciting "Micro-Lesson" about "${subTopic}" (context: ${parentTopic}) for a ${ageGroup}-year-old. Use analogies. Max 150 words.`,
    });
    return response.text || "Could not load deep dive.";
  } catch (err) {
    return "Error loading content.";
  }
}

async function generateDialogueText(tutorialText: string, topic: string, ageGroup: number): Promise<string> {
  const ai = getAI();
  const prompt = `Convert this lesson about "${topic}" into a short dialogue between 'Buddy' and 'Sam'. Content: ${tutorialText.slice(0, 1000)}`;
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

export async function generateDiagram(topic: string, subject: string): Promise<string | null> {
  if (DEBUG) console.log(`[GeminiService] generateDiagram: Generating SVG code`);
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a clean, educational SVG diagram code for "${topic}" (${subject}). 
      - Return ONLY the raw <svg>...</svg> code. 
      - Do not wrap in markdown blocks. 
      - Use inline styles. 
      - Make it colorful and use a viewbox of 0 0 800 600. 
      - Include labels text elements.`,
    });
    let svg = response.text || "";
    // Robust cleanup to handle markdown blocks and XML declarations
    svg = svg.replace(/```svg/g, '').replace(/```xml/g, '').replace(/```/g, '').trim();
    
    // Find the first occurrence of <svg
    const startIndex = svg.indexOf('<svg');
    const endIndex = svg.lastIndexOf('</svg>');
    
    if (startIndex !== -1 && endIndex !== -1) {
      return svg.substring(startIndex, endIndex + 6);
    }
    return null;
  } catch (err) {
    console.error("Diagram Error", err);
    return null;
  }
}

export async function generateImages(topic: string, subject: string, ageGroup: number): Promise<string[]> {
  const ai = getAI();
  const prompts = [
    `Detailed educational illustration of ${topic} (${subject}), age ${ageGroup}.`,
    `Scientific conceptual visualization of ${topic}.`,
    `Informative diagram of ${topic} for students.`,
    `Atmospheric scene depicting ${topic}.`
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
    throw err;
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
    return JSON.parse(response.text || '[]');
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
