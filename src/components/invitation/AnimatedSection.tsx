'use client';

import { motion } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  sectionIndex: number;
  className?: string;
  id?: string;
  // Animation settings
  enabled?: boolean;
  baseDelay?: number;
  threshold?: number;
  duration?: number;
}

export default function AnimatedSection({
  children,
  sectionIndex,
  className = '',
  id,
  enabled = true,
  baseDelay = 0.08,
  threshold = 0.1,
  duration = 0.6
}: AnimatedSectionProps) {
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    // Check prefers-reduced-motion only on client side
    const checkReducedMotion = () => {
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setShouldAnimate(!mediaQuery.matches && enabled);
        
        const handleChange = () => {
          setShouldAnimate(!mediaQuery.matches && enabled);
        };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
      return () => {};
    };
    
    return checkReducedMotion();
  }, [enabled]);
  
  const delay = sectionIndex * baseDelay;
  
  // Don't animate on server side or if animations are disabled
  if (!isClient || !shouldAnimate) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }
  
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: threshold }}
      transition={{
        duration,
        delay,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
}