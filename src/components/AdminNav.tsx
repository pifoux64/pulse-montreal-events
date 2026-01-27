/**
 * Navigation component for admin pages
 * Provides links between different admin sections
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, Building2, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AdminNav() {
  const t = useTranslations('admin');
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="mb-8 border-b border-slate-700">
      <div className="flex items-center gap-4 overflow-x-auto">
        <Link
          href="/admin/ingestion"
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            isActive('/admin/ingestion')
              ? 'text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{t('ingestion')}</span>
        </Link>
        <Link
          href="/admin/venue-claims"
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            isActive('/admin/venue-claims')
              ? 'text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{t('venueClaims.title')}</span>
        </Link>
      </div>
    </nav>
  );
}
