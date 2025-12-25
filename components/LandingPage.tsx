
import React, { useEffect, useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const generateHeroImage = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: 'A warm, modern multimodal tutoring scene: a student at a desk interacting with a tablet showing three stacked cards — a scanned textbook page with highlighted text, a short video thumbnail with play icon, and a quiz card with multiple choice. Include a floating parent report preview and a small validator badge icon. Style: soft rounded shapes, bright teal and deep blue accents, subtle warm yellow highlights, minimal background gradient, friendly semi-realistic characters, clean device mockups, high contrast, 16:9 composition.',
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9"
            }
          }
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setHeroImageUrl(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      } catch (error) {
        console.error("Failed to generate hero image", error);
      }
    };

    generateHeroImage();
  }, []);

  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row items-center gap-12 py-12 lg:py-20">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-block px-4 py-1.5 rounded-full bg-teal-100 text-teal-700 text-sm font-bold tracking-wide uppercase">
            Powered by Gemini 3
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-blue-950 leading-tight">
            The Personal Tutor for the <span className="text-teal-500">Modern Learner.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-xl mx-auto lg:mx-0">
            Scan your textbook, interact with AI-generated videos, and master any topic with TutorBuddy's agentic loop.
          </p>
          <button
            onClick={onStart}
            className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-blue-700 transform transition-all active:scale-95 hover:shadow-blue-200"
          >
            Start Learning Now
          </button>
        </div>

        <div className="flex-1 w-full max-w-2xl">
          {heroImageUrl ? (
            <div className="rounded-3xl overflow-hidden shadow-2xl border-8 border-white ring-1 ring-gray-200 bg-white">
              <img src={heroImageUrl} alt="TutorBuddy Scene" className="w-full h-auto object-cover" />
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-3xl animate-pulse flex items-center justify-center border-4 border-dashed border-gray-200">
              <span className="text-gray-400 font-medium">Loading tutor scene...</span>
            </div>
          )}
        </div>
      </div>

      {/* 3-Step Loop Section */}
      <div className="py-16 bg-white/50 rounded-[3rem] border border-white p-12 shadow-sm">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-blue-950">How TutorBuddy Works</h2>
          <p className="text-gray-500 mt-2">A simple 3-step loop designed for ultimate mastery.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative p-8 bg-white rounded-3xl shadow-sm border border-gray-100 group hover:border-teal-200 transition-colors">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg">1</div>
            <div className="mb-6 p-4 bg-teal-50 rounded-2xl w-fit group-hover:bg-teal-100 transition-colors">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-blue-950 mb-2">Seed & Scan</h3>
            <p className="text-gray-600 leading-relaxed">
              Pick a topic or scan your classwork. Our AI analyzes your textbook pages to build a personalized path.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative p-8 bg-white rounded-3xl shadow-sm border border-gray-100 group hover:border-yellow-200 transition-colors">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg">2</div>
            <div className="mb-6 p-4 bg-yellow-50 rounded-2xl w-fit group-hover:bg-yellow-100 transition-colors">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-blue-950 mb-2">Learn & Quiz</h3>
            <p className="text-gray-600 leading-relaxed">
              Watch AI-generated videos tailored to your style and practice with interactive, fun quizzes.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative p-8 bg-white rounded-3xl shadow-sm border border-gray-100 group hover:border-blue-200 transition-colors">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg">3</div>
            <div className="mb-6 p-4 bg-blue-50 rounded-2xl w-fit group-hover:bg-blue-100 transition-colors">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 2v-6m-8 13h11a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-blue-950 mb-2">Parent Report</h3>
            <p className="text-gray-600 leading-relaxed">
              Receive a detailed reporter summary tracking mastery, highlights, and personalized recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
