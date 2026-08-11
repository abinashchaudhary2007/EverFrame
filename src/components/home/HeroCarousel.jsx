import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { heroSlides } from '../../data/products';

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const touchStartX = useRef(null);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % heroSlides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + heroSlides.length) % heroSlides.length);
  }, []);

  // Auto-play
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [isPaused, next]);

  // Touch support
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
    touchStartX.current = null;
  };

  const handleNavClick = (fn) => {
    setIsPaused(true);
    fn();
    setTimeout(() => setIsPaused(false), 6000);
  };

  return (
    <section
      className="hero"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-label="Hero Carousel"
    >
      {heroSlides.map((slide, i) => (
        <div key={slide.id} className={`hero-slide ${i === current ? 'active' : ''}`}>
          <img src={slide.image} alt={slide.heading} loading={i === 0 ? 'eager' : 'lazy'} />
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="hero-tag">{slide.tag}</p>
            <h1 className="hero-heading">{slide.heading}</h1>
            <p className="hero-sub">{slide.subheading}</p>
            <Link to={slide.ctaLink} className="btn btn-primary btn-lg">
              {slide.cta}
            </Link>
          </div>
        </div>
      ))}

      {/* Navigation */}
      <button
        className="hero-nav-btn prev"
        aria-label="Previous slide"
        onClick={() => handleNavClick(prev)}
      >
        <ChevronLeft size={22} />
      </button>
      <button
        className="hero-nav-btn next"
        aria-label="Next slide"
        onClick={() => handleNavClick(next)}
      >
        <ChevronRight size={22} />
      </button>

      {/* Dots */}
      <div className="hero-dots">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            className={`hero-dot ${i === current ? 'active' : ''}`}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => { setCurrent(i); setIsPaused(true); setTimeout(() => setIsPaused(false), 6000); }}
          />
        ))}
      </div>
    </section>
  );
}
