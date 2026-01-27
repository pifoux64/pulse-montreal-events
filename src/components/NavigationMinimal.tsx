'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Sparkles, Compass, Map, Heart, Search, 
  Menu, X, Music, Users, Palette, Trophy, 
  Building2, Globe
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFavorites } from '@/hooks/useFavorites';
import NotificationBell from './NotificationBell';
import LanguageSwitcherFlag from './LanguageSwitcherFlag';
import ProfileMenu from './ProfileMenu';
import ExploreMenu from './ExploreMenu';

export default function NavigationMinimal() {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  const { favorites } = useFavorites([]);
  const favoritesCount = favorites.length;

  // Fermer le menu mobile en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[50] bg-slate-950/70 backdrop-blur-2xl border-b border-white/10 shadow-lg" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <div
                className="relative w-12 h-12 lg:w-14 lg:h-14 group-hover:scale-105 transition-all duration-300"
                style={{
                  animation: 'float-gentle 4s ease-in-out infinite',
                  position: 'relative'
                }}
              >
                <Image
                  src="/Pulse_Logo.png"
                  alt="Pulse Logo"
                  fill
                  sizes="(max-width: 768px) 48px, 56px"
                  className="object-contain drop-shadow-lg"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Navigation desktop - 5 items max */}
          <div className="hidden lg:flex items-center space-x-2">
            {/* 1. For You */}
            <Link
              href="/pour-toi"
              className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('pourToiShort')}</span>
            </Link>

            {/* 2. Explore (dropdown) */}
            <ExploreMenu />

            {/* 3. Map */}
            <Link
              href="/carte"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Map className="w-4 h-4" />
              <span>{t('mapShort')}</span>
            </Link>

            {/* 4. Favorites */}
            <Link
              href="/favoris"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 relative"
            >
              <Heart className="w-4 h-4" />
              <span>{t('favoritesShort')}</span>
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </Link>

            {/* 5. Search (icon only) */}
            <div className="relative">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    autoFocus
                    className="px-3 py-2 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 w-48"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="p-2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Actions droite - Desktop */}
          <div className="hidden lg:flex items-center space-x-2">
            <NotificationBell />
            <LanguageSwitcherFlag />
            {status === 'loading' ? (
              <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse border border-white/20" />
            ) : session?.user ? (
              <ProfileMenu />
            ) : (
              <Link
                href="/api/auth/signin"
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors"
              >
                {t('login')}
              </Link>
            )}
          </div>

          {/* Menu mobile */}
          <div className="lg:hidden flex items-center space-x-2">
            <LanguageSwitcherFlag />
            {session?.user && <NotificationBell />}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile déroulant */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="lg:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-xl"
        >
          <div className="px-4 py-3 space-y-2">
            <Link
              href="/pour-toi"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              <span>{t('pourToi')}</span>
            </Link>
            <Link
              href="/carte"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all"
            >
              <Map className="w-5 h-5" />
              <span>{t('map')}</span>
            </Link>
            <Link
              href="/favoris"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-all"
            >
              <Heart className="w-5 h-5" />
              <span>{t('favorites')}</span>
              {favoritesCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {favoritesCount}
                </span>
              )}
            </Link>
            <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 py-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder-slate-400"
              />
            </form>
            {session?.user ? (
              <div className="pt-2 border-t border-white/10">
                <ProfileMenu onClose={() => setIsMobileMenuOpen(false)} />
              </div>
            ) : (
              <Link
                href="/api/auth/signin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-center text-white bg-sky-500 hover:bg-sky-600 transition-colors"
              >
                {t('login')}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
