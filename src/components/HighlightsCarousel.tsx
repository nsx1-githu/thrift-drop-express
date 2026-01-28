import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Product } from '@/types/product';
import { cn } from '@/lib/utils';

interface HighlightsCarouselProps {
  products: Product[];
  isLoading?: boolean;
}

export const HighlightsCarousel = ({ products, isLoading }: HighlightsCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (isPaused || products.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [products.length, isPaused]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  if (isLoading) {
    return (
      <div className="relative aspect-[4/5] md:aspect-[16/9] bg-muted animate-pulse rounded-lg" />
    );
  }

  if (products.length === 0) {
    return null;
  }

  const currentProduct = products[currentIndex];

  return (
    <div 
      className="relative overflow-hidden rounded-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Slide */}
      <Link to={`/product/${currentProduct.id}`} className="block">
        <div className="relative aspect-[4/5] md:aspect-[16/9]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProduct.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              <img
                src={currentProduct.images[0]}
                alt={currentProduct.name}
                className="w-full h-full object-cover"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
              
              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium">
                      Latest Drop
                    </span>
                  </div>
                  
                  <h3 className="text-2xl md:text-4xl font-normal text-foreground mb-2">
                    {currentProduct.name}
                  </h3>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-lg md:text-2xl font-medium text-foreground">
                      ₹{currentProduct.price.toLocaleString()}
                    </span>
                    {currentProduct.originalPrice && (
                      <span className="text-sm md:text-base text-muted-foreground line-through">
                        ₹{currentProduct.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">
                    {currentProduct.brand} · {currentProduct.size} · {currentProduct.condition}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </Link>

      {/* Navigation Arrows */}
      {products.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); goToPrevious(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors"
            aria-label="Previous highlight"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={(e) => { e.preventDefault(); goToNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors"
            aria-label="Next highlight"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {products.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.preventDefault(); setCurrentIndex(index); }}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "w-6 bg-primary" 
                  : "bg-foreground/30 hover:bg-foreground/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
