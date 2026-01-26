'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

interface ProfitMatrixTableProps {
  totalCosts: number;
  minTicketPrice?: number;
  maxTicketPrice?: number;
  minAttendees?: number;
  maxAttendees?: number;
}

export default function ProfitMatrixTable({
  totalCosts,
  minTicketPrice = 15,
  maxTicketPrice = 300,
  minAttendees = 15,
  maxAttendees = 25,
}: ProfitMatrixTableProps) {
  const t = useTranslations('budget');

  // Générer les prix de billets (par pas de 25$)
  const ticketPrices = useMemo(() => {
    const prices: number[] = [];
    for (let price = minTicketPrice; price <= maxTicketPrice; price += 25) {
      prices.push(price);
    }
    return prices;
  }, [minTicketPrice, maxTicketPrice]);

  // Générer les nombres d'entrées (par pas de 2.5)
  const attendeeCounts = useMemo(() => {
    const counts: number[] = [];
    for (let count = minAttendees; count <= maxAttendees; count += 2.5) {
      counts.push(count);
    }
    return counts;
  }, [minAttendees, maxAttendees]);

  // Calculer le bénéfice pour chaque combinaison
  const calculateProfit = (ticketPrice: number, attendees: number): number => {
    const revenue = ticketPrice * attendees;
    return revenue - totalCosts;
  };

  // Obtenir la couleur selon le bénéfice
  const getProfitColor = (profit: number): string => {
    if (profit < -500) {
      return 'bg-red-900 text-red-100'; // Perte importante
    } else if (profit < -250) {
      return 'bg-red-700 text-red-50'; // Perte modérée
    } else if (profit < 0) {
      return 'bg-orange-600 text-orange-50'; // Petite perte
    } else if (profit === 0) {
      return 'bg-yellow-600 text-yellow-50'; // Équilibre
    } else if (profit < 500) {
      return 'bg-yellow-400 text-yellow-900'; // Petit bénéfice
    } else if (profit < 1000) {
      return 'bg-green-400 text-green-900'; // Bénéfice modéré
    } else if (profit < 2000) {
      return 'bg-green-600 text-green-50'; // Bon bénéfice
    } else if (profit < 3000) {
      return 'bg-green-700 text-green-50'; // Très bon bénéfice
    } else {
      return 'bg-green-900 text-green-50'; // Excellent bénéfice
    }
  };

  // Trouver le bénéfice min et max pour la normalisation
  const { minProfit, maxProfit } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    ticketPrices.forEach(price => {
      attendeeCounts.forEach(attendees => {
        const profit = calculateProfit(price, attendees);
        min = Math.min(min, profit);
        max = Math.max(max, profit);
      });
    });
    return { minProfit: min, maxProfit: max };
  }, [ticketPrices, attendeeCounts, totalCosts]);

  return (
    <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10 overflow-x-auto">
      <h4 className="text-lg font-semibold text-white mb-4">
        {t('profitMatrix')}
      </h4>
      <p className="text-sm text-slate-400 mb-4">
        {t('profitMatrixDescription')}
      </p>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-2 bg-white/10 text-white font-semibold text-left border border-white/20">
                {t('profitMatrixLabel')}
              </th>
              {attendeeCounts.map((count) => (
                <th
                  key={count}
                  className="p-2 bg-white/10 text-white font-semibold text-center border border-white/20 min-w-[80px]"
                >
                  {count.toFixed(count % 1 === 0 ? 0 : 1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ticketPrices.map((price) => (
              <tr key={price}>
                <td className="p-2 bg-white/5 text-white font-medium border border-white/20">
                  {price} $
                </td>
                {attendeeCounts.map((attendees) => {
                  const profit = calculateProfit(price, attendees);
                  const colorClass = getProfitColor(profit);
                  return (
                    <td
                      key={`${price}-${attendees}`}
                      className={`p-2 text-center border border-white/20 font-medium ${colorClass}`}
                    >
                      {profit >= 0 ? '+' : ''}
                      {profit.toFixed(profit % 1 === 0 ? 0 : 1)} $
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Légende */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-900 rounded"></div>
          <span className="text-slate-300">{t('lossHigh')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-700 rounded"></div>
          <span className="text-slate-300">{t('lossMedium')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-orange-600 rounded"></div>
          <span className="text-slate-300">{t('lossLow')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-yellow-600 rounded"></div>
          <span className="text-slate-300">{t('breakEven')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-400 rounded"></div>
          <span className="text-slate-300">{t('profitLow')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-600 rounded"></div>
          <span className="text-slate-300">{t('profitMedium')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-900 rounded"></div>
          <span className="text-slate-300">{t('profitHigh')}</span>
        </div>
      </div>
    </div>
  );
}
