'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, Map, Calendar, Heart, Plus, Filter, Search, User, Bell, LogOut, BarChart3, Sparkles, Users, Palette, Trophy, Compass, Music } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFavorites } from '@/hooks/useFavorites';
import NotificationBell from './NotificationBell';

export default function Navigation() {
  const t = useTranslations('navigation');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Récupérer le nombre de favoris pour afficher un badge
  const { favorites } = useFavorites([]);
  const favoritesCount = favorites.length;

  // Fermer le menu utilisateur en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const navigationItems = [
    { name: t('map'), href: '/carte', icon: Map, shortName: 'Carte' },
    { name: t('calendar'), href: '/calendrier', icon: Calendar, shortName: 'Cal.' },
    { name: 'Pour toi', href: '/pour-toi', icon: Sparkles, shortName: 'Pour toi' },
    { name: t('favorites'), href: '/favoris', icon: Heart, shortName: 'Favoris' },
    { name: t('publish'), href: '/publier', icon: Plus, shortName: 'Publier' },
  ];

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-[50] bg-slate-950/70 backdrop-blur-2xl border-b border-white/10 shadow-[0_20px_60px_-40px_rgba(15,118,110,0.8)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 text-slate-100">
          {/* Logo avec animation float ajustée */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <div
                className="relative w-16 h-16 lg:w-20 lg:h-20 group-hover:scale-105 transition-all duration-300"
                style={{
                  animation: 'float-gentle 4s ease-in-out infinite, heartbeat 3.2s ease-in-out infinite',
                  position: 'relative' // Explicit pour éviter l'erreur Next.js Image
                }}
              >
                <Image
                  src="/Pulse_Logo.png"
                  alt="Pulse Logo"
                  fill
                  sizes="(max-width: 768px) 64px, 80px"
                  className="object-contain drop-shadow-lg"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Navigation desktop ultra-moderne */}
          <div className="hidden lg:block">
            <div className="flex items-center space-x-1.5">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isFavorites = item.href === '/favoris';
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white transition-all duration-300 flex items-center space-x-2 whitespace-nowrap"
                    title={item.name}
                  >
                    {/* Background gradient on hover */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative z-10 flex-shrink-0">
                      <Icon className="w-4 h-4" />
                      {isFavorites && favoritesCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                          {favoritesCount > 99 ? '99+' : favoritesCount}
                        </span>
                      )}
                    </div>
                    <span className="relative z-10 text-xs">{item.shortName || item.name}</span>
                  </Link>
                );
              })}
              
              {/* Menu déroulant "Découvrir" - Amélioré */}
              <div className="relative group">
                <button className="group relative px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white transition-all duration-300 flex items-center space-x-2 whitespace-nowrap" title="Découvrir">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10 flex-shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span className="relative z-10 text-xs">Découvrir</span>
                  <div className="relative z-10 ml-0.5 flex-shrink-0">
                    <svg className="w-3 h-3 transition-transform group-hover:rotate-180 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {/* Menu déroulant amélioré */}
                <div className="absolute top-full left-0 mt-3 w-56 bg-slate-900/98 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden">
                  {/* Effet de brillance en haut */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
                  
                  <div className="p-3 space-y-1">
                    <Link
                      href="/musique"
                      className="group/item flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:text-white rounded-xl transition-all duration-200 hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-purple-500/20 border border-transparent hover:border-pink-500/30"
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 group-hover/item:scale-110 transition-transform">
                        <Music className="w-4 h-4 text-pink-400" />
                      </div>
                      <span className="font-medium">Musique</span>
                    </Link>
                    
                    <Link
                      href="/famille"
                      className="group/item flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:text-white rounded-xl transition-all duration-200 hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-pink-500/20 border border-transparent hover:border-orange-500/30"
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-pink-500/20 group-hover/item:scale-110 transition-transform">
                        <Users className="w-4 h-4 text-orange-400" />
                      </div>
                      <span className="font-medium">Famille</span>
                    </Link>
                    
                    <Link
                      href="/culture"
                      className="group/item flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:text-white rounded-xl transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-indigo-500/20 border border-transparent hover:border-purple-500/30"
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 group-hover/item:scale-110 transition-transform">
                        <Palette className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="font-medium">Culture</span>
                    </Link>
                    
                    <Link
                      href="/sport"
                      className="group/item flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:text-white rounded-xl transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-cyan-500/20 border border-transparent hover:border-blue-500/30"
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover/item:scale-110 transition-transform">
                        <Trophy className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="font-medium">Sport</span>
                    </Link>
                    
                    <div className="border-t border-white/10 my-1" />
                    
                    <Link
                      href="/top-5"
                      className="group/item flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:text-white rounded-xl transition-all duration-200 hover:bg-gradient-to-r hover:from-amber-500/20 hover:to-orange-500/20 border border-transparent hover:border-amber-500/30"
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 group-hover/item:scale-110 transition-transform">
                        <Trophy className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="font-medium">Top 5 Pulse Picks</span>
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        IA
                      </span>
                    </Link>
                  </div>
                  
                  {/* Effet de brillance en bas */}
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
                </div>
              </div>
            </div>
          </div>

          {/* Actions utilisateur ultra-modernes - Desktop uniquement */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Barre de recherche avec glassmorphism */}
              <div className="relative group">
            <div className="relative rounded-2xl px-4 py-2 flex items-center space-x-3 border border-white/15 bg-white/10 backdrop-blur-xl hover:bg-white/15 transition-all duration-300">
                <Search className="w-4 h-4 text-slate-300 group-focus-within:text-sky-300 transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Recherche rapide..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const query = (e.target as HTMLInputElement).value;
                      if (query.trim()) {
                        window.location.href = `/?search=${encodeURIComponent(query)}`;
                      }
                    }
                  }}
                  className="bg-transparent border-none outline-none text-sm text-slate-100 placeholder-slate-400 w-32 focus:w-48 transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500/10 to-emerald-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </div>

            {/* Notifications */}
            <NotificationBell />

            {/* Profil utilisateur avec menu déroulant */}
            {status === 'loading' ? (
              <div className="p-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : session?.user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="p-2 rounded-2xl text-slate-200 hover:text-sky-300 transition-all duration-300 relative group border border-white/10 bg-white/5 backdrop-blur-md"
                >
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500/15 to-emerald-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl overflow-hidden z-50">
                    <div className="p-2">
                      {/* En-tête utilisateur */}
                      <div className="px-3 py-3 text-sm border-b border-white/10 mb-1">
                        <div className="font-semibold text-white">{session.user.name || 'Utilisateur'}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{session.user.email}</div>
                      </div>
                      
                      {/* Section Mon compte */}
                      <div className="px-3 py-1.5 mb-1">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Mon compte
                        </div>
                      </div>
                      <Link
                        href="/profil"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                      >
                        <User className="w-4 h-4 text-slate-400 group-hover:text-sky-400 transition-colors" />
                        <span>Mon profil</span>
                      </Link>
                      <Link
                        href="/favoris"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                      >
                        <Heart className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
                        <span>Mes favoris</span>
                        {favoritesCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                            {favoritesCount > 99 ? '99+' : favoritesCount}
                          </span>
                        )}
                      </Link>
                      
                      {/* Section Organisateur (si applicable) */}
                      {(session.user.role === 'ORGANIZER' || session.user.organizer) && (
                        <>
                          <div className="border-t border-white/10 my-2" />
                          <div className="px-3 py-1.5 mb-1">
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Organisateur
                            </div>
                          </div>
                          <Link
                            href="/organisateur/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                          >
                            <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                            <span>Tableau de bord</span>
                          </Link>
                          <Link
                            href="/organisateur/mon-profil"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                          >
                            <User className="w-4 h-4 text-slate-400 group-hover:text-sky-400 transition-colors" />
                            <span>Mon profil organisateur</span>
                          </Link>
                        </>
                      )}
                      
                      {/* Déconnexion */}
                      <div className="border-t border-white/10 my-2" />
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: '/' });
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors group"
                      >
                        <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="px-4 py-2 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Connexion
              </Link>
            )}
          </div>

          {/* Bouton menu mobile moderne - Toujours visible sur mobile */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 rounded-2xl border border-white/15 bg-white/10 text-slate-100 transition-all duration-300 hover:bg-white/20 relative z-[60]"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/* Menu mobile moderne ! - En dehors du nav pour z-index */}
    {isMenuOpen && (
      <>
        {/* Overlay pour fermer le menu - commence sous la nav */}
        <div 
          className="lg:hidden fixed top-20 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-[100]"
          onClick={() => setIsMenuOpen(false)}
        />
        {/* Menu mobile */}
        <div className="lg:hidden border-t border-white/20 bg-slate-950 shadow-2xl fixed top-20 left-0 right-0 bottom-0 overflow-y-auto overscroll-contain z-[110]" style={{ backgroundColor: 'rgba(15, 23, 42, 0.98)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
              <div className="space-y-4">
              {/* Barre de recherche mobile */}
              <div className="relative">
                <div className="relative bg-white/10 border border-white/15 rounded-2xl px-4 py-3 flex items-center space-x-3 text-slate-100">
                  <Search className="w-5 h-5 text-slate-300" />
                  <input
                    type="text"
                    placeholder="Rechercher un événement..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const query = (e.target as HTMLInputElement).value;
                        if (query.trim()) {
                          window.location.href = `/?search=${encodeURIComponent(query)}`;
                        }
                      }
                    }}
                    className="bg-transparent border-none outline-none text-base text-slate-100 placeholder-slate-400 flex-1"
                  />
                </div>
              </div>

              {/* Navigation mobile */}
              <div className="grid grid-cols-2 gap-3">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isFavorites = item.href === '/favoris';
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all duration-300 flex items-center space-x-3 group text-slate-100 relative"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="relative">
                        <Icon className="w-6 h-6 text-slate-200 group-hover:text-sky-300 group-hover:scale-105 transition-transform duration-300" />
                        {isFavorites && favoritesCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {favoritesCount > 99 ? '99+' : favoritesCount}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-slate-100 whitespace-nowrap">{item.name}</span>
                    </Link>
                  );
                })}
                
                {/* Pages verticales dans le menu mobile */}
                <Link
                  href="/musique"
                  className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all duration-300 flex items-center space-x-3 group text-slate-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Music className="w-6 h-6 text-slate-200 group-hover:text-pink-300 group-hover:scale-105 transition-transform duration-300" />
                  <span className="font-semibold text-slate-100">Musique</span>
                </Link>
                <Link
                  href="/famille"
                  className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all duration-300 flex items-center space-x-3 group text-slate-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Users className="w-6 h-6 text-slate-200 group-hover:text-orange-300 group-hover:scale-105 transition-transform duration-300" />
                  <span className="font-semibold text-slate-100">Famille</span>
                </Link>
                <Link
                  href="/culture"
                  className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all duration-300 flex items-center space-x-3 group text-slate-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Palette className="w-6 h-6 text-slate-200 group-hover:text-purple-300 group-hover:scale-105 transition-transform duration-300" />
                  <span className="font-semibold text-slate-100">Culture</span>
                </Link>
                <Link
                  href="/sport"
                  className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all duration-300 flex items-center space-x-3 group text-slate-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Trophy className="w-6 h-6 text-slate-200 group-hover:text-blue-300 group-hover:scale-105 transition-transform duration-300" />
                  <span className="font-semibold text-slate-100">Sport</span>
                </Link>
              </div>

              {/* Actions utilisateur mobile */}
              <div className="flex flex-col space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/10 border border-white/15">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-slate-200" />
                    <span className="font-medium text-slate-100">Notifications</span>
                  </div>
                  <NotificationBell />
                </div>

                {status === 'loading' ? (
                  <div className="flex items-center justify-center p-3 rounded-2xl border border-white/15 bg-white/5">
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : session?.user ? (
                  <div className="space-y-3">
                    {/* En-tête utilisateur mobile */}
                    <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
                      <div className="flex items-center space-x-3">
                        {session.user.image ? (
                          <Image
                            src={session.user.image}
                            alt={session.user.name || 'User'}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="text-left flex-1">
                          <div className="font-semibold text-slate-100">
                            {session.user.name || 'Mon compte'}
                          </div>
                          <p className="text-xs text-slate-400">{session.user.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Section Mon compte mobile */}
                    <div className="px-3 py-1">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Mon compte
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        router.push('/profil');
                      }}
                      className="flex items-center space-x-3 w-full p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all duration-300 text-slate-100"
                    >
                      <User className="w-5 h-5 text-slate-200" />
                      <span className="font-medium text-slate-100">Mon profil</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        router.push('/favoris');
                      }}
                      className="flex items-center space-x-3 w-full p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all duration-300 text-slate-100 relative"
                    >
                      <Heart className="w-5 h-5 text-slate-200" />
                      <span className="font-medium text-slate-100">Mes favoris</span>
                      {favoritesCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                          {favoritesCount > 99 ? '99+' : favoritesCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Section Organisateur mobile (si applicable) */}
                    {(session.user.role === 'ORGANIZER' || session.user.organizer) && (
                      <>
                        <div className="border-t border-white/10 my-2" />
                        <div className="px-3 py-1">
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Organisateur
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            router.push('/organisateur/dashboard');
                          }}
                          className="flex items-center space-x-3 w-full p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all duration-300 text-slate-100"
                        >
                          <BarChart3 className="w-5 h-5 text-slate-200" />
                          <span className="font-medium text-slate-100">Tableau de bord</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            router.push('/organisateur/mon-profil');
                          }}
                          className="flex items-center space-x-3 w-full p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all duration-300 text-slate-100"
                        >
                          <User className="w-5 h-5 text-slate-200" />
                          <span className="font-medium text-slate-100">Mon profil organisateur</span>
                        </button>
                      </>
                    )}
                    
                    {/* Déconnexion mobile */}
                    <div className="border-t border-white/10 my-2" />
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut({ callbackUrl: '/' });
                      }}
                      className="w-full flex items-center justify-center space-x-2 p-3 rounded-2xl border border-red-500/40 text-red-300 hover:bg-red-500/10 transition-all duration-300 font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push('/auth/signin');
                    }}
                    className="text-center p-3 rounded-2xl bg-gradient-to-r from-sky-600 to-emerald-600 font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Connexion
                  </button>
                )}
              </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
