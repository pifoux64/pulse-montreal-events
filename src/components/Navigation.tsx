'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, Map, Calendar, Heart, Plus, Home, Filter, Search, User, Bell } from 'lucide-react';

const navigationItems = [
  { name: 'Accueil', href: '/', icon: Home },
  { name: 'Carte', href: '/carte', icon: Map },
  { name: 'Calendrier', href: '/calendrier', icon: Calendar },
  { name: 'Mes Favoris', href: '/favoris', icon: Heart },
  { name: 'Publier', href: '/publier', icon: Plus },
];

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo agrandi sans texte */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <div className="relative w-16 h-16 lg:w-20 lg:h-20 group-hover:scale-110 transition-transform duration-300">
                <Image
                  src="/Pulse_Logo.png"
                  alt="Pulse Logo"
                  fill
                  sizes="(max-width: 768px) 64px, 80px"
                  className="object-contain"
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
                    className="px-6 py-3 rounded-2xl text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 flex items-center space-x-3 group"
                  >
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Actions utilisateur modernes */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Barre de recherche rapide */}
            <div className="relative group">
              <div className="relative bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 flex items-center space-x-3 hover:bg-gray-100 transition-all duration-300">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Recherche rapide..."
                  className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-32 focus:w-40 transition-all duration-300"
                />
              </div>
            </div>

            {/* Notifications */}
            <button className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-300 relative group">
              <Bell className="w-5 h-5 text-gray-600 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </button>

            {/* Profil utilisateur */}
            <button className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-300 group">
              <User className="w-5 h-5 text-gray-600 group-hover:scale-110 transition-transform duration-300" />
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
