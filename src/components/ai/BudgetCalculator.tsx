'use client';

import { useState } from 'react';
import { Calculator, Loader2, DollarSign, TrendingUp, Users } from 'lucide-react';

export default function BudgetCalculator() {
  const [formData, setFormData] = useState({
    eventType: '',
    expectedAttendance: '',
    venueCapacity: '',
    venueCost: '',
    artistCosts: '',
    hasSound: false,
    hasLighting: false,
    promotionBudget: '',
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
      setError(err.message || 'Erreur lors du calcul');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-sky-400" />
        <h3 className="text-xl font-bold text-white">Calculateur de Budget</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Type d'événement
            </label>
            <select
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Sélectionnez...</option>
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
              Personnes attendues
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
            Capacité de la salle
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
              Coût salle (CAD)
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
              Cachets artistes (CAD)
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
            Sonorisation incluse
          </label>
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasLighting}
              onChange={(e) => setFormData({ ...formData, hasLighting: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            Éclairage inclus
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Budget promotion (CAD)
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
              Autres coûts (CAD)
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
        </div>

        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className="w-full px-6 py-3 bg-gradient-to-r from-sky-600 to-emerald-600 text-white rounded-lg hover:from-sky-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isCalculating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Calcul en cours...
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5" />
              Calculer le budget
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
              <h4 className="text-lg font-semibold text-white mb-4">Coûts estimés</h4>
              <div className="space-y-2">
                {result.estimatedCosts.venue != null && typeof result.estimatedCosts.venue === 'number' && (
                  <div className="flex justify-between text-slate-300">
                    <span>Salle</span>
                    <span>{result.estimatedCosts.venue.toFixed(2)} $</span>
                  </div>
                )}
                {result.estimatedCosts.artists != null && typeof result.estimatedCosts.artists === 'number' && (
                  <div className="flex justify-between text-slate-300">
                    <span>Artistes</span>
                    <span>{result.estimatedCosts.artists.toFixed(2)} $</span>
                  </div>
                )}
                {result.estimatedCosts.sound != null && typeof result.estimatedCosts.sound === 'number' && (
                  <div className="flex justify-between text-slate-300">
                    <span>Sonorisation</span>
                    <span>{result.estimatedCosts.sound.toFixed(2)} $</span>
                  </div>
                )}
                {result.estimatedCosts.lighting != null && typeof result.estimatedCosts.lighting === 'number' && (
                  <div className="flex justify-between text-slate-300">
                    <span>Éclairage</span>
                    <span>{result.estimatedCosts.lighting.toFixed(2)} $</span>
                  </div>
                )}
                {result.estimatedCosts.promotion != null && typeof result.estimatedCosts.promotion === 'number' && (
                  <div className="flex justify-between text-slate-300">
                    <span>Promotion</span>
                    <span>{result.estimatedCosts.promotion.toFixed(2)} $</span>
                  </div>
                )}
                {result.estimatedCosts.staff != null && typeof result.estimatedCosts.staff === 'number' && (
                  <div className="flex justify-between text-slate-300">
                    <span>Personnel</span>
                    <span>{result.estimatedCosts.staff.toFixed(2)} $</span>
                  </div>
                )}
                {result.estimatedCosts.other != null && typeof result.estimatedCosts.other === 'number' && (
                  <div className="flex justify-between text-slate-300">
                    <span>Autres</span>
                    <span>{result.estimatedCosts.other.toFixed(2)} $</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span>{result.estimatedCosts.total != null && typeof result.estimatedCosts.total === 'number' ? result.estimatedCosts.total.toFixed(2) : '0.00'} $</span>
                </div>
              </div>
            </div>

            {/* Seuil de rentabilité */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Seuil de rentabilité
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Prix de billet nécessaire</span>
                  <span className="text-white font-semibold">
                    {result.breakEven?.ticketPrice != null && typeof result.breakEven.ticketPrice === 'number' 
                      ? result.breakEven.ticketPrice.toFixed(2) 
                      : '0.00'} $
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Personnes nécessaires</span>
                  <span className="text-white font-semibold">
                    {result.breakEven?.attendeesNeeded != null ? result.breakEven.attendeesNeeded : '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Suggestions de tarification */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-4">Suggestions de tarification</h4>
              <div className="space-y-3">
                {result.suggestedPricing.free.viable && (
                  <div className="p-3 bg-emerald-600/20 rounded-lg border border-emerald-600/50">
                    <div className="font-semibold text-emerald-300 mb-1">Gratuit</div>
                    <div className="text-sm text-slate-300">{result.suggestedPricing.free.notes}</div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-xs text-slate-400 mb-1">Bas</div>
                    <div className="text-white font-semibold">
                      {result.suggestedPricing?.low?.price != null && typeof result.suggestedPricing.low.price === 'number'
                        ? result.suggestedPricing.low.price.toFixed(2)
                        : '0.00'} $
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{result.suggestedPricing?.low?.target || ''}</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-xs text-slate-400 mb-1">Moyen</div>
                    <div className="text-white font-semibold">
                      {result.suggestedPricing?.medium?.price != null && typeof result.suggestedPricing.medium.price === 'number'
                        ? result.suggestedPricing.medium.price.toFixed(2)
                        : '0.00'} $
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{result.suggestedPricing?.medium?.target || ''}</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-xs text-slate-400 mb-1">Élevé</div>
                    <div className="text-white font-semibold">
                      {result.suggestedPricing?.high?.price != null && typeof result.suggestedPricing.high.price === 'number'
                        ? result.suggestedPricing.high.price.toFixed(2)
                        : '0.00'} $
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{result.suggestedPricing?.high?.target || ''}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommandations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-3">Recommandations</h4>
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
