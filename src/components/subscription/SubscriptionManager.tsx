'use client';

import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, X, Loader2, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
}

interface SubscriptionManagerProps {
  type: 'organizer' | 'venue';
  venueId?: string;
}

export default function SubscriptionManager({ type, venueId }: SubscriptionManagerProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [type, venueId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Charger les plans
      const plansRes = await fetch(`/api/subscriptions/plans?type=${type}`);
      if (!plansRes.ok) throw new Error('Erreur lors du chargement des plans');
      const plansData = await plansRes.json();
      setPlans(plansData.plans || []);

      // Charger l'abonnement actuel
      if (type === 'organizer') {
        const subRes = await fetch('/api/subscriptions/organizer');
        if (subRes.ok) {
          const subData = await subRes.json();
          setCurrentSubscription(subData.subscription);
        }
      } else if (type === 'venue' && venueId) {
        const subRes = await fetch(`/api/subscriptions/venue?venueId=${venueId}`);
        if (subRes.ok) {
          const subData = await subRes.json();
          setCurrentSubscription(subData.subscription);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setIsSubscribing(true);
      setError(null);

      const endpoint = type === 'organizer' 
        ? '/api/subscriptions/organizer'
        : '/api/subscriptions/venue';

      const body = type === 'venue' 
        ? { planId, venueId }
        : { planId };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la souscription');
      }

      const data = await res.json();
      
      // Rediriger vers Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la souscription');
      setIsSubscribing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400 mx-auto" />
      </div>
    );
  }

  const currentPlan = currentSubscription?.plan || (type === 'organizer' ? 'ORGANIZER_BASIC' : 'VENUE_BASIC');
  const isPro = currentPlan.includes('PRO');

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-6 h-6 text-sky-400" />
        <h3 className="text-xl font-bold text-white">
          {type === 'organizer' ? 'Abonnement Organisateur' : 'Abonnement Salle'}
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Statut actuel */}
      <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-white">
                Plan actuel : {isPro ? 'Pro' : 'Gratuit'}
              </span>
              {isPro && <Crown className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-sm text-slate-400">
              {isPro 
                ? 'Vous bénéficiez de toutes les fonctionnalités premium'
                : 'Plan gratuit avec fonctionnalités limitées'}
            </p>
          </div>
          {isPro && (
            <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium">
              Actif
            </div>
          )}
        </div>
      </div>

      {/* Plans disponibles */}
      <div className="space-y-4">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === (plan as any).plan;
          const isProPlan = plan.id.includes('pro');

          return (
            <div
              key={plan.id}
              className={`p-6 rounded-xl border-2 transition-all ${
                isProPlan
                  ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                    {isProPlan && <Crown className="w-5 h-5 text-amber-400" />}
                  </div>
                  <p className="text-slate-300 text-sm mb-3">{plan.description}</p>
                  <div className="text-2xl font-bold text-white">
                    ${(plan.price / 100).toFixed(2)} CAD
                    <span className="text-sm font-normal text-slate-400">/{plan.interval}</span>
                  </div>
                </div>
                {isCurrentPlan && (
                  <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Actuel
                  </div>
                )}
              </div>

              <ul className="space-y-2 mb-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isSubscribing || isCurrentPlan}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                  isCurrentPlan
                    ? 'bg-white/10 text-slate-400 cursor-not-allowed'
                    : isProPlan
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700'
                    : 'bg-sky-600 text-white hover:bg-sky-700'
                }`}
              >
                {isSubscribing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Traitement...
                  </span>
                ) : isCurrentPlan ? (
                  'Plan actuel'
                ) : (
                  'S\'abonner'
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-200">
          💡 <strong>Note :</strong> Aucun paiement n'est obligatoire pour exister sur Pulse. 
          Les plans payants offrent des fonctionnalités supplémentaires pour optimiser votre présence.
        </p>
      </div>
    </div>
  );
}
