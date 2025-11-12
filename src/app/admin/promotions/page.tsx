'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import ModernLoader from '@/components/ModernLoader';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { PromotionKind, PromotionStatus } from '@prisma/client';

interface Promotion {
  id: string;
  eventId: string;
  kind: PromotionKind;
  status: PromotionStatus;
  startsAt: string;
  endsAt: string;
  priceCents: number;
  event: {
    id: string;
    title: string;
    imageUrl?: string;
  };
}

export default function AdminPromotionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    eventId: '',
    kind: 'LIST_TOP' as PromotionKind,
    startsAt: '',
    endsAt: '',
    priceCents: 0,
    status: 'DRAFT' as PromotionStatus,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/promotions');
    } else if (status === 'authenticated') {
      if (session.user.role !== 'ADMIN') {
        router.push('/');
      } else {
        loadPromotions();
      }
    }
  }, [status, session, router]);

  const loadPromotions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/promotions');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des promotions');
      }
      const data = await response.json();
      setPromotions(data.items || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPromotion 
        ? `/api/promotions/${editingPromotion.id}`
        : '/api/promotions';
      const method = editingPromotion ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      // Recharger les promotions
      loadPromotions();
      setShowForm(false);
      setEditingPromotion(null);
      setFormData({
        eventId: '',
        kind: 'LIST_TOP',
        startsAt: '',
        endsAt: '',
        priceCents: 0,
        status: 'DRAFT',
      });
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      eventId: promotion.eventId,
      kind: promotion.kind,
      startsAt: new Date(promotion.startsAt).toISOString().slice(0, 16),
      endsAt: new Date(promotion.endsAt).toISOString().slice(0, 16),
      priceCents: promotion.priceCents,
      status: promotion.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/promotions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      loadPromotions();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleToggleStatus = async (promotion: Promotion) => {
    const newStatus = promotion.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    try {
      const response = await fetch(`/api/promotions/${promotion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      loadPromotions();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour');
    }
  };

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900 flex items-center justify-center">
        <ModernLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
        <Navigation />
        <div className="pt-24 text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <p className="text-xl font-semibold text-white mb-2">Erreur</p>
          <p className="text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-gray-900">
      <Navigation />
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-amber-400" />
                Gestion des promotions
              </h1>
              <p className="text-slate-300">
                Créez et gérez les promotions pour mettre en avant des événements
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingPromotion(null);
                setFormData({
                  eventId: '',
                  kind: 'LIST_TOP',
                  startsAt: '',
                  endsAt: '',
                  priceCents: 0,
                  status: 'DRAFT',
                });
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Annuler' : 'Nouvelle promotion'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 mb-8 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingPromotion ? 'Modifier la promotion' : 'Créer une promotion'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ID de l'événement
                </label>
                <input
                  type="text"
                  value={formData.eventId}
                  onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Type de promotion
                </label>
                <select
                  value={formData.kind}
                  onChange={(e) => setFormData({ ...formData, kind: e.target.value as PromotionKind })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="HOMEPAGE">Page d'accueil</option>
                  <option value="LIST_TOP">En tête de liste</option>
                  <option value="MAP_TOP">En haut de la carte</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date de début
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date de fin
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endsAt}
                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Prix (en cents)
                </label>
                <input
                  type="number"
                  value={formData.priceCents}
                  onChange={(e) => setFormData({ ...formData, priceCents: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Statut
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PromotionStatus })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="DRAFT">Brouillon</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expirée</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
                >
                  {editingPromotion ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPromotion(null);
                  }}
                  className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6">
            Promotions ({promotions.length})
          </h2>

          {promotions.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <p className="text-xl font-semibold text-white mb-2">
                Aucune promotion
              </p>
              <p className="text-slate-300">
                Créez votre première promotion pour mettre en avant un événement
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {promotions.map((promotion) => (
                <div
                  key={promotion.id}
                  className="bg-slate-900/50 rounded-lg p-4 border border-white/10 hover:border-amber-400/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {promotion.event.title}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          promotion.status === 'ACTIVE' 
                            ? 'bg-green-500/20 text-green-400' 
                            : promotion.status === 'DRAFT'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {promotion.status === 'ACTIVE' ? 'Active' : 
                           promotion.status === 'DRAFT' ? 'Brouillon' : 'Expirée'}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
                          {promotion.kind === 'HOMEPAGE' ? 'Page d\'accueil' :
                           promotion.kind === 'LIST_TOP' ? 'En tête de liste' :
                           'En haut de la carte'}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400 space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(promotion.startsAt).toLocaleDateString('fr-CA')} - {new Date(promotion.endsAt).toLocaleDateString('fr-CA')}
                          </span>
                        </div>
                        <div>
                          Prix: ${(promotion.priceCents / 100).toFixed(2)} CAD
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(promotion)}
                        className={`p-2 rounded-lg transition-colors ${
                          promotion.status === 'ACTIVE'
                            ? 'text-yellow-400 hover:bg-yellow-400/10'
                            : 'text-green-400 hover:bg-green-400/10'
                        }`}
                        title={promotion.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                      >
                        {promotion.status === 'ACTIVE' ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(promotion)}
                        className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(promotion.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

