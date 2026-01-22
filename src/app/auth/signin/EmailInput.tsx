'use client';

import { useState, useEffect } from 'react';

interface EmailInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  placeholder?: string;
}

/**
 * Composant EmailInput qui évite les erreurs d'hydratation avec les extensions de navigateur
 * En rendant l'input uniquement après l'hydratation côté client
 */
export default function EmailInput({ value, onChange, disabled, placeholder = 'votre@email.com' }: EmailInputProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Placeholder pour éviter le layout shift
    return (
      <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 h-[48px]">
        {/* Placeholder invisible */}
      </div>
    );
  }

  return (
    <input
      id="email"
      type="email"
      value={value}
      onChange={onChange}
      required
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
      disabled={disabled}
      autoComplete="email"
    />
  );
}
