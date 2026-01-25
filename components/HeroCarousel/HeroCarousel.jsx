// components/HeroCarousel/HeroCarousel.jsx
'use client';
import React, { useCallback, useEffect } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import './HeroCarousel.css';

const HeroCarousel = ({ 
  images = [], 
  locale = 'en-SA',
  autoplayDelay = 4000,
  showOverlay = true,
  showContent = true,
  height = '400px',
  showDots = true
}) => {
  const isRtl = locale.startsWith('ar');
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      direction: isRtl ? 'rtl' : 'ltr',
    },
    [Autoplay({ delay: autoplayDelay, stopOnInteraction: false })]
  );

  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState([]);

  const scrollTo = useCallback(
    (index) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="hero-carousel-wrapper" style={{ '--carousel-height': height }}>
      <div className="hero-carousel" ref={emblaRef}>
        <div className="hero-carousel__container">
          {images.map((item, index) => (
            <div key={item.id || index} className="hero-carousel__slide">
              <div className="hero-slide">
                <Image
                  src={item.image || item.coverImage}
                  alt={item.name || item.alt || `Slide ${index + 1}`}
                  fill
                  priority={index === 0}
                  className="hero-slide__image"
                  sizes="100vw"
                  style={{ objectFit: 'cover' }}
                />
                
                {showOverlay && (
                  <div className="hero-slide__overlay" />
                )}
                
                {showContent && (item.logo || item.name || item.title) && (
                  <div className="hero-slide__content">
                    {/*{item.logo && (
                      <Image
                        src={item.logo}
                        alt={item.name}
                        width={150}
                        height={80}
                        className="hero-slide__logo"
                      />
                    )}
                    {(item.name || item.title) && (
                      <h2 className="hero-slide__title">
                        {item.name || item.title}
                      </h2>
                    )}
                    {item.description && (
                      <p className="hero-slide__description">
                        {item.description}
                      </p>
                    )}*/}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Navigation */}
      {showDots && images.length > 1 && (
        <div className="hero-carousel__dots">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              className={`hero-carousel__dot ${
                index === selectedIndex ? 'hero-carousel__dot--active' : ''
              }`}
              onClick={() => scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;
