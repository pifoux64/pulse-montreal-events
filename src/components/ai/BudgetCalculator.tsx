'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Calculator, Loader2, DollarSign, TrendingUp, Users } from 'lucide-react';
import ProfitMatrixTable from './ProfitMatrixTable';

export default function BudgetCalculator() {
  const t = useTranslations('budget');
  const [formData, setFormData] = useState({
    eventType: '',
    expectedAttendance: '',
    venueCapacity: '',
    venueCost: '',
    artistCosts: '',
    hasSound: false,
    hasLighting: false,
    promotionBudget: '',
    staffCost: '',
    otherCosts: '',
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setIsCalculating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/budget-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: formData.eventType || undefined,
          expectedAttendance: formData.expectedAttendance ? parseInt(formData.expectedAttendance, 10) : undefined,
          venueCapacity: formData.venueCapacity ? parseInt(formData.venueCapacity, 10) : undefined,
          venueCost: formData.venueCost || undefined,
          artistCosts: formData.artistCosts || undefined,
          hasSound: formData.hasSound,
          hasLighting: formData.hasLighting,
          promotionBudget: formData.promotionBudget || undefined,
          staffCost: formData.staffCost || undefined,
          otherCosts: formData.otherCosts || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du calcul');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || t('calculationError'));
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-sky-400" />
        <h3 className="text-xl font-bold text-white">{t('title')}</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('eventType')}
            </label>
            <select
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">{t('select')}</option>
              <option value="concert">Concert</option>
              <option value="dj_set">DJ Set</option>
              <option value="festival">Festival</option>
              <option value="theatre">Théâtre</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              {t('expectedAttendance')}
            </label>
            <input
              type="number"
              value={formData.expectedAttendance}
              onChange={(e) => setFormData({ ...formData, expectedAttendance: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {t('venueCapacity')}
          </label>
          <input
            type="number"
            value={formData.venueCapacity}
            onChange={(e) => setFormData({ ...formData, venueCapacity: e.target.value })}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="300"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              {t('venueCost')}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.venueCost}
              onChange={(e) => setFormData({ ...formData, venueCost: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="1500.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              {t('artistCosts')}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.artistCosts}
              onChange={(e) => setFormData({ ...formData, artistCosts: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="2000.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasSound}
              onChange={(e) => setFormData({ ...formData, hasSound: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            {t('soundIncluded')}
          </label>
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasLighting}
              onChange={(e) => setFormData({ ...formData, hasLighting: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            {t('lightingIncluded')}
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('promotionBudget')}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.promotionBudget}
              onChange={(e) => setFormData({ ...formData, promotionBudget: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="500.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('staffCost')}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.staffCost}
              onChange={(e) => setFormData({ ...formData, staffCost: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder={t('staffCostPlaceholder')}
            />
            <p className="text-xs text-slate-400 mt-1">{t('staffCostHint')}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {t('otherCosts')}
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.otherCosts}
            onChange={(e) => setFormData({ ...formData, otherCosts: e.target.value })}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="300.00"
          />
        </div>

        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className="w-full px-6 py-3 bg-gradient-to-r from-sky-600 to-emerald-600 text-white rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isCalculating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('calculating')}
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5" />
              {t('calculate')}
            </>
          )}
        </button>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-6">
            {/* Coûts estimés */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-4">{t('estimatedCosts')}</h4>
              <div className="space-y-2">
                {result.estimatedCosts.venue != null && typeof result.estimatedCosts.venue === 'number' && (
                  <div className="flex justify-between text-slate-300">
                    <span>{t('venue')}</span>
                    <span>{result.estimatedCosts.venue.toFixed(2)} $</span>
                  </div>
                )}
                {result.estimatedCosts.artists != null && typeof result.estimatedCosts.artists === 'number' && (
                  <div className="flex justify-between text-slate-300">
                    <span>{t('artists')}</span>
                    <span>{result.estimatedCosts.artists.toFixed(2)} $</span>
                  </div>
                )}
                {result.estimatedCosts.sound != null && typeof result.estimatedCosts.sound === 'number' && (
                  <div className="flex justify-between text-slate-300">
                    <span>{t('sound')}</span>
                    <span>{result.estimatedCosts.sound.toFixed(2)} $</span>
                  </div>
                )}
                {result.estimatedCosts.lighting != null && typeof result.estimatedCosts.lighting === 'number' && (
                  <div className="flex justify-between text-slate-300">
                    <span>{t('lighting')}</span>
                    <span>{result.estimatedCosts.lighting.toFixed(2)} $</span>
                  </div>
                )}
                {result.estimatedCosts.promotion != null && typeof result.estimatedCosts.promotion === 'number' && (
                  <div className="flex justify-between text-slate-300">
                    <span>{t('promotion')}</span>
                    <span>{result.estimatedCosts.promotion.toFixed(2)} $</span>
                  </div>
                )}
                {result.estimatedCosts.staff != null && typeof result.estimatedCosts.staff === 'number' && (
                  <div className="flex justify-between text-slate-300">
                    <span>{t('staff')}</span>
                    <span>{result.estimatedCosts.staff.toFixed(2)} $</span>
                  </div>
                )}
                {result.estimatedCosts.other != null && typeof result.estimatedCosts.other === 'number' && (
                  <div className="flex justify-between text-slate-300">
                    <span>{t('other')}</span>
                    <span>{result.estimatedCosts.other.toFixed(2)} $</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold pt-2 border-t border-white/10">
                  <span>{t('total')}</span>
                  <span>{result.estimatedCosts.total != null && typeof result.estimatedCosts.total === 'number' ? result.estimatedCosts.total.toFixed(2) : '0.00'} $</span>
                </div>
              </div>
            </div>

            {/* Seuil de rentabilité */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {t('breakEven')}
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>{t('ticketPriceNeeded')}</span>
                  <span className="text-white font-semibold">
                    {result.breakEven?.ticketPrice != null && typeof result.breakEven.ticketPrice === 'number' 
                      ? result.breakEven.ticketPrice.toFixed(2) 
                      : '0.00'} $
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{t('attendeesNeeded')}</span>
                  <span className="text-white font-semibold">
                    {result.breakEven?.attendeesNeeded != null ? result.breakEven.attendeesNeeded : '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Suggestions de tarification */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-4">{t('pricingSuggestions')}</h4>
              <div className="space-y-3">
                {result.suggestedPricing.free.viable && (
                  <div className="p-3 bg-emerald-600/20 rounded-lg border border-emerald-600/50">
                    <div className="font-semibold text-emerald-300 mb-1">{t('free')}</div>
                    <div className="text-sm text-slate-300">{result.suggestedPricing.free.notes}</div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-xs text-slate-400 mb-1">{t('low')}</div>
                    <div className="text-white font-semibold">
                      {(() => {
                        const price = result.suggestedPricing?.low?.price;
                        const numPrice = typeof price === 'number' ? price : (typeof price === 'string' ? parseFloat(price) : 0);
                        const validPrice = isNaN(numPrice) || numPrice <= 0 || numPrice > 500 ? 0 : numPrice;
                        return validPrice.toFixed(2);
                      })()} $
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {result.suggestedPricing?.low?.target === 'Broad audience' ? t('targetBroad') :
                       result.suggestedPricing?.low?.target === 'Public large' ? t('targetBroad') :
                       result.suggestedPricing?.low?.target === 'Audiencia amplia' ? t('targetBroad') :
                       result.suggestedPricing?.low?.target || t('targetBroad')}
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-xs text-slate-400 mb-1">{t('medium')}</div>
                    <div className="text-white font-semibold">
                      {(() => {
                        const price = result.suggestedPricing?.medium?.price;
                        const numPrice = typeof price === 'number' ? price : (typeof price === 'string' ? parseFloat(price) : 0);
                        const validPrice = isNaN(numPrice) || numPrice <= 0 || numPrice > 500 ? 0 : numPrice;
                        return validPrice.toFixed(2);
                      })()} $
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {result.suggestedPricing?.medium?.target === 'Target audience' ? t('targetAudience') :
                       result.suggestedPricing?.medium?.target === 'Public cible' ? t('targetAudience') :
                       result.suggestedPricing?.medium?.target === 'Audiencia objetivo' ? t('targetAudience') :
                       result.suggestedPricing?.medium?.target || t('targetAudience')}
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-xs text-slate-400 mb-1">{t('high')}</div>
                    <div className="text-white font-semibold">
                      {(() => {
                        const price = result.suggestedPricing?.high?.price;
                        const numPrice = typeof price === 'number' ? price : (typeof price === 'string' ? parseFloat(price) : 0);
                        const validPrice = isNaN(numPrice) || numPrice <= 0 || numPrice > 500 ? 0 : numPrice;
                        return validPrice.toFixed(2);
                      })()} $
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {result.suggestedPricing?.high?.target === 'Premium audience' ? t('targetPremium') :
                       result.suggestedPricing?.high?.target === 'Public premium' ? t('targetPremium') :
                       result.suggestedPricing?.high?.target === 'Audiencia premium' ? t('targetPremium') :
                       result.suggestedPricing?.high?.target || t('targetPremium')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau de bénéfices */}
            {result.estimatedCosts?.total && typeof result.estimatedCosts.total === 'number' && result.estimatedCosts.total > 0 && (
              <ProfitMatrixTable
                totalCosts={result.estimatedCosts.total}
                minTicketPrice={15}
                maxTicketPrice={300}
                minAttendees={15}
                maxAttendees={25}
              />
            )}

            {/* Recommandations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-3">{t('recommendations')}</h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <span className="text-sky-400 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
