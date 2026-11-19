import React, { useEffect, useRef, useState } from 'react';

/**
 * Premium Scroll Reveal Component
 * Smoothly animates elements on scroll (left-to-right, right-to-left, fade-up, zoom)
 * Uses high-performance IntersectionObserver with GPU-accelerated inline transforms
 * and silk-smooth cubic-bezier physics.
 */
export const ScrollReveal = ({
  children,
  direction = 'up', // 'up' | 'left' | 'right' | 'zoom'
  delay = 0,
  duration = 850,
  threshold = 0.08,
  className = '',
  distance = 70,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  const getInitialTransform = () => {
    if (isVisible) return 'translate3d(0, 0, 0) scale(1)';
    switch (direction) {
      case 'left':
        return `translate3d(-${distance}px, 0, 0) scale(0.98)`;
      case 'right':
        return `translate3d(${distance}px, 0, 0) scale(0.98)`;
      case 'zoom':
        return 'scale(0.90)';
      case 'up':
      default:
        return `translate3d(0, ${distance}px, 0)`;
    }
  };

  return (
    <div
      ref={ref}
      className={`transform-gpu ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getInitialTransform(),
        transitionProperty: 'opacity, transform',
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
