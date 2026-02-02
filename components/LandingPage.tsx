
import React, { useEffect, useState, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";

interface LandingPageProps {
  onStart: () => void;
  isKeyConnected: boolean;
  onConnectKey: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, isKeyConnected, onConnectKey }) => {
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [isGeneratingHero, setIsGeneratingHero] = useState(false);

  const generateHeroImage = useCallback(async () => {
    // Only generate if key is present and we haven't already
    if (isGeneratingHero || !isKeyConnected) return;
    
    setIsGeneratingHero(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: 'Kids studying in a warm, inviting public library. A cozy hybrid environment featuring stacks of physical hardcover books and colorful flip charts alongside subtle, glowing holographic digital interfaces and tablets. Soft golden hour sunlight streaming through large windows, rich wooden textures, comfortable community atmosphere, cinematic lighting, high-end educational aesthetic, 16:9 aspect ratio.',
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (imagePart?.inlineData) {
        setHeroImageUrl(`data:image/png;base64,${imagePart.inlineData.data}`);
      }
    } catch (error) {
      console.warn("Hero image generation deferred or failed.", error);
    } finally {
      setIsGeneratingHero(false);
    }
  }, [isGeneratingHero, isKeyConnected]);

  // Reactive effect: Try to generate image when key status changes to true
  useEffect(() => {
    if (isKeyConnected && !heroImageUrl) {
      generateHeroImage();
    }
  }, [isKeyConnected, generateHeroImage, heroImageUrl]);

  const handleOpenDemo = () => {
    window.open('https://youtu.be/5RXk6AvlUUc', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="animate-fadeIn w-full">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 py-6 lg:py-16">
        <div className="flex-1 space-y-6 lg:space-y-8 text-center lg:text-left w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs md:text-sm font-bold tracking-wide uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Gemini 3 Flash Powered
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-950 leading-tight tracking-tighter">
            Mastery in <span className="text-blue-600">Minutes.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed px-2 md:px-0">
            Enter any topic. We generate a professional tutorial, an emotional audio dialogue, and 5 custom visual mastery aids instantly.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 pt-4 justify-center lg:justify-start w-full">
            {/* Video Demo Button with Tooltip */}
            <div className="relative group/tooltip w-full sm:w-auto">
              <button
                onClick={handleOpenDemo}
                className="w-full sm:w-auto px-6 py-4 md:px-8 md:py-5 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl font-black text-lg md:text-xl shadow-lg hover:border-blue-400 hover:text-blue-600 transform transition-all active:scale-95 flex items-center justify-center gap-3 group"
              >
                <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
                Video Demo
              </button>
            </div>

            <button
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-4 md:px-10 md:py-5 bg-blue-600 text-white rounded-2xl font-black text-lg md:text-xl shadow-2xl shadow-blue-200 hover:bg-blue-700 transform transition-all active:scale-95 hover:-translate-y-1"
            >
              Start Learning
            </button>
            
            <div className="relative group w-full sm:w-auto">
              <button
                onClick={onConnectKey}
                disabled={isKeyConnected}
                className={`w-full sm:w-auto px-6 py-4 md:px-6 md:py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all border-2 ${
                  isKeyConnected 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'
                }`}
              >
                {isKeyConnected ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Key Connected
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    Connect Key
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full max-w-2xl relative mt-8 lg:mt-0">
          <div className="absolute -inset-4 bg-blue-400/10 blur-3xl rounded-full"></div>
          {heroImageUrl ? (
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 md:border-8 border-white ring-1 ring-slate-100 bg-white animate-fadeIn">
              <img src={heroImageUrl} alt="TutorBuddy Scene" className="w-full h-auto object-cover" />
            </div>
          ) : (
            <div className="aspect-video bg-white rounded-3xl flex items-center justify-center border-4 border-dashed border-slate-200 relative group overflow-hidden">
               {isGeneratingHero ? (
                   <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-widest animate-pulse">Designing Hero...</span>
                   </div>
               ) : (
                   <div className="text-center p-6">
                      <span className="block text-4xl mb-2">🎨</span>
                      <span className="text-slate-400 font-bold uppercase tracking-widest text-xs md:text-sm">
                        {isKeyConnected ? "Generating visual..." : "Connect Key to Generate Hero"}
                      </span>
                   </div>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="py-12 lg:py-20 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-950 mb-3">Structured Tutorials</h3>
          <p className="text-sm md:text-base text-slate-500 leading-relaxed">Gemini 3 Flash crafts clear, concisely formatted lessons with expert analogies.</p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
             <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-950 mb-3">5 Visual Mastery Aids</h3>
          <p className="text-sm md:text-base text-slate-500 leading-relaxed">Experience 5 high-quality AI generated images tailored to visualize your learning topic.</p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-950 mb-3">Emotional Dialogues</h3>
          <p className="text-sm md:text-base text-slate-500 leading-relaxed">Listen to Buddy and Sam discuss your topic with multi-speaker emotional TTS technology.</p>
        </div>
      </div>
    </div>
  );
};
