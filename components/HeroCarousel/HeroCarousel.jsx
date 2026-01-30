// components/HeroCarousel/HeroCarousel.jsx
'use client';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { flushSync } from 'react-dom';
import './HeroCarousel.css';

const ChevronLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
);
const ChevronRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
);

const HeroCarousel = ({ 
  images = [], 
  locale = 'en-SA',
  autoplayDelay = 6000,
  showOverlay = true,
  showContent = true,
  height = '600px',
  showDots = true,
  showArrows = true
}) => {
  const isRtl = locale.startsWith('ar');
  const autoplayRef = useRef(
    Autoplay({ delay: autoplayDelay, stopOnInteraction: false })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      direction: isRtl ? 'rtl' : 'ltr',
    },
    [autoplayRef.current]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);
  const [tweenValues, setTweenValues] = useState([]);

  // Parallax Logic
  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    const engine = emblaApi.internalEngine();
    const scrollProgress = emblaApi.scrollProgress();

    const styles = emblaApi.scrollSnapList().map((scrollSnap, index) => {
      let diffToTarget = scrollSnap - scrollProgress;
      if (engine.options.loop) {
        engine.slideLooper.loopPoints.forEach((loopItem) => {
          const target = loopItem.target();
          if (index === loopItem.index && target !== 0) {
            const sign = Math.sign(target);
            if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress);
            if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress);
          }
        });
      }
      return diffToTarget * (-18) + "%"; // 18% parallax speed
    });
    setTweenValues(styles);
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  
  const scrollTo = useCallback((index) => {
    if (emblaApi) {
        emblaApi.scrollTo(index);
        autoplayRef.current.reset();
    }
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    autoplayRef.current.reset();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onScroll();
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on('scroll', () => flushSync(() => onScroll()));
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
      emblaApi.off('scroll', onScroll);
    };
  }, [emblaApi, onSelect, onScroll]);

  if (!images || images.length === 0) return null;

  return (
    <div 
        className="hero-carousel-wrapper" 
        style={{ '--carousel-height': height }} 
        dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="hero-carousel" ref={emblaRef}>
        <div className="hero-carousel__container">
          {images.map((item, index) => (
            <div key={item.id || index} className="hero-carousel__slide">
              <div className="hero-slide">
                {/* Parallax Image */}
                <div className="hero-slide__parallax">
                  <div 
                    className="hero-slide__image-wrapper"
                    style={{ transform: `translateX(${tweenValues[index]})` }}
                  >
                    <Image
                      src={item.image || item.coverImage}
                      alt={item.name || item.alt || `Slide ${index + 1}`}
                      fill
                      priority={index === 0}
                      className="hero-slide__image"
                      sizes="100vw"
                    />
                  </div>
                </div>
                
                {showOverlay && <div className="hero-slide__overlay" />}
                
                {showContent && (item.title || item.name) && (
                  <div className={`hero-slide__content ${index === selectedIndex ? 'is-active' : ''}`}>
                    {/* Content Inner ensures alignment with Header */}
                    <div className="content-inner">
                        {item.tag && (
                          <span className="hero-slide__tag">{item.tag}</span>
                        )}
                        <h2 className="hero-slide__title">
                          {item.title || item.name}
                        </h2>
                        {item.description && (
                          <p className="hero-slide__description">
                            {item.description}
                          </p>
                        )}
                        {item.ctaText && (
                           <button className="hero-slide__cta">
                             {item.ctaText}
                           </button>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hero-carousel__controls">
        {/* Controls Inner ensures Arrows align with Header max-width */}
        <div className="controls-inner">
            {showArrows && images.length > 1 && (
                <>
                    <button className="nav-btn nav-btn--prev" onClick={scrollPrev} aria-label="Previous Slide">
                        <ChevronLeft />
                    </button>
                    <button className="nav-btn nav-btn--next" onClick={scrollNext} aria-label="Next Slide">
                        <ChevronRight />
                    </button>
                </>
            )}
        </div>

        {showDots && images.length > 1 && (
          <div className="hero-carousel__dots">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                className={`dot-btn ${index === selectedIndex ? 'is-active' : ''}`}
                onClick={() => scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              >
                <span className="dot-visual">
                    {index === selectedIndex && (
                        <span 
                            className="dot-progress" 
                            style={{ animationDuration: `${autoplayDelay}ms` }}
                        />
                    )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroCarousel;
