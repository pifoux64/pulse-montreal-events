'use client';

import { useState } from 'react';

interface EventTabsSectionProps {
  infoContent: React.ReactNode;
  feedContent: React.ReactNode;
}

export default function EventTabsSection({ infoContent, feedContent }: EventTabsSectionProps) {
  const [activeTab, setActiveTab] = useState<'infos' | 'fil'>('infos');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 rounded-2xl bg-white/70 p-1 border border-white/40 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('infos')}
          className={`flex-1 min-w-[120px] rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === 'infos'
              ? 'bg-gradient-to-r from-sky-500 to-emerald-500 text-white shadow-lg'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Infos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fil')}
          className={`flex-1 min-w-[120px] rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === 'fil'
              ? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-lg'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Fil
        </button>
      </div>
      <div>{activeTab === 'infos' ? infoContent : feedContent}</div>
    </div>
  );
}

