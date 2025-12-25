import React, { useState, useEffect } from 'react';

interface ImageSlideshowProps {
  images: string[];
}

export const ImageSlideshow: React.FC<ImageSlideshowProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [images]);

  if (!images || images.length === 0) return null;

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