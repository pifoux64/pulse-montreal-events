'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Compass, Music, Users, Palette, Trophy, Building2, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ExploreMenu() {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 group"
        aria-expanded={isOpen}
      >
        <Compass className="w-4 h-4" />
        <span>{t('explore')}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden z-50">
          <div className="p-2">
            {/* Catégories */}
            <div className="px-3 py-1.5 mb-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {tCommon('categories')}
              </div>
            </div>
            <Link
              href="/musique"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
            >
              <Music className="w-4 h-4 text-slate-400 group-hover:text-pink-400 transition-colors" />
              <span>{t('music')}</span>
            </Link>
            <Link
              href="/famille"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
            >
              <Users className="w-4 h-4 text-slate-400 group-hover:text-orange-400 transition-colors" />
              <span>{t('family')}</span>
            </Link>
            <Link
              href="/culture"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
            >
              <Palette className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
              <span>{t('culture')}</span>
            </Link>
            <Link
              href="/sport"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
            >
              <Trophy className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <span>{t('sport')}</span>
            </Link>

            <div className="border-t border-white/10 my-2" />

            {/* Venues & Organizers */}
            <div className="px-3 py-1.5 mb-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t('discover')}
              </div>
            </div>
            <Link
              href="/salles"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
            >
              <Building2 className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <span>{t('venues')}</span>
            </Link>
            <Link
              href="/organisateurs"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
            >
              <Users className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
              <span>{t('organizers')}</span>
            </Link>

            <div className="border-t border-white/10 my-2" />

            {/* Pulse Picks */}
            <Link
              href="/top-5"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
            >
              <Sparkles className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
              <span>{t('top5')}</span>
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                IA
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
