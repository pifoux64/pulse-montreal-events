'use client';

import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface ModernLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  variant?: 'default' | 'minimal' | 'pulse';
}

const ModernLoader = ({ 
  size = 'md', 
  text = 'Chargement...', 
  variant = 'default' 
}: ModernLoaderProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const containerClasses = {
    sm: 'gap-2 text-sm',
    md: 'gap-3 text-base',
    lg: 'gap-4 text-lg'
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-violet-500`} />
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className="flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 animate-ping opacity-20"></div>
          <div className="relative rounded-full bg-gradient-to-r from-violet-500 to-purple-500 p-3">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`flex flex-col items-center ${containerClasses[size]}`}>
        {/* Loader animé avec glassmorphism */}
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-aurora opacity-20 blur-xl animate-pulse"></div>
          <div className="relative glass-effect p-6 rounded-2xl border border-white/20">
            <Loader2 className={`${sizeClasses[size]} animate-spin text-violet-500 mx-auto`} />
          </div>
        </div>
        
        {/* Texte avec effet gradient */}
        <p className="text-gradient-primary font-medium animate-pulse mt-4">
          {text}
        </p>
        
        {/* Points animés */}
        <div className="flex space-x-1 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModernLoader;
