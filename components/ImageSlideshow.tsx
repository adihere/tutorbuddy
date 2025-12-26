import React, { useState, useEffect } from 'react';

interface ImageSlideshowProps {
  images: string[];
  topic?: string;
}

export const ImageSlideshow: React.FC<ImageSlideshowProps> = ({ images, topic }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [images]);

  if (!images || images.length === 0) return null;

  const downloadCurrent = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = images[currentIndex];
    link.download = `tutorbuddy-${topic || 'image'}-${currentIndex + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="relative w-full h-full group" 
      role="region" 
      aria-label="Educational image slideshow"
      aria-live="polite"
    >
      {images.map((img, idx) => (
        <img
          key={`slideshow-img-${idx}`}
          src={img}
          alt={`Educational visual aid ${idx + 1}`}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            idx === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
        />
      ))}

      {/* Individual Download Overlay */}
      <button
        onClick={downloadCurrent}
        className="absolute top-4 right-4 p-2.5 bg-white/20 backdrop-blur-xl border border-white/30 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40 shadow-xl z-20"
        title="Download this image"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full z-10 border border-white/10">
        {images.map((_, idx) => (
          <button
            key={`dot-${idx}`}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};