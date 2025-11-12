'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, Map, Calendar, Heart, Plus, Filter, Search, User, Bell, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Navigation() {
  const t = useTranslations('navigation');
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
    { name: t('map'), href: '/carte', icon: Map },
    { name: t('calendar'), href: '/calendrier', icon: Calendar },
    { name: t('favorites'), href: '/favoris', icon: Heart },
    { name: t('publish'), href: '/publier', icon: Plus },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/70 backdrop-blur-2xl border-b border-white/10 shadow-[0_20px_60px_-40px_rgba(15,118,110,0.8)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 text-slate-100">
          {/* Logo avec animation float ajustée */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <div
                className="relative w-16 h-16 lg:w-20 lg:h-20 group-hover:scale-105 transition-all duration-300"
                style={{
                  animation: 'float-gentle 4s ease-in-out infinite, heartbeat 3.2s ease-in-out infinite'
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
            <div className="flex items-center space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative px-6 py-3 rounded-2xl text-sm font-semibold text-slate-200 hover:text-white transition-all duration-300 flex items-center space-x-3"
                  >
                    {/* Background gradient on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <Icon className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Actions utilisateur ultra-modernes */}
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
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500/10 to-emerald-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            {/* Notifications avec animation */}
            <button className="p-3 rounded-2xl text-slate-200 hover:text-sky-300 transition-all duration-300 relative group border border-white/10 bg-white/5 backdrop-blur-md">
              <Bell className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs text-white flex items-center justify-center font-bold shadow-sm">3</div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500/15 to-emerald-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            {/* Profil utilisateur avec menu déroulant */}
            {status === 'loading' ? (
              <div className="p-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : session?.user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="p-3 rounded-2xl text-slate-200 hover:text-sky-300 transition-all duration-300 relative group border border-white/10 bg-white/5 backdrop-blur-md flex items-center gap-2"
                >
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  <span className="hidden md:block text-sm font-medium">{session.user.name || session.user.email}</span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500/15 to-emerald-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl overflow-hidden z-50">
                    <div className="p-2">
                      <div className="px-3 py-2 text-sm text-slate-300 border-b border-white/10">
                        <div className="font-medium text-white">{session.user.name || 'Utilisateur'}</div>
                        <div className="text-xs text-slate-400">{session.user.email}</div>
                      </div>
                      <Link
                        href="/favoris"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        Mes favoris
                      </Link>
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: '/' });
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
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

          {/* Bouton menu mobile moderne */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 rounded-2xl border border-white/15 bg-white/10 text-slate-100 transition-all duration-300 hover:bg-white/20"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile moderne !*/}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all duration-300 flex items-center space-x-3 group text-slate-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon className="w-6 h-6 text-slate-200 group-hover:text-sky-300 group-hover:scale-105 transition-transform duration-300" />
                      <span className="font-semibold text-slate-100">{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Actions utilisateur mobile */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button className="flex items-center space-x-3 p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all duration-300 text-slate-100">
                  <Bell className="w-5 h-5 text-slate-200" />
                  <span className="font-medium text-slate-100">Notifications</span>
                </button>
                <button className="flex items-center space-x-3 p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all duration-300 text-slate-100">
                  <User className="w-5 h-5 text-slate-200" />
                  <span className="font-medium text-slate-100">Profil</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
