// frontend/src/components/dashboard/ScrollFadeIn.tsx
'use client';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

type ScrollFadeInProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
};

export default function ScrollFadeIn({ children, className = '', delay = 0, y = 48, once = true }: ScrollFadeInProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: '-40px 0px' });

  return (
    <motion.section
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.7, delay, type: 'spring', stiffness: 110 }}
    >
      {children}
    </motion.section>
  );
}