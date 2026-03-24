import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Home, Search, Shield } from 'lucide-react';
import { Button } from '../components/UI';

const slides = [
  {
    icon: Home,
    title: 'Find Your Perfect Room',
    description: 'Discover PGs, flats, and shared rooms near your college or workplace. Verified listings with real photos.',
    image: 'https://images.pexels.com/photos/7683897/pexels-photo-7683897.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'
  },
  {
    icon: Search,
    title: 'Smart Search & Filters',
    description: 'Filter by budget, location, amenities, and more. Use AI-powered search to find exactly what you need.',
    image: 'https://images.pexels.com/photos/5417293/pexels-photo-5417293.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'
  },
  {
    icon: Shield,
    title: 'Safe & Trusted',
    description: 'Connect directly with verified owners. Book visits, chat in real-time, and find your new home safely.',
    image: 'https://images.pexels.com/photos/36411037/pexels-photo-36411037.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'
  }
];

export default function Onboarding({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip button */}
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={handleSkip}
          data-testid="skip-onboarding"
          className="text-muted-foreground text-sm font-medium px-4 py-2 hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          {/* Image */}
          <div className="relative h-[50vh] overflow-hidden">
            <img 
              src={slides[currentSlide].image}
              alt={slides[currentSlide].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
          </div>
          
          {/* Content */}
          <div className="flex-1 px-6 py-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mb-6">
              {React.createElement(slides[currentSlide].icon, { 
                size: 28, 
                className: 'text-secondary-foreground' 
              })}
            </div>
            
            <h2 className="font-heading font-bold text-2xl mb-3">
              {slides[currentSlide].title}
            </h2>
            
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              {slides[currentSlide].description}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom section */}
      <div className="px-6 pb-8">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-8 bg-primary' 
                  : 'w-2 bg-muted hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
        
        {/* Next button */}
        <Button 
          onClick={handleNext}
          data-testid="onboarding-next"
          size="lg"
          className="w-full"
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          <ChevronRight size={20} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}
