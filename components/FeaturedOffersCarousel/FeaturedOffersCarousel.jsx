// components/FeaturedOffersCarousel.jsx
'use client';

import { useState } from 'react';
import OfferCard from '../OfferCard/OfferCard'; // Adjust path if needed based on your folder structure
import './FeaturedOffersCarousel.css';

export default function FeaturedOffersCarousel({ title, offers = [], locale }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // If no offers, don't render
  if (!offers || offers.length === 0) {
    return null;
  }

  // Determine items per view logic for navigation boundaries
  // Note: CSS controls visual width, this controls logic
  const itemsPerView = 2; // Matches CSS calc (50% on desktop)
  const maxSlideIndex = Math.max(0, offers.length - 1); 
  // Simplified navigation: Scroll one by one, but clamp at end based on view

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? 0 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => {
      // If we are at the end (taking into account visible items)
      // Mobile sees 1 item, Desktop sees 2. 
      // Simple logic: Allow scrolling until the last item is fully visible.
      // Since CSS handles overflow, we just increment index.
      return prev >= offers.length - 1 ? 0 : prev + 1;
    });
  };

  return (
    <section className="featured-offers-carousel">
      <div className="carousel-container home-section"> {/* Added home-section class to align with page layout */}
        <div className="carousel-header">
          <h2 className="carousel-title">
             <span className="material-symbols-sharp">verified</span>
             {title}
          </h2>
          
          <div className="carousel-controls">
            <button 
              className="control-btn prev" 
              onClick={handlePrev}
              disabled={currentSlide === 0}
              aria-label="Previous"
            >
              <span className="material-symbols-sharp">arrow_back</span>
            </button>
            <button 
              className="control-btn next" 
              onClick={handleNext}
              disabled={currentSlide >= offers.length - 1}
              aria-label="Next"
            >
              <span className="material-symbols-sharp">arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="carousel-track-container">
          <div 
            className="carousel-track" 
            style={{ 
              // Logic: Shift by percentage based on item width.
              // We rely on CSS variables or fixed percentages. 
              // Let's assume on desktop (min-width 1024px) items are 50% width.
              // On mobile they are 100%.
              // To make this responsive in JS without ResizeObserver is tricky.
              // Better approach: Use a scroll container or simple transform based on 100% of ITEM width.
              // However, the simplest way given the previous code is to translate by percentage of the TRACK.
              
              // Let's use CSS scroll snap instead for native feel, or keep the transform logic simple:
              // Mobile: -100% * currentSlide
              // Desktop: -50% * currentSlide
              
              // We will handle this via a CSS variable set by media query, but JS doesn't see CSS vars easily.
              // Let's use a class-based modifier or just standard scrolling.
              
              // FALLBACK: Simple Transform
               transform: `translateX(${locale.startsWith('ar') ? '' : '-'}${currentSlide * 100}%)` 
               // Note: This assumes 1 item scroll at a time. 
               // We need to adjust the CSS to ensure the track moves correctly.
            }}
          >
            {offers.map((offer) => (
              <div key={offer.id} className="carousel-slide">
                <OfferCard offer={offer} />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Scroll Indicator */}
        <div className="mobile-scroll-indicator">
          {offers.map((_, index) => (
            <div 
              key={index}
              className={`indicator-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
