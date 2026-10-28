import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderSrc?: string;
  className?: string;
  rootMargin?: string;
  threshold?: number;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholderSrc,
  className = '',
  rootMargin = '150px',
  threshold = 0.01,
  ...props
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = imgRef.current;
    if (!target) return;

    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsIntersecting(true);
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin, threshold }
      );

      observer.observe(target);
      return () => {
        observer.disconnect();
      };
    } else {
      // Fallback for older browsers
      setIsIntersecting(true);
    }
  }, [rootMargin, threshold]);

  return (
    <div ref={imgRef} className={`relative overflow-hidden bg-black/40 ${className}`}>
      {/* Shimmer skeleton while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] via-amber-500/[0.08] to-white/[0.03] animate-pulse" />
      )}

      {/* Render img only when intersecting */}
      {isIntersecting && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-700 ${
            isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm'
          } ${className}`}
          {...props}
        />
      )}

      {/* Fallback if image link is broken */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-gray-900 text-gray-500">
          <span className="text-xl mb-1">🌸</span>
          <span className="text-[10px] text-amber-300/80 font-medium">Sacred Mala</span>
        </div>
      )}
    </div>
  );
};
