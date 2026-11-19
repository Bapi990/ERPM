import React, { useEffect, useRef, useState } from 'react';

export const AnimatedCounter = ({ value, duration = 1.5, suffix = "", prefix = "" }) => {
  const [count, setCount] = useState(0);
  const counterRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // If value has non-digits, extract numeric part
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const end = numericValue;
          const startTime = performance.now();

          const animate = (currentTime) => {
            const elapsed = (currentTime - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentCount = Math.floor(easeOut * end);
            setCount(currentCount);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(end);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, [numericValue, duration, hasAnimated]);

  return (
    <span ref={counterRef} className="font-mono">
      {prefix}
      {hasAnimated ? count.toLocaleString('en-IN') : numericValue.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
