'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { 
  User, Bell, Heart, Settings, LogOut, 
  BarChart3, Calendar, Plus, FileText, Sparkles, 
  Palette, TrendingUp, CreditCard, Building2, 
  MessageSquare, Users, Database
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFavorites } from '@/hooks/useFavorites';
import { UserRole } from '@prisma/client';

interface ProfileMenuProps {
  onClose?: () => void;
}

export default function ProfileMenu({ onClose }: ProfileMenuProps) {
  const t = useTranslations('navigation');
  const { data: session } = useSession();
  const { favorites } = useFavorites([]);
  const favoritesCount = favorites.length;
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!session?.user) {
    return null;
  }

  const userRoles = session.user.roles || [session.user.role || 'USER'];
  const hasOrganizerRole = userRoles.includes('ORGANIZER');
  const hasVenueRole = userRoles.includes('VENUE');
  const isAdmin = userRoles.includes('ADMIN');

  const handleLinkClick = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-xl text-slate-200 hover:text-sky-300 transition-all duration-300 relative group border-2 border-sky-400/40 bg-gradient-to-br from-sky-500/25 to-emerald-500/25 backdrop-blur-md hover:border-sky-400/60 hover:from-sky-500/35 hover:to-emerald-500/35 shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 hover:scale-105"
        aria-label="Menu utilisateur"
        aria-expanded={isOpen}
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User'}
            width={44}
            height={44}
            className="rounded-lg border-2 border-white/30 shadow-md"
          />
        ) : (
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-sky-500 via-sky-400 to-emerald-500 flex items-center justify-center border-2 border-white/30 shadow-md">
            <User className="w-6 h-6 text-white drop-shadow-sm" />
          </div>
        )}
        {isOpen && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-950 shadow-sm" />
        )}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500/30 to-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl overflow-hidden z-50 max-h-[80vh] overflow-y-auto">
          {/* En-tête utilisateur */}
          <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-sky-500/10 to-emerald-500/10">
            <div className="font-semibold text-white text-sm">{session.user.name || t('myAccount')}</div>
            <div className="text-xs text-slate-400 mt-0.5 truncate">{session.user.email}</div>
            {userRoles.length > 1 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {userRoles.filter(r => r !== 'USER').map(role => (
                  <span
                    key={role}
                    className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30"
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="p-2">
            {/* Section USER (toujours visible) */}
            <div className="px-3 py-1.5 mb-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t('myAccount')}
              </div>
            </div>
            <Link
              href="/profil"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
            >
              <User className="w-4 h-4 text-slate-400 group-hover:text-sky-400 transition-colors" />
              <span>{t('profile')}</span>
            </Link>
            <Link
              href="/notifications"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
            >
              <Bell className="w-4 h-4 text-slate-400 group-hover:text-yellow-400 transition-colors" />
              <span>{t('notifications')}</span>
            </Link>
            <Link
              href="/favoris"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
            >
              <Heart className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
              <span>{t('favorites')}</span>
              {favoritesCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </Link>
            <Link
              href="/pulsers"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
            >
              <Users className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <span>{t('pulsers')}</span>
            </Link>
            <Link
              href="/settings"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
            >
              <Settings className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors" />
              <span>{t('settings')}</span>
            </Link>

            {/* Section ORGANIZER */}
            {hasOrganizerRole && (
              <>
                <div className="border-t border-white/10 my-2" />
                <div className="px-3 py-1.5 mb-1">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {t('organizerTools')}
                  </div>
                </div>
                <Link
                  href="/organisateur/dashboard"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                  <span>{t('organizer.dashboard')}</span>
                </Link>
                <Link
                  href="/organisateur/mes-evenements"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <Calendar className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  <span>{t('organizer.myEvents')}</span>
                </Link>
                <Link
                  href="/publier"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-green-400 transition-colors" />
                  <span>{t('organizer.createEvent')}</span>
                </Link>
                <Link
                  href="/organisateur/importer"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <FileText className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
                  <span>{t('organizer.importEvent')}</span>
                </Link>
                <Link
                  href="/organisateur/ai-assistant"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <Sparkles className="w-4 h-4 text-slate-400 group-hover:text-pink-400 transition-colors" />
                  <span>{t('organizer.aiAssistant')}</span>
                </Link>
                <Link
                  href="/organisateur/flyers"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <Palette className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  <span>{t('organizer.flyers')}</span>
                </Link>
                <Link
                  href="/organisateur/promotions"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <TrendingUp className="w-4 h-4 text-slate-400 group-hover:text-orange-400 transition-colors" />
                  <span>{t('organizer.promotions')}</span>
                </Link>
                <Link
                  href="/organisateur/analytics"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  <span>{t('organizer.analytics')}</span>
                </Link>
                <Link
                  href="/organisateur/billing"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <CreditCard className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                  <span>{t('organizer.billing')}</span>
                </Link>
              </>
            )}

            {/* Section VENUE */}
            {hasVenueRole && (
              <>
                <div className="border-t border-white/10 my-2" />
                <div className="px-3 py-1.5 mb-1">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {t('venueTools')}
                  </div>
                </div>
                <Link
                  href="/venue/dashboard"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  <span>{t('venue.dashboard')}</span>
                </Link>
                <Link
                  href="/venue/mon-profil"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <Building2 className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
                  <span>{t('venue.myVenuePage')}</span>
                </Link>
                <Link
                  href="/venue/calendrier"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <Calendar className="w-4 h-4 text-slate-400 group-hover:text-green-400 transition-colors" />
                  <span>{t('venue.calendar')}</span>
                </Link>
                <Link
                  href="/venue/requests"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-yellow-400 transition-colors" />
                  <span>{t('venue.requests')}</span>
                </Link>
                <Link
                  href="/venue/analytics"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  <span>{t('venue.analytics')}</span>
                </Link>
                <Link
                  href="/venue/billing"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <CreditCard className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                  <span>{t('venue.billing')}</span>
                </Link>
              </>
            )}

            {/* Section ADMIN */}
            {isAdmin && (
              <>
                <div className="border-t border-white/10 my-2" />
                <div className="px-3 py-1.5 mb-1">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Admin
                  </div>
                </div>
                <Link
                  href="/admin/ingestion"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <Database className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  <span>Ingestion</span>
                </Link>
                <Link
                  href="/admin/venue-claims"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/10 rounded-lg transition-colors group"
                >
                  <Building2 className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
                  <span>Venue Claims</span>
                </Link>
              </>
            )}

            {/* Déconnexion */}
            <div className="border-t border-white/10 my-2" />
            <button
              onClick={() => {
                signOut({ callbackUrl: '/' });
                handleLinkClick();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors group"
            >
              <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
              <span>{t('signOut')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
