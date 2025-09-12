'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, Map, Calendar, Heart, Plus, Filter, Search, User, Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Navigation() {
  const t = useTranslations('navigation');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { name: t('map'), href: '/carte', icon: Map },
    { name: t('calendar'), href: '/calendrier', icon: Calendar },
    { name: t('favorites'), href: '/favoris', icon: Heart },
    { name: t('publish'), href: '/publier', icon: Plus },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo avec animation float ajustée */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <div className="relative w-16 h-16 lg:w-20 lg:h-20 group-hover:scale-105 transition-all duration-300" style={{
                animation: 'float-gentle 4s ease-in-out infinite'
              }}>
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
                    className="group relative px-6 py-3 rounded-2xl text-sm font-semibold text-gray-700 hover:text-white transition-all duration-300 flex items-center space-x-3"
                  >
                    {/* Background gradient on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
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
              <div className="relative glass-effect rounded-2xl px-4 py-2 flex items-center space-x-3 hover-lift border border-white/20">
                <Search className="w-4 h-4 text-gray-500 group-focus-within:text-violet-500 transition-colors duration-300" />
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
                  className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-32 focus:w-48 transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/5 to-purple-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
              </div>
            </div>


            {/* Notifications avec animation */}
            <button className="glass-effect hover-lift p-3 rounded-2xl text-gray-600 hover:text-violet-600 transition-all duration-300 relative group border border-white/20">
              <Bell className="w-5 h-5 group-hover:animate-pulse" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-xs text-white flex items-center justify-center font-bold animate-pulse">3</div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            {/* Profil utilisateur avec avatar moderne */}
            <button className="glass-effect hover-lift p-3 rounded-2xl text-gray-600 hover:text-violet-600 transition-all duration-300 relative group border border-white/20">
              <User className="w-5 h-5" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>

          {/* Bouton menu mobile moderne */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-300"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="block h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile moderne */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-4">
              {/* Barre de recherche mobile */}
              <div className="relative">
                <div className="relative bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex items-center space-x-3">
                  <Search className="w-5 h-5 text-gray-500" />
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
                    className="bg-transparent border-none outline-none text-base text-gray-700 placeholder-gray-400 flex-1"
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
                      className="p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-300 flex items-center space-x-3 group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon className="w-6 h-6 text-gray-600 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-semibold text-gray-700">{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Actions utilisateur mobile */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button className="flex items-center space-x-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-300">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">Notifications</span>
                </button>
                <button className="flex items-center space-x-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-300">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">Profil</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
