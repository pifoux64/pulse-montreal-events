'use client';

/**
 * Composant pour animations de transition fluides
 * Performance: Utilise CSS transforms pour animations GPU-accelerated
 */

import { ReactNode } from 'react';

interface AnimatedTransitionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeIn({ children, className = '', delay = 0 }: AnimatedTransitionProps) {
  return (
    <div
      className={`animate-in fade-in duration-500 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function SlideUp({ children, className = '', delay = 0 }: AnimatedTransitionProps) {
  return (
    <div
      className={`animate-in slide-in-from-bottom-4 duration-500 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function ScaleIn({ children, className = '', delay = 0 }: AnimatedTransitionProps) {
  return (
    <div
      className={`animate-in zoom-in-95 duration-300 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

